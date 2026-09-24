# Contact form — server-side delivery

O formulário de contato não envia e-mail pelo navegador. Ele faz `POST` para uma
API route do Astro, que valida no servidor e entrega por SMTP. Nenhuma
credencial, host ou senha chega ao bundle do cliente.

```
Visitante → <form action="/api/contact/"> → POST /api/contact/
          → tamanho do corpo → parsing → honeypot
          → sanitização + validação → Turnstile (opcional)
          → rate limit → SMTP
          → e-mail do lead para o estúdio (replyTo = visitante)
          → e-mail de confirmação para o visitante
          → JSON { ok: true } → mensagem visual no formulário
```

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `src/pages/api/contact.ts` | Endpoint server-side (`prerender = false`): validação, honeypot, Turnstile, rate limit, envio SMTP, logs. |
| `src/lib/contact-form.ts` | Contrato compartilhado: nomes dos campos, limites, opções permitidas, caminho da API. É a fonte de verdade do markup, do e-mail e da validação. |
| `src/lib/contact-email.ts` | Templates do e-mail do lead e da confirmação (text/plain + HTML responsivo), com escaping de todo valor do visitante. |
| `src/lib/rate-limit.ts` | Rate limit distribuído via Upstash REST, com fallback em memória **declarado como tal** nos logs. |
| `src/components/ui/Turnstile.astro` | Widget opcional do Cloudflare Turnstile; nada é renderizado nem carregado sem a site key. |
| `src/pages/contact.astro` | Formulário completo da página de contato. |
| `src/components/Header.astro` | Formulário compacto do modal "Start your project" (mesmo endpoint). |
| `src/components/Analytics.astro` | Estado de envio, mensagens de sucesso/erro e eventos de analytics. |
| `astro.config.mjs` | `output: 'static'` + adapter da Vercel: só este endpoint roda on-demand, o resto continua estático. |

## Variáveis de ambiente (configurar na Vercel)

Configurar em **Vercel → Project → Settings → Environment Variables** para
**Production, Preview e Development**. Depois de salvar, **fazer um novo deploy**:
o Astro substitui `import.meta.env.*` em tempo de build.

| Variável | Obrigatória | Valor |
| --- | --- | --- |
| `SMTP_HOST` | sim | `smtpout.secureserver.net` (GoDaddy Professional Email / Titan) |
| `SMTP_PORT` | sim | `465` |
| `SMTP_SECURE` | sim | `true` |
| `SMTP_USER` | sim | `info@paulaambrosio.com` |
| `SMTP_PASSWORD` | sim | senha da caixa (ou app password). **Somente servidor.** |
| `CONTACT_RECIPIENT_EMAIL` | recomendada | `info@paulaambrosio.com` (vazio = usa `SMTP_USER`) |
| `CONTACT_MAIL_MODE` | não | `json` só para teste: escreve o e-mail no log em vez de enviar |
| `UPSTASH_REDIS_REST_URL` | não | habilita rate limit distribuído |
| `UPSTASH_REDIS_REST_TOKEN` | não | idem |
| `CONTACT_RATE_LIMIT` / `CONTACT_RATE_LIMIT_WINDOW` | não | padrão `5` por `600` segundos |
| `CONTACT_RATE_LIMIT_PEPPER` | não | pepper do hash do IP usado como chave |
| `PUBLIC_TURNSTILE_SITE_KEY` | não | site key do Turnstile (pública por natureza) |
| `TURNSTILE_SECRET_KEY` | não | secret key do Turnstile (**somente servidor**) |

Se a conta for **Microsoft 365 da GoDaddy** em vez de Titan, trocar somente as
variáveis — nada de código:

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

Participantes do `Prefer to discuss`/`Other` etc. vêm de `src/lib/contact-form.ts`.

**Provedor confirmado: Professional Email / Titan.** Além da confirmação do
proprietário, o domínio foi testado no endpoint público de descoberta da Microsoft
(`login.microsoftonline.com/getuserrealm.srf`), que responde `Unknown` — ou seja,
não existe tenant Microsoft 365 para este domínio (o controle com um domínio
Microsoft responde `Federated`). Logo, os padrões do Titan em `SMTP_HOST`,
`SMTP_PORT` e `SMTP_SECURE` estão certos e não há nada a mudar no código.

