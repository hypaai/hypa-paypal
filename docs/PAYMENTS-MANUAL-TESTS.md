# Payments agent flow: manual test matrix

A merchant asks in any supported language, by voice, text or photo, and ends with a paid PayPal sandbox order, the confirmation posted in their chat, and a notification if the app is closed. These are the checks that cannot be automated: they need real phones, a microphone, a camera and a PayPal sandbox buyer. Split the matrix by platform; mark each cell with the build and date.

## Setup

- A merchant account signed in on the phone, with a wallet balance (the fee is $0.01 per paid order).
- The API reachable from the phone, with `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT=sandbox`, and `PAYPAL_WEBHOOK_ID` set to the **webhook id** from the PayPal dashboard (not its URL).
- A PayPal sandbox **Personal** (buyer) account for the customer. Pay from a private window.
- For the paid step to arrive without a public webhook, tap the payment status in the app (it reconciles); with a tunnel to `/webhooks/paypal` the webhook arrives by itself.
- Notifications: allow them when the app asks after the first approval. Android needs the FCM credentials set up in EAS; iOS needs push credentials. A development build, not Expo Go.
- A second phone or a chat app (WhatsApp, Messages) with a contact to receive the keyboard insert.

## Languages (checked against the model catalog)

| Role | Languages | Why |
| --- | --- | --- |
| Voice, recognition and translation all available | English, French, Spanish, Portuguese, Yoruba, Igbo, Hausa, Pidgin | The approval card has labels for all eight |
| **No voice** (text-only confirmation) | Bengali, Haitian Creole | In the catalog for translation but no text-to-speech |
| **No speech recognition** (ask the merchant to type) | Kikongo, Swati | In the catalog for translation but no speech-to-text |

Of 145 translation languages, 94 have a voice and 134 have speech recognition. Test at least five of the first row, and both "without" rows.

## The matrix

Each cell: the merchant says or types the same request (a customer's name, an item, an amount and a currency) and the full flow completes. Surfaces: **App** (chat), **iOS keyboard**, **Android keyboard**.

| Language | Voice: App | Voice: iOS kbd | Voice: Android kbd | Text: App | Text: iOS kbd | Text: Android kbd | Photo: App | Photo: iOS kbd | Photo: Android kbd |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| English | | | | | | | | | |
| French | | | | | | | | | |
| Yoruba | | | | | | | | | |
| Igbo | | | | | | | | | |
| Hausa | | | | | | | | | |
| Bengali (no voice) | n/a | n/a | n/a | | | | | | |
| Kikongo (no recognition) | expect "type it" | expect "type it" | expect "type it" | | | | | | |

"Photo" is a photo of a handwritten or printed order, with text in that language.

## What each run must show

1. **Understand.** The agent reads the request in the merchant's language (transcribes the recording, reads the photo) and replies in that language.
2. **Plan.** One draft order and one **approval card**: customer, items, amount and currency in the merchant's number format (for example `25,00 EUR` in French), the Hypa fee, labels in the merchant's language. Nothing payable exists yet.
3. **Approve.** Tapping Approve moves the order to approved. The notification permission prompt appears now, once.
4. **Hand off the link.** App: the share sheet opens with the message and link. Keyboard: the message and link are inserted into the open chat. The message is in the **customer's** language, the amount and currency and URL are exactly the order's, and the link is a `paypal.com` checkout.
5. **Pay.** Pay the link as the sandbox buyer.
6. **Confirm.** The merchant's chat shows "`<customer>` has paid `<amount>`." in the merchant's language, posted by Hypa. If the app is closed, a notification arrives with the same text; tapping it opens that chat.

## Scenarios

| # | Do this | Expected |
| --- | --- | --- |
| 1 | Ask for an order with the amount missing, or "about 20" | The agent asks for the exact amount in the merchant's language. **No order, no checkout.** |
| 2 | Ask with the currency missing | The agent asks for the currency. Nothing is created. |
| 3 | Ask with two customers in one message | Two orders and two approval cards, each with its own amount. |
| 4 | Ask for an order and, before approving, close and reopen the app | The card is still there as a draft. Opening an old, already-approved card does not reopen the sheet. |
| 5 | Tap Cancel on a draft | Order cancelled. Asking for a payment link for it fails with a clear message. |
| 6 | Approve, then change the amount (API or another device), then approve again on the old card | The second approval is refused: "This order changed after you reviewed it." The order is back to draft. |
| 7 | Tap Approve twice quickly | One approval, no error shown. |
| 8 | Send the same agent request twice (retry the request id) | **One** order and **one** usage charge. |
| 9 | Record a voice order in **Kikongo or Swati** | The agent says it cannot hear that language and asks the merchant to type the order. |
| 10 | Complete a flow in **Bengali or Haitian Creole** | Text-only confirmation; no audio is attempted and nothing fails. |
| 11 | Pay with the buyer, then pay the same link again | One paid order and one fee; the second attempt does nothing. |
| 12 | Close the app fully, then pay | A notification arrives; tapping it opens the chat with the confirmation. |
| 13 | Sign out, then pay another order of that account | No notification on this phone. |
| 14 | From an outside agent (`/v2/mcp`) create an order | It returns an approval link that opens the card in the app. The agent cannot approve. |
| 15 | Turn the network off during hand-off, then on | The failed step is retried once; a second failure says what failed. |

## Checks in the data (after each run)

- Orders: one row per request, status `draft` → `approved` → `paid`, `agent_request_id` set (`<run id>:<fingerprint>`).
- `commerce_payment_event` has the status changes, and `payment.paid` once.
- `usage_charge`: one row per paid order.
- The chat has the assistant message with id `payment-paid-<order id>` once.
- `push_device`: one row per signed-in phone; none after sign-out.

## Not covered by the automated tests

The phone side of notifications (the permission prompt, the token registration, opening the chat from a tap), the keyboard insert, the share sheet, voice and photo input, and the spoken confirmation. Record failures with the build, the device, the language and the request id.
