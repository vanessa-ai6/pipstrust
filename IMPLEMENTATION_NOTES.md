# PipsTrust frontend implementation notes

## What changed

- Rebuilt the dashboard with a cleaner professional dark/emerald visual system, motion, quick actions, active/completed/pending metrics and recent activity.
- Active investments are defensively filtered so 100%/completed items never appear in the active list.
- Rebuilt withdrawals with method cards, balance validation, percentage shortcuts, payout-address preview, OTP confirmation, resend OTP, cancellation, loading states and motion.
- Added USDT ERC-20 payout address support.
- Added a complete Support Tickets page with ticket creation, threaded messages and replies.
- Added Support Ticket navigation after Profile and a Support Ticket card inside Profile.
- Added support-ticket management to the admin panel so administrators can reply and close tickets.
- Fixed profile forms so API-loaded values populate correctly after the profile request completes.
- Added shared premium-card styling and reduced-motion accessibility behavior.

## Deploy

1. Set `NEXT_PUBLIC_API_URL` to the backend API base, for example `https://api.example.com/api`.
2. Install packages with `npm ci`.
3. Run `npm run build`.
4. Deploy/restart the Next.js app.

Deploy the backend migrations before deploying this frontend because the frontend expects the new dashboard fields, support-ticket endpoints and ERC-20 wallet field.
