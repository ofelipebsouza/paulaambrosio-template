#!/usr/bin/env python3
"""Execute the production Lua against OFFLINE Redis-command fixtures.

Requires an already installed liblua (5.3 or 5.4). This is a syntax/logic test,
NOT a Redis/Upstash integration test. No network, downloads or real lead data.
Run: python3 tests/lead-receipt-lua.py
"""
import copy
import ctypes as C
import ctypes.util
import json
from pathlib import Path
import re
import unittest

library = ctypes.util.find_library('lua5.4') or ctypes.util.find_library('lua5.3')
if not library:
    raise SystemExit('NOT RUN: an installed liblua5.3/5.4 is required; no Redis integration was performed.')
lua = C.CDLL(library)
state = C.c_void_p
callback = C.CFUNCTYPE(C.c_int, state)
def api(name, restype, *args):
    fn = getattr(lua, name)
    fn.restype, fn.argtypes = restype, list(args)
    return fn
new = api('luaL_newstate', state)
openlibs = api('luaL_openlibs', None, state)
close = api('lua_close', None, state)
load = api('luaL_loadstring', C.c_int, state, C.c_char_p)
pcall = api('lua_pcallk', C.c_int, state, C.c_int, C.c_int, C.c_int, C.c_longlong, state)
gettop = api('lua_gettop', C.c_int, state)
settop = api('lua_settop', None, state, C.c_int)
kind = api('lua_type', C.c_int, state, C.c_int)
tostring = api('lua_tolstring', state, state, C.c_int, C.POINTER(C.c_size_t))
toboolean = api('lua_toboolean', C.c_int, state, C.c_int)
tonumber = api('lua_tonumberx', C.c_double, state, C.c_int, state)
absolute = api('lua_absindex', C.c_int, state, C.c_int)
nextkey = api('lua_next', C.c_int, state, C.c_int)
pushnil = api('lua_pushnil', None, state)
pushboolean = api('lua_pushboolean', None, state, C.c_int)
pushnumber = api('lua_pushnumber', None, state, C.c_double)
pushstring = api('lua_pushlstring', state, state, C.c_char_p, C.c_size_t)
createtable = api('lua_createtable', None, state, C.c_int, C.c_int)
setfield = api('lua_setfield', None, state, C.c_int, C.c_char_p)
rawseti = api('lua_rawseti', None, state, C.c_int, C.c_longlong)
setglobal = api('lua_setglobal', None, state, C.c_char_p)
pushcallback = api('lua_pushcclosure', None, state, callback, C.c_int)
source = Path('src/lib/crm/lead-receipt.ts').read_text()
script = re.search(r'export const INSERT_LEAD_WITH_RECEIPT_LUA = `(.+?)`;', source, re.S).group(1)
script = script.replace('${LEAD_RECEIPT_TTL_SECONDS}', str(7 * 24 * 60 * 60))

