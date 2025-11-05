import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PromptForm } from "@/components/prompt-form";
import { DesignGrid } from "@/components/design-grid";
import { DesignDetail } from "@/components/design-detail";
import { AuthHeader } from "@/components/auth-header";
import { Button } from "@/components/ui/button";
import { Sparkles, Moon, Sun } from "lucide-react";
import type { DesignVariation, DesignWithDetails } from "@shared/schema";

export default function Home() {
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Initialize theme on load
  useState(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  });

  // Fetch all generated designs
  const { data: designs, isLoading } = useQuery<DesignVariation[]>({
    queryKey: ["/api/designs"],
  });

  // Fetch selected design details
  const { data: designDetails } = useQuery<DesignWithDetails>({
    queryKey: ["/api/designs", selectedDesign],
    queryFn: async () => {
      const response = await fetch(`/api/designs/${selectedDesign}`);
      if (!response.ok) throw new Error("Failed to fetch design");
      return response.json();
    },
    enabled: !!selectedDesign,
  });

  // Generate designs mutation
  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/generate", { prompt });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Quilter's AI</h1>
              <p className="text-xs text-muted-foreground">Design with intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AuthHeader />
            <Button
              data-testid="button-theme-toggle"
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className="hover-elevate active-elevate-2"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Left Panel - Prompt Form */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <PromptForm
              onGenerate={(prompt) => generateMutation.mutate(prompt)}
              isGenerating={generateMutation.isPending}
            />
          </aside>

          {/* Main Content - Design Grid */}
          <main>
            {isLoading ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading designs...</p>
                  </div>
                </div>
              </div>
            ) : generateMutation.isPending ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Generating designs...</p>
                    <p className="text-xs text-muted-foreground">This may take 10-20 seconds</p>
                  </div>
                </div>
              </div>
            ) : !designs || designs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Ready to create?</h2>
                    <p className="text-muted-foreground mx-auto">
                      Describe your dream quilt in the prompt box. Include size, colors, style,
                      and any preferences. Our AI will generate unique design variations for you.
                    </p>
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mx-auto">
                      <strong>Try:</strong> "Modern twin quilt, teal and charcoal, budget under $120,
                      prefer rectangles, no triangles, intermediate skill"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <DesignGrid
                designs={designs}
                onSelectDesign={setSelectedDesign}
              />
            )}
          </main>
        </div>
      </div>

      {/* Design Detail Modal */}
      {selectedDesign && designDetails && (
        <DesignDetail
          design={designDetails}
          onClose={() => setSelectedDesign(null)}
        />
      )}
    </div>
  );
}