**Pendente: a senha da caixa.** A credencial fornecida é recusada pelo próprio
provedor — `535 Authentication Failed` em `smtpout.secureserver.net:465` e `:587`
e em `smtp.titan.email`, e `[AUTHENTICATIONFAILED]` no IMAP dos dois hosts. O teste
com um endereço inexistente devolve a mesma resposta, então não é possível
distinguir senha desatualizada de caixa não provisionada; as duas hipóteses se
resolvem no painel do GoDaddy (*E-mail e Office → Gerenciar*). O login no webmail
usa o SSO do GoDaddy e chegou a responder `429 Too Many Requests`, sem relação com
a senha.

## Pré-requisito de DNS (bloqueador atual)

O domínio `paulaambrosio.com` usa o **Vercel DNS** (`ns1/ns2.vercel-dns.com`) e
**não tem nenhum registro de e-mail**:

| Registro | Situação | Consequência |
| --- | --- | --- |
| `MX` | ausente | e-mail para `info@paulaambrosio.com` **retorna erro** para quem envia |
| `TXT` (SPF) | ausente | mensagens enviadas pelo site não têm autorização declarada |
| `_dmarc` | ausente | sem política de proteção contra spoofing |
| `DKIM` | ausente | sem assinatura |

Para o formulário funcionar em produção, adicionar no painel de DNS (o GoDaddy
mostra os valores exatos em *Email & Office → Configurar DNS*; os do Titan são):

| Tipo | Nome | Valor |
| --- | --- | --- |
| MX | `@` | `mx1.titan.email` (prioridade 10) |
| MX | `@` | `mx2.titan.email` (prioridade 20) |
| TXT | `@` | `v=spf1 include:spf.titan.email ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@paulaambrosio.com` |
| TXT/CNAME | DKIM | valor gerado pelo Titan para o domínio (`default._domainkey`) |

O SPF é o que mais importa para o lead não cair em spam: sem ele, mensagens
enviadas pelo servidor em nome de `info@paulaambrosio.com` são tratadas como
não autorizadas.

## Verificando cada etapa (sem olhar painel)

Três comandos, todos sem dependência extra:

| Comando | Responde |
| --- | --- |
| `npm run dns:check` | O caminho de e-mail existe? Confere MX, SPF, DKIM (seletores comuns) e DMARC via DNS-over-HTTPS, mostrando o registro exato a publicar quando falta algo. Sai com código 1 enquanto incompleto. |
| `npm run smtp:check` | O host, a porta e a senha funcionam? Monta o **mesmo transporte** do endpoint, verifica conexão e autenticação e traduz o erro (535 = credencial recusada, `ENOTFOUND`/`ETIMEDOUT` = host/rede). `--send` envia uma mensagem de teste de verdade e devolve o id aceito pelo servidor. A senha nunca é impressa. |
| `npm run build` | O site está publicável? Inclui o guard que prova que `/api/contact/` foi construído como função. |

Os valores vêm de `.env.local`/`.env` (nenhum dos dois é versionado) ou do
ambiente. Estado atual: `dns:check` acusa os quatro registros ausentes e
`smtp:check` acusa `EAUTH 535`.

## Proteções implementadas

1. **Sanitização** — caracteres de controle removidos; campos de uma linha não
   aceitam quebras; o texto é normalizado antes de qualquer validação.
2. **Validação server-side** — obrigatórios, formato de e-mail, comprimento máximo
   por campo (`name` 100, `email` 200, `phone` 50, `location` 150, `message` 3000)
   e opções restritas às listas do contrato. Nada depende do navegador.
3. **Honeypot** — campo `website` invisível; se vier preenchido a resposta é um
   `200 { ok: true }` idêntico ao sucesso e nenhum e-mail é enviado.
4. **CSRF** — o `checkOrigin` do Astro rejeita POST de formulário sem `Origin`
   correto (bloqueia bots que postam de outros lugares).
5. **Rate limit** — por IP **hasheado** (SHA-256 + pepper opcional, nunca o IP
   cru) em janela fixa. Com Upstash configurado é distribuído; sem ele o log
   registra `rate_limit_memory_only` avisando que a proteção é apenas local.
6. **Turnstile** — ativado automaticamente quando as duas chaves existem; o
   script é carregado só na primeira interação com o formulário.
7. **Anti header-injection** — valores de uma linha não podem conter CR/LF; o
   assunto usa o nome já normalizado; o `from` é fixo na caixa autenticada e o
   visitante vai em `replyTo`.
8. **Escaping** — todo valor interpolado no HTML do e-mail passa por `escapeHtml`.
9. **Sem vazamento** — erros de SMTP/Turnstile/rate limit ficam no log do
   servidor com um `requestId`; o visitante recebe apenas uma mensagem genérica.

