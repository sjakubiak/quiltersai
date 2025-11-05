import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthHeader() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => window.location.href = "/api/login"}
        data-testid="button-login"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Log In
      </Button>
    );
  }

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email?.[0]?.toUpperCase() || "U";

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email || "User";

  const tierColors: Record<string, string> = {
    FREE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    HOBBY: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    PRO: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  };
  
  const tier = user.subscriptionTier || "FREE";

  return (
    <div className="flex items-center gap-3">
      <Badge 
        variant="secondary" 
        className={tierColors[tier]}
        data-testid="badge-subscription-tier"
      >
        {tier}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 h-9 px-2"
            data-testid="button-user-menu"
          >
            <Avatar className="h-7 w-7">
              {user.profileImageUrl && (
                <AvatarImage 
                  src={user.profileImageUrl} 
                  alt={displayName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">
              {user.firstName || "Account"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
