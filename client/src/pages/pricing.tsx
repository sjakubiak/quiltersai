import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_FEATURES, type SubscriptionTier } from "@shared/pricing";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Pricing() {
  const { user } = useAuth();

  const tiers: Array<{
    id: SubscriptionTier;
    popular?: boolean;
  }> = [
    { id: "FREE" },
    { id: "HOBBY", popular: true },
    { id: "PRO" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Start free and upgrade as you create more beautiful quilts
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-3">
          {tiers.map(({ id, popular }) => {
            const features = TIER_FEATURES[id];
            const isCurrentTier = user?.subscriptionTier === id;

            return (
              <Card
                key={id}
                className={`relative flex flex-col p-8 ${
                  popular ? "border-primary shadow-lg" : ""
                }`}
                data-testid={`card-tier-${id.toLowerCase()}`}
              >
                {popular && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    data-testid="badge-popular"
                  >
                    Most Popular
                  </Badge>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2" data-testid={`text-tier-name-${id.toLowerCase()}`}>
                    {features.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold" data-testid={`text-price-${id.toLowerCase()}`}>
                      ${features.priceMonthly}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {isCurrentTier && (
                    <Badge variant="secondary" data-testid="badge-current-plan">
                      Current Plan
                    </Badge>
                  )}
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {/* Generation Limits */}
                  {features.generationsPerDay && (
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {features.generationsPerDay} designs per day
                      </span>
                    </div>
                  )}
                  {features.generationsPerMonth && (
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {features.generationsPerMonth} designs per month
                      </span>
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {features.saveDesigns ? "Save unlimited designs" : "No saved designs"}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        features.pdfExport ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                    <span className={`text-sm ${!features.pdfExport ? "text-muted-foreground" : ""}`}>
                      PDF pattern export
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        features.zipExport ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                    <span className={`text-sm ${!features.zipExport ? "text-muted-foreground" : ""}`}>
                      Batch ZIP export
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        features.commercialLicense ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                    <span className={`text-sm ${!features.commercialLicense ? "text-muted-foreground" : ""}`}>
                      Commercial license
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        features.priorityQueue ? "text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                    <span className={`text-sm ${!features.priorityQueue ? "text-muted-foreground" : ""}`}>
                      Priority queue
                    </span>
                  </div>
                </div>

                {id === "FREE" ? (
                  <Link href="/">
                    <Button
                      className="w-full"
                      variant={isCurrentTier ? "secondary" : "outline"}
                      data-testid="button-get-started-free"
                    >
                      {isCurrentTier ? "Current Plan" : "Get Started"}
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link href="/">
                    <Button
                      className="w-full"
                      variant={popular ? "default" : "outline"}
                      data-testid={`button-login-${id.toLowerCase()}`}
                    >
                      Login to Subscribe
                    </Button>
                  </Link>
                ) : isCurrentTier ? (
                  <Link href="/account">
                    <Button
                      className="w-full"
                      variant="secondary"
                      data-testid="button-manage-plan"
                    >
                      Manage Plan
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/subscribe?tier=${id}`}>
                    <Button
                      className="w-full"
                      variant={popular ? "default" : "outline"}
                      data-testid={`button-subscribe-${id.toLowerCase()}`}
                    >
                      Subscribe Now
                    </Button>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mx-auto max-w-3xl mt-16 text-center text-sm text-muted-foreground">
          <p>All plans include AI-powered design generation and SVG mockups.</p>
          <p className="mt-2">Cancel anytime. No long-term commitments.</p>
        </div>
      </div>
    </div>
  );
}
