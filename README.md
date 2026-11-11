# Hypa PayPal

**Speak, snap or type an order in your own language. Hypa's agent turns it into a PayPal checkout, and nothing is charged until you approve it.**

Hypa is a multilingual AI assistant for small merchants. This repository is Hypa's entry for the PayPal AI Hackathon (Best Use of Agentic Commerce): an agent that takes a merchant's request by voice, photo or text in any of 160 languages, builds the order, asks the merchant to approve it, creates a PayPal checkout, sends the customer a payment message in the customer's own language, and confirms when PayPal says the order is paid.

The same backend also runs **Hypa Bridge**: a WhatsApp assistant for a small business. It answers customers from the owner's price list, records their orders, and hands anything unusual to the owner. You can try it with a local simulator, with no Meta account.

MIT licensed. See [LICENSE](LICENSE).

## Try the hosted demo

**[labs.hypaintelligence.com](https://labs.hypaintelligence.com)** is Hypa's hosted build of this flow, running against the PayPal sandbox. This repository is the full open-source version; to run it yourself, see [Try it locally](#try-it-locally).

1. Open [labs.hypaintelligence.com](https://labs.hypaintelligence.com) and sign in with the sandbox merchant login from the Devpost testing instructions.
2. In the chat, ask in any language, for example: *Invoice Ada, ada@example.com, 20 USD for two bags at 10 USD each. She speaks Hausa.*
3. Review the order on the approval card and tap **Approve order**.
4. Tap **Share payment link** or **Copy payment link**, open the link in a private window, and pay with a PayPal sandbox **Personal** account.
5. After paying, the receipt page shows the payment. Ask the chat *Has Ada paid?* to see the agent confirm it.

## Contents

- [Try the hosted demo](#try-the-hosted-demo)
- [The problem](#the-problem)
- [How it works](#how-it-works)
- [Safety rules](#safety-rules)
- [How PayPal and AI are used](#how-paypal-and-ai-are-used)
- [Architecture](#architecture)
- [What changed during the hackathon](#what-changed-during-the-hackathon)
- [Try it locally](#try-it-locally)
- [Try Hypa Bridge](#try-hypa-bridge)
- [Connect an outside agent over MCP](#connect-an-outside-agent-over-mcp)
- [Repository layout](#repository-layout)
- [Useful commands](#useful-commands)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## The problem

Millions of small merchants, many of them in Africa, sell through chat: a customer sends a voice note on WhatsApp, the merchant replies with a price, and payment happens somewhere else, often by bank transfer and a screenshot. Card checkout tools assume the merchant works in English, at a desk, in a dashboard. A tailor in Lagos who speaks Yoruba to one customer and Hausa to the next has none of that.

Hypa lets that merchant say "Invoice Ada 20 dollars for two bags, she speaks Hausa" in their own language, from the app or from the Hypa keyboard inside the chat they already use, and get back a PayPal link with a message Ada can read.

## How it works

1. **Ask.** The merchant asks Hypa by voice, photo (for example a handwritten order) or text, in the Hypa app, the web app, or the Hypa keyboard inside any chat app.
2. **Understand.** The agent uses Hypa's own tools to transcribe speech, read text in photos and translate, so it works in the merchant's language.
3. **Draft.** The agent calls the `paypal` tool with `create_order`. This saves a **draft** order only.
4. **Approve.** Hypa shows an approval card in the merchant's language: items, total and Hypa's fee. Nothing moves until the merchant taps **Approve**.
5. **Send.** Hypa creates a PayPal Orders v2 checkout and writes the payment message in the customer's language, with the exact amount and link kept intact. The merchant shares it, or the keyboard types it into the chat.
6. **Pay.** The customer pays on PayPal and lands on a Hypa receipt page in their language.
7. **Confirm.** PayPal's signed webhook (or the receipt page's own check with PayPal) marks the order paid, and the agent tells the merchant only once PayPal says it is paid.

The same tools are published over MCP at `/v2/mcp`, so an outside agent (Claude, ChatGPT, Codex, Muse Code) can run the same flow for a signed-in merchant.

**Hypa Bridge.** A customer's WhatsApp message is checked against the app secret, queued, and answered from the owner's business profile only. Simple replies can go out on their own. Orders, unlisted prices and anything the profile cannot answer wait for the owner.

## Safety rules

- **The model never moves money.** The agent plans and calls tools. The backend checks who is asking and which order it is. PayPal moves the money.
- **No checkout without approval.** `create_checkout` and `send_payment_link` refuse any order the merchant has not approved (`Only approved orders can start checkout`).
- **Amounts come from the database.** After approval, the amount, currency and provider are read from the saved order, never from the model. Editing an approved order sends it back to draft.
- **Signed-in merchants only.** Payment tools need a merchant account. Anonymous chat still works for everything else.
- **Verified webhooks, idempotent steps.** PayPal webhooks are checked with PayPal's signature verification API against the raw request body. Retried agent turns find the same order instead of making a second one, and PayPal requests carry request IDs.
- **Customers pay nothing extra.** Hypa charges the merchant a small fee ($0.01 in sandbox, set in [`payments.json`](packages/@hypa-config/json/payments.json)) only after a payment completes.
- **Private by default.** Saved chat history drops the customer's contact details from approval events.

## How PayPal and AI are used

| Part | What it does | Where |
| --- | --- | --- |
| PayPal Orders v2 | Creates checkouts with an itemised amount breakdown, the customer's PayPal locale, and return and cancel URLs; captures approved orders | [`packages/@hypa-paypal-agent`](packages/@hypa-paypal-agent) |
| PayPal webhooks | Verifies `PAYMENT.CAPTURE.*` and `CHECKOUT.ORDER.*` events with PayPal's signature verification endpoint, then settles the order and charges the fee once | [`paypal-webhook.service.ts`](apps/hypa-api/src/api/webhooks/paypal-webhook.service.ts) |
| PayPal sandbox | Every request runs against `api-m.sandbox.paypal.com` unless `PAYPAL_ENVIRONMENT=live` | [`.env.example`](apps/hypa-api/.env.example) |
| Agent | Meta Muse Spark (default) or any model in Hypa's catalog plans the steps and calls tools | [`agent.service.ts`](apps/hypa-api/src/api/agent/agent.service.ts) |
| `paypal` tool | One tool with five actions: `create_order`, `list_payment_methods`, `create_checkout`, `get_payment_status`, `send_payment_link` | [`tools.ts`](packages/@hypa-intelligence-core/src/tools.ts) |
| Language tools | Speech-to-text, OCR, translation and text-to-speech, so the flow works in the merchant's and the customer's languages | [`tools.ts`](packages/@hypa-intelligence-core/src/tools.ts) |

The PayPal adapter is also published on its own as the open-source package [`@hypa/paypal-agent`](packages/@hypa-paypal-agent), with provider-neutral payment contracts and an in-memory fake provider for tests.

## Architecture

```mermaid
flowchart LR
  subgraph Clients
    App[Mobile app]
    Kbd[Hypa keyboard]
    Web[Web app]
    Ext[Outside agent via MCP]
  end
  subgraph API[hypa-api]
    Agent[Agent /v2/agent]
    MCP[MCP /v2/mcp]
    Tools[paypal tool + language tools]
    Commerce[Commerce: orders, approval, receipts]
    Hook[PayPal webhook]
    DB[(Postgres)]
  end
  PayPal[PayPal Orders v2]
  Customer[Customer]

  App --> Agent
  Kbd --> Agent
  Web --> Agent
  Ext --> MCP
  Agent --> Tools
  MCP --> Tools
  Tools --> Commerce
  App -- approve --> Commerce
  Web -- approve --> Commerce
  Commerce --> DB
  Commerce -- create and capture --> PayPal
  Customer -- pays --> PayPal
  PayPal -- signed webhook --> Hook
  Hook --> Commerce
```

## What changed during the hackathon

Hypa's translation, speech, keyboard and agent features existed before the hackathon. Everything about payments was built during the submission period (from October 26, 2026):

- The open-source [`@hypa/paypal-agent`](packages/@hypa-paypal-agent) package: payment contracts, the PayPal Orders v2 adapter, webhook verification and a fake provider.
- The commerce data model: customers, orders, payments, payment events and merchant fees.
- The commerce API: draft orders, approve and cancel, checkout, receipts, and reconciliation with PayPal.
- The `paypal` agent tool with five actions, served to Hypa's own agent and to outside agents over MCP.
- Payment messages written in the customer's language, with the amount and link protected from translation errors.
- Approval cards in the mobile app, the web app and the iOS and Android keyboards.
- The PayPal webhook handler, capture after approval, and the merchant fee.
- The customer receipt page and merchant sign-in on the web.
- Hypa Bridge: WhatsApp customer threads, owner drafts, a local WhatsApp simulator, and one-tap connection to a Hypa number.

## Try it locally

This runs the API and the web app on your computer against the PayPal sandbox. The mobile app and keyboard are optional; see [Mobile app and keyboard](#mobile-app-and-keyboard).

### Prerequisites

- Node.js 22.18 or newer, and pnpm 11.25.0 (`corepack enable` sets it up)
- PostgreSQL with the `pgvector` extension
- Redis 6.2 or newer
- A free [PayPal developer](https://developer.paypal.com/) account for sandbox keys
- A model key for the agent. The default model is Meta Muse Spark (`META_MODEL_API_KEY`).

### 1. Clone and install

```bash
git clone https://github.com/hypaai/hypa-paypal.git
cd hypa-paypal
corepack enable
pnpm install
```

The install also builds `@hypa/paypal-agent`.

### 2. Start PostgreSQL and Redis

With Docker:

```bash
docker run --name hypa-postgres -e POSTGRES_USER=hypa -e POSTGRES_PASSWORD=hypa -e POSTGRES_DB=hypa-paypal -p 5432:5432 -d pgvector/pgvector:pg17
docker run --name hypa-redis -p 6379:6379 -d redis
```

Or with a local install, create a database named `hypa-paypal` and enable `pgvector` in it:

```bash
createdb hypa-paypal
psql postgresql://localhost:5432/hypa-paypal -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

### 3. Get PayPal sandbox keys

1. Sign in at [developer.paypal.com](https://developer.paypal.com/) and switch to **Sandbox**.
2. Under **Apps & Credentials**, create an app (or use the default one) and copy its **Client ID** and **Secret**.
3. Under **Testing Tools → Sandbox Accounts**, note a **Personal** (buyer) account. You will pay with it.
4. Optional, for webhooks: add a webhook to your app pointing at `https://<public-url>/webhooks/paypal` (for example through a tunnel such as ngrok) with the `PAYMENT.CAPTURE.*` and `CHECKOUT.ORDER.APPROVED` events, and copy its **Webhook ID**. Without a webhook, the receipt page checks the payment with PayPal directly, so the flow still completes locally.

### 4. Configure the API

```bash
cp apps/hypa-api/.env.example apps/hypa-api/.env
```

Set at least these values in `apps/hypa-api/.env`:

```dotenv
DATABASE_URL=postgresql://hypa:hypa@localhost:5432/hypa-paypal?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=<a long random string>
AGENT_MEDIA_SECRET=<another long random string>
NODE_ENV=development
BASE_URL=http://localhost:5678

META_MODEL_API_KEY=<your Meta model key>

PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=<sandbox client id>
PAYPAL_CLIENT_SECRET=<sandbox secret>
PAYPAL_WEBHOOK_ID=<optional webhook id>

FRONTEND_URL=http://localhost:5181
APP_ORIGINS=http://localhost:5181

# Only needed for Hypa Bridge. Any local strings work with the simulator.
WHATSAPP_APP_SECRET=any-local-string
WHATSAPP_VERIFY_TOKEN=any-local-string
WHATSAPP_ACCESS_TOKEN=any-local-string
WHATSAPP_PHONE_NUMBER_IDS=1415999774934646
WHATSAPP_CONNECT_EMAILS=merchant@example.com
WHATSAPP_GRAPH_URL=http://localhost:4010
```

`ENCRYPTION_KEY` is already in `.env.example`. Bridge uses it to store customer phone numbers. Keep the same value after the first customer connects, or stored numbers can no longer be read.

Keep the placeholder `GOOGLE_*` values from `.env.example`; the API needs them to start even without Google sign-in. If you have no Firebase storage, set `FIREBASE_STORAGE_BUCKET` to any placeholder; only voice-reply storage needs it.

### 5. Prepare the database and start the API

```bash
pnpm --filter hypa-api exec prisma db push
pnpm --filter hypa-api dev
```

The API listens on `http://localhost:5678`.

### 6. Create a merchant account

```bash
curl -sS -X POST http://localhost:5678/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"merchant@example.com","password":"choose-a-local-password","first_name":"Test","last_name":"Merchant"}'
```

The agent's model calls are billed to the merchant's Hypa wallet, so give the local account some test balance:

```bash
psql postgresql://hypa:hypa@localhost:5432/hypa-paypal -c "INSERT INTO wallet (id, \"userId\", balance, updated_at) SELECT 'local-wallet', id, 5, now() FROM \"user\" WHERE email = 'merchant@example.com' ON CONFLICT (\"userId\") DO UPDATE SET balance = 5;"
```

### 7. Start the web app

```bash
cp apps/hypa-intelligence/.env.example apps/hypa-intelligence/.env
pnpm --filter @hypa/audio build
pnpm --filter hypa-intelligence dev
```

Open `http://localhost:5181/chat`.

### 8. Run the flow

1. In the chat, ask: *Invoice Ada, ada@example.com, 20 USD for two bags at 10 USD each. She speaks Hausa.* You can also attach a photo of a handwritten order or record a voice note.
2. The agent drafts the order and the approval card opens. Sign in with the merchant account from step 6.
3. Check the items, total and fee, then tap **Approve order**.
4. Tap **Share payment link** or **Copy payment link**. The message is in Hausa and ends with the PayPal link.
5. Open the link in a private window and pay with your sandbox **Personal** account.
6. PayPal returns you to the receipt page, which shows the payment as received.
7. Back in the chat, ask *Has Ada paid?* The agent checks with `get_payment_status` and answers.

### Mobile app and keyboard

The Expo app in [`apps/hypa-intelligence-mobile`](apps/hypa-intelligence-mobile) has the same chat, a native approval sheet, and the Hypa keyboard for iOS and Android with an **Approve order** button. Set `EXPO_PUBLIC_API_BASE_URL` in `apps/hypa-intelligence-mobile/.env` (copy `.env.example`) to an API URL the device can reach (`http://localhost:5678` for the iOS Simulator, `http://10.0.2.2:5678` for the Android Emulator, your computer's LAN IP for a phone), then:

```bash
pnpm --filter @hypa/intelligence ios
pnpm --filter @hypa/intelligence android
```

The keyboard needs a physical device: enable **Hypa Keyboard** in the system keyboard settings (on iOS, also **Allow Full Access**).

For a real iPhone, open `apps/hypa-intelligence-mobile/ios` in Xcode and choose your own Apple development team for signing first.

The app uses native modules (`expo-notifications`, `react-native-keyboard-controller`, the Hypa keyboard), so use a development build, not Expo Go. After pulling new changes, run `pnpm install`, then `pod install` in `apps/hypa-intelligence-mobile/ios` and rebuild. Add `EXPO_PUBLIC_POSTHOG_KEY` to `.env` only if you want usage analytics; empty turns it off.

An order made in the app returns to `/pay/:id?receipt=<token>&from=app`. On a phone that page opens `hypaintelligence://pay/<id>?receipt=<token>`, and the app's `pay/[id]` screen shows the receipt. The return URL must be public HTTPS, not `localhost`, for a phone to reach it.


## Try Hypa Bridge

Hypa Bridge answers a small business's WhatsApp customers from the owner's price list. The simulator plays WhatsApp on your computer, so you do not need a Meta account. Finish [Try it locally](#try-it-locally) through step 6 first, and install `ffmpeg` (`brew install ffmpeg`) if you want voice notes.

### How it behaves

- The assistant answers from the business profile only: name, what you sell, currency, price list, opening hours, languages and tone. It never invents or changes a price. Anything it cannot answer (a discount, a refund, a complaint, an unlisted item) goes to the owner.
- When a customer wants something, it records an order and asks for what is still missing.
- Customers can send text, voice notes and photos such as a handwritten order.
- With **Answer simple questions automatically** off, every reply is a draft the owner sends, edits or discards. With it on, simple answers go out directly. Orders, hand-offs and unlisted prices always wait.
- The owner can reply by hand (**Write a reply**), which pauses the assistant, then tap **Hand back** to let it continue.
- WhatsApp only allows free-form messages within 24 hours of the customer's last message. After that, a draft uses an approved template (`WHATSAPP_QUOTE_TEMPLATE`, default `quote_ready`).
- An order the assistant records becomes a draft PayPal order. Nothing payable is sent until the owner approves it. Then the customer gets the PayPal link in their language, and a receipt once PayPal says it is paid. Outside the 24-hour window the templates `invoice_ready` and `payment_received` are used. PayPal does not support NGN, GHS or XOF, so a business in those currencies arranges payment itself.
- Replies are billed to the owner's wallet. If it runs low, the assistant pauses and the app shows an alert.

### Run it with the simulator

1. In `apps/hypa-api/.env`, set the WhatsApp values from step 4 and restart the API.
2. In the app, open **Settings → Hypa Bridge**. Fill in the business, including a real price list. Leave automatic answers off for a first run. Tap **Connect WhatsApp**. Only emails listed in `WHATSAPP_CONNECT_EMAILS` can take a number.
3. In another terminal, start the simulator with the same secret:

```bash
WHATSAPP_APP_SECRET=any-local-string pnpm --filter hypa-api whatsapp:sim
```

4. Type as the customer. Each line is a WhatsApp message. Replies print as `← [text] ...`.

| Input | Sends |
| --- | --- |
| `how much is a 3 piece agbada` | A text message |
| `/voice path/to/note.ogg` | A voice note |
| `/image path/to/photo.jpg My order` | A photo |
| `/quit` | Stops the simulator |

5. In the app, open **Hypa Bridge**, then the customer. **Send**, **Edit** or **Discard** the draft. The reply then shows in the simulator.

A good first run, one line at a time, approving each draft:

```text
hi, how much is a 3 piece agbada
I want 2, I need them by Friday
what is your return policy?
```

The first line quotes the price list. The second records an order. The third is handed to the owner, because a return policy is not in the profile.

### Push notifications

The app sends its Expo push token to `POST /v2/push/token` once a business has a number. The owner is told when a draft or an order waits for approval and when a customer has paid. A failed push is logged and never stops the reply. A real device needs a development build and push credentials. The simulator does not send pushes. Run `pnpm install` and `prisma db push` to pick up the new table.

### Connect a real WhatsApp number

Hypa uses one Meta app. A business never handles a Meta credential.

1. In the Meta app, copy the phone number ID and an access token. Add the phone that will play the customer.
2. In `.env`, set `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_IDS`. Remove `WHATSAPP_GRAPH_URL`. Restart the API.
3. Expose the API (for example `ngrok http 5678`). In Meta, set the callback to `https://<your-public-url>/v2/whatsapp/webhook`, use the same verify token, and subscribe to `messages`.
4. In the app, tap **Connect WhatsApp** and message the test number from the phone you added.
5. Approve an English template named `quote_ready`, or set `WHATSAPP_QUOTE_TEMPLATE`. It is used after the 24-hour window.

## WhatsApp order to PayPal in one file

[`examples/whatsapp`](./examples/whatsapp/README.md) is a single-file bot that wires WhatsApp to the PayPal adapter, sandbox only, with keys from the environment: order, merchant approval, PayPal link, receipt.

## Connect an outside agent over MCP

Any MCP client can use the same `paypal` tool for a signed-in merchant. Use the merchant's login token (or a Hypa API key) as a Bearer token:

```bash
TOKEN='<access_token from /auth/login>'
curl -sS -X POST http://localhost:5678/v2/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"paypal","arguments":{"action":"create_order","customerName":"Ada","customerContact":"ada@example.com","customerLanguage":"Hausa","amount":"20.00","currency":"USD","items":[{"name":"Bag","qty":2,"unitPrice":"10.00"}]}}}'
```

The reply carries an `approvalUrl`. The merchant opens it in the web app to approve, and the agent can then call `send_payment_link` and `get_payment_status`.

For Claude Desktop, Muse Code or another client, point it at `http://localhost:5678/v2/mcp` with the header `Authorization: Bearer <token>`.

## Repository layout

| Path | What it is |
| --- | --- |
| [`packages/@hypa-paypal-agent`](packages/@hypa-paypal-agent) | Open-source PayPal Orders v2 adapter, payment contracts and fake provider |
| [`apps/hypa-api`](apps/hypa-api) | NestJS API: agent, MCP, commerce, PayPal webhook, Hypa Bridge, auth |
| [`apps/hypa-intelligence`](apps/hypa-intelligence) | Web app: chat, approval card, merchant sign-in, receipt page |
| [`apps/hypa-intelligence-mobile`](apps/hypa-intelligence-mobile) | Expo app with the approval sheet and the Hypa keyboard |
| [`packages/@hypa-intelligence-core`](packages/@hypa-intelligence-core) | Shared tool list (including `paypal`), agent stream, approval and payment-link helpers |
| [`packages/@hypa-config`](packages/@hypa-config) | Model and language catalog, prompts, payment fees and PayPal locales |

## Useful commands

| Task | Command |
| --- | --- |
| Start the API | `pnpm --filter hypa-api dev` |
| Start the web app | `pnpm --filter hypa-intelligence dev` |
| Run the WhatsApp simulator | `WHATSAPP_APP_SECRET=<secret> pnpm --filter hypa-api whatsapp:sim` |
| Run the PayPal adapter demo (no keys needed) | `pnpm --filter @hypa/paypal-agent demo` |
| Test the shared tools | `pnpm --filter @hypa/intelligence-core test` |
| Test the web app | `pnpm --filter hypa-intelligence test` |
| Check API types | `pnpm --filter hypa-api check-types` |

## Troubleshooting

**`PayPal credentials are not configured`.** Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `apps/hypa-api/.env` and restart the API.

**`Only approved orders can start checkout`.** This is the approval rule working. Approve the order on its card first.

**`Payment tools require a signed-in merchant`.** Sign in on the web app (the approval card asks you to), or send a Bearer token to `/v2/mcp`.

**`type "vector" does not exist` during `prisma db push`.** Enable `pgvector` in the database (see step 2).

**The web app cannot reach the API.** Check that `VITE_PUBLIC_API_URL` in `apps/hypa-intelligence/.env` points at the API and that the web app's origin is in `APP_ORIGINS`.

**The agent replies with an insufficient balance error.** Top up the merchant's local wallet (step 6).

**The simulator says `Set WHATSAPP_APP_SECRET` or answers `403`.** The simulator and the API must use the same `WHATSAPP_APP_SECRET`. Restart both after changing it.

**No customer appears in Hypa Bridge.** `WHATSAPP_PHONE_NUMBER_IDS` must match the simulator's number, and the business must tap **Connect WhatsApp** first.

**No push notification arrives.** Use a physical device with a development build, sign in, and connect a number. The token is sent then.

**No reply appears in the simulator.** Redis must be running. `WHATSAPP_GRAPH_URL` must be `http://localhost:4010`. If automatic answers are off, send the draft in the app.

**Native build or generated-code errors.** Run `pnpm install` and `pnpm --filter @hypa/intelligence generate:nitro`, then rebuild the app.

## Security

- Never commit `.env` files, PayPal secrets, API keys or tokens. Only `.env.example` files are tracked.
- Use PayPal **sandbox** credentials. `PAYPAL_ENVIRONMENT=live` is for a production PayPal app only.
- Keep the API's database and Redis local or private.
