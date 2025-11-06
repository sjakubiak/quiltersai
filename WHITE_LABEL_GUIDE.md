# White-Label Configuration Guide

## Overview

This framework allows you to create custom-branded instances of the AI design platform for your customers. Each white-label deployment can have:

- ✅ Custom branding (colors, logo, tagline)
- ✅ Custom domain name
- ✅ Custom pricing tiers
- ✅ Separate Stripe account
- ✅ Independent user base
- ✅ Domain-specific features

## Use Cases

### 1. Industry-Specific SaaS
Deploy different domains for different industries:
- `quiltersai.com` - Quilting patterns
- `builderai.com` - Construction blueprints
- `composerAI.com` - Music composition

### 2. White-Label for Customers
Sell branded instances to customers:
- `acme-builder.com` - ACME Construction's custom BuilderAI
- `johnsquilts.com` - John's Quilting Studio custom platform
- `metro-design.com` - Metro Architects' design tool

### 3. Regional Deployments
Deploy localized versions:
- `quiltersai.ca` - Canadian pricing (CAD)
- `quiltersai.eu` - European pricing (EUR)
- `quiltersai.au` - Australian pricing (AUD)

## Creating a White-Label Instance

### Step 1: Create Customer Configuration

```bash
# Create new white-label configuration
mkdir -p domains/customer-name
cp domains/construction/config.json domains/customer-name/config.json
cp domains/construction/plugin.ts domains/customer-name/plugin.ts
```

### Step 2: Customize config.json

Edit `domains/customer-name/config.json`:

```json
{
  "id": "customer-name",
  "name": "Customer Brand Name",
  "description": "Custom description",
  "domain": "customer-domain.com",
  
  "terminology": {
    "itemName": "blueprint",
    "itemPlural": "blueprints",
    "actionVerb": "design",
    "generateVerb": "create",
    "collectionName": "projects"
  },
  
  "branding": {
    "primaryColor": "#CUSTOMER_PRIMARY",
    "accentColor": "#CUSTOMER_ACCENT",
    "logo": "/assets/customer-logo.svg",
    "favicon": "/assets/customer-favicon.ico",
    "tagline": "Customer's Tagline",
    "heroTitle": "Customer's Hero Title",
    "heroSubtitle": "Customer's subtitle..."
  },
  
  "features": {
    "pdfExport": true,
    "imageUpload": true,
    "advancedOptions": true,
    "communityGallery": false
  },
  
  "pricing": {
    "currency": "USD",
    "hobbyPrice": 15,
    "proPrice": 35
  },
  
  "seo": {
    "title": "Customer SEO Title",
    "description": "Customer meta description",
    "keywords": ["keyword1", "keyword2"]
  }
}
```

### Step 3: Create Stripe Products

