import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Gift, Save, TrendingUp, X } from "lucide-react";
import { useState } from "react";

export function SignupIncentiveBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('signup-banner-dismissed') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('signup-banner-dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <Card className="relative p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-sm opacity-70 hover-elevate"
        data-testid="button-dismiss-signup-banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
          <Gift className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">Create a Free Account</h3>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Get More Free
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Sign up with your Replit account and unlock exclusive benefits at no cost!
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">5 Designs Daily</p>
                <p className="text-xs text-muted-foreground">vs. 3 for guests</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Save className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Save Forever</p>
                <p className="text-xs text-muted-foreground">Build your library</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Design History</p>
                <p className="text-xs text-muted-foreground">Access anytime</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-signup-banner"
              className="gap-2"
            >
              <Gift className="h-4 w-4" />
              Sign Up Free - Get 5/Day
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              data-testid="button-continue-guest"
            >
              Continue as Guest
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Free forever • No credit card required • Sign up with Google, GitHub, or email
          </p>
        </div>
      </div>
    </Card>
  );
}