## Logs

JSON por linha, sem PII além do estritamente necessário:
`inquiry_delivered` (requestId, mode, service, hasPhone), `validation_failed`
(campos), `honeypot_triggered`, `rate_limited`, `turnstile_rejected`,
`smtp_delivery_failed` (code/mensagem técnica, no servidor), `smtp_not_configured`.
Nunca é registrado o corpo da mensagem nem a senha.

## Testando

Local, sem credenciais (cria um `.env.local`, ignorado pelo Git):

```
CONTACT_MAIL_MODE=json
SMTP_USER=info@paulaambrosio.com
CONTACT_RECIPIENT_EMAIL=info@paulaambrosio.com
```

Com o dev server rodando:

```bash
# caminho do browser (multipart com Origin)
curl -X POST http://localhost:4321/api/contact/ \
  -H "Origin: http://localhost:4321" \
  -F "name=Marina Albuquerque" -F "email=marina@example.com" \
  -F "location=Miami Beach" -F "service=Turnkey Interior Design" \
  -F "message=Reforma completa de um apartamento de 3 quartos."
```

Casos verificados nesta implementação: corpo válido (200), campos obrigatórios
vazios (422), e-mail inválido (422), mensagem acima de 3000 (422), opção fora da
lista (422), honeypot preenchido (200 silencioso), corpo > 32 KB (413), POST de
formulário sem `Origin` (403), rate limit excedido (429 + `Retry-After`),
`GET` (405). No navegador: `Sending…` + botão desabilitado + `aria-busy`,
double submit ignorado, sucesso limpa os campos, erro **preserva** os dados.

## Fallback: o lead não se perde antes das credenciais existirem

Enquanto `SMTP_USER`/`SMTP_PASSWORD` não estiverem cadastradas na Vercel, o
endpoint responde **503 `delivery_unavailable`** (e registra `smtp_not_configured`
no log). O cliente trata esse caso específico abrindo o aplicativo de e-mail do
visitante com a mensagem já preenchida — exatamente o comportamento anterior a
este endpoint. O evento `form_success` é disparado com `delivery: 'mailto'`, então
os números ficam distinguíveis do caminho SMTP (`delivery: 'smtp'`, implícito).

Esse fallback só existe para o 503 de configuração ausente: falha real de SMTP
(502) ou validação (422) continuam mostrando a mensagem de erro e **preservando**
os campos preenchidos.

## Build e deploy

Com o adapter da Vercel, o build passa a ter duas saídas:

| Caminho | Conteúdo |
| --- | --- |
| `dist/client/` | o site estático (todas as páginas prerenderizadas, `_astro/`, sitemaps) |
| `dist/server/` | bundle das rotas on-demand (redirecionado pelo adapter para `.vercel/output/server`) |
| `.vercel/output/` | saída no formato Build Output API: `static/`, `functions/_render.func`, `config.json` |

O `npm run build` roda `scripts/build.mjs`: o `astro build` e, em seguida, o
guard `scripts/check-links.mjs`. O guard varre o diretório de cliente correto
(`dist/client` quando existe) e falha o build se encontrar action de formulário
insegura, referência `http://`, mais de um `<h1>`, canonical fora do sitemap,
link interno que gera redirect, link quebrado — ou uma action `/api/*` que não
esteja roteada para uma função em `.vercel/output/config.json` (era o caso que
faria o formulário postar num 404).

> **Windows + OneDrive:** o `fs.cpSync` do Node falha com `EIO` para qualquer
> caminho dentro de uma pasta sincronizada pelo OneDrive, e é essa chamada que o
> adapter usa para montar `.vercel/output`. Por isso `scripts/build.mjs` carrega
> `scripts/cp-sync-fallback.mjs`, que tenta a implementação nativa e, apenas no
> Windows e apenas nesse erro, usa uma cópia equivalente com `copyFileSync`.
> Em Linux/macOS (builders da Vercel) não há diferença alguma.

## Pendências

1. Confirmar o produto de e-mail (Titan ou Microsoft 365) na GoDaddy.
2. Cadastrar as variáveis acima na Vercel e refazer o deploy.
3. Adicionar MX/SPF/DKIM/DMARC no DNS do domínio (bloqueador: sem MX, o e-mail
   não chega; sem SPF, cai em spam).
4. Opcional: criar conta Upstash e as chaves do Turnstile.
