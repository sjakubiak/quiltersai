import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConfigCheckResponse {
  stripeMode: string;
  accountInfo: {
    id: string;
    email: string;
    country: string;
    type: string;
  } | { error: string };
  configured: {
    TESTING_STRIPE_SECRET_KEY: boolean;
    TESTING_STRIPE_PRICE_HOBBY: boolean;
    TESTING_STRIPE_PRICE_PRO: boolean;
    STRIPE_SECRET_KEY: boolean;
    STRIPE_PRICE_HOBBY: boolean;
    STRIPE_PRICE_PRO: boolean;
  };
  priceIds: {
    hobby: string;
    pro: string;
  };
  priceDetails: {
    hobby: { error?: string } | any;
    pro: { error?: string } | any;
  };
  diagnosis: string;
}

export default function StripeDiagnostic() {
  const { data, isLoading } = useQuery<ConfigCheckResponse>({
    queryKey: ['/api/stripe/config-check'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load diagnostic data</p>
      </div>
    );
  }

  const hasErrors = data.priceDetails.hobby.error || data.priceDetails.pro.error;
  const accountId = 'accountInfo' in data.accountInfo && 'id' in data.accountInfo 
    ? data.accountInfo.id 
    : null;

  // Extract account identifier from price ID (between first underscore and second character group)
  const extractAccountFromPrice = (priceId: string): string => {
    const match = priceId.match(/price_\d+([A-Za-z0-9]+)/);
    return match ? match[1] : 'unknown';
  };

  const priceAccountId = data.priceIds.hobby !== 'NOT_SET' 
    ? extractAccountFromPrice(data.priceIds.hobby)
    : 'unknown';

  const accountMatch = accountId?.includes(priceAccountId.slice(-10));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Stripe Configuration Diagnostic</h1>
          <p className="text-muted-foreground">
            Checking your Stripe setup to identify any configuration issues
          </p>
        </div>

        {hasErrors && (
          <Alert variant="destructive" data-testid="alert-stripe-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error Detected</AlertTitle>
            <AlertDescription>{data.diagnosis}</AlertDescription>
          </Alert>
        )}

        {!hasErrors && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950" data-testid="alert-stripe-success">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">All Systems Operational</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              {data.diagnosis}
            </AlertDescription>
          </Alert>
        )}

        <Card data-testid="card-stripe-mode">
          <CardHeader>
            <CardTitle>Stripe Mode</CardTitle>
            <CardDescription>Current Stripe environment</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={data.stripeMode === 'TEST' ? 'secondary' : 'destructive'} data-testid="badge-stripe-mode">
              {data.stripeMode} MODE
            </Badge>
          </CardContent>
        </Card>

        <Card data-testid="card-account-info">
          <CardHeader>
            <CardTitle>Connected Stripe Account</CardTitle>
            <CardDescription>The Stripe account your secret key connects to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {'error' in data.accountInfo ? (
              <p className="text-destructive" data-testid="text-account-error">{data.accountInfo.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Account ID:</span>
                  <code className="text-sm font-mono" data-testid="text-account-id">{data.accountInfo.id}</code>
                  
                  <span className="text-muted-foreground">Email:</span>
                  <span data-testid="text-account-email">{data.accountInfo.email}</span>
                  
                  <span className="text-muted-foreground">Country:</span>
                  <span data-testid="text-account-country">{data.accountInfo.country}</span>
                  
                  <span className="text-muted-foreground">Type:</span>
                  <span data-testid="text-account-type">{data.accountInfo.type}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-price-config">
          <CardHeader>
            <CardTitle>Price Configuration</CardTitle>
            <CardDescription>Configured price IDs and their status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {data.priceDetails.hobby.error ? (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" data-testid="icon-hobby-error" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" data-testid="icon-hobby-success" />
                )}
                <div className="flex-1">
                  <div className="font-medium">Hobby Tier</div>
                  <code className="text-sm font-mono text-muted-foreground" data-testid="text-hobby-price-id">
                    {data.priceIds.hobby}
                  </code>
                  {data.priceDetails.hobby.error && (
                    <p className="text-sm text-destructive mt-1" data-testid="text-hobby-error">
                      {data.priceDetails.hobby.error}
                    </p>
                  )}
                  {!data.priceDetails.hobby.error && (
                    <p className="text-sm text-green-600 mt-1" data-testid="text-hobby-success">
                      ${(data.priceDetails.hobby.unit_amount / 100).toFixed(2)}/{data.priceDetails.hobby.recurring?.interval}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                {data.priceDetails.pro.error ? (
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" data-testid="icon-pro-error" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" data-testid="icon-pro-success" />
                )}
                <div className="flex-1">
                  <div className="font-medium">Pro Tier</div>
                  <code className="text-sm font-mono text-muted-foreground" data-testid="text-pro-price-id">
                    {data.priceIds.pro}
                  </code>
                  {data.priceDetails.pro.error && (
                    <p className="text-sm text-destructive mt-1" data-testid="text-pro-error">
                      {data.priceDetails.pro.error}
                    </p>
                  )}
                  {!data.priceDetails.pro.error && (
                    <p className="text-sm text-green-600 mt-1" data-testid="text-pro-success">
                      ${(data.priceDetails.pro.unit_amount / 100).toFixed(2)}/{data.priceDetails.pro.recurring?.interval}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasErrors && (
          <Card className="border-orange-500" data-testid="card-fix-instructions">
            <CardHeader>
              <CardTitle>How to Fix</CardTitle>
              <CardDescription>Follow these steps to resolve the configuration issue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Log into the correct Stripe account</p>
                    <p className="text-sm text-muted-foreground">
                      Go to{' '}
                      <a 
                        href="https://dashboard.stripe.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        data-testid="link-stripe-dashboard"
                      >
                        dashboard.stripe.com
                      </a>
                      {accountId && (
                        <> and verify you're logged in as the account with ID <code className="text-xs">{accountId}</code></>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Toggle to Test Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use the toggle in the top right corner to switch to Test Mode (should be orange)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Create or find your products</p>
                    <p className="text-sm text-muted-foreground">
                      Go to <strong>Products</strong> → <strong>Product Catalog</strong>
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 ml-2">
                      <li>Create "Quilter's AI Hobby" - $8/month recurring</li>
                      <li>Create "Quilter's AI Pro" - $18/month recurring</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Copy the Price IDs</p>
                    <p className="text-sm text-muted-foreground">
                      Click on each product → Under <strong>Pricing</strong>, copy the <strong>Price ID</strong> (starts with <code className="text-xs">price_</code>)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Update Replit Secrets</p>
                    <p className="text-sm text-muted-foreground">
                      In your Replit project: <strong>Tools</strong> → <strong>Secrets</strong>
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-md font-mono text-xs">
                      <div>TESTING_STRIPE_PRICE_HOBBY=price_[your hobby price ID]</div>
                      <div>TESTING_STRIPE_PRICE_PRO=price_[your pro price ID]</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    6
                  </div>
                  <div>
                    <p className="font-medium">Restart and retest</p>
                    <p className="text-sm text-muted-foreground">
                      Refresh this page to verify the configuration is now working
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-env-vars">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Status of configured secrets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(data.configured).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {value ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <code className="text-xs font-mono">{key}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
