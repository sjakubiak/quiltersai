import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

export default function AuthDebug() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Auth Debug Page</h1>
          <p className="text-muted-foreground">
            Use this page to test and troubleshoot Replit Auth
          </p>
        </div>

        {/* Authentication Status */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Authentication Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm">Loading authentication state...</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Authenticated</span>
                  <Badge variant="default">Logged In</Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Not Authenticated</span>
                  <Badge variant="secondary">Logged Out</Badge>
                </>
              )}
            </div>

            {!isLoading && !isAuthenticated && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      You're not logged in
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Click the button below to test the login flow
                    </p>
                    <Button
                      size="sm"
                      onClick={() => window.location.href = "/api/login"}
                      data-testid="button-test-login"
                    >
                      Test Login Flow
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* User Data */}
        {isAuthenticated && user && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">User Data</h2>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium text-muted-foreground">User ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{user.id}</code>
                
                <span className="font-medium text-muted-foreground">Email:</span>
                <span>{user.email || "N/A"}</span>
                
                <span className="font-medium text-muted-foreground">First Name:</span>
                <span>{user.firstName || "N/A"}</span>
                
                <span className="font-medium text-muted-foreground">Last Name:</span>
                <span>{user.lastName || "N/A"}</span>
                
                <span className="font-medium text-muted-foreground">Subscription:</span>
                <Badge variant="secondary">{user.subscriptionTier || "FREE"}</Badge>
                
                <span className="font-medium text-muted-foreground">Status:</span>
                <Badge variant="outline">{user.subscriptionStatus || "N/A"}</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Full user object:</p>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        {/* Test Actions */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Test Actions</h2>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login-test"
            >
              Test Login
            </Button>
            
            {isAuthenticated && (
              <Button
                variant="outline"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout-test"
              >
                Test Logout
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              data-testid="button-refresh"
            >
              Refresh Page
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              data-testid="button-home"
            >
              Go to Home
            </Button>
          </div>
        </Card>

        {/* Troubleshooting Tips */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Troubleshooting Tips</h2>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>Make sure you're testing in the Replit Webview (not external browser)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>Clear cookies and try again if login seems stuck</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>Check browser console for any error messages</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>Verify REPL_ID and SESSION_SECRET environment variables exist</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
