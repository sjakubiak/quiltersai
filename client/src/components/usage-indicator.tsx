import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { Link } from "wouter";

interface UsageData {
  tier: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  periodType: string;
  period: string;
}

export function UsageIndicator() {
  const { data: usage, isLoading } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
    refetchOnWindowFocus: true,
  });

  if (isLoading || !usage) {
    return null;
  }

  if (usage.limit === null) {
    return null; // No limit for this tier
  }

  const percentage = (usage.used / usage.limit) * 100;
  const isNearLimit = usage.remaining !== null && usage.remaining <= 1;
  const isAtLimit = usage.remaining === 0;

  return (
    <div data-testid="usage-indicator" className="space-y-2 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {usage.used} of {usage.limit} designs used
          </span>
        </div>
        {usage.tier === "FREE" && (
          <Badge variant="secondary" className="text-xs" data-testid="badge-tier">
            Free
          </Badge>
        )}
        {usage.tier === "HOBBY" && (
          <Badge variant="default" className="text-xs" data-testid="badge-tier">
            Hobby
          </Badge>
        )}
        {usage.tier === "PRO" && (
          <Badge variant="default" className="text-xs" data-testid="badge-tier">
            Pro
          </Badge>
        )}
      </div>

      <Progress 
        value={percentage} 
        className="h-2"
        data-testid="progress-usage"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-period">
          {usage.periodType === "daily" ? "Today" : "This month"}
        </span>
        {usage.remaining !== null && (
          <span data-testid="text-remaining">
            {usage.remaining} remaining
          </span>
        )}
      </div>

      {isAtLimit && (
        <div className="pt-2 mt-2 border-t space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium" data-testid="text-limit-reached">
                Daily limit reached!
              </p>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              You're on fire! Upgrade to keep designing without limits.
            </p>
          </div>
          {usage.tier === "FREE" && (
            <Link href="/pricing">
              <button
                data-testid="button-upgrade"
                className="w-full text-xs px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2 flex items-center justify-center gap-2 font-medium"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Unlock 50 Designs/Month - $8
              </button>
            </Link>
          )}
          {usage.tier !== "FREE" && (
            <div className="text-xs p-2 rounded bg-muted/50 flex items-center gap-2" data-testid="text-reset-info">
              <Sparkles className="h-3 w-3 text-primary" />
              Resets {usage.periodType === "daily" ? "tomorrow" : "next month"}
            </div>
          )}
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="pt-2 mt-2 border-t space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-500 flex-1" data-testid="text-near-limit">
              Almost out! Only {usage.remaining} design{usage.remaining !== 1 ? "s" : ""} left today.
            </p>
          </div>
          {usage.tier === "FREE" && usage.limit === 3 && (
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                Create a free account → Get 5 designs/day!
              </p>
              <button
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-signup-more-designs"
                className="mt-1 w-full text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover-elevate active-elevate-2 font-medium"
              >
                Sign Up Free
              </button>
            </div>
          )}
          {usage.tier === "FREE" && usage.limit === 5 && (
            <Link href="/pricing">
              <button
                data-testid="button-upgrade-soon"
                className="mt-1 w-full text-xs px-3 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 text-primary rounded-md hover-elevate active-elevate-2 font-medium flex items-center justify-center gap-2"
              >
                <Zap className="h-3.5 w-3.5" />
                Get 50/month for less than 2 yards of fabric!
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
