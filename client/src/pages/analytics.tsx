import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Activity, Users, TrendingUp } from "lucide-react";

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

function getBotScoreSeverity(score: number): { variant: "default" | "secondary" | "destructive" | "outline"; label: string } {
  if (score >= 70) return { variant: "destructive", label: "High Risk" };
  if (score >= 40) return { variant: "secondary", label: "Suspicious" };
  return { variant: "outline", label: "Normal" };
}

export default function Analytics() {
  const { data: summary, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

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
    </div>
  );
}
