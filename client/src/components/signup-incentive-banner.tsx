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
    <Card className="relative p-4 sm:p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-sm opacity-70 hover-elevate z-10 min-h-[44px] min-w-[44px] sm:h-auto sm:w-auto flex items-center justify-center"
        data-testid="button-dismiss-signup-banner"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 sm:gap-4 pr-8">
        <div className="hidden sm:inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
          <Gift className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-semibold">Create a Free Account</h3>
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <Sparkles className="h-3 w-3" />
                Get More Free
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sign up with your Replit account and unlock exclusive benefits at no cost!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-signup-banner"
              className="gap-2 w-full sm:w-auto"
            >
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Up Free - Get 5/Day</span>
              <span className="sm:hidden">Sign Up Free</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              data-testid="button-continue-guest"
              className="w-full sm:w-auto"
            >
              Continue as Guest
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Free forever • No credit card required
          </p>
        </div>
      </div>
    </Card>
  );
}
