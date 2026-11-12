# Hypa PayPal — Local Contest Setup

Hypa is a multilingual AI assistant for small merchants. Its agent takes a merchant's request by voice, photo or text in their own language, drafts an order, waits for the merchant to approve it, creates a **PayPal Orders v2** checkout in the **PayPal sandbox**, sends the customer a payment message in the customer's language, and confirms when PayPal says the order is paid. The same flow works from the Hypa app, the web app, the Hypa keyboard inside any chat app, Hypa Bridge on WhatsApp, and outside agents over MCP.

This guide helps you run Hypa PayPal locally and test a sandbox payment end to end. It covers the API, database, Redis, PayPal sandbox, web app, mobile app, keyboard and WhatsApp bridge.

The recommended review path is:

1. Install the project dependencies.
2. Start PostgreSQL and Redis.
3. Create PayPal sandbox credentials.
4. Configure the API credentials.
5. Apply the Prisma schema and start the API.
6. Create a merchant account and test the agent.
7. Start the web app.
8. Run the PayPal sandbox flow: order → approval → PayPal checkout → paid.
9. Optionally run the mobile app, the keyboard, and the WhatsApp bridge.

Prefer not to install anything? See [Hosted demo](#hosted-demo).

MIT licensed. See [LICENSE](./LICENSE).

## Table of contents

- [Hosted demo](#hosted-demo)
- [How the payment flow works](#how-the-payment-flow-works)
- [What was built during the hackathon](#what-was-built-during-the-hackathon)
- [Project components](#project-components)
- [Prerequisites](#prerequisites)
- [1. Clone and install](#1-clone-and-install)
- [2. Start PostgreSQL](#2-start-postgresql)
  - [Option A: Docker PostgreSQL](#option-a-docker-postgresql)
  - [Option B: Local PostgreSQL installation](#option-b-local-postgresql-installation)
- [3. Start Redis](#3-start-redis)
- [4. Create PayPal sandbox credentials](#4-create-paypal-sandbox-credentials)
- [5. Configure API environment variables](#5-configure-api-environment-variables)
  - [Required local values](#required-local-values)
  - [PayPal values](#paypal-values)
  - [Provider keys](#provider-keys)
  - [How to obtain external provider keys](#how-to-obtain-external-provider-keys)
- [6. Prepare the database](#6-prepare-the-database)
- [7. Start and test the API](#7-start-and-test-the-api)
- [8. Start the web app](#8-start-the-web-app)
- [9. Run the PayPal sandbox flow](#9-run-the-paypal-sandbox-flow)
- [10. Receive PayPal webhooks (optional)](#10-receive-paypal-webhooks-optional)
- [11. Run the mobile app](#11-run-the-mobile-app)
- [12. Validate the keyboard](#12-validate-the-keyboard)
- [13. Try Hypa Bridge and Bridge Pay on WhatsApp (optional)](#13-try-hypa-bridge-and-bridge-pay-on-whatsapp-optional)
- [WhatsApp order to PayPal in one file](#whatsapp-order-to-paypal-in-one-file)
- [Call the paypal tool over MCP](#call-the-paypal-tool-over-mcp)
- [Connect Hypa MCP to Claude Code (Desktop)](#connect-hypa-mcp-to-claude-code-desktop)
- [Connect Hypa MCP to Muse Code](#connect-hypa-mcp-to-muse-code)
- [Useful commands](#useful-commands)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## Hosted demo

**[labs.hypaintelligence.com/chat](https://labs.hypaintelligence.com/chat)** is Hypa's hosted build of this flow. Everything runs against the **PayPal sandbox**, so no real money moves. This repository is the full open-source version of it.

The judge logins (email, or **Continue with Google**) are in the Devpost testing instructions.

**To pay as the customer,** use a PayPal sandbox **Personal** (buyer) account. Create one for free at [developer.paypal.com](https://developer.paypal.com/) → **Testing Tools → Sandbox Accounts**. Open the payment link in a private or incognito window, so you are not signed in as the merchant.

### Chat to PayPal (about 2 minutes)

1. Open [labs.hypaintelligence.com/chat](https://labs.hypaintelligence.com/chat) and sign in with a judge login.
2. Ask in any language, by text, voice or a photo of a handwritten order. For example: *Invoice Ada, ada@example.com, 20 USD for two bags at 10 USD each. She speaks Hausa.*
3. Hypa drafts the order and shows an approval card with the items, the total and the Hypa fee. Nothing is payable yet.
4. Tap **Approve order**, then **Copy payment link**. The message is in Hausa and ends with a PayPal sandbox link.
5. Open the link in a private window and pay with the sandbox buyer account.
6. The receipt page confirms the payment, and Hypa posts "Ada has paid 20.00 USD." in the chat.

Things to try:

- Leave out the amount. Hypa asks for it and creates nothing.
- Tap **Approve order** twice quickly. The order is approved once.
- Pay the same link twice. There is one payment and one fee.

### WhatsApp to PayPal (mobile app)

Install the Hypa Intelligence app and sign in with a judge login:

- iPhone: [TestFlight](https://testflight.apple.com/join/1u423Uz4)
- Android: [Google Play](https://play.google.com/store/apps/details?id=com.hypaintelligence.hypaintelligence)

Then follow [Try it as a hackathon judge](#try-it-as-a-hackathon-judge). Meta's WhatsApp test number only messages approved phones, so first send your WhatsApp number to [chris@hypaintelligence.com](mailto:chris@hypaintelligence.com) and we will add it.

## How the payment flow works

1. **Ask.** The merchant asks by voice, photo or text, in the app, the web app, the Hypa keyboard, or on WhatsApp through Hypa Bridge.
2. **Understand.** The agent uses Hypa's tools to transcribe speech, read photos and translate.
3. **Draft.** The agent calls the `paypal` tool with `create_order`. This saves a **draft** order only.
4. **Approve.** An approval card shows the items, total and Hypa fee in the merchant's language. Nothing moves until the merchant taps **Approve order**, and the approval only counts for the amount the merchant saw.
5. **Send.** Hypa creates a PayPal Orders v2 checkout and writes the payment message in the customer's language, keeping the amount and link exact.
6. **Pay.** The customer pays on PayPal and returns to a Hypa receipt page in their language.
7. **Confirm.** PayPal's signed webhook (or the receipt page's own check with PayPal) settles the order. Hypa posts "Ada has paid 20.00 USD." in the merchant's chat and sends a push notification.

Safety rules:

- The model plans and calls tools. The backend checks the merchant and the order. PayPal moves the money.
- `create_checkout` and `send_payment_link` refuse any order the merchant has not approved.
- After approval, the amount and currency come from the database, never from the model.
- Payment tools need a signed-in merchant.
- PayPal webhooks are verified with PayPal's signature verification API against the raw request body. Retried agent turns reuse the same order, and PayPal requests carry request IDs.
- Hypa charges the merchant a small fee ($0.01 in sandbox, set in [`payments.json`](./packages/@hypa-config/json/payments.json)) only after a payment completes. Customers pay nothing extra.

## What was built during the hackathon

Before the hackathon, Hypa had a dictionary, translation, text-to-speech and speech recognition for African and other under-represented languages. Everything else in this repository was built during the submission period (from October 1, 2026):

- **The AI agent:** Hypa's agent that plans and calls tools, using Hypa's own language models (translation, speech-to-text, text-to-speech, reading text in photos) as tools, so it works in 160 languages.
- **MCP:** Hypa's tools served over MCP, so outside agents (Claude, ChatGPT, Codex, Muse Code) can use them, including payments.
- **Chat:** the Chat tab in the Hypa Intelligence mobile app and the web chat, with voice, photo and text input.
- **The Hypa Keyboard's agent features:** Ask Hypa from inside any chat app, including approving orders and typing in payment links.
- [`@hypa/paypal-agent`](./packages/@hypa-paypal-agent): open-source payment contracts, the PayPal Orders v2 adapter, webhook verification and a fake provider.
- The commerce data model and API: customers, orders, approval, checkout, receipts, reconciliation with PayPal, and the merchant fee.
- The `paypal` agent tool with five actions, served to Hypa's agent and to outside agents over MCP.
- Payment messages in the customer's language, with the amount and link protected from translation errors.
- Approval cards in the mobile app, the web app and the iOS and Android keyboards, which approve only the amount the merchant reviewed.
- The PayPal webhook handler, capture after approval, the "customer has paid" chat message and push notifications.
- The customer receipt page, and merchant sign-in with email or Google.
- Hypa Bridge: Hypa's agent answering a business's customers on WhatsApp, with the owner's approval, and a local WhatsApp simulator.
- Bridge Pay: a customer's WhatsApp order becomes a PayPal sandbox payment after the owner approves it, with the link and receipt sent on WhatsApp.
- [`examples/whatsapp`](./examples/whatsapp/README.md): the WhatsApp-to-PayPal flow in one file.

## Project components

| Component | Location | Purpose |
| --- | --- | --- |
| PayPal adapter | [`packages/@hypa-paypal-agent`](./packages/@hypa-paypal-agent) | Open-source PayPal Orders v2 adapter, payment contracts and fake provider |
| NestJS API | [`apps/hypa-api`](./apps/hypa-api) | Authentication, agent, MCP, commerce, PayPal webhook, push, WhatsApp bridge |
| Web app | [`apps/hypa-intelligence`](./apps/hypa-intelligence) | Chat, merchant sign-in, approval card, customer receipt page |
| Mobile app | [`apps/hypa-intelligence-mobile`](./apps/hypa-intelligence-mobile) | Expo app with the approval sheet, the Hypa Keyboard and the Hypa Bridge screens |
| Shared agent package | [`packages/@hypa-intelligence-core`](./packages/@hypa-intelligence-core) | Tool list (including `paypal`), agent stream, approval and payment-link helpers |
| Shared configuration | [`packages/@hypa-config`](./packages/@hypa-config) | Model and language catalog, prompts, payment fees and PayPal locales |
| On-device keyboard model | [`packages/@hypa-tiny-keys`](./packages/@hypa-tiny-keys) | Downloads the pinned Tiny Keys ONNX model |
| WhatsApp example | [`examples/whatsapp`](./examples/whatsapp) | WhatsApp order to PayPal sandbox payment in one file |

## Prerequisites

Install:

- Node.js 22.18 or newer
- pnpm 11.25.0 (run `corepack enable` first to get the right pnpm version; on Windows without administrator rights `corepack enable` fails with `EPERM`, so run `npm install -g pnpm@11.25.0` instead)
- Git
- PostgreSQL with the `pgvector` extension (the schema uses a `vector(1536)` column)
- Redis 6.2.0 or newer
- A free [PayPal developer](https://developer.paypal.com/) account for sandbox credentials
- For the mobile app only: Xcode and CocoaPods for iOS, Android Studio with the Android SDK and a compatible JDK for Android

Verify the JavaScript toolchain:

```bash
corepack enable
node --version
pnpm --version
```

## 1. Clone and install

```bash
git clone https://github.com/hypaai/hypa-paypal.git
cd hypa-paypal
corepack enable
pnpm install
```

During installation:

- [`packages/@hypa-paypal-agent`](./packages/@hypa-paypal-agent) builds itself, so the API can import it.
- [`apps/hypa-intelligence-mobile/package.json`](./apps/hypa-intelligence-mobile/package.json) runs `generate:nitro`, which generates native bindings for the Lens module.
- [`packages/@hypa-tiny-keys/package.json`](./packages/@hypa-tiny-keys/package.json) downloads the pinned Tiny Keys keyboard model. It runs `pnpm`, so `pnpm` must be on your `PATH` (`corepack enable` does this).

If installation fails while compiling native dependencies, install the platform prerequisites listed above and run `pnpm install` again. The API and web app do not need the native tools.

## 2. Start PostgreSQL

Choose **one** of the following options.

<details>
<summary><strong>Expand Docker PostgreSQL setup</strong></summary>

### Option A: Docker PostgreSQL

```bash
export POSTGRES_PASSWORD='<choose-a-local-password>'
docker volume create hypa-paypal-postgres-data
docker run --name hypa-paypal-postgres \
  -e POSTGRES_USER=hypa \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB=hypa-paypal \
  -p 5432:5432 \
  -v hypa-paypal-postgres-data:/var/lib/postgresql/data \
  -d pgvector/pgvector:pg17
```

The plain `postgres` image does not include `pgvector`, and `prisma db push` fails with `type "vector" does not exist` without it.

If the container already exists, start it instead:

```bash
docker start hypa-paypal-postgres
```

The matching API connection string is:

```dotenv
DATABASE_URL=postgresql://hypa:<docker-password>@localhost:5432/hypa-paypal?schema=public
```

Check the database:

```bash
docker exec hypa-paypal-postgres pg_isready -U hypa -d hypa-paypal
```

</details>

<details>
<summary><strong>Expand local PostgreSQL setup</strong></summary>

### Option B: Local PostgreSQL installation

On macOS with Homebrew or Postgres.app:

```bash
createdb hypa-paypal
psql postgresql://localhost:5432/hypa-paypal -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

The matching API connection string is:

```dotenv
DATABASE_URL=postgresql://localhost:5432/hypa-paypal?schema=public
```

If your PostgreSQL user needs a password, include it: `postgresql://<user>:<password>@localhost:5432/hypa-paypal?schema=public`. If `CREATE EXTENSION vector` fails, install `pgvector` for your PostgreSQL version first.

</details>

## 3. Start Redis

Redis is used by the API for caching, queues (including WhatsApp messages), and agent state.

```bash
docker run --name hypa-paypal-redis -p 6379:6379 -d redis
```

Or on macOS with Homebrew: `brew services start redis`.

Verify Redis:

```bash
redis-cli ping
```

Expected output:

```text
PONG
```

## 4. Create PayPal sandbox credentials

1. Sign in at [developer.paypal.com](https://developer.paypal.com/) and switch the dashboard to **Sandbox**.
2. Open **Apps & Credentials**, create an app (or use the default one), and copy its **Client ID** and **Secret**.
3. Open **Testing Tools → Sandbox Accounts** and note a **Personal** (buyer) account and its password. You will pay with it.

Webhooks are optional for a local run: the receipt page checks the payment with PayPal itself. To receive real webhooks, see [step 10](#10-receive-paypal-webhooks-optional).

## 5. Configure API environment variables

Create the API environment file:

```bash
cp apps/hypa-api/.env.example apps/hypa-api/.env
```

Open `apps/hypa-api/.env` and set the values below.

### Required local values

```dotenv
DATABASE_URL=postgresql://localhost:5432/hypa-paypal?schema=public
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TLS=false

JWT_SECRET=replace-with-a-long-random-local-secret
ENCRYPTION_KEY=replace-with-a-long-random-local-secret
AGENT_MEDIA_SECRET=replace-with-a-long-random-local-secret

NODE_ENV=development
BASE_URL=http://localhost:5678

# The web app: approval links and the page PayPal returns the customer to.
FRONTEND_URL=http://localhost:5181
```

For Docker PostgreSQL, replace `DATABASE_URL` with the Docker connection string shown in [Option A](#option-a-docker-postgresql).

> Note: `ENCRYPTION_KEY` encrypts stored WhatsApp numbers. The API does not start without it.

> Note: keep the placeholder Google values from `.env.example` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_STATE_SECRET`) even if you do not use Google sign-in. The API does not start without them.

> Note: if you have no Firebase storage, set `FIREBASE_STORAGE_BUCKET` to any placeholder. Only stored voice replies need real storage.

### PayPal values

```dotenv
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=<sandbox client id from step 4>
PAYPAL_CLIENT_SECRET=<sandbox secret from step 4>
PAYPAL_WEBHOOK_ID=
```

Leave `PAYPAL_WEBHOOK_ID` empty unless you set up [step 10](#10-receive-paypal-webhooks-optional). Use `PAYPAL_ENVIRONMENT=live` only for a production PayPal app.

### Provider keys

Only configure the providers needed for the review. The default agent uses Meta Muse Spark plus Hypa-hosted tools:

| Capability | Environment variable | Required for the payment review? |
| --- | --- | --- |
| Agent planning (`meta/muse-spark-1.3`) | `META_MODEL_API_KEY` | Yes |
| Hypa-hosted translation and speech tools (the customer's payment message in their language, voice orders) | `HYPA_API_KEY` | Recommended. Without it, the payment message is sent in English. |
| PayPal sandbox | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Yes |
| Push notifications to the merchant's phone | `EXPO_ACCESS_TOKEN` | No. Only if Expo "enhanced push security" is on. |
| WhatsApp bridge | `WHATSAPP_*` | No. See [step 13](#13-try-hypa-bridge-and-bridge-pay-on-whatsapp-optional). |
| OpenAI models | `OPENAI_API_KEY` | No |
| Google Gemini/Vertex models | `GOOGLE_CLOUD_PROJECT`, `GEMINI_API_KEY` | No |
| Firebase audio/image storage | `FIREBASE_STORAGE_BUCKET`, `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional |

For the default review path, add:

```dotenv
META_MODEL_API_KEY=<your-meta-provider-key>
HYPA_API_KEY=<paste-the-hypa-api-key-here>
```

The `HYPA_API_KEY` line is a placeholder. Add the Hypa credential supplied for the contest; do not commit it. `HYPA_API_KEY` is not a Hugging Face token.

Keep Mansa disabled unless you have a valid Mansa account:

```dotenv
MANSA_MT_ENABLED=false
MANSA_ASR_ENABLED=false
MANSA_TTS_ENABLED=false
```

### How to obtain external provider keys

| Provider | Where to create the key | Environment variable |
| --- | --- | --- |
| PayPal | [PayPal Developer → Apps & Credentials (Sandbox)](https://developer.paypal.com/dashboard/applications/sandbox) | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` |
| Meta | Meta provider/developer console supplied with the contest access | `META_MODEL_API_KEY` |
| Hypa Labs | Hypa Labs/developer credentials supplied by the project owner or contest organizers | `HYPA_API_KEY` |
| WhatsApp Cloud API | [Meta for Developers](https://developers.facebook.com/) → your app → WhatsApp | `WHATSAPP_*` |
| OpenAI | [OpenAI API keys](https://platform.openai.com/api-keys) | `OPENAI_API_KEY` |
| Google Gemini | [Google AI Studio API keys](https://aistudio.google.com/apikey) | `GEMINI_API_KEY` |

API keys may incur provider charges. Review each provider's terms and quotas before creating a key.

## 6. Prepare the database

This repository does not include Prisma migration files. Apply the Prisma schema to the local database:

```bash
pnpm --filter hypa-api exec prisma db push
pnpm --filter hypa-api exec prisma generate
```

`db push` is appropriate for this isolated local review environment. It should not replace a reviewed migration process for production.

## 7. Start and test the API

Start the API from the repository root:

```bash
pnpm --filter hypa-api dev
```

The API listens on `http://localhost:5678`. Keep this terminal running.

Create a local merchant account:

```bash
curl -sS -X POST http://localhost:5678/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "merchant@example.com",
    "password": "use-a-local-password",
    "first_name": "Test",
    "last_name": "Merchant"
  }'
```

Save the returned token:

```bash
TOKEN='<access_token returned by the API>'
AUTH_HEADER=$(printf 'Authorization: %s %s' 'Bearer' "$TOKEN")
```

The agent's model calls are billed to the merchant's Hypa wallet, so give the local account some test balance:

```bash
psql "<your DATABASE_URL without ?schema=public>" -c "INSERT INTO wallet (id, \"userId\", balance, updated_at) SELECT 'local-wallet', id, 5, now() FROM \"user\" WHERE email = 'merchant@example.com' ON CONFLICT (\"userId\") DO UPDATE SET balance = 5;"
```

Ask the agent for an invoice:

```bash
curl -N -X POST http://localhost:5678/v2/agent \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d '{
    "requestId": "local-paypal-test-001",
    "input": "Invoice Ada, ada@example.com, 20 USD for two bags at 10 USD each. She speaks Hausa.",
    "provider": "meta",
    "model": "muse-spark-1.3",
    "surface": "app"
  }'
```

The response is a stream of `data: ...` Server-Sent Events. Look for:

- a `tool_call` to `paypal` with `"action":"create_order"`,
- an `approval` event with the order, the items, the total and `"fee":{"amount":"0.01","currency":"USD"}`,
- a `done` event whose text asks the merchant to approve, with a link like `http://localhost:5181/orders/<id>/approve`.

No checkout exists yet. That is the approval rule working.

## 8. Start the web app

Create the web environment file:

```bash
cp apps/hypa-intelligence/.env.example apps/hypa-intelligence/.env
```

Set these two values in `apps/hypa-intelligence/.env`, so the browser reaches the local API through the web app's own dev proxy:

```dotenv
VITE_PUBLIC_API_URL=/api
API_BASE_URL=http://localhost:5678
```

Build the shared audio package once, then start the web app:

```bash
pnpm --filter @hypa/audio build
pnpm --filter hypa-intelligence dev
```

Open `http://localhost:5181/chat`.

## 9. Run the PayPal sandbox flow

1. **Order.** In the chat at `http://localhost:5181/chat`, ask: *Invoice Ada, ada@example.com, 20 USD for two bags at 10 USD each. She speaks Hausa.* You can also attach a photo of a handwritten order or record a voice note.
2. **Sign in.** The approval card asks you to sign in. Use the merchant account from [step 7](#7-start-and-test-the-api).
3. **Approve.** Check the customer, items, total and Hypa fee, then tap **Approve order**. The card shows **Approved**.
4. **Send.** Tap **Share payment link** or **Copy payment link**. The message is in Hausa and ends with a `sandbox.paypal.com` checkout link.
5. **Pay.** Open the link in a private window and pay with the sandbox **Personal** account from [step 4](#4-create-paypal-sandbox-credentials).
6. **Receipt.** PayPal returns you to `http://localhost:5181/pay/<id>`, which checks the payment with PayPal and shows it as received.
7. **Confirm.** Back in the merchant's chat, Hypa posts "Ada has paid 20.00 USD." Asking *Has Ada paid?* makes the agent check with `get_payment_status`.

Things to check while you test:

| Try this | Expected |
| --- | --- |
| Ask without an exact amount or currency | The agent asks for it. No order is created. |
| Call `create_checkout` before approving (see [MCP](#call-the-paypal-tool-over-mcp)) | Refused: `Only approved orders can start checkout`. |
| Tap **Approve order** twice quickly | One approval, no error. |
| Change an order's amount after opening its card, then approve on the old card | Refused: `This order changed after you reviewed it`. |
| Pay the same link twice | One paid order and one fee. |
| Tap **Cancel order** on a draft, then ask for its payment link | Fails with a clear message. |

The full manual test matrix, by language and surface, is in [`docs/PAYMENTS-MANUAL-TESTS.md`](./docs/PAYMENTS-MANUAL-TESTS.md).

## 10. Receive PayPal webhooks (optional)

Without webhooks, the receipt page and `get_payment_status` reconcile with PayPal directly. To test PayPal's signed webhooks:

1. Expose the local API on a public HTTPS URL, for example with a tunnel such as ngrok: `ngrok http 5678`.
2. In your sandbox app on [developer.paypal.com](https://developer.paypal.com/), add a webhook pointing at `https://<public-url>/webhooks/paypal` with the events `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.PENDING`, `PAYMENT.CAPTURE.DENIED` and `PAYMENT.CAPTURE.DECLINED`.
3. Copy the webhook's **Webhook ID** (not its URL) into `PAYPAL_WEBHOOK_ID` and restart the API.

After a sandbox payment, the API verifies the webhook with PayPal, captures the approved order, marks it paid, charges the fee once, and tells the merchant.

## 11. Run the mobile app

Create the mobile environment file:

```bash
cp apps/hypa-intelligence-mobile/.env.example apps/hypa-intelligence-mobile/.env
```

Use an API URL reachable from the selected runtime:

| Runtime | `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_LIVE_BASE_URL` |
| --- | --- |
| iOS Simulator | `http://localhost:5678` |
| Android Emulator | `http://10.0.2.2:5678` |
| Physical device | `http://<your-computer-lan-ip>:5678` |

Build and run a development app:

```bash
pnpm --filter @hypa/intelligence ios
```

or:

```bash
pnpm --filter @hypa/intelligence android
```

Sign in with the merchant account, then repeat [step 9](#9-run-the-paypal-sandbox-flow) in the app's Chat tab. The approval opens as a sheet. After the first approval the app asks to send notifications; allow it to get the "has paid" push. Push notifications need a development build on a physical device (not Expo Go) with push credentials set up in EAS.

The app uses native modules (`expo-notifications`, `react-native-keyboard-controller`, the Hypa keyboard), so use a development build, not Expo Go. After pulling new changes, run `pnpm install`, then `pod install` in `apps/hypa-intelligence-mobile/ios`, and rebuild. Add `EXPO_PUBLIC_POSTHOG_KEY` to `.env` only if you want usage analytics; empty turns it off.

For a real iPhone, open `apps/hypa-intelligence-mobile/ios` in Xcode and set your own Apple development team for signing before building. On a physical device, connect the device and computer to the same network and allow inbound TCP traffic on port `5678`.

An order paid from the app returns to `/pay/<id>?receipt=<token>&from=app`. On a phone that page offers **Open in the Hypa app**, which opens `hypaintelligence://pay/<id>?receipt=<token>` and the app's receipt screen. It never jumps there on its own, because the payer is often a customer without the app. For a phone to reach that page, `FRONTEND_URL` must be a public HTTPS address, not `localhost`.

## 12. Validate the keyboard

The keyboard needs a physical device.

1. Open Hypa Intelligence and complete its setup checklist.
2. Enable **Hypa Keyboard** in the device keyboard settings:
   - Android: **Settings → System → Keyboard → On-screen keyboard**.
   - iOS: **Settings → General → Keyboard → Keyboards → Add New Keyboard**, then enable **Allow Full Access**.
3. Open a chat app (WhatsApp, Messages), switch to Hypa Keyboard, and use **Ask Hypa** to request an invoice.
4. The keyboard shows the order with an **Open Hypa to approve** button. Approve in the app.
5. In the app, tap **Share payment link** and pick the chat app. When you return to the chat, the keyboard types the payment message for you.

## 13. Try Hypa Bridge and Bridge Pay on WhatsApp (optional)

Hypa Bridge lets Hypa's agent answer a small business's WhatsApp customers from the owner's price list. **Bridge Pay** turns a customer's WhatsApp order into a PayPal sandbox payment: the owner approves the order in the app, the customer gets the PayPal link on WhatsApp in their language, and a receipt once PayPal says it is paid. A local simulator plays WhatsApp, so no Meta account is needed.

Finish steps 1 to 7 first. Install `ffmpeg` (`brew install ffmpeg`) if you want to send voice notes.

### Try it as a hackathon judge

You can try the whole WhatsApp flow on the hosted API (`https://api.hypaintelligence.com`) without running anything locally. The judge logins (email, or **Continue with Google**) are in the Devpost testing instructions.

**Why a login is given.** Hypa Bridge normally lets any business connect its own WhatsApp number. Meta has not finished verifying Hypa's business during the hackathon, so a merchant cannot add a number of their own yet. Hypa instead gives the judge login the WhatsApp **test number** that Meta provides for development. That login is the only account allowed to take it (`WHATSAPP_CONNECT_EMAILS`), and the test number only exchanges messages with phones on its recipient list in Hypa's Meta app, so send the WhatsApp number you will test with to [chris@hypaintelligence.com](mailto:chris@hypaintelligence.com) and we will add it.

1. Install the Hypa Intelligence app from [TestFlight](https://testflight.apple.com/join/1u423Uz4) (iPhone) or [Google Play](https://play.google.com/store/apps/details?id=com.hypaintelligence.hypaintelligence) (Android) (or build it yourself with [step 11](#11-run-the-mobile-app), pointed at `https://api.hypaintelligence.com`), and sign in with the judge login.
2. Go to **Settings → Hypa Bridge → Connect your number**, fill in the business profile (name, what you sell, a price list in **USD**, EUR or GBP), and tap **Connect WhatsApp**. The app shows the number to write to.
3. From WhatsApp, message that number, for example `hi, I want 2 agbada by Friday`.
4. The assistant answers from the profile only and records the order. The app shows a push notification and an **Approve** card in the customer's chat.
5. Tap **Approve**. The customer gets a PayPal sandbox link in their language, and pays with a PayPal sandbox buyer account.
6. PayPal tells the API, the order becomes **paid**, and the customer gets a receipt on WhatsApp.

What you will see:

- **Customer side (WhatsApp):** a reply that quotes only the listed prices; a message that the business is confirming the order; then the PayPal link in the customer's language (amount, currency and link unchanged); then a receipt.
- **Owner side (the app):** the customer appears in **Chat**. Each reply the assistant writes waits as a **draft** to **Send**, **Edit** or **Discard** (turn on **Answer simple questions automatically** to skip this for simple answers). An order shows an approval card; nothing payable goes out until you tap **Approve**. If you close the card by mistake, open it again from the chat, and use **Send payment link to customer** to resend the link.
- **Things the assistant hands to you:** a discount, a refund, a complaint or an item that is not on the price list. It never invents a price.

### How it behaves

- The assistant answers from the business profile only: name, what it sells, currency, price list, opening hours, languages and tone. It never invents or changes a price. Anything it cannot answer (a discount, a refund, a complaint, an unlisted item) goes to the owner.
- When a customer wants something, it records an order and asks for what is still missing.
- Customers can send text, voice notes and photos such as a handwritten order.
- With **Answer simple questions automatically** off, every reply is a draft the owner sends, edits or discards. With it on, simple answers go out directly. Orders, hand-offs and unlisted prices always wait.
- The owner can reply by hand (**Write a reply**), which pauses the assistant, then tap **Hand back** to let it continue.
- An order the assistant records becomes a draft PayPal order. Nothing payable is sent until the owner approves it. Then the customer gets the PayPal link in their language, and a receipt once PayPal says it is paid. PayPal does not support NGN, GHS or XOF, so a business in those currencies arranges payment itself.
- WhatsApp only allows free-form messages within 24 hours of the customer's last message. After that, approved templates are used: `quote_ready` for a draft, `invoice_ready` for the payment link and `payment_received` for the receipt (see `WHATSAPP_*_TEMPLATE` in `.env.example`).
- Replies are billed to the owner's wallet. If it runs low, the assistant pauses and the app shows an alert.

### Run it with the simulator

1. Add to `apps/hypa-api/.env` and restart the API. Any local strings work with the simulator:

   ```dotenv
   WHATSAPP_APP_SECRET=any-local-string
   WHATSAPP_VERIFY_TOKEN=any-local-string
   WHATSAPP_ACCESS_TOKEN=any-local-string
   WHATSAPP_PHONE_NUMBER_IDS=1415999774934646
   WHATSAPP_CONNECT_EMAILS=merchant@example.com
   WHATSAPP_GRAPH_URL=http://localhost:4010
   ```

   `ENCRYPTION_KEY` stores customer phone numbers. Keep the same value after the first customer connects, or stored numbers can no longer be read.

2. In another terminal, start the simulator with the same secret:

   ```bash
   WHATSAPP_APP_SECRET=any-local-string pnpm --filter hypa-api whatsapp:sim
   ```

3. In the app, open **Settings → Hypa Bridge**. Fill in the business with a real price list, in a PayPal currency such as USD. Leave automatic answers off for a first run. Tap **Connect WhatsApp**. Only emails listed in `WHATSAPP_CONNECT_EMAILS` can take a number.

   Without the app, connect with the API instead:

   ```bash
   curl -sS -X POST http://localhost:5678/v2/whatsapp/number \
     -H "$AUTH_HEADER" \
     -H 'Content-Type: application/json' \
     -d '{"autoReply":false,"profile":{"name":"Ada Bags","sells":"handmade tote bags","currency":"USD","priceList":[{"name":"Tote bag","price":10}],"languages":["English","Yoruba"]}}'
   ```

4. Type as the customer in the simulator. Each line is a WhatsApp message. Replies print as `← [text] ...`.

   | Input | Sends |
   | --- | --- |
   | `how much are your tote bags?` | A text message |
   | `/voice path/to/note.ogg` | A voice note |
   | `/image path/to/photo.jpg My order` | A photo |
   | `/quit` | Stops the simulator |

5. In the app, open the customer from the top of the Chat tab's history. **Send**, **Edit** or **Discard** each draft. The reply then shows in the simulator.

A good first run, one line at a time, sending each draft:

```text
hi, how much are your tote bags?
I want 2, I need them by Friday
what is your return policy?
```

The first line quotes the price list. The second records an order: approve it in the app, and the simulator prints the PayPal sandbox link the customer receives. Pay it as the sandbox buyer; the customer then gets a receipt. The third line is handed to the owner, because a return policy is not in the profile.

The API also lists threads and drafts, for a run without the app:

```bash
curl -sS http://localhost:5678/v2/whatsapp/threads -H "$AUTH_HEADER"
curl -sS http://localhost:5678/v2/whatsapp/threads/<thread-id> -H "$AUTH_HEADER"
curl -sS -X POST http://localhost:5678/v2/whatsapp/drafts/<draft-id>/send -H "$AUTH_HEADER" -H 'Content-Type: application/json' -d '{}'
```

If a payment link did not reach the customer, the owner can send it again with **Send the payment link again**, or `POST /v2/whatsapp/orders/<order-id>/payment-link`.

### Push notifications for the owner

The app registers its Expo push token with `POST /v2/push/register`. The owner is told when a draft or an order waits for approval and when a customer has paid. A failed push is logged and never stops the reply or the payment. A real device needs a development build and push credentials. The simulator does not send pushes.

### Connect a real WhatsApp number

Hypa uses one Meta app. A business never handles a Meta credential.

1. In the Meta app, copy the phone number ID and an access token. Add the phone that will play the customer.
2. In `apps/hypa-api/.env`, set `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_IDS`. Remove `WHATSAPP_GRAPH_URL`. Restart the API.
3. Expose the API (for example `ngrok http 5678`). In Meta, set the callback to `https://<your-public-url>/v2/whatsapp/webhook`, use the same verify token, and subscribe to `messages`.
4. In the app, tap **Connect WhatsApp** and message the test number from the phone you added. Only emails in `WHATSAPP_CONNECT_EMAILS` can take the number, so add yours.
5. For payments, set the PayPal sandbox keys (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENVIRONMENT=sandbox`) and set `FRONTEND_URL` to a public HTTPS address of the web app, so PayPal can return the customer.
6. Approve the templates `quote_ready`, `invoice_ready` and `payment_received` in Meta, or set the `WHATSAPP_*_TEMPLATE` values to your own. They are used after the 24-hour window: `invoice_ready` has the body `{{1}}` amount, `{{2}}` link, and `payment_received` has `{{1}}` amount. Inside 24 hours no template is needed. The Meta test number can only message phones you added in step 1.

## WhatsApp order to PayPal in one file

[`examples/whatsapp`](./examples/whatsapp/README.md) is a single-file bot that wires WhatsApp to the [`@hypa/paypal-agent`](./packages/@hypa-paypal-agent) adapter, sandbox only, with keys from the environment: order, merchant approval, PayPal link, receipt. It is the smallest version of what Bridge Pay does in the API.

## Call the paypal tool over MCP

Any MCP client can use the same `paypal` tool for a signed-in merchant. Payment tools need the merchant's login token or a Hypa API key:

```bash
curl -sS -X POST http://localhost:5678/v2/mcp \
  -H "$AUTH_HEADER" \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"paypal","arguments":{"action":"create_order","customerName":"Ada","customerContact":"ada@example.com","customerLanguage":"Hausa","amount":"20.00","currency":"USD","items":[{"name":"Bag","qty":2,"unitPrice":"10.00"}]}}}'
```

The reply carries an `orderId` and an `approvalUrl`. Open the `approvalUrl` in the web app to approve, then call the tool again with `"action":"send_payment_link"` and the `orderId` to get the customer's message and checkout link, and with `"action":"get_payment_status"` to see whether it is paid.

The five actions are `create_order`, `list_payment_methods`, `create_checkout`, `get_payment_status` and `send_payment_link`.

## Connect Hypa MCP to Claude Code (Desktop)

You need Node.js and a Hypa API key. This connects to the hosted MCP server; no local API setup is required.

1. Open **Settings → Desktop app → Extensions → Manage**.
2. Under **Local MCP servers**, click **Edit config** and open `claude_desktop_config.json`.
3. Add the configuration below, replacing `YOUR_HYPA_API_KEY` with your key. Keep existing settings; if `mcpServers` already exists, add `hypa` inside it.

   ```json
   {
     "mcpServers": {
       "hypa": {
         "command": "npx",
         "args": [
           "-y", "mcp-remote",
           "https://api.hypaintelligence.com/v2/mcp",
           "--header", "x-api-key:${HYPA_API_KEY}"
         ],
         "env": {
           "HYPA_API_KEY": "YOUR_HYPA_API_KEY"
         }
       }
     }
   }
   ```

4. Save, fully quit and reopen Claude. Check that **hypa** shows **Running**, then ask, for example, "Invoice Ada 20 USD for two bags and give me the approval link."

On Windows, use `"command": "cmd"` and start `args` with `"/c", "npx"`.

To use your local API instead, set the URL to `http://localhost:5678/v2/mcp` and replace the header with `"Authorization:Bearer ${HYPA_TOKEN}"`, with `HYPA_TOKEN` set to the merchant's login token from [step 7](#7-start-and-test-the-api). A local API only accepts API keys created in its own database.

Keep your API key private and do not commit the configuration file.

## Connect Hypa MCP to Muse Code

You need Muse Code 1.3.0 or newer and a Hypa API key.

1. Open `~/.config/muse/settings.json` (or `$XDG_CONFIG_HOME/muse/settings.json`). Create it if it does not exist.
2. Add the configuration below, replacing `YOUR_HYPA_API_KEY`. `schema_version` must be `1`.

   ```json
   {
     "schema_version": 1,
     "mcpServers": {
       "hypa": {
         "type": "streamable-http",
         "url": "https://api.hypaintelligence.com/v2/mcp",
         "headers": { "x-api-key": "YOUR_HYPA_API_KEY" }
       }
     }
   }
   ```

   Write the key itself in `headers`; Muse Code does not expand `${VAR}` there.

3. Start a new `muse` session, run `/mcp`, and check that **hypa** lists its tools, including `paypal`.

To use your local API instead, set `url` to `http://localhost:5678/v2/mcp` and `headers` to `{ "Authorization": "Bearer <merchant login token>" }`.

The settings file is in your home folder, not this repository. Keep your API key private.

## Useful commands

| Task | Command |
| --- | --- |
| Start API | `pnpm --filter hypa-api dev` |
| Start web app | `pnpm --filter hypa-intelligence dev` |
| Build iOS app | `pnpm --filter @hypa/intelligence ios` |
| Build Android app | `pnpm --filter @hypa/intelligence android` |
| Run the WhatsApp simulator | `WHATSAPP_APP_SECRET=<secret> pnpm --filter hypa-api whatsapp:sim` |
| Run the PayPal adapter demo (no keys) | `pnpm --filter @hypa/paypal-agent demo` |
| Test the shared tools and payment helpers | `pnpm --filter @hypa/intelligence-core test` |
| Test the web app | `pnpm --filter hypa-intelligence test` |
| Check API types | `pnpm --filter hypa-api check-types` |
| Check mobile types | `pnpm --filter @hypa/intelligence check-types` |
| Generate Prisma client | `pnpm --filter hypa-api exec prisma generate` |

## Troubleshooting

### `PayPal credentials are not configured`

Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `apps/hypa-api/.env` and restart the API.

### `Only approved orders can start checkout`

This is the approval rule. Approve the order on its card first.

### `This order changed after you reviewed it`

The order's amount or currency changed after the card was opened. Close the card, open the order again, and approve the new amount.

### `Payment tools require a signed-in merchant`

Sign in on the web app (the approval card asks you to), sign in on the mobile app, or send a Bearer token or `x-api-key` to `/v2/mcp`.

### The payment message is in English, not the customer's language

The message is translated with Hypa's translation tool. Set `HYPA_API_KEY`. If translation fails, Hypa still sends the link with an English message rather than losing it.

### The receipt page keeps saying the payment is processing

Wait a few seconds and tap **Check again**: PayPal can take a moment to settle. Check that `FRONTEND_URL` matches the web app's address.

### The API does not start

Check the required values in [step 5](#required-local-values). `ENCRYPTION_KEY`, `JWT_SECRET`, `AGENT_MEDIA_SECRET`, the placeholder `GOOGLE_*` values and `FIREBASE_STORAGE_BUCKET` must be set.

### `type "vector" does not exist` during `prisma db push`

Enable `pgvector` in the database (see [step 2](#2-start-postgresql)).

### `there is no unique or exclusion constraint matching the ON CONFLICT specification`

Creating an order fails because the database was only partly built. This happens when `prisma db push` stops at the `vector` error and leaves some indexes missing. Enable `pgvector` (see [step 2](#2-start-postgresql)), then run `db push` again.

### `Approval link must use HTTPS`

The API only creates approval links on `https://` addresses or `localhost`. If `FRONTEND_URL` points at a LAN address such as `http://192.168.x.x`, set it back to `http://localhost:<port>`, or serve the web app over https with a tunnel.

### The web app cannot reach the API

Check `VITE_PUBLIC_API_URL=/api` and `API_BASE_URL=http://localhost:5678` in `apps/hypa-intelligence/.env`, then restart the web app.

### The agent replies with an insufficient balance error

Top up the merchant's local wallet ([step 7](#7-start-and-test-the-api)).

### The mobile app cannot reach the API

Check the runtime-specific URL in `apps/hypa-intelligence-mobile/.env`. Use `localhost` only for the iOS Simulator, `10.0.2.2` for the Android Emulator, and the computer's LAN IP for physical devices.

### No push notification after a payment

Push needs a development build on a physical device with notifications allowed, and push credentials in EAS. The "has paid" message still appears in the chat.

### Native build or generated-code errors

Run `pnpm install` and `pnpm --filter @hypa/intelligence generate:nitro`, then `pod install` in `apps/hypa-intelligence-mobile/ios`, and rebuild the app.

### The WhatsApp simulator gets no reply

Check that Redis is running, that the simulator and the API use the same `WHATSAPP_APP_SECRET` (a mismatch answers `403`), that `WHATSAPP_GRAPH_URL=http://localhost:4010`, that `WHATSAPP_PHONE_NUMBER_IDS` matches the simulator's number, and that the business tapped **Connect WhatsApp** after the simulator started. With automatic answers off, send the draft in the app.

## Security

- Never commit `.env` files, PayPal secrets, API keys, passwords, private keys, or Firebase service-account JSON. Only `.env.example` files are tracked.
- Use PayPal **sandbox** credentials. `PAYPAL_ENVIRONMENT=live` is for a production PayPal app only.
- Do not point local development at production PostgreSQL or Redis.
- Rotate a credential immediately if it is exposed.
