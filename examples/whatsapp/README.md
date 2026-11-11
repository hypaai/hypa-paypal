# WhatsApp order to PayPal sandbox payment

A single-file bot that takes an order on WhatsApp and ends with a paid PayPal **sandbox** order,
using this repo's `PayPalProvider`. It is the smallest version of what `apps/hypa-api` does for Hypa Bridge.

1. A customer writes `order 24.00 USD 2 coffee`. The bot answers "Your order is being confirmed".
2. Nothing payable is sent yet. The merchant approves with `POST /approve/<orderId>` and the bearer `MERCHANT_TOKEN`
   (the order id is printed in the console). The customer then gets the PayPal link, amount and currency unchanged.
3. PayPal's signed webhook (`POST /paypal`) marks the order paid and the customer gets a receipt.

A repeated WhatsApp message id makes one order, a repeated PayPal event sends one receipt, and approving twice sends one link.
State is in memory only. Nothing is stored, and the example refuses to run unless `PAYPAL_ENVIRONMENT=sandbox`.

## Run

```sh
cp examples/whatsapp/.env.example examples/whatsapp/.env   # fill in your own sandbox and Meta keys
set -a; . examples/whatsapp/.env; set +a
npx tsx examples/whatsapp/index.ts
```

Expose the port with a tunnel (for example ngrok), set `PUBLIC_URL` to its HTTPS address, then point
Meta's webhook at `<PUBLIC_URL>/whatsapp` (verify token = `WHATSAPP_VERIFY_TOKEN`) and the PayPal sandbox
webhook at `<PUBLIC_URL>/paypal` (copy its id into `PAYPAL_WEBHOOK_ID`).

Keys come from the environment only; never commit a `.env`. Messages are in English here. The full app
(`apps/hypa-api`) also writes them in the customer's language, sends approved templates outside WhatsApp's
24-hour window, and shows the merchant an approval card in the app.
