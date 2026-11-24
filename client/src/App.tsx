import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteFooter } from "@/components/site-footer";
import Home from "@/pages/home";
import Pricing from "@/pages/pricing";
import Subscribe from "@/pages/subscribe";
import Account from "@/pages/account";
import Favorites from "@/pages/favorites";
import Analytics from "@/pages/analytics";
import AuthDebug from "@/pages/auth-debug";
import StripeDiagnostic from "@/pages/stripe-diagnostic";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/account" component={Account} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/auth-debug" component={AuthDebug} />
      <Route path="/stripe-diagnostic" component={StripeDiagnostic} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="flex min-h-dvh flex-col">
          <div className="flex-1">
            <Router />
          </div>
          <SiteFooter />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
