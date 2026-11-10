# hypa-paypal: hackathon submission plan

PayPal AI Hackathon on Devpost. Closes **Thu Nov 12, 2026, 12:00 PT**. Target prize: Best Use of Agentic Commerce.

**Goal:** this repo becomes the full, runnable Hypa payments product, built the same way as hypa-meta.
- Base: hypa-meta's public code (HEAD `bac4775`).
- On top: the payments work from hypa-v2 (tickets 00–06 in `hypa-v2/.claude/linear-payments-tickets/`).

**Rules**
- Read hypa-meta and hypa-v2 as sources. Never edit them.
- Small commits.
- Ask before **every** commit and **every** push. Never force-push.
- Port the **final** hypa-v2 version of each payments file. That version already has the Nov 7–9 fixes, so don't replay old commits one by one.
- Run the malware check and a secret scan before each push.

## Phase 1: Make room (Nov 9)

1. Add `AGENTS.md` with the git rules.
2. Move the library to `packages/@hypa-paypal-agent` with `git mv`, so its history is kept.
3. Sync the library to hypa-v2's newer copy:
   - the `approved` status
   - the webhook `payload`
   - `tsconfig.cjs.json`

   Bump to `0.3.0`. Publishing to npm is a separate yes from you.

## Phase 2: Base from hypa-meta (Nov 9–10)

One commit per group, in this order:

4. Root scaffold: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`, `patches/`, `pnpm-lock.yaml`
5. `packages/typescript-config`
6. `packages/@hypa-config`
7. `@hypa-translate-core`, `@hypa-audio`, `@hypa-ui`
8. `@hypa-tiny-keys`, `localize-image`
9. `@hypa-intelligence-core`
10. `@hypa-mcp-server`, `@hypa-mcp-client`
11. `apps/hypa-api`
12. `apps/hypa-intelligence-mobile`
13. `apps/hypa-intelligence` (web)
14. `evals/` and docs, if useful

**In every step:**
- Point repo links and clone commands to `github.com/hypaai/hypa-paypal`.
- Check that `pnpm install` and the build still work.

## Phase 3: Payments from hypa-v2 (Nov 10)

15. **Config:** `@hypa-config/payments.ts` and `json/payments.json` (the merchant fee key `payments.paid_order`).
16. **Database:**
    - Commerce models in `prisma/schema.prisma`
    - These migrations:
      - `commerce_data_model`
      - `unique_agent_request_order`
      - `commerce_receipt_token`
      - `commerce_receipt_expiry`
      - `commerce_payment_cancelled_refunded`
    - Skip `pro_payment_reversals`. It belongs to Labs Pro.
17. **API commerce module:** `commerce.service`, `.dto`, `.controller`, `.module`, `commerce-receipt.controller`, plus the spec.
18. **Merchant fee:** the paid-order charge in `libs/billing/wallet-billing.ts`. Only the merchant pays, and only after payment.
19. **PayPal webhook:** `paypal-webhook.service` and its spec, the `webhooks.controller` and module wiring, and the raw body in `main.ts`.
20. **Core:**
    - `payment-approval.ts`, `payment-link.ts`, `payment-receipt.ts`
    - Payment tools in `tools.ts`
    - The `approval` event in `agent-stream.ts`
    - Tests for all of the above
21. **Agent:**
    - Payment tools in `tool-executor.ts`
    - Idempotent retries in `agent.loop.ts`
    - Tools in `mcp.controller.ts`
    - Payment prompts in `prompts.json`
    - Specs, including `payment-tools.spec.ts`
22. **`.env.example`:** PayPal sandbox client ID, secret, webhook ID, and the environment.
23. **Mobile approval:**
    - `api/commerce.ts`, `lib/payment-approval.ts`
    - `payment-approval-card.tsx`, `payment-approval-sheet.tsx`
    - `app/orders/[id]/approve.tsx`
24. **Mobile chat:** wire approval into `chat-screen.tsx`, `use-agent-chat.ts` and `chat-turn.ts`, so the payment link comes back to chat.
25. **Keyboard approve button:**
    - iOS: `KeyboardTools.swift`, `KeyboardViewController.swift`
    - Android: `AskHypaClient.kt`, `HypaKeyboardPanelView.kt`
26. **Web approval and receipt pages:** port hypa-lab's pages into `apps/hypa-intelligence`. This gives outside agents an approval link and gives Ada her receipt.
    - `order-approval.tsx`, `payment-receipt.tsx`
    - `order-approval-modal.tsx`, `payment-link-chip.tsx`
    - `order-approval-store.ts`, `lib/order-approval.ts`
27. **Full flow test:** follow `05-agent-flow-manual-tests.md` in sandbox (voice, photo, text → approval → PayPal → paid message).

## Phase 4: Submission (Nov 11 – Nov 12 morning)

28. **README:**
    - What it is, who it's for, the 7-step flow
    - Architecture diagram
    - Local setup like hypa-meta's
    - PayPal sandbox setup and test accounts
    - **What changed since Oct 1**, which the rules require
29. **License:** the MIT `LICENSE` stays at the root and shows in GitHub's About section.
30. **Hosted sandbox demo:** for example on Render, which also opens the Render sponsor prize.
    - Add a test merchant login and a sandbox buyer.
    - Put the login details in the README and on Devpost.
31. **Video:** under 3 min, on YouTube (public). No copyrighted music. Show:
    - voice, photo and text in 3 languages
    - approve → PayPal → spoken "paid"
    - Ada's link message in her language
    - an outside agent calling the same tools over MCP
32. **Devpost write-up in English:**
    - the problem
    - how it works
    - safety rules (approval before money, server-side amounts, signed webhooks)
    - languages
    - what's next
33. **Final checks, then submit before 12:00 PT, Nov 12:**
    - a secret scan
    - a clean-clone run of the README steps

## Leave out

- Other hypa-v2 apps, and hypa-lab beyond the two pages in step 26
- Labs Pro billing and subscriptions
- Tickets 07–18
- PostHog and tracing
- Internal URLs and any secrets

## Open questions

- Keep hypa-meta's Lens / Meta-only parts, or trim them? Default: keep them, so nothing breaks.
- Where to host: Render or somewhere else?
- Who on the team takes the video and the hosted demo?
