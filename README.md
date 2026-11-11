# Hypa PayPal — Local Setup Guide

Hypa's entry for the PayPal AI Hackathon. It has two parts that share one backend:

1. **Hypa Commerce agent.** A merchant speaks, types or sends a photo ("charge Ada 2 shirts at $20 each"). The agent drafts an order, the merchant approves it with an explicit tap, and only then does Hypa create a PayPal checkout and a payment link for the customer.
2. **Hypa Bridge.** A WhatsApp assistant for a small business. It answers the business's customers from the owner's price list, records their orders, and hands anything unusual to the owner.

This guide takes you from a fresh clone to both parts running on your own computer. You do not need a Meta (WhatsApp) account: a built-in simulator plays WhatsApp for you.

MIT licensed. See [LICENSE](LICENSE).

## Table of contents

- [How it works](#how-it-works)
- [Try it as a hackathon judge](#try-it-as-a-hackathon-judge)
- [What you will need](#what-you-will-need)
- [Quick path](#quick-path)
- [Project components](#project-components)
- [Prerequisites](#prerequisites)
- [1. Clone and install](#1-clone-and-install)
- [2. Start PostgreSQL](#2-start-postgresql)
- [3. Start Redis](#3-start-redis)
- [4. Configure API environment variables](#4-configure-api-environment-variables)
- [5. Prepare the database](#5-prepare-the-database)
- [6. Start and test the API](#6-start-and-test-the-api)
- [7. Configure PayPal (sandbox)](#7-configure-paypal-sandbox)
- [8. Start the web approval page](#8-start-the-web-approval-page)
- [9. Configure and run the mobile app](#9-configure-and-run-the-mobile-app)
- [10. Take a PayPal payment](#10-take-a-paypal-payment)
- [11. Use Hypa Bridge with the simulator](#11-use-hypa-bridge-with-the-simulator)
- [Connect a real WhatsApp number](#connect-a-real-whatsapp-number)
- [Try the PayPal adapter on its own](#try-the-paypal-adapter-on-its-own)
- [Tests](#tests)
- [Useful commands](#useful-commands)
- [Glossary](#glossary)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## How it works

```text
                     ┌────────────────────────────┐
  Merchant ───────►  │  Mobile app (Expo)         │
  (voice/text/photo) │  chat · approval · Bridge  │
                     └─────────────┬──────────────┘
                                   │ HTTPS
                     ┌─────────────▼──────────────┐      ┌───────────────┐
                     │  Hypa API (NestJS)         │◄────►│ PostgreSQL    │
                     │  agent · commerce · bridge │◄────►│ Redis (queue) │
                     └───┬──────────┬─────────┬───┘      └───────────────┘
                         │          │         │
            PayPal Orders v2   AI model    WhatsApp Cloud API
            + webhooks         (tools)     (or the local simulator)
                         │                    │
  Customer pays ◄────────┘                    └──────► Customer chats
```

**Payment flow.** Merchant message → agent saves a **draft** order → merchant taps **Approve** (no model or customer can do this for them) → API creates a PayPal checkout → customer gets a payment link → PayPal calls the API's webhook (signature verified) → order becomes paid.

**Bridge flow.** Customer WhatsApp message → webhook (signature verified) → queue → assistant writes a reply using only the owner's business profile → the reply waits as a **draft** for the owner (or goes out directly if the owner turned on automatic answers) → customer receives it.

## Try it as a hackathon judge

You can try the whole flow on the hosted API (`https://api.hypaintelligence.com`) without running anything locally. A judge login (an email and password) is given in the hackathon submission.

**Why a login is given.** Hypa Bridge normally lets any business connect its own WhatsApp number. Meta has not finished verifying Hypa's business during the hackathon, so a merchant cannot add a number of their own yet. Hypa instead gives the judge login the WhatsApp **test number** that Meta provides for development. That login is the only account allowed to take it (`WHATSAPP_CONNECT_EMAILS`), and the test number only exchanges messages with phones on its recipient list in Hypa's Meta app, so ask us to add the number you will test with.

**Try it.**

1. Open the Hypa Intelligence app and sign in with the judge login.
2. Go to **Settings → Hypa Bridge → Connect your number**, fill in the business profile (name, what you sell, a price list in **USD**, EUR or GBP), and tap **Connect WhatsApp**. The app shows the number to write to.
3. From WhatsApp, message that number, for example `hi, I want 2 agbada by Friday`.
4. The assistant answers from the profile only and records the order. The app shows a push notification and an **Approve** card in the customer's chat.
5. Tap **Approve**. The customer gets a PayPal sandbox link in their language, and pays with a PayPal sandbox buyer account.
6. PayPal tells the API, the order becomes **paid**, and the customer gets a receipt on WhatsApp. Paying from the app returns you to the app.

**What you will see.**

- **Customer side (WhatsApp):** a reply from the business assistant that quotes only the listed prices; a message that the business is confirming the order; then the PayPal link in the customer's language (amount, currency and link unchanged); then a receipt.
- **Owner side (the app):** under **Hypa Bridge**, the customer appears in **Chat**. Each reply the assistant writes waits as a **draft** to **Send**, **Edit** or **Discard** (turn on **Answer simple questions automatically** to skip this for simple answers). An order shows an approval card; nothing payable goes out until you tap **Approve**. If you close the card by mistake, open it again from the chat, and use **Send payment link to customer** to resend the link.
- **Things the assistant hands to you:** a discount, a refund, a complaint or an item that is not on the price list. It never invents a price.
- **PayPal currencies:** PayPal does not support NGN, GHS or XOF. Use USD, EUR or GBP, otherwise the owner is told to arrange payment with the customer.

**Set it up yourself.** To run the same flow on your own machine, follow [Use Hypa Bridge with the simulator](#11-use-hypa-bridge-with-the-simulator) (no Meta account needed), or [Connect a real WhatsApp number](#connect-a-real-whatsapp-number) to use Meta's test number.

## What you will need

Gather these first so setup does not stall halfway:

| Need | Used for | Where to get it |
| --- | --- | --- |
| A computer with Node.js 22.18+, pnpm, Git | Everything | See [Prerequisites](#prerequisites) |
| Docker (easiest) or local PostgreSQL + Redis | Database and queue | [docker.com](https://www.docker.com/) |
| A model key (`META_MODEL_API_KEY`, or `OPENAI_API_KEY`) | The AI that writes replies and plans actions | Your provider's console (see [step 4](#4-configure-api-environment-variables)) |
| `HYPA_API_KEY` | Hypa-hosted tools (speech, translation) | The credential supplied for the hackathon |
| A PayPal developer account (free) | Sandbox checkout | [developer.paypal.com](https://developer.paypal.com/) |
| A tunnel such as `ngrok` (optional) | Lets PayPal's webhook reach your computer | [ngrok.com](https://ngrok.com/) |
| Xcode (Mac) or Android Studio | Running the mobile app | Apple / Google |
| `ffmpeg` | Converting WhatsApp voice notes | `brew install ffmpeg` |

You do **not** need a Meta account or a real WhatsApp number to try Hypa Bridge.

## Quick path

If you already have Docker, Node and a model key, the whole thing is:

```bash
git clone https://github.com/hypaai/hypa-paypal-agent.git && cd hypa-paypal-agent
pnpm install
# start Postgres (pgvector) and Redis with Docker: see steps 2 and 3
cp apps/hypa-api/.env.example apps/hypa-api/.env      # then edit it: step 4
pnpm --filter hypa-api exec prisma db push && pnpm --filter hypa-api exec prisma generate
pnpm --filter hypa-api dev                            # terminal 1: API on :5678
pnpm --filter hypa-intelligence dev                   # terminal 2: web page on :5181
pnpm --filter @hypa/intelligence ios                  # terminal 3: the app
```

Then follow [step 10](#10-take-a-paypal-payment) (payments) and [step 11](#11-use-hypa-bridge-with-the-simulator) (Bridge). Each numbered step below ends with a **Check it worked** line so you know when to move on.

## Project components

| Component | Location | Purpose |
| --- | --- | --- |
| NestJS API | [`apps/hypa-api`](./apps/hypa-api) | Auth, agent, PayPal orders and webhooks, Hypa Bridge, local WhatsApp simulator |
| Mobile app | [`apps/hypa-intelligence-mobile`](./apps/hypa-intelligence-mobile) | Expo app: agent chat, payment approval, Hypa Bridge (customer chat, push notifications), the Hypa keyboard (iOS and Android), Lens, translate and dictionary |
| Web app | [`apps/hypa-intelligence`](./apps/hypa-intelligence) | Vite React app: chat, order approval page, PayPal return page |
| PayPal adapter | [`packages/@hypa-paypal-agent`](./packages/@hypa-paypal-agent) | Open-source PayPal Orders v2 adapter with a credential-free demo |
| Shared agent tools | [`packages/@hypa-intelligence-core`](./packages/@hypa-intelligence-core) | The one tool list used by the agent and `/v2/mcp` |
| Shared configuration | [`packages/@hypa-config`](./packages/@hypa-config) | Model catalog and prompts |

## Prerequisites

Install:

- Node.js 22.18 or newer
- pnpm 11.25.0 (run `corepack enable` first; on Windows without administrator rights it fails with `EPERM`, so run `npm install -g pnpm@11.25.0` instead)
- Git
- PostgreSQL with the `pgvector` extension (the schema uses a `vector(1536)` column)
- Redis 6.2.0 or newer (the Hypa Bridge queue and caching use it)
- `ffmpeg` on your PATH (Hypa Bridge converts WhatsApp voice notes with it)
- Xcode and CocoaPods for iOS, or Android Studio with the Android SDK and a compatible JDK for Android
- A PayPal developer account with a sandbox app (see [step 7](#7-configure-paypal-sandbox))

Verify the toolchain:

```bash
corepack enable
node --version     # v22.18 or newer
pnpm --version     # 11.25.0
ffmpeg -version    # prints a version
```

## 1. Clone and install

```bash
git clone https://github.com/hypaai/hypa-paypal-agent.git
cd hypa-paypal-agent
pnpm install
```

Installation also generates the native bindings for the mobile app and downloads the pinned Tiny Keys model. If it fails while compiling native dependencies, install the platform prerequisites above and run `pnpm install` again.

**Check it worked:** the command ends with `Done` and no red errors.

## 2. Start PostgreSQL

Choose **one** option. Do not set up both for the same database.

<details>
<summary><strong>Option A: Docker PostgreSQL (recommended)</strong></summary>

```bash
export POSTGRES_PASSWORD='<choose-a-local-password>'
docker volume create hypa-postgres-data
docker run --name hypa-postgres \
  -e POSTGRES_USER=hypa \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB=hypa-v2 \
  -p 5432:5432 \
  -v hypa-postgres-data:/var/lib/postgresql/data \
  -d pgvector/pgvector:pg17
```

The plain `postgres` image does not include `pgvector`; `prisma db push` fails with `type "vector" does not exist` without it. If the container already exists, run `docker start hypa-postgres`.

Connection string for step 4:

```dotenv
DATABASE_URL=postgresql://hypa:<docker-password>@localhost:5432/hypa-v2?schema=public
```

**Check it worked:** `docker exec hypa-postgres pg_isready -U hypa -d hypa-v2` prints `accepting connections`.

</details>

<details>
<summary><strong>Option B: Local PostgreSQL</strong></summary>

On macOS with Homebrew:

```bash
brew services start postgresql
createdb hypa-v2
psql postgresql://localhost:5432/hypa-v2 -c 'select 1;'
```

Install `pgvector` for your PostgreSQL version, then enable it:

```bash
psql postgresql://localhost:5432/hypa-v2 -c 'CREATE EXTENSION IF NOT EXISTS vector;'
```

Connection string for step 4:

```dotenv
DATABASE_URL=postgresql://localhost:5432/hypa-v2?schema=public
```

If your user needs a password: `postgresql://<user>:<password>@localhost:5432/hypa-v2?schema=public`. On Windows or Linux, start PostgreSQL with the service manager and create a database named `hypa-v2`.

**Check it worked:** the `select 1` query prints a table with `1`.

</details>

## 3. Start Redis

Redis holds the queue that processes WhatsApp messages, and caches.

```bash
# Docker
docker run --name hypa-redis -p 6379:6379 -d redis     # or, if it exists: docker start hypa-redis

# macOS with Homebrew
brew services start redis
```

**Check it worked:** `redis-cli ping` prints `PONG` (with Docker: `docker exec hypa-redis redis-cli ping`).

## 4. Configure API environment variables

```bash
cp apps/hypa-api/.env.example apps/hypa-api/.env
```

Open `apps/hypa-api/.env` in an editor. Never commit this file.

### Required local values

```dotenv
DATABASE_URL=postgresql://localhost:5432/hypa-v2?schema=public
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TLS=false

JWT_SECRET=replace-with-a-long-random-local-secret
ENCRYPTION_KEY=replace-with-a-local-encryption-secret
AGENT_MEDIA_SECRET=replace-with-a-long-random-local-secret

NODE_ENV=development
BASE_URL=http://localhost:5678
```

- `JWT_SECRET` signs login tokens. Any long random string works locally.
- `ENCRYPTION_KEY` encrypts each customer's phone number in the database. Once you have connected a number, keep the same value, or stored values can no longer be read.
- `AGENT_MEDIA_SECRET` signs agent media URLs; the API refuses to start without it.
- Keep the placeholder `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` lines from `.env.example` even if you do not use Google sign-in.
- Keep Mansa disabled unless you have an account:

```dotenv
MANSA_MT_ENABLED=false
MANSA_ASR_ENABLED=false
MANSA_TTS_ENABLED=false
```

### Model and provider keys

| Capability | Variable | Needed for |
| --- | --- | --- |
| Agent planning (default `meta/muse-spark-1.3`) | `META_MODEL_API_KEY` | The agent and Hypa Bridge |
| Hypa-hosted translation, speech and other tools | `HYPA_API_KEY` | Tools such as text-to-speech and translation |
| Speech workloads | `RUNPOD_API_KEY`, `ASR_SEVERLESS_API_KEY` | Optional |
| Firebase audio storage | `FIREBASE_STORAGE_BUCKET`, `FIREBASE_SERVICE_ACCOUNT_JSON` | The API will not start without `FIREBASE_STORAGE_BUCKET`; keep the placeholder from `.env.example` |

At minimum set **one model key** plus `HYPA_API_KEY`:

```dotenv
META_MODEL_API_KEY=<your-meta-model-key>
HYPA_API_KEY=<the-hypa-key-supplied-for-the-hackathon>
```

`HYPA_API_KEY` is **not** a Hugging Face token. It authorizes this API to call Hypa-hosted tools; never commit it.

| Provider | Where to create a key |
| --- | --- |
| Meta | The Meta model console supplied with your access |
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| RunPod | [runpod.io/console/user/settings](https://www.runpod.io/console/user/settings) |

Provider keys can incur charges. Use development keys, not production ones.

**Check it worked:** every variable above has a value, and no line still says `your-...-here`.

## 5. Prepare the database

There are no migration files; apply the Prisma schema directly:

```bash
pnpm --filter hypa-api exec prisma db push
pnpm --filter hypa-api exec prisma generate
```

`db push` is fine for an isolated local environment. Do not use it as a production migration process.

**Check it worked:** the first command ends with `Your database is now in sync with your Prisma schema`.

## 6. Start and test the API

```bash
pnpm --filter hypa-api dev
```

Keep this terminal open. The API listens on `http://localhost:5678`.

**Check it worked:** the terminal prints `Server is running on http://0.0.0.0:5678`.

Create a local account. Registration also creates a wallet with a starting balance; agent turns and Hypa Bridge replies are billed to that wallet.

```bash
curl -sS -X POST http://localhost:5678/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"merchant@example.com","password":"use-a-local-password","first_name":"Local","last_name":"Merchant"}'
```

The response contains an `access_token`. Test the streaming agent with it:

```bash
TOKEN='<access_token returned by the API>'
curl -N -X POST http://localhost:5678/v2/agent \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d '{"requestId":"local-agent-test-001","input":"Translate hello into Spanish.","provider":"meta","model":"muse-spark-1.3","surface":"app"}'
```

**Check it worked:** you see lines starting with `data: ...`. That confirms the API, database, model key and agent pipeline are connected. If you get an error instead, see [Troubleshooting](#troubleshooting).

## 7. Configure PayPal (sandbox)

PayPal's sandbox uses fake money, so you can test safely.

1. Sign in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) and open **Apps & Credentials**. Make sure **Sandbox** is selected.
2. Create an app (or open the default one) and copy its **Client ID** and **Secret**.
3. Under **Sandbox → Accounts**, note the **Personal** (buyer) account. You will log in with it to pay in step 10.
4. For webhooks, PayPal must reach your computer. Start a tunnel: `ngrok http 5678`, and copy the `https://...` address it shows.
5. In your app's settings, add a webhook with URL `https://<your-tunnel>/webhooks/paypal` and subscribe to `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.DECLINED` and `PAYMENT.CAPTURE.PENDING`. Copy the **Webhook ID**.
6. Set these in `apps/hypa-api/.env`:

```dotenv
PAYPAL_CLIENT_ID=<sandbox-client-id>
PAYPAL_CLIENT_SECRET=<sandbox-client-secret>
PAYPAL_WEBHOOK_ID=<sandbox-webhook-id>
PAYPAL_ENVIRONMENT=sandbox
FRONTEND_URL=http://localhost:5181
```

7. Restart the API (stop it with `Ctrl+C`, run `pnpm --filter hypa-api dev` again).

Without the webhook, you can still create checkouts and pay; the order just will not flip to **paid** automatically. Use `PAYPAL_ENVIRONMENT=live` only with a real PayPal app and real money.

**Check it worked:** the API restarts without a PayPal error.

## 8. Start the web approval page

`FRONTEND_URL` is where merchants can review and approve an order in the browser (`/orders/:id/approve`) and where customers land after paying (`/pay/:id`). An order made in the app (not a WhatsApp customer's) returns to `/pay/:id?receipt=<token>&from=app`; have that page open `hypaintelligence://pay/<id>?receipt=<token>` on a phone, and the app's `pay/[id]` screen shows the receipt. It must be a public HTTPS URL, not `localhost`, to be reachable from a phone.

```bash
pnpm --filter hypa-intelligence dev
```

**Check it worked:** `http://localhost:5181` opens in your browser.

## 9. Configure and run the mobile app

```bash
cp apps/hypa-intelligence-mobile/.env.example apps/hypa-intelligence-mobile/.env
```

Set both URLs for your runtime:

| Runtime | `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_LIVE_BASE_URL` |
| --- | --- |
| iOS Simulator | `http://localhost:5678` |
| Android Emulator | `http://10.0.2.2:5678` |
| Physical device | `http://<your-computer-lan-ip>:5678` |

For a physical device, connect it to the same Wi-Fi as your computer and allow inbound TCP on port `5678`. Never use `localhost` on a device: it points at the phone itself.

Run the app (the first build takes several minutes):

```bash
pnpm --filter @hypa/intelligence ios        # iOS Simulator
pnpm --filter @hypa/intelligence android    # Android Emulator
```

For a real iPhone, open `apps/hypa-intelligence-mobile/ios` in Xcode and choose your own Apple development team for signing first.

The app uses native modules (`expo-notifications`, `react-native-keyboard-controller`, the Hypa keyboard), so use a development build, not Expo Go. After pulling new changes, run `pnpm install`, then `pod install` in `apps/hypa-intelligence-mobile/ios` and rebuild. Add `EXPO_PUBLIC_POSTHOG_KEY` to `.env` only if you want usage analytics; empty turns it off.

Sign in with the account from step 6 (or create one in the app). If a build fails with generated-code errors, run `pnpm --filter @hypa/intelligence generate:nitro` and rebuild.

**Check it worked:** the app opens, you are signed in, and a chat message gets an answer.

## 10. Take a PayPal payment

1. In the app's chat, tell the agent what to charge, in any language, for example:
   *"Create a payment for Ada, ada@example.com: 2 shirts at 20 dollars each."*
   If something is missing or unclear (customer, contact, items, exact amount or currency), the agent asks. It never guesses.
2. The agent saves a **draft order** and shows a **review** sheet with the items, the total and the Hypa fee. Nothing has been charged and no link exists yet.
3. Check the details, then approve. This tap is the merchant's alone: no model, customer or keyboard action can approve for them. (You can also open `http://localhost:5181/orders/<id>/approve` in the browser.)
4. After approval the agent creates the PayPal checkout and returns a **payment link** with the exact amount and currency.
5. Open the link and sign in with the sandbox **Personal** account from step 7. Approve the payment.
6. PayPal returns the customer to `http://localhost:5181/pay/<id>` and calls your webhook. The order becomes **paid**. Ask the agent for the payment status to confirm.

**Check it worked:** the order shows as paid, and the sandbox business account's balance (PayPal dashboard → Sandbox → Accounts) went up.

## 11. Use Hypa Bridge with the simulator

Hypa Bridge lets a small business answer WhatsApp customers with an assistant that only says what the owner told it. The simulator plays WhatsApp on your computer: it signs webhooks the way Meta does and prints every reply the assistant sends, so you can try the whole flow without a Meta account.

### How Bridge behaves

- The assistant answers from the business profile only: name, what you sell, currency, price list, opening hours, languages and tone. It never invents or changes a price. Anything it cannot answer (a discount, a refund, a complaint, an unlisted item) goes to the owner.
- When a customer wants something, it records an order (items, quantity, date needed, and size or colour only for items that have them) and asks for whatever is missing.
- Customers can send text, voice notes (the assistant can answer with a voice note) and photos such as a handwritten order.
- With **Answer simple questions automatically** off, every reply is a **draft** the owner sends, edits or discards in the app. With it on, simple answers go out directly; orders, hand-offs and unlisted prices always wait for the owner.
- The owner can reply by hand (**Write a reply**), which pauses the assistant, then tap **Hand back** to let it continue.
- WhatsApp only allows free-form messages within 24 hours of the customer's last message. After that, sending a draft uses an approved message template (`WHATSAPP_QUOTE_TEMPLATE`, default `quote_ready`).
- An order the assistant records becomes a draft PayPal order and appears as an approval card in the customer's chat (Bridge's Chat tab); reopen it from the card if you closed it, and use **Send payment link to customer** to send it again. The customer is told the business is confirming. Nothing payable is sent until the owner approves it; then the customer gets the PayPal link in their language (amount, currency and URL unchanged), and a receipt once PayPal's webhook marks it paid. A repeated WhatsApp message makes one order and a repeated webhook sends one receipt. Outside the 24-hour window the approved templates `invoice_ready` and `payment_received` are used (`WHATSAPP_PAYMENT_LINK_TEMPLATE`, `WHATSAPP_PAYMENT_RECEIPT_TEMPLATE`; `WHATSAPP_TEMPLATE_LANGUAGES` lists the languages they are approved in, English otherwise). PayPal does not support NGN, GHS or XOF, so a business in those currencies arranges payment itself; use USD, EUR or GBP for the demo.
- Replies are billed to the owner's wallet. If it runs low, the assistant pauses and the app shows an alert.

### Step by step

**A. Configure the API for the simulator.** In `apps/hypa-api/.env`:

```dotenv
WHATSAPP_APP_SECRET=any-local-string
WHATSAPP_VERIFY_TOKEN=any-local-string
WHATSAPP_ACCESS_TOKEN=any-local-string
WHATSAPP_PHONE_NUMBER_IDS=1415999774934646
WHATSAPP_CONNECT_EMAILS=you@example.com
WHATSAPP_GRAPH_URL=http://localhost:4010
```

Restart the API after changing `.env`.

**B. Set up the business in the app.** Open **Settings → Hypa Bridge → Connect your number**.

- There is no number or token to enter. Tapping **Connect WhatsApp** gives the business the first number in `WHATSAPP_PHONE_NUMBER_IDS` that no other business uses (one number serves one business). Only accounts whose email is in `WHATSAPP_CONNECT_EMAILS` (comma separated) can take a number; unset means nobody new can.
- Under **Replies**, choose whether simple questions are answered automatically. Off means you approve every reply, which is best for a first run.
- Under **Your business**, fill in the business name, what you sell, currency (a dropdown), the price list, opening hours per day, languages and tone. Use realistic prices; the assistant only quotes the list.
- Tap **Connect WhatsApp**.

**C. Start the simulator** in a second terminal, with the same secret the API uses:

```bash
cd hypa-paypal-agent
WHATSAPP_APP_SECRET=any-local-string pnpm --filter hypa-api whatsapp:sim
```

It prints `Fake Graph on http://localhost:4010. Customer 2348000000001 -> number 1415999774934646.` Optional variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `SIM_API_URL` | `http://localhost:5678` | Where your API runs |
| `SIM_GRAPH_PORT` | `4010` | Port of the fake WhatsApp server (must match `WHATSAPP_GRAPH_URL`) |
| `SIM_PHONE_NUMBER_ID` | `1415999774934646` | The business number ID (must match step B) |
| `SIM_CUSTOMER` | `2348000000001` | The customer's phone number |
| `SIM_CUSTOMER_NAME` | `Ada` | The customer's WhatsApp name |

**D. Type as the customer.** Each line you type is sent as a WhatsApp message:

| Input | Sends |
| --- | --- |
| `how much is a 3 piece agbada` | A text message |
| `/voice path/to/note.ogg` | A voice note (`.ogg`, `.opus` or `.mp3`) |
| `/image path/to/photo.jpg My order` | A photo with an optional caption |
| `/quit` | Exits the simulator |

Replies the assistant sends appear in the simulator terminal as `← [text] ...`.

**E. Watch it in the app.** Open **Hypa Bridge**. The customer appears under **Customers**, with a badge when a draft waits or the owner is needed. Open the chat to:

- read the conversation (customer on the left, replies on the right);
- **Send**, **Edit** or **Discard** a draft (the quoted order and any price warning show with it);
- see the **order card** the assistant built from the chat;
- **Write a reply** yourself, then **Hand back** to the assistant.

When you tap **Send** on a draft, the reply appears in the simulator terminal.

### A good first run

Type these as the customer, one at a time, approving each draft in the app:

```text
hi, how much is a 3 piece agbada
I want 2, I need them by Friday
what is your return policy?
```

Expected: a price quote taken from your list; an order recorded for two with the due date; and the last question handed to you as an owner request, because a return policy is not in the profile.

**Check it worked:** the order card shows 2 × agbada with a due date, and the third message is flagged for you.

### Push notifications

The app sends its Expo push token to `POST /v2/push/token` (`push_token`) once a business has a number. `PushService` tells the owner when a draft or an order waits for approval and when a customer has paid. A failed push is logged and never stops the reply. It needs a development build with `expo-notifications`, and push credentials (APNs, FCM) set in EAS for a real device; the simulator does not send pushes. Run `pnpm install` and `prisma db push` to pick up the new dependency and table.

## Connect a real WhatsApp number

Hypa runs one Meta app and its own WhatsApp number(s). Businesses never handle a Meta credential.

1. In the Meta app (WhatsApp product), open **API Setup**. Copy the **Phone number ID** and a **temporary access token** (24 hours; use a system user token for anything longer). Under **To**, add the phone that will play the customer and confirm its code.
2. In `apps/hypa-api/.env`, set `WHATSAPP_APP_SECRET` (Meta app secret), `WHATSAPP_VERIFY_TOKEN` (any string you choose), `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_IDS` (the phone number ID; add more ids, comma separated, for more businesses). **Remove** `WHATSAPP_GRAPH_URL`. Restart the API.
3. Expose your API publicly (for example `ngrok http 5678`). In Meta's **WhatsApp → Configuration**, set the callback to `https://<your-public-url>/v2/whatsapp/webhook`, use the same verify token, and subscribe to `messages`.
4. In the app, open **Settings → Hypa Bridge**, fill in the business and tap **Connect WhatsApp**. Message the Meta test number from the phone you added in step 1.
5. For payments, set the PayPal sandbox keys from [section 7](#7-configure-paypal-sandbox) (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENVIRONMENT=sandbox`) and set `FRONTEND_URL` to a public HTTPS address of the web app, so PayPal can return the customer. Only emails in `WHATSAPP_CONNECT_EMAILS` can take the number, so add yours.
6. Create and get approved an `en` message template named `quote_ready` (or set `WHATSAPP_QUOTE_TEMPLATE` and `WHATSAPP_QUOTE_TEMPLATE_LANGUAGE`). It is used for replies sent after the 24-hour window. For payments, approve two more templates: `invoice_ready` (body: `{{1}}` amount, `{{2}}` link) and `payment_received` (body: `{{1}}` amount), or set `WHATSAPP_PAYMENT_LINK_TEMPLATE` and `WHATSAPP_PAYMENT_RECEIPT_TEMPLATE`. Inside 24 hours no template is needed. The Meta test number can only message phones you added in step 1.

## WhatsApp order to PayPal in one file

[`examples/whatsapp`](./examples/whatsapp/README.md) is a single-file bot that wires WhatsApp to the PayPal adapter, sandbox only, with keys from the environment: order, merchant approval, PayPal link, receipt.

## Try the PayPal adapter on its own

The open-source adapter has a demo that needs no PayPal credentials, no database and no Hypa services:

```bash
cd packages/@hypa-paypal-agent
npm install
npm run demo
```

It creates a fake checkout, prints its URL, captures the fake payment and prints the resulting status. See [`packages/@hypa-paypal-agent/README.md`](./packages/@hypa-paypal-agent/README.md) to use the real PayPal provider with sandbox credentials.

## Tests

```bash
# API (Hypa Bridge specs and the rest)
cd apps/hypa-api && ENCRYPTION_KEY=test NODE_ENV=test npx jest

# Mobile Bridge helpers
cd apps/hypa-intelligence-mobile && node --import tsx --test lib/bridge.test.ts
```

## Useful commands

| Task | Command |
| --- | --- |
| Start API | `pnpm --filter hypa-api dev` |
| Start web app | `pnpm --filter hypa-intelligence dev` |
| Run the WhatsApp simulator | `WHATSAPP_APP_SECRET=<secret> pnpm --filter hypa-api whatsapp:sim` |
| Build iOS app | `pnpm --filter @hypa/intelligence ios` |
| Build Android app | `pnpm --filter @hypa/intelligence android` |
| Check all workspace types | `pnpm check-types` |
| Apply the schema | `pnpm --filter hypa-api exec prisma db push` |
| Generate Prisma client | `pnpm --filter hypa-api exec prisma generate` |

## Glossary

- **Draft.** A reply or order the assistant prepared but nobody has approved yet. Nothing reaches the customer or PayPal until the owner approves.
- **Sandbox.** PayPal's practice environment with fake money and test accounts.
- **Webhook.** A message one service sends to your API when something happens (PayPal: a payment was made; WhatsApp: a customer wrote). Each is checked with a secret before it is trusted.
- **Phone number ID.** WhatsApp's internal ID for the business number. It is not the phone number itself.
- **24-hour window.** WhatsApp lets a business send free-form messages only within 24 hours of the customer's last message; later messages must use an approved template.
- **Wallet.** The balance on your Hypa account that pays for AI turns and Bridge replies.
- **Simulator.** `whatsapp:sim`, a local stand-in for WhatsApp used for demos and testing.

## Troubleshooting

**The API reports a missing provider key, or a Bridge chat shows `agent_failed`.** Hypa Bridge uses `meta/muse-spark-1.3`, which needs `META_MODEL_API_KEY`. Set it and restart the API.

**The API does not start and mentions a missing secret.** Set `AGENT_MEDIA_SECRET`, `JWT_SECRET` and `ENCRYPTION_KEY` in `apps/hypa-api/.env`, and keep the placeholder Google values.

**`ENCRYPTION_KEY environment variable is not defined` or `Cannot find module`.** Run `pnpm install`, and make sure `apps/hypa-api/.env` sets `ENCRYPTION_KEY`.

**`type "vector" does not exist` during `prisma db push`.** Your PostgreSQL has no `pgvector`. Use the `pgvector/pgvector` Docker image or run `CREATE EXTENSION vector;`.

**The mobile app cannot reach the API.** Use `localhost` only on the iOS Simulator, `10.0.2.2` on the Android Emulator, and your computer's LAN IP on a physical device. Confirm the API is on port `5678`.

**The agent answers but cannot use tools.** Sign in with a real account (the token from `/auth/register` or `/auth/login`). For anonymous testing, set `AGENT_ANONYMOUS_USER_ID` to the ID of a local user with a wallet and restart the API.

**The PayPal order never turns paid.** The webhook is not reaching the API. Check that your tunnel is running, the webhook URL in PayPal matches it, and `PAYPAL_WEBHOOK_ID` is the ID of that webhook.

**The payment link opens an error.** `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` must come from a **sandbox** app while `PAYPAL_ENVIRONMENT=sandbox`.

**The simulator says `Set WHATSAPP_APP_SECRET`.** Pass the same secret the API uses, on the same command line.

**The simulator prints `webhook answered 403`.** `WHATSAPP_APP_SECRET` differs between the API and the simulator. Restart both with the same value.

**The API logs "a message arrived for a number that is not connected" and no customer appears.** `WHATSAPP_PHONE_NUMBER_IDS` differs from `SIM_PHONE_NUMBER_ID`, or the business has not tapped Connect yet. The id must be digits only, with no trailing comma or space.

**No reply appears in the simulator.** Check that `WHATSAPP_GRAPH_URL` is `http://localhost:4010`, that Redis is running (Bridge replies go through a queue), and that automatic answers are on or you sent the draft in the app.

**Voice notes fail.** Install `ffmpeg` and make sure it is on your PATH.

**The assistant stopped answering and the app shows an alert.** The wallet is low (`low_balance`), or the business profile is incomplete (`profile_incomplete`). Fix the cause; the next message resumes.

**No push notification arrives.** Use a physical device with a development build, sign in, and connect a number (the token is sent then). A phone that was signed out keeps its old token until another account registers it.

**Native build or generated-code errors.** Run `pnpm install` and `pnpm --filter @hypa/intelligence generate:nitro`, then rebuild the app.

## Security

- Never commit `.env` files, API keys, passwords, access tokens, private keys or service-account JSON.
- Use sandbox and local credentials, not production ones. Do not point local development at production PostgreSQL or Redis.
- A customer's phone number is stored encrypted with `ENCRYPTION_KEY`; the phone number is also kept hashed to find the thread and is never logged.
- Hypa Bridge rejects any webhook whose signature does not match `WHATSAPP_APP_SECRET`; PayPal webhooks are verified against `PAYPAL_WEBHOOK_ID`.
- Money only moves after the merchant's explicit approval.
- Rotate any credential that has been exposed.
