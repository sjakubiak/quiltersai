import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp } from "lucide-react";
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
        <div className="pt-2 mt-2 border-t space-y-2">
          <p className="text-xs text-destructive font-medium" data-testid="text-limit-reached">
            You've reached your {usage.periodType} limit
          </p>
          {usage.tier === "FREE" && (
            <Link href="/pricing">
              <button
                data-testid="button-upgrade"
                className="w-full text-xs px-3 py-2 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2 flex items-center justify-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Upgrade for more designs
              </button>
            </Link>
          )}
          {usage.tier !== "FREE" && (
            <p className="text-xs" data-testid="text-reset-info">
              Your limit will reset next {usage.periodType === "daily" ? "day" : "month"}
            </p>
          )}
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="pt-2 mt-2 border-t">
          <p className="text-xs text-amber-600 dark:text-amber-500" data-testid="text-near-limit">
            Almost at your limit! {usage.remaining} design{usage.remaining !== 1 ? "s" : ""} left.
          </p>
          {usage.tier === "FREE" && (
            <Link href="/pricing">
              <button
                data-testid="button-upgrade-soon"
                className="mt-2 w-full text-xs px-3 py-1.5 border border-primary text-primary rounded-md hover-elevate active-elevate-2"
              >
                Upgrade for unlimited
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
