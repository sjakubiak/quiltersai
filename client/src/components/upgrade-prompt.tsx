import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, X, TrendingUp, AlertCircle, Flame } from "lucide-react";
import { Link } from "wouter";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  remainingDesigns: number;
  tier: string;
}

export function UpgradePrompt({ isOpen, onClose, remainingDesigns, tier }: UpgradePromptProps) {
  // Only show to FREE tier users
  if (tier !== "FREE") return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-upgrade-prompt">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover-elevate"
          data-testid="button-close-upgrade-prompt"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Love Your Design?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Remaining Designs Alert */}
          {remainingDesigns <= 1 ? (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Only {remainingDesigns} design{remainingDesigns !== 1 ? "s" : ""} left today!
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Upgrade now to keep designing without interruption
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              You have {remainingDesigns} design{remainingDesigns !== 1 ? "s" : ""} left today. Upgrade to design without limits!
            </p>
          )}

          {/* Value Proposition */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">50 Designs Per Month</p>
                <p className="text-xs text-muted-foreground">Never hit your daily limit again</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Professional PDF Exports</p>
                <p className="text-xs text-muted-foreground">Print-ready patterns with cut lists</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Save Unlimited Designs</p>
                <p className="text-xs text-muted-foreground">Build your personal library</p>
              </div>
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-3xl font-bold">$8</span>
              <span className="text-muted-foreground">/month CAD</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Less than the cost of 2 yards of fabric
            </p>
            <Badge variant="secondary" className="mt-2 flex items-center gap-1 w-fit mx-auto">
              <Flame className="h-3 w-3" />
              Most Popular Plan
            </Badge>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <Link href="/pricing">
              <Button
                className="w-full"
                size="lg"
                data-testid="button-upgrade-now"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade to Hobby Plan
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
              data-testid="button-maybe-later"
            >
              Maybe Later
            </Button>
          </div>

          {/* Trust Signal */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              <span>30-day money-back</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
