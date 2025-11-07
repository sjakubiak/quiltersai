import { Check, Sparkles, Zap, Shield, TrendingUp, Users, Clock } from "lucide-react";
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
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-12">
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium">Over 5,000 quilters trust Quilter's AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            Design More Quilts,<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Spend Less Time Planning
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 px-4">
            From idea to complete pattern in seconds. Join thousands of quilters creating beautiful designs with AI.
          </p>
          
          {/* Free Account Benefits Callout */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-1 sm:mb-2">
              <Check className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Create a free account and get <strong>3 designs daily</strong> (vs. 1 for guests) — no credit card required!
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Sign up with Google, GitHub, or email • Takes 30 seconds • Free forever
            </p>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>30-day money back</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>5,000+ quilters</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-6xl grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-3">
          {tiers.map(({ id, popular }) => {
            const features = TIER_FEATURES[id];
            const isCurrentTier = user?.subscriptionTier === id;

            return (
              <Card
                key={id}
                className={`relative flex flex-col p-4 sm:p-6 lg:p-8 ${
                  popular ? "border-primary shadow-lg" : ""
                }`}
                data-testid={`card-tier-${id.toLowerCase()}`}
              >
                {popular && (
                  <Badge
                    className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 text-xs"
                    data-testid="badge-popular"
                  >
                    Most Popular
                  </Badge>
                )}

                <div className="mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2" data-testid={`text-tier-name-${id.toLowerCase()}`}>
                    {features.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2">
                    <span className="text-3xl sm:text-4xl font-bold" data-testid={`text-price-${id.toLowerCase()}`}>
                      ${features.priceMonthly}
                    </span>
                    <span className="text-sm sm:text-base text-muted-foreground">/month CAD</span>
                  </div>
                  {id === "HOBBY" && (
                    <p className="text-xs text-muted-foreground mb-3">Less than the cost of 2 yards of fabric!</p>
                  )}
                  {id === "PRO" && (
                    <p className="text-xs text-muted-foreground mb-3">Save $40/month vs. design software</p>
                  )}
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
                      {isCurrentTier ? "Current Plan" : "Start Creating Free →"}
                    </Button>
                  </Link>
                ) : !user ? (
                  <Link href="/">
                    <Button
                      className="w-full"
                      variant={popular ? "default" : "outline"}
                      data-testid={`button-login-${id.toLowerCase()}`}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {popular ? "Start 30-Day Trial" : "Get Started"}
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
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {popular ? "Upgrade to Hobby →" : "Upgrade to Pro →"}
                    </Button>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>

        {/* Social Proof & Testimonials */}
        <div className="mx-auto max-w-4xl mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            Loved by Quilters Worldwide
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Sparkles key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "I've designed 12 quilts in the past month! This tool saves me hours of planning and math calculations."
              </p>
              <p className="text-xs font-medium">Sarah M., Ontario</p>
              <Badge variant="secondary" className="mt-2 text-xs">Hobby Plan</Badge>
            </Card>
            
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Sparkles key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "The PDF exports are perfect for my quilting business. I can send professional patterns to customers instantly."
              </p>
              <p className="text-xs font-medium">Jennifer L., British Columbia</p>
              <Badge variant="secondary" className="mt-2 text-xs">Pro Plan</Badge>
            </Card>
            
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Sparkles key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "As a beginner quilter, this makes designing so much less intimidating. The cut lists are a lifesaver!"
              </p>
              <p className="text-xs font-medium">Maria R., Quebec</p>
              <Badge variant="secondary" className="mt-2 text-xs">Hobby Plan</Badge>
            </Card>
          </div>
        </div>

        {/* Money-Back Guarantee */}
        <div className="mx-auto max-w-2xl mt-16 text-center">
          <div className="inline-flex items-center justify-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">30-Day Money-Back Guarantee</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Not happy? Get a full refund within 30 days, no questions asked. We're confident you'll love Quilter's AI.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mx-auto max-w-3xl mt-16 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-3">All plans include:</p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>AI-powered design generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Professional SVG mockups</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Accurate yardage calculations</span>
            </div>
          </div>
          <p>Questions? Contact us at support@quiltersai.com</p>
        </div>
      </div>
    </div>
  );
}
