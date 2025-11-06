# Stripe Production Deployment Checklist

## ⚠️ CRITICAL ISSUES FOUND

### 1. Frontend Public Key Configuration Issue ❌

**Problem:** The frontend is hardcoded to use only `VITE_STRIPE_PUBLIC_KEY`, but the backend uses a fallback pattern (`TESTING_* || PRODUCTION_*`).

**Current Code (client/src/pages/subscribe.tsx):**
```typescript
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
```

**Impact:** In production, if you only set production keys, the frontend won't load them. You need BOTH sets of keys configured.

**Solution Options:**

**Option A (Recommended): Use environment-based selection**
```typescript
const publicKey = import.meta.env.MODE === 'production'
  ? import.meta.env.VITE_STRIPE_PUBLIC_KEY
  : (import.meta.env.VITE_TESTING_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const stripePromise = loadStripe(publicKey);
```

**Option B: Set VITE_STRIPE_PUBLIC_KEY to your production key**
- In production environment, set `VITE_STRIPE_PUBLIC_KEY` to your production public key
- Keep `TESTING_VITE_STRIPE_PUBLIC_KEY` for development

---

## Required Production Secrets

### Production Stripe Keys (REQUIRED)
You need to obtain these from your Stripe Dashboard (https://dashboard.stripe.com):

1. **STRIPE_SECRET_KEY** - Your production secret key (starts with `sk_live_`)
2. **VITE_STRIPE_PUBLIC_KEY** - Your production publishable key (starts with `pk_live_`)

### Production Price IDs (REQUIRED)
Create these in Stripe Dashboard → Products:

3. **STRIPE_PRICE_HOBBY** - Production price ID for $8/month Hobby plan
4. **STRIPE_PRICE_PRO** - Production price ID for $18/month Pro plan

### Current Setup (Test Mode)
✅ TESTING_STRIPE_SECRET_KEY - Currently set (test mode: `sk_test_*`)
✅ TESTING_VITE_STRIPE_PUBLIC_KEY - Currently set (test mode: `pk_test_*`)
✅ TESTING_STRIPE_PRICE_HOBBY - Currently set
✅ TESTING_STRIPE_PRICE_PRO - Currently set

---

## Pre-Production Checklist

### 1. Create Production Stripe Products ⚠️

In Stripe Dashboard → Products → Create Product:

**Hobby Plan:**
- Name: "Hobby Plan"
- Recurring: Monthly
- Price: $8.00 USD
- Copy the Price ID → Set as `STRIPE_PRICE_HOBBY`

**Pro Plan:**
- Name: "Pro Plan"  
- Recurring: Monthly
- Price: $18.00 USD
- Copy the Price ID → Set as `STRIPE_PRICE_PRO`

### 2. Configure Production Secrets ⚠️

Add these to your production Replit deployment:

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_PRICE_HOBBY=price_YOUR_PRODUCTION_HOBBY_PRICE_ID
STRIPE_PRICE_PRO=price_YOUR_PRODUCTION_PRO_PRICE_ID
```

### 3. Webhook Configuration ⚠️

**Current Status:** Webhooks are optional (the app uses direct completion as fallback)

**For Production (Recommended):**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `setup_intent.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy the webhook signing secret
5. Add to your production secrets:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

**Note:** Even without webhooks, subscriptions will complete via the `/api/subscription/complete` endpoint.

### 4. Test Before Going Live ✅

**Using Stripe Test Mode:**
- ✅ Test subscriptions are working (confirmed via e2e tests)
- ✅ User tier upgrades working
- ✅ Payment collection working

**Before Production Launch:**
1. Verify all production secrets are set correctly
2. Run `/stripe-diagnostic` page to verify configuration
3. Test with Stripe test mode cards first
4. Verify webhook delivery (if configured)

### 5. Security Considerations ✅

**Already Implemented:**
- ✅ Webhook signature verification (if webhook secret is configured)
- ✅ User authentication required for all subscription endpoints
- ✅ Subscription ownership verification in completion endpoint
- ✅ Stripe API errors handled gracefully

**Additional Recommendations:**
- [ ] Enable 3D Secure for production cards (configured in Stripe Dashboard)
- [ ] Set up fraud detection rules in Stripe Dashboard
- [ ] Configure email receipts in Stripe Dashboard

---

## Production Deployment Steps

### Step 1: Update Frontend Code (REQUIRED)

Choose one of these approaches:

**Approach A: Environment-based selection (Recommended)**
Update `client/src/pages/subscribe.tsx`:

```typescript
// Use testing keys in development, production keys in production
const getStripePublicKey = () => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  }
  return import.meta.env.VITE_TESTING_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;
};

const stripePromise = loadStripe(getStripePublicKey());
```

**Approach B: Just set production keys**
Keep the code as-is but ensure `VITE_STRIPE_PUBLIC_KEY` is set to your production public key in the production environment.

### Step 2: Create Production Stripe Products

Follow the steps in "Create Production Stripe Products" above.

### Step 3: Configure Production Secrets

Add all required production secrets to your Replit deployment.

### Step 4: Test Configuration

1. Visit `/stripe-diagnostic` in production
2. Verify:
   - Stripe Mode shows "LIVE"
   - Account info shows your production Stripe account
   - All price IDs are valid
   - No configuration errors

### Step 5: Test Subscription Flow

1. Create a test user account
2. Attempt to subscribe to Hobby tier
3. Use a Stripe test card (4242 4242 4242 4242) in test mode first
4. Verify tier upgrade happens
5. Check Stripe Dashboard for the subscription

### Step 6: Monitor Production

After going live, monitor:
- Server logs for subscription errors
- Stripe Dashboard → Payments for successful subscriptions
- Stripe Dashboard → Webhooks for delivery status (if configured)

---

## Account Matching Verification

**CRITICAL:** Your Stripe secret key and price IDs MUST be from the same Stripe account.

**Current Test Setup:**
- Account: `acct_1SQ7K3H2Aoyp5vFH` ✅
- All test keys and price IDs are from this account ✅

**For Production:**
Verify all production credentials are from the same Stripe account:
```bash
# Check using /stripe-diagnostic endpoint
# It will verify:
# 1. Secret key connects to account X
# 2. Price IDs belong to account X
# 3. All from same account = ✅
```

---

## Common Issues & Solutions

### Issue: "Price not found" error
**Cause:** Price ID doesn't exist in the connected Stripe account  
**Solution:** Verify price IDs in Stripe Dashboard match your environment variables

### Issue: "No such customer" error
**Cause:** Customer ID mismatch between environments  
**Solution:** Delete test data, ensure using correct environment keys

### Issue: Frontend shows "Failed to load Stripe"
**Cause:** Missing or incorrect `VITE_STRIPE_PUBLIC_KEY`  
**Solution:** Verify the environment variable is set and starts with `pk_live_` for production

### Issue: Webhooks not firing
**Cause:** Webhook endpoint not configured or signing secret wrong  
**Solution:** Verify webhook URL and signing secret in Stripe Dashboard

---

## Testing Stripe in Production

### Test Cards (Stripe Test Mode Only)
- Success: `4242 4242 4242 4242`
- 3D Secure: `4000 0027 6000 3184`
- Decline: `4000 0000 0000 0002`

### Production Testing
**DO NOT use test cards in production!**

For production testing:
1. Create a real product at $0.50 for testing
2. Use your own real card
3. Cancel/refund immediately after testing
4. Delete test subscriptions from Stripe Dashboard

---

## Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **App Diagnostic Page:** `/stripe-diagnostic`

---

## Summary

**Before Production Deployment:**

1. ❌ **MUST FIX:** Update frontend to handle production public keys correctly
2. ⚠️ **REQUIRED:** Create production Stripe products and obtain price IDs
3. ⚠️ **REQUIRED:** Configure all production secrets (STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY, price IDs)
4. ✅ **OPTIONAL:** Configure webhooks (app works without them via fallback)
5. ✅ **RECOMMENDED:** Test using `/stripe-diagnostic` page before going live

**Current Status:** ✅ Test mode working perfectly | ❌ Production keys need configuration
