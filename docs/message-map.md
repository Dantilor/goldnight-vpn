# Message Map

## `/start`

**Trigger**: `/start`  
**Message**:

- Title: `Golden Night VPN`
- Body: `Private VPN access inside Telegram. Manage subscription and setup securely in Mini App.`
- CTA: quick actions hint based on subscription/access presence

## `/help` or Help button

**Message**:

- Guidance on main actions (Open App, My Subscription, Setup VPN, Referrals)
- Support direction to Mini App Profile/Support

## `/profile`

**Message blocks**:

- Profile identity (`@username` or first name)
- Subscription summary (or no subscription)
- VPN access summary (or no access)
- Referral code

## `My Subscription` button

**Message**:

- Plan name
- Status
- Active until date

Fallback:

- `No active subscription found. Choose a plan in Mini App.`

## `Setup VPN` button

**Message**:

- Mini App deep-link to `/connect`
- If no active access: concise note to contact support + setup link

## `Referrals` button

**Message**:

- Total referrals
- Granted rewards count
- Link to Mini App referrals screen
