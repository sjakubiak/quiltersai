import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TIER_FEATURES } from "@shared/pricing";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Use production keys in production, testing keys in development
const getStripePublicKey = () => {
  // In production mode, use production key
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  }
  // In development, prefer testing key but fallback to production key
  return import.meta.env.VITE_TESTING_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;
};

const stripePromise = loadStripe(getStripePublicKey());

function SubscribeForm({ tier, intentType }: { tier: string; intentType: 'payment' | 'setup' }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.log("Stripe or elements not ready");
      return;
    }

    setIsProcessing(true);
    console.log(`Starting ${intentType} confirmation...`);

    try {
      // Use confirmPayment for payment intents, confirmSetup for setup intents
      const confirmMethod = intentType === 'setup' ? stripe.confirmSetup : stripe.confirmPayment;
      
      const result = await confirmMethod({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account`,
        },
      });

      console.log("Stripe confirmation result:", result);

      if (result.error) {
        console.error("Stripe confirmation error:", result.error);
        setIsProcessing(false);
        toast({
          title: intentType === 'setup' ? "Setup Failed" : "Payment Failed",
          description: result.error.message || "An error occurred during payment processing",
          variant: "destructive",
        });
      } else {
        // Success! For test cards, Stripe may not redirect automatically
        // Navigate to account page manually with the intent ID
        const intent: any = 'setupIntent' in result ? result.setupIntent : 'paymentIntent' in result ? result.paymentIntent : null;
        if (intent?.id) {
          console.log("Stripe confirmation succeeded, redirecting to /account with intent:", intent.id);
          setLocation(`/account?setup_intent=${intent.id}`);
        }
        // If no intent is returned, Stripe will redirect automatically via return_url
      }
    } catch (error: any) {
      console.error("Exception during confirmation:", error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-3">
        <Link href="/pricing" className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-subscribe"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Subscribe to ${TIER_FEATURES[tier as keyof typeof TIER_FEATURES]?.name || tier}`
          )}
        </Button>
      </div>
    </form>
  );
}

export default function Subscribe() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const tier = urlParams.get("tier") || "HOBBY";
  const [clientSecret, setClientSecret] = useState("");
  const [intentType, setIntentType] = useState<'payment' | 'setup'>('payment');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (tier !== "HOBBY" && tier !== "PRO") {
      toast({
        title: "Invalid Tier",
        description: "Please select a valid subscription tier",
        variant: "destructive",
      });
      setLocation("/pricing");
      return;
    }

    // Create subscription on mount
    apiRequest("POST", "/api/subscription/create", { tier })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret);
        setIntentType(data.intentType || 'payment');
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error creating subscription:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to initialize subscription",
          variant: "destructive",
        });
        setLocation("/pricing");
      });
  }, [tier]);

  const tierFeatures = TIER_FEATURES[tier as keyof typeof TIER_FEATURES];

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-subscribe-title">
              Subscribe to {tierFeatures?.name || tier}
            </h1>
            <p className="text-lg text-muted-foreground">
              Complete your payment to unlock premium features
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Payment Form */}
            <Card className="p-6">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                  },
                }}
              >
                <SubscribeForm tier={tier} intentType={intentType} />
              </Elements>
            </Card>

            {/* Order Summary */}
            <Card className="p-6 h-fit">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{tierFeatures?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing</span>
                  <span>Monthly</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span data-testid="text-total-price">${tierFeatures?.priceMonthly}/mo</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                <p>• Cancel anytime</p>
                <p>• Billed monthly</p>
                <p>• Instant access</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