class Runtime:
    def __init__(self):
        self.L = new()
        openlibs(self.L)
        self.db, self.ttl, self.writes = {}, {}, []
        self.callbacks = []
        for name, method in [('_decode', self.decode), ('_encode', self.encode), ('_redis', self.redis)]:
            fn = callback(method)
            self.callbacks.append(fn)
            pushcallback(self.L, fn, 0)
            setglobal(self.L, name.encode())
        self.run("""
          cjson = {
            decode = function(raw)
              local ok, result = _decode(raw)
              if not ok then error(result) end
              return result
            end,
            encode = function(value) return _encode(value) end
          }
          redis = {call = function(...)
            local result = _redis(...)
            if type(result) == 'table' and result.err then error(result.err) end
            return result
          end}
        """)

    def dispose(self):
        close(self.L)

    def push(self, value):
        if value is None: pushnil(self.L)
        elif isinstance(value, bool): pushboolean(self.L, value)
        elif isinstance(value, (int, float)): pushnumber(self.L, value)
        elif isinstance(value, str):
            encoded = value.encode()
            pushstring(self.L, encoded, len(encoded))
        elif isinstance(value, list):
            createtable(self.L, len(value), 0)
            for i, item in enumerate(value, 1):
                self.push(item)
                rawseti(self.L, -2, i)
        elif isinstance(value, dict):
            createtable(self.L, 0, len(value))
            for key, item in value.items():
                self.push(item)
                setfield(self.L, -2, key.encode())
        else: raise TypeError(value)

    def value(self, index):
        tag = kind(self.L, index)
        if tag == 0: return None
        if tag == 1: return bool(toboolean(self.L, index))
        if tag == 3: return tonumber(self.L, index, None)
        if tag == 4:
            length = C.c_size_t()
            ptr = tostring(self.L, index, C.byref(length))
            return C.string_at(ptr, length.value).decode()
        if tag == 5:
            index = absolute(self.L, index)
            result = {}
            pushnil(self.L)
            while nextkey(self.L, index):
                result[self.value(-2)] = self.value(-1)
                settop(self.L, -2)
            if result and set(result) == set(range(1, len(result) + 1)):
                return [result[i] for i in range(1, len(result) + 1)]
            return result
        raise TypeError(f'Unexpected Lua value type {tag}')

    def decode(self, _):
        try:
            decoded = json.loads(self.value(1))
            self.push(True)
            self.push(decoded)
        except (ValueError, TypeError):
            self.push(False)
            self.push('invalid fixture JSON')
        return 2

    def encode(self, _):
        self.push(json.dumps(self.value(1), separators=(',', ':')))
        return 1

    def redis(self, _):
        try:
            args = [self.value(i) for i in range(1, gettop(self.L) + 1)]
            op, key, *args = args
            entry = self.db.get(key)
            if op == 'TYPE': result = {'ok': entry[0] if entry else 'none'}
            elif op in ('GET', 'HGET', 'ZSCORE'):
                expected = {'GET': 'string', 'HGET': 'hash', 'ZSCORE': 'zset'}[op]
                if entry and entry[0] != expected: raise ValueError('WRONGTYPE')
                result = False if not entry else (entry[1] if op == 'GET' else entry[1].get(args[0], False))
            elif op == 'SET':
                self.db[key] = ('string', str(args[0]))
                if len(args) == 3:
                    assert args[1] == 'EX'
                    self.ttl[key] = int(args[2])
                self.writes.append((op, key))
                result = 'OK'
            elif op in ('ZADD', 'HINCRBY'):
                expected = 'zset' if op == 'ZADD' else 'hash'
                if entry and entry[0] != expected: raise ValueError('WRONGTYPE')
                values = entry[1] if entry else {}
                if op == 'ZADD':
                    values[str(args[1])] = float(args[0])
                    result = 1
                else:
                    prior = values.get(args[0], '0')
                    if not re.fullmatch(r'0|-?[1-9][0-9]*', prior): raise ValueError('not an integer')
                    result = int(prior) + int(args[1])
                    if not -(2**63) <= result < 2**63: raise ValueError('integer overflow')
                    values[args[0]] = str(result)
                self.db[key] = (expected, values)
                self.writes.append((op, key))
            else: raise ValueError(f'Unexpected fixture command {op}')
        except Exception as error:
            result = {'err': str(error)}
        self.push(result)
        return 1

    def run(self, code):
        if load(self.L, code.encode()) or pcall(self.L, 0, 1, 0, 0, None):
            error = self.value(-1)
            settop(self.L, 0)
            raise AssertionError(f'Lua error: {error}')
        result = self.value(-1)
        settop(self.L, 0)
        return result

    def evaluate(self, lead_id='lead-1', fingerprint='a' * 64, mode='create'):
        keys = ['crm:receipt:fixture', f'crm:lead:{lead_id}', 'crm:idx:time', 'crm:idx:email:fixture', 'crm:metrics:fixture']
        lead = {'id': lead_id, 'createdAt': 1791498000000, 'name': 'Synthetic fixture', 'email': 'fixture@example.test', 'form': 'contact'}
        args = [lead_id, json.dumps(lead), str(lead['createdAt']), '24662b3d-3b41-45e0-b4e0-a515b9b7056b', fingerprint, 'service:Unspecified', 'form:contact', mode]
        self.push(keys)
        setglobal(self.L, b'KEYS')
        self.push(args)
        setglobal(self.L, b'ARGV')
        return self.run(script)

