import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TIER_FEATURES } from "@shared/pricing";
import { Link, useLocation } from "wouter";
import { CreditCard, User, LogOut, Loader2, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Account() {
  const { user, isLoading, logout, refetch } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompletingSubscription, setIsCompletingSubscription] = useState(false);

  // Handle return from Stripe after SetupIntent confirmation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const setupIntentId = urlParams.get('setup_intent');
    const setupIntentClientSecret = urlParams.get('setup_intent_client_secret');
    
    if (setupIntentId && setupIntentClientSecret && !isCompletingSubscription) {
      setIsCompletingSubscription(true);
      
      // Complete the subscription payment
      apiRequest("POST", "/api/subscription/complete", { setupIntentId })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast({
              title: "Subscription Activated!",
              description: "Your subscription has been successfully activated.",
            });
            
            // Clean URL and refresh user data
            window.history.replaceState({}, '', '/account');
            refetch();
          } else {
            throw new Error(data.error || "Failed to activate subscription");
          }
        })
        .catch((error: any) => {
          console.error("Error completing subscription:", error);
          toast({
            title: "Subscription Activation Failed",
            description: error.message || "Please contact support if this issue persists.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCompletingSubscription(false);
        });
    }
  }, [location, isCompletingSubscription, toast, refetch]);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const handleManageBilling = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/subscription/portal");
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL received");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tierFeatures = TIER_FEATURES[user.subscriptionTier as keyof typeof TIER_FEATURES];
  const hasActiveSubscription = user.subscriptionTier !== "FREE";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-account-title">
                Account Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your profile and subscription
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="grid gap-6">
            {/* Profile Section */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold mb-1" data-testid="text-user-name">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </h2>
                    <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </Card>

            {/* Subscription Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Subscription</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" data-testid="text-current-tier">
                        {tierFeatures.name} Plan
                      </span>
                      <Badge
                        variant={hasActiveSubscription ? "default" : "secondary"}
                        data-testid="badge-tier"
                      >
                        {user.subscriptionTier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveSubscription
                        ? `$${tierFeatures.priceMonthly}/month`
                        : "Free forever"}
                    </p>
                  </div>
                  {!hasActiveSubscription && (
                    <Link href="/pricing">
                      <Button data-testid="button-upgrade">Upgrade Plan</Button>
                    </Link>
                  )}
                </div>

                <Separator />

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Your Plan Includes:</h4>
                  <div className="grid gap-2 text-sm">
                    {tierFeatures.generationsPerDay && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{tierFeatures.generationsPerDay} designs per day</span>
                      </div>
                    )}
                    {tierFeatures.generationsPerMonth && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{tierFeatures.generationsPerMonth} designs per month</span>
                      </div>
                    )}
                    {tierFeatures.pdfExport && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>PDF pattern export</span>
                      </div>
                    )}
                    {tierFeatures.zipExport && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Batch ZIP export</span>
                      </div>
                    )}
                    {tierFeatures.commercialLicense && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Commercial license</span>
                      </div>
                    )}
                    {tierFeatures.saveDesigns && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Unlimited saved designs</span>
                      </div>
                    )}
                  </div>
                </div>

                {hasActiveSubscription && (
                  <>
                    <Separator />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleManageBilling}
                        disabled={isProcessing}
                        data-testid="button-manage-billing"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Manage Billing"
                        )}
                      </Button>
                      <Link href="/pricing" className="flex-1">
                        <Button variant="outline" className="w-full" data-testid="button-change-plan">
                          Change Plan
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Quick Stats (Future enhancement) */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Designs Generated</p>
                  <p className="text-2xl font-bold" data-testid="text-designs-count">
                    Coming Soon
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saved Designs</p>
                  <p className="text-2xl font-bold" data-testid="text-saved-count">
                    Coming Soon
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
