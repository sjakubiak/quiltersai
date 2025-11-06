# Deployment Guide

## Framework Deployment: Multiple Domains from One Codebase

This guide explains how to deploy separate instances for each domain (quilting, construction, etc.) with custom branding and DNS.

## Quick Start

### 1. Choose Your Domain

Decide which domain you're deploying:
- `quilting` - Quilter's AI
- `construction` - BuilderAI
- `music` - (future)
- `architecture` - (future)

### 2. Set Environment Variables

In your Replit project or hosting environment:

```bash
# Required for all deployments
DOMAIN_ID=construction              # Which domain to load
DATABASE_URL=postgresql://...        # Database connection
SESSION_SECRET=your_session_secret   # Session encryption key

# Stripe (domain-specific prices)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_HOBBY=price_hobby_construction
STRIPE_PRICE_PRO=price_pro_construction
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# OpenAI (via Replit Integration - auto-configured)
# No API key needed when using Replit AI Integrations

# Email (optional - for feedback)
RESEND_API_KEY=re_...
```

### 3. Deploy

The framework automatically loads the correct domain based on `DOMAIN_ID`:

```bash
# For quilting domain
DOMAIN_ID=quilting npm run dev

# For construction domain  
DOMAIN_ID=construction npm run dev
```

## Multi-Domain Deployment Strategy

### Option 1: Separate Replit Projects (Recommended)

Create one Replit project per domain:

**Quilter's AI** (quiltersai.com)
- Fork this project → `quiltersai`
- Set `DOMAIN_ID=quilting`
- Configure Stripe prices for quilting
- Deploy to quiltersai.com

**BuilderAI** (builderai.com)
- Fork this project → `builderai`
- Set `DOMAIN_ID=construction`
- Configure Stripe prices for construction
- Deploy to builderai.com

**Benefits:**
- Independent scaling
- Separate databases (if desired)
- Easy rollback per domain
- Clear separation

### Option 2: Single Project, Multiple Deployments

Use one Replit project with different deployment configurations:

**Development:**
```bash
DOMAIN_ID=quilting npm run dev
```

**Production Quilting:**
```bash
DOMAIN_ID=quilting npm start
```

**Production Construction:**
```bash
DOMAIN_ID=construction npm start
```

## DNS Configuration

### Custom Domains

1. In Replit, go to your project settings
2. Add custom domain (e.g., `quiltersai.com`)
3. Update DNS records:
   ```
   A     @       76.76.21.21
   CNAME www     your-repl.repl.co
   ```

### Multi-Domain Setup

For multiple domains from same codebase:
1. Deploy separate Replit projects
2. Each project sets its own custom domain
3. Each loads different `DOMAIN_ID`

## Stripe Configuration

### Create Separate Price IDs

Each domain needs its own Stripe products:

**Quilting Domain:**
```
Product: Quilter's AI Hobby → price_quilting_hobby
Product: Quilter's AI Pro   → price_quilting_pro
```

**Construction Domain:**
```
Product: BuilderAI Hobby → price_construction_hobby
Product: BuilderAI Pro   → price_construction_pro
```

Set in environment:
```bash
# For quilting deployment
STRIPE_PRICE_HOBBY=price_quilting_hobby
STRIPE_PRICE_PRO=price_quilting_pro

# For construction deployment
STRIPE_PRICE_HOBBY=price_construction_hobby
STRIPE_PRICE_PRO=price_construction_pro
```

### Webhook Configuration

If using separate deployments:
- Configure webhook per domain:
  ```
  quiltersai.com/api/webhooks/stripe
  builderai.com/api/webhooks/stripe
  ```

If single deployment:
- One webhook endpoint handles all domains

## Database Strategy

### Option 1: Shared Database (Recommended for White-Label)
- All domains use same `DATABASE_URL`
- Data is separated by domain logic
- Easier cross-domain analytics
- Shared user accounts possible

### Option 2: Separate Databases
- Each domain has its own `DATABASE_URL`
- Complete data isolation
- Independent backups/migrations
- No cross-domain user accounts

## White-Label Deployment

To deploy a custom-branded instance for a customer:

### 1. Create Customer Configuration

```bash
# Copy domain configuration
cp domains/construction/config.json domains/acme-construction/config.json
```

### 2. Customize Branding

Edit `domains/acme-construction/config.json`:
```json
{
  "id": "acme-construction",
  "name": "ACME BuilderPro",
  "domain": "acme-builder.com",
  "branding": {
    "primaryColor": "#FF5733",  // Customer's brand color
    "logo": "/assets/acme-logo.svg",
    "tagline": "Build Smart with ACME"
  },
  "pricing": {
    "currency": "USD",
    "hobbyPrice": 15,  // Custom pricing
    "proPrice": 35
  }
}
```

### 3. Deploy with Customer Domain

```bash
DOMAIN_ID=acme-construction npm run dev
```

### 4. Configure Custom Stripe

Create customer-specific Stripe prices:
```bash
STRIPE_PRICE_HOBBY=price_acme_hobby
STRIPE_PRICE_PRO=price_acme_pro
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DOMAIN_ID` | ✅ | Which domain to load | `quilting` or `construction` |
| `DATABASE_URL` | ✅ | PostgreSQL connection | `postgresql://...` |
| `SESSION_SECRET` | ✅ | Session encryption key | Random string |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key | `sk_live_...` |
| `STRIPE_PRICE_HOBBY` | ✅ | Hobby tier price ID | `price_...` |
| `STRIPE_PRICE_PRO` | ✅ | Pro tier price ID | `price_...` |
| `VITE_STRIPE_PUBLIC_KEY` | ✅ | Stripe public key | `pk_live_...` |
| `RESEND_API_KEY` | ❌ | Email service (optional) | `re_...` |

## Testing Deployments

### Test Locally

```bash
# Test quilting domain
DOMAIN_ID=quilting npm run dev

# Test construction domain
DOMAIN_ID=construction npm run dev
```

Visit `http://localhost:5000` and verify:
- ✅ Correct branding colors
- ✅ Correct terminology
- ✅ Domain-specific generation works
- ✅ Pricing displays correctly

### Production Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Custom domain DNS configured
- [ ] Stripe products created
- [ ] Stripe webhook configured
- [ ] Database migrations run
- [ ] SSL certificate active
- [ ] Test signup flow
- [ ] Test subscription flow
- [ ] Test generation with domain logic
- [ ] Test PDF export (if enabled)

## Monitoring

Each deployment should monitor:
- API response times
- Generation success rate
- Stripe webhook delivery
- Database connection pool
- OpenAI API errors

## Troubleshooting

### Wrong Domain Loads

**Problem:** Wrong branding/terminology displays
**Solution:** Check `DOMAIN_ID` environment variable

### Stripe Errors

**Problem:** "Price not found" errors
**Solution:** Verify `STRIPE_PRICE_HOBBY` and `STRIPE_PRICE_PRO` match your Stripe dashboard

### Generation Fails

**Problem:** Domain-specific generation returns errors
**Solution:** Check plugin implementation in `domains/{DOMAIN_ID}/plugin.ts`

### Database Errors

**Problem:** Table not found
**Solution:** Run migrations: `npm run db:push`

## Support

For deployment issues:
- Check framework README: `framework/README.md`
- Review plugin interface: `framework/types/plugin-interface.ts`
- Examine domain config: `domains/{DOMAIN_ID}/config.json`