class ReceiptLuaTests(unittest.TestCase):
    def setUp(self): self.runtime = Runtime()
    def tearDown(self): self.runtime.dispose()
    def assert_unchanged(self, expected, **args):
        before = copy.deepcopy((self.runtime.db, self.runtime.ttl, self.runtime.writes))
        self.assertEqual(self.runtime.evaluate(**args), expected)
        self.assertEqual((self.runtime.db, self.runtime.ttl, self.runtime.writes), before)

    def test_creates_lead_indexes_counters_and_receipt_last(self):
        r = self.runtime
        self.assertEqual(r.evaluate()[0], 'created')
        self.assertIn('crm:lead:lead-1', r.db)
        self.assertEqual(r.db['crm:idx:email:fixture'], ('string', 'lead-1'))
        self.assertEqual(r.db['crm:metrics:fixture'][1], {'leads':'1', 'service:Unspecified':'1', 'form:contact':'1'})
        self.assertEqual(r.ttl, {'crm:receipt:fixture': 604800})
        self.assertEqual(r.writes[-1], ('SET', 'crm:receipt:fixture'))
        receipt = json.loads(r.db['crm:receipt:fixture'][1])
        self.assertEqual(receipt['leadId'], 'lead-1')
        self.assertEqual(receipt['eventId'], r.evaluate()[1])

    def test_replay_is_read_only_and_does_not_extend_retention(self):
        self.runtime.evaluate()
        self.runtime.ttl['crm:receipt:fixture'] = 20
        self.assert_unchanged(['replayed', '24662b3d-3b41-45e0-b4e0-a515b9b7056b', 'lead-1'])

    def test_same_key_candidates_select_original_without_duplicate_record(self):
        self.runtime.evaluate()
        self.assert_unchanged(['lookup', 'lead-1'], lead_id='lead-2')
        self.assert_unchanged(['replayed', '24662b3d-3b41-45e0-b4e0-a515b9b7056b', 'lead-1'], mode='replay')
        self.assertNotIn('crm:lead:lead-2', self.runtime.db)

    def test_fingerprint_conflict_does_not_mutate(self):
        self.runtime.evaluate()
        self.assert_unchanged(['conflict'], fingerprint='b' * 64)

    def test_receipt_expiry_during_lookup_never_inserts(self):
        self.runtime.evaluate()
        del self.runtime.db['crm:receipt:fixture']
        self.assert_unchanged(['unavailable'], mode='replay')

    def test_missing_or_malformed_original_lead_never_replays(self):
        self.runtime.evaluate()
        for value in [None, ('hash', {}), ('string', 'invalid'), ('string', '{}'), ('string', '[]'),
                      ('string', '{"id":"different","createdAt":0,"name":"x","email":"x","form":"x"}')]:
            if value is None: self.runtime.db.pop('crm:lead:lead-1', None)
            else: self.runtime.db['crm:lead:lead-1'] = value
            self.assert_unchanged(['unavailable'])

    def test_wrong_types_are_rejected_before_any_write(self):
        for key in ['crm:receipt:fixture', 'crm:lead:lead-1', 'crm:idx:time', 'crm:idx:email:fixture', 'crm:metrics:fixture']:
            with self.subTest(key=key):
                self.runtime.db = {key: ('list', ['fixture'])}
                self.assert_unchanged(['unavailable'])

    def test_malformed_receipt_is_not_replaced(self):
        for value in ['invalid', '{}', '[]', 'null', '{"version":1,"leadId":"lead-1","eventId":"bad","fingerprint":"' + 'a' * 64 + '"}']:
            self.runtime.db = {'crm:receipt:fixture': ('string', value)}
            self.assert_unchanged(['unavailable'])

    def test_existing_lead_is_not_overwritten_or_counted(self):
        self.runtime.db['crm:lead:lead-1'] = ('string', 'existing')
        self.assert_unchanged(['unavailable'])

    def test_orphaned_time_index_is_not_counted_twice(self):
        self.runtime.db['crm:idx:time'] = ('zset', {'lead-1': 100})
        self.assert_unchanged(['unavailable'])

    def test_noninteger_overflow_and_noncanonical_counters_do_not_partially_write(self):
        for field in ['leads', 'service:Unspecified', 'form:contact']:
            for value in ['-1', 'NaN', 'Infinity', '1.5', '01', '00', '+1', ' 1', '9007199254740991', '9223372036854775807']:
                with self.subTest(field=field, value=value):
                    self.runtime.db = {'crm:metrics:fixture': ('hash', {field: value})}
                    self.assert_unchanged(['unavailable'])

    def test_valid_existing_counters_and_email_index_are_preserved_and_incremented(self):
        self.runtime.db['crm:idx:email:fixture'] = ('string', 'previous')
        self.runtime.db['crm:metrics:fixture'] = ('hash', {'leads':'8', 'service:Unspecified':'0', 'unrelated':'100'})
        self.assertEqual(self.runtime.evaluate()[0], 'created')
        self.assertEqual(self.runtime.db['crm:metrics:fixture'][1], {'leads':'9', 'service:Unspecified':'1', 'form:contact':'1', 'unrelated':'100'})
        self.assertEqual(self.runtime.db['crm:idx:email:fixture'], ('string', 'lead-1'))

if __name__ == '__main__':
    print('OFFLINE Lua logic tests with mocked Redis commands. Real Redis/Upstash: NOT RUN.', flush=True)
    unittest.main(verbosity=2)
