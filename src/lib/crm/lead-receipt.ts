/**
 * Accepted-lead receipts live for seven days. A retry within that window must
 * carry the same submission UUID and SHA-256 fingerprint of sanitized input.
 * Expiry is not extended by replay. After expiry the key is a new submission.
 * No receipt is inferred from a process-wide backend status or memory copy.
 */
export const LEAD_RECEIPT_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface AcceptedLeadReceipt {
	eventId: string;
}

export type InsertLeadWithReceiptResult =
	| { status: 'created'; receipt: AcceptedLeadReceipt; leadId: string }
	| { status: 'replayed'; receipt: AcceptedLeadReceipt; leadId: string }
	| { status: 'conflict' }
	| { status: 'unavailable' };

export const RECEIPT_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const RECEIPT_LEAD_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * All keys, including the lead used to verify a replay, are supplied explicitly.
 * On a retry with a newly generated candidate lead ID, `lookup` asks the caller
 * to run the read-only replay branch with the original lead key. That branch
 * cannot create anything, including if the receipt expires between requests.
 *
 * Redis scripts are isolated, but runtime command errors do NOT roll back prior
 * writes. Validate types, counters and JSON before the first write, then write
 * the receipt last. The known error cases leave every existing key untouched.
 */
export const INSERT_LEAD_WITH_RECEIPT_LUA = `
local function key_type(key)
  return redis.call('TYPE', key).ok
end
local function object(raw)
  if type(raw) ~= 'string' then return nil end
  local ok, value = pcall(cjson.decode, raw)
  if not ok or type(value) ~= 'table' then return nil end
  return value
end
local function valid_id(id)
  return type(id) == 'string' and #id > 0 and #id <= 128 and not string.find(id, '[^%w_-]')
end
local function uuid(value)
  return type(value) == 'string' and #value == 36 and
    string.match(value, '^%x%x%x%x%x%x%x%x%-%x%x%x%x%-4%x%x%x%-[89abAB]%x%x%x%-%x%x%x%x%x%x%x%x%x%x%x%x$') ~= nil
end
local function fingerprint(value)
  return type(value) == 'string' and #value == 64 and not string.find(value, '[^0-9a-f]')
end
local function lead_record(value, id)
  return value and value.id == id and type(value.createdAt) == 'number' and
    value.createdAt >= 0 and value.createdAt <= 9007199254740991 and
    value.createdAt % 1 == 0 and type(value.name) == 'string' and
    type(value.email) == 'string' and type(value.form) == 'string'
end
local receipt_type = key_type(KEYS[1])
if receipt_type ~= 'none' and receipt_type ~= 'string' then return {'unavailable'} end
if receipt_type == 'string' then
  local receipt = object(redis.call('GET', KEYS[1]))
  if not receipt or receipt.version ~= 1 or not valid_id(receipt.leadId) or
    not uuid(receipt.eventId) or not fingerprint(receipt.fingerprint) then
    return {'unavailable'}
  end
  if receipt.fingerprint ~= ARGV[5] then return {'conflict'} end
  if receipt.leadId ~= ARGV[1] then
    if ARGV[8] == 'replay' then return {'unavailable'} end
    return {'lookup', receipt.leadId}
  end
  if key_type(KEYS[2]) ~= 'string' then return {'unavailable'} end
  if not lead_record(object(redis.call('GET', KEYS[2])), receipt.leadId) then
    return {'unavailable'}
  end
  return {'replayed', receipt.eventId, receipt.leadId}
end
if ARGV[8] == 'replay' then return {'unavailable'} end
local lead = object(ARGV[2])
if not valid_id(ARGV[1]) or not lead_record(lead, ARGV[1]) or
  lead.createdAt ~= tonumber(ARGV[3]) or not uuid(ARGV[4]) or not fingerprint(ARGV[5]) then
  return {'unavailable'}
end
if key_type(KEYS[2]) ~= 'none' then return {'unavailable'} end
local time_type = key_type(KEYS[3])
local email_type = key_type(KEYS[4])
local metrics_type = key_type(KEYS[5])
if (time_type ~= 'none' and time_type ~= 'zset') or
  (email_type ~= 'none' and email_type ~= 'string') or
  (metrics_type ~= 'none' and metrics_type ~= 'hash') then return {'unavailable'} end
if redis.call('ZSCORE', KEYS[3], ARGV[1]) then return {'unavailable'} end
local fields = {'leads', ARGV[6], ARGV[7]}
for _, field in ipairs(fields) do
  local value = redis.call('HGET', KEYS[5], field)
  if value and (not (value == '0' or string.match(value, '^[1-9]%d*$')) or
    #value > 16 or (#value == 16 and value > '9007199254740990')) then
    return {'unavailable'}
  end
end
local receipt_json = cjson.encode({version = 1, leadId = ARGV[1], eventId = ARGV[4], fingerprint = ARGV[5]})
redis.call('SET', KEYS[2], ARGV[2])
redis.call('ZADD', KEYS[3], ARGV[3], ARGV[1])
redis.call('SET', KEYS[4], ARGV[1])
for _, field in ipairs(fields) do redis.call('HINCRBY', KEYS[5], field, 1) end
redis.call('SET', KEYS[1], receipt_json, 'EX', ${LEAD_RECEIPT_TTL_SECONDS})
return {'created', ARGV[4], ARGV[1]}
`;
