import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Activity, Users, TrendingUp, Lock, CreditCard, MousePointer, CheckCircle, Shield, Unlock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SubscriptionEvent, BlockedIp } from "@shared/schema";

interface AnalyticsSummary {
  totalRequests: number;
  uniqueIps: number;
  avgBotScore: number;
  topBotIps: Array<{
    ipAddress: string;
    requestCount: number;
    avgBotScore: number;
  }>;
}

interface SubscriptionSummary {
  totalClicks: number;
  hobbyClicks: number;
  proClicks: number;
  completions: number;
  conversionRate: number;
  recentEvents: SubscriptionEvent[];
}

interface BlockedIpsResponse {
  blockedIps: BlockedIp[];
}

function getBotScoreSeverity(score: number): { variant: "default" | "secondary" | "destructive" | "outline"; label: string } {
  if (score >= 70) return { variant: "destructive", label: "High Risk" };
  if (score >= 40) return { variant: "secondary", label: "Suspicious" };
  return { variant: "outline", label: "Normal" };
}

export default function Analytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: summary, isLoading, error } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
    enabled: !!user,
  });

  const { data: subscriptionSummary } = useQuery<SubscriptionSummary>({
    queryKey: ["/api/analytics/subscriptions"],
    enabled: !!user,
  });

  const { data: blockedIpsData } = useQuery<BlockedIpsResponse>({
    queryKey: ["/api/analytics/blocked-ips"],
    enabled: !!user,
  });

  const unblockMutation = useMutation({
    mutationFn: async (ip: string) => {
      return await apiRequest("DELETE", `/api/analytics/blocked-ips/${encodeURIComponent(ip)}`);
    },
    onSuccess: () => {
      toast({ title: "IP Unblocked", description: "The IP address has been removed from the block list" });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/blocked-ips"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unblock IP", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access the analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home & Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Error Loading Analytics</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Failed to load analytics data"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary || summary.totalRequests === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bot Detection Analytics</h1>
          <p className="text-muted-foreground">
            Monitor traffic patterns and identify potential bot activity
          </p>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No Data Yet</CardTitle>
            <CardDescription>
              The bot detection system is running, but no requests have been tracked yet. 
              Navigate around the app to generate some traffic data.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bot Detection Analytics</h1>
        <p className="text-muted-foreground">
          Monitor traffic patterns and identify potential bot activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-requests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRequests.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">API requests tracked</p>
          </CardContent>
        </Card>

        <Card data-testid="card-unique-ips">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.uniqueIps.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Different IP addresses</p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-bot-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Bot Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.avgBotScore || 0}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card data-testid="card-high-risk">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk IPs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.topBotIps.filter((ip) => ip.avgBotScore >= 70).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Bot score ≥ 70</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Suspicious IPs Table */}
      <Card data-testid="card-suspicious-ips">
        <CardHeader>
          <CardTitle>Top Suspicious IP Addresses</CardTitle>
          <CardDescription>
            IPs ranked by average bot score (higher = more likely to be a bot)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg Bot Score</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary?.topBotIps.slice(0, 20).map((ip, index) => {
                const severity = getBotScoreSeverity(ip.avgBotScore);
                return (
                  <TableRow key={index} data-testid={`row-ip-${index}`}>
                    <TableCell className="font-mono text-sm">{ip.ipAddress}</TableCell>
                    <TableCell className="text-right font-mono">{ip.requestCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{ip.avgBotScore}</TableCell>
                    <TableCell>
                      <Badge variant={severity.variant}>{severity.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {(!summary?.topBotIps || summary.topBotIps.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No data available yet. Analytics will appear after some traffic.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot Detection Criteria */}
      <Card data-testid="card-detection-criteria">
        <CardHeader>
          <CardTitle>Detection Criteria</CardTitle>
          <CardDescription>How bot scores are calculated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">High Risk Signals</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Missing User-Agent (+50 points)</li>
                <li>• Suspicious paths like /wp-admin (+50 points)</li>
                <li>• Known bot User-Agent patterns (+40 points)</li>
                <li>• Platform mismatches (+30 points)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Medium Risk Signals</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Missing Accept-Language header (+20 points)</li>
                <li>• Missing Accept-Encoding header (+20 points)</li>
                <li>• Alphabetically ordered headers (+15 points)</li>
                <li>• Outdated browser version (+15 points)</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm">
              <strong>Rate Limiting:</strong> IPs making &gt;100 requests/minute receive additional bot score penalties based on traffic volume.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Analytics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Subscription Analytics</h2>
        
        {/* Subscription Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card data-testid="card-total-clicks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptionSummary?.totalClicks || 0}</div>
              <p className="text-xs text-muted-foreground">Subscription button clicks</p>
            </CardContent>
          </Card>

          <Card data-testid="card-hobby-clicks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hobby Clicks</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptionSummary?.hobbyClicks || 0}</div>
              <p className="text-xs text-muted-foreground">$8/month plan</p>
            </CardContent>
          </Card>

          <Card data-testid="card-pro-clicks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro Clicks</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptionSummary?.proClicks || 0}</div>
              <p className="text-xs text-muted-foreground">$18/month plan</p>
            </CardContent>
          </Card>

          <Card data-testid="card-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptionSummary?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {subscriptionSummary?.completions || 0} completions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Subscription Events */}
        <Card data-testid="card-recent-events">
          <CardHeader>
            <CardTitle>Recent Subscription Events</CardTitle>
            <CardDescription>
              Track user interest in subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionSummary?.recentEvents.map((event, index) => (
                  <TableRow key={event.id} data-testid={`row-event-${index}`}>
                    <TableCell>
                      <Badge variant={event.eventType === "complete" ? "default" : "secondary"}>
                        {event.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{event.tier}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.source || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {event.userId ? event.userId.slice(0, 8) + "..." : "Anonymous"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {event.createdAt ? new Date(event.createdAt).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!subscriptionSummary?.recentEvents || subscriptionSummary.recentEvents.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No subscription events yet. Events will appear when users click subscription buttons.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blocked IPs Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">IP Blocking</h2>
        
        <Card data-testid="card-blocked-ips">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              <CardTitle>Currently Blocked IPs</CardTitle>
            </div>
            <CardDescription>
              IPs automatically blocked for scoring 80+ (high risk). Blocks escalate with repeat offenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Bot Score</TableHead>
                  <TableHead className="text-right">Offenses</TableHead>
                  <TableHead>Blocked Until</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedIpsData?.blockedIps.map((blocked, index) => (
                  <TableRow key={blocked.id} data-testid={`row-blocked-${index}`}>
                    <TableCell className="font-mono text-sm">{blocked.ipAddress}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {blocked.reason}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {blocked.botScore || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={blocked.blockCount > 2 ? "destructive" : "secondary"}>
                        {blocked.blockCount}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {blocked.blockedUntil ? new Date(blocked.blockedUntil).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unblockMutation.mutate(blocked.ipAddress)}
                        disabled={unblockMutation.isPending}
                        data-testid={`button-unblock-${index}`}
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        Unblock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!blockedIpsData?.blockedIps || blockedIpsData.blockedIps.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No IPs are currently blocked. High-risk IPs (score 80+) will be automatically blocked.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-blocking Info */}
        <Card className="mt-4" data-testid="card-blocking-info">
          <CardHeader>
            <CardTitle className="text-lg">How Auto-Blocking Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Trigger</h4>
                <p className="text-sm text-muted-foreground">
                  IPs scoring 80+ are automatically blocked
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">First Offense</h4>
                <p className="text-sm text-muted-foreground">
                  24 hour block
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Escalation</h4>
                <p className="text-sm text-muted-foreground">
                  Each repeat doubles duration (max 32 days)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