In your Stripe dashboard (or customer's Stripe account):

1. Create products:
   - "Customer Name - Hobby Plan"
   - "Customer Name - Pro Plan"

2. Create recurring prices:
   - Hobby: $15/month USD
   - Pro: $35/month USD

3. Note the price IDs:
   ```
   price_customer_hobby_xxxxx
   price_customer_pro_xxxxx
   ```

### Step 4: Configure Environment

Create `.env` for this deployment:

```bash
# Domain Configuration
DOMAIN_ID=customer-name

# Database (can be shared or separate)
DATABASE_URL=postgresql://customer_db_url...

# Stripe (customer's account or yours)
STRIPE_SECRET_KEY=sk_live_customer_xxxxx
STRIPE_PRICE_HOBBY=price_customer_hobby_xxxxx
STRIPE_PRICE_PRO=price_customer_pro_xxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_customer_xxxxx

# Session
SESSION_SECRET=random_secret_for_customer

# Email (optional)
RESEND_API_KEY=re_xxxxx
```

### Step 5: Deploy

Deploy to customer's domain:
```bash
# Deploy to Replit
DOMAIN_ID=customer-name npm start

# Or deploy to your hosting platform
docker build -t customer-app .
docker run -e DOMAIN_ID=customer-name customer-app
```

## Pricing Models for White-Label

### Model 1: Flat Fee + Revenue Share

**Customer pays you:**
- $500/month platform fee
- 20% of their subscription revenue

**You provide:**
- Hosted platform
- Maintenance and updates
- Technical support
- Custom branding

### Model 2: Per-User Licensing

**Customer pays you:**
- $5 per active subscriber/month

**You provide:**
- Platform access
- Updates
- Support

### Model 3: One-Time Setup + Monthly SaaS

**Customer pays you:**
- $2,000 one-time setup
- $200/month hosting & maintenance

**You provide:**
- Initial configuration
- Ongoing hosting
- Platform updates

### Model 4: Full White-Label License

**Customer pays you:**
- $10,000 one-time license
- $500/month support contract

**Customer gets:**
- Complete codebase
- Self-hosting capability
- Custom modifications
- Priority support

## Stripe Configuration Options

### Option 1: Your Stripe Account (Recommended for Starting)

**Pros:**
- Simpler setup
- You control payment flow
- Easier commission/revenue share

**Cons:**
- You're responsible for payouts to customers
- Tax implications

**Setup:**
```bash
# Use your Stripe account for all white-label instances
STRIPE_SECRET_KEY=sk_live_your_account
STRIPE_PRICE_HOBBY=price_customer1_hobby
STRIPE_PRICE_PRO=price_customer1_pro
```

### Option 2: Customer's Stripe Account

**Pros:**
- Customer receives payments directly
- Simpler tax situation
- Customer has full control

**Cons:**
- More complex setup
- Need webhook access
- Customer must configure Stripe

**Setup:**
```bash
# Each customer uses their Stripe account
STRIPE_SECRET_KEY=sk_live_customer_account
STRIPE_PRICE_HOBBY=price_customer_hobby
STRIPE_PRICE_PRO=price_customer_pro
```

### Option 3: Stripe Connect (Advanced)

**Pros:**
- Platform fees built-in
- Automatic revenue split
- Customer controls their money

**Cons:**
- More complex integration
- Requires Stripe Connect setup

**Implementation:** (Future feature)
```typescript
// Create connected account for customer
const account = await stripe.accounts.create({
  type: 'standard',
  country: 'US',
  email: 'customer@example.com',
});
```

## Branding Customization

### Color Schemes

The framework uses CSS variables for theming. Update colors in the config and they'll automatically apply:

```json
{
  "branding": {
    "primaryColor": "#2563EB",    // Main brand color
    "accentColor": "#F59E0B"      // Secondary/accent color
  }
}
```

These colors are automatically applied to:
- Buttons and CTAs
- Links and interactive elements
- Headers and navigation
- Progress indicators
- Pricing cards

### Logo and Assets

1. **Add customer logos:**
   ```bash
   mkdir -p client/public/assets/customers/customer-name
   # Add: logo.svg, favicon.ico, og-image.png
   ```

2. **Update config:**
   ```json
   {
     "branding": {
       "logo": "/assets/customers/customer-name/logo.svg",
       "favicon": "/assets/customers/customer-name/favicon.ico"
     }
   }
   ```

### Custom CSS (Advanced)

For more advanced customization:

1. Create `domains/customer-name/custom.css`
2. Add custom styles (overrides)
3. Import in the build process

## Database Strategies

### Shared Database (Recommended)

All white-label instances share one database:

**Pros:**
- Easier management
- Shared infrastructure
- Lower costs
- Cross-customer analytics

**Implementation:**
- Add `domain_id` column to all tables
- Filter all queries by domain
- Automatic data isolation

```sql
-- All tables include domain_id
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  domain_id TEXT NOT NULL,
  email TEXT NOT NULL,
  ...
);

-- Queries automatically filter
SELECT * FROM users WHERE domain_id = 'customer-name';
```

### Separate Databases

Each white-label instance has its own database:

**Pros:**
- Complete data isolation
- Independent backups
- Customer-controlled

**Cons:**
- Higher operational complexity
- More expensive

**Implementation:**
```bash
# Each customer gets their own DATABASE_URL
DATABASE_URL=postgresql://customer1_db...
```

## User Management

### Separate User Bases (Default)

Each white-label instance has independent users:
- `user@example.com` on `quiltersai.com`
- `user@example.com` on `builderai.com`
- Different accounts, same email

### Shared SSO (Advanced)

Allow users to access multiple domains:
- Implement OAuth/SAML
- Shared user table
- Domain-specific permissions

## Deployment Checklist

Before launching a white-label instance:

- [ ] Customer configuration created
- [ ] Branding assets uploaded (logo, favicon)
- [ ] Colors customized in config.json
- [ ] Stripe products created
- [ ] Price IDs configured
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] SSL certificate active
- [ ] Test signup flow
- [ ] Test subscription flow
- [ ] Test generation with domain logic
- [ ] Verify branding displays correctly
- [ ] Verify pricing displays correctly
- [ ] Test PDF export (if enabled)
- [ ] Configure email notifications
- [ ] Set up monitoring/alerts

## Ongoing Management

### Updates and Maintenance

When you update the core framework:

1. Test in staging environment
2. Deploy to your main domains
3. Roll out to white-label instances
4. Monitor for issues

### Customer Support

**Your responsibilities:**
- Platform bugs and issues
- Feature updates
- Server uptime
- Security patches

**Customer responsibilities:**
- End-user support
- Content moderation
- Payment processing (if using their Stripe)
- Marketing and sales

### Monitoring

Monitor per-domain metrics:
- Active users
- Generation count
- Revenue
- Error rates
- Performance

```typescript
// Example monitoring query
SELECT 
  domain_id,
  COUNT(DISTINCT user_id) as active_users,
  SUM(generation_count) as total_generations,
  AVG(response_time) as avg_response_time
FROM analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY domain_id;
```

## Pricing Examples

### Small Business Package
**Setup:** $1,500 one-time
**Monthly:** $299/month
**Includes:**
- Custom domain
- Custom branding
- Up to 1,000 users
- Email support

### Enterprise Package
**Setup:** $5,000 one-time
**Monthly:** $999/month
**Includes:**
- Everything in Small Business
- Dedicated database
- Priority support
- Custom features
- SLA guarantee

### Agency/Reseller Package
**Setup:** $10,000 one-time
**Monthly:** $499/month per instance
**Includes:**
- Unlimited instances
- White-label license
- Reseller commission
- Technical training
- Sales materials

## Legal Considerations

1. **Licensing Agreement:**
   - Define usage rights
   - Set modification limits
   - Specify support terms

2. **Data Ownership:**
   - Customer owns their data
   - You own the platform
   - Clear data export rights

3. **Revenue Sharing:**
   - Document commission structure
   - Payment terms
   - Minimum commitments

4. **Liability:**
   - Platform uptime SLA
   - Data security responsibilities
   - Indemnification clauses

## Next Steps

1. ✅ Review this guide
2. Create your first white-label configuration
3. Test deployment with `DOMAIN_ID=customer-name`
4. Finalize pricing model
5. Create customer onboarding process
6. Launch! 🚀
