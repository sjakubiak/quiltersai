import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Bookmark, X, Check, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { apiRequest } from "@/lib/queryClient";
import { CutListTable } from "@/components/cut-list-table";
import { PiecingSteps } from "@/components/piecing-steps";
import { QuiltOverview } from "@/components/quilt-overview";
import { SocialShare } from "@/components/social-share";
import { BuySupplies } from "@/components/buy-supplies";
import type { DesignWithDetails } from "@shared/schema";

interface DesignDetailProps {
  design: DesignWithDetails;
  onClose: () => void;
}

export function DesignDetail({ design, onClose }: DesignDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const { isFavorited, toggleFavorite } = useFavorites();

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/save", { designId: design.design.id });
    },
    onSuccess: () => {
      setIsSaved(true);
      toast({
        title: "Design saved!",
        description: "This design has been added to your collection.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save design. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: design.design.id }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }
      
      // Get the filename from Content-Disposition header or use default
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${design.design.name}_pattern.pdf`;
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "PDF Downloaded!",
        description: "Your quilt pattern has been downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportPDF = () => {
    exportMutation.mutate();
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-[100vh] md:max-w-6xl md:max-h-[90vh] md:rounded-lg overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <DialogTitle className="text-lg sm:text-2xl truncate" data-testid="text-design-detail-title">
                {design.design.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge variant="secondary" className="text-xs">{design.design.blockPattern}</Badge>
                <Badge variant="outline" className="text-xs">{design.design.layoutStrategy}</Badge>
                {design.design.scrapFriendly === 1 && (
                  <Badge variant="outline" className="border-primary text-primary text-xs">
                    Scrap Friendly
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <Button
                data-testid="button-favorite-design"
                size="icon"
                variant="ghost"
                onClick={() => toggleFavorite(design.design.id)}
                className="hover-elevate active-elevate-2 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorited(design.design.id) ? 'fill-primary text-primary' : ''}`}
                />
              </Button>
              <Button
                data-testid="button-save-design"
                size="icon"
                variant="ghost"
                onClick={handleSave}
                disabled={saveMutation.isPending || isSaved}
                className="hover-elevate active-elevate-2 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9"
              >
                {isSaved ? <Check className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
              </Button>
              <SocialShare
                designName={design.design.name}
                blockPattern={design.design.blockPattern || ""}
                sizeCategory={(design.design.metadata as any)?.sizeCategory || "custom"}
                designId={design.design.id}
              />
              <Button
                data-testid="button-export-pdf"
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exportMutation.isPending}
                className="hover-elevate active-elevate-2 min-h-[44px]"
              >
                {exportMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    <span className="hidden sm:inline">Exporting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Download className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </>
                )}
              </Button>
              <Button
                data-testid="button-close-detail"
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="hover-elevate active-elevate-2 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <div className="sticky top-0 bg-background z-10 py-3 sm:py-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
              <TabsList className="w-full justify-start bg-muted p-1 overflow-x-auto flex-nowrap">
                <TabsTrigger value="overview" data-testid="tab-overview" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="cutlist" data-testid="tab-cutlist" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4">
                  Cut List
                </TabsTrigger>
                <TabsTrigger value="steps" data-testid="tab-steps" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4">
                  Steps
                </TabsTrigger>
                <TabsTrigger value="layout" data-testid="tab-layout" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4">
                  Layout
                </TabsTrigger>
                <TabsTrigger value="supplies" data-testid="tab-supplies" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4">
                  Buy Supplies
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <QuiltOverview design={design} />
            </TabsContent>

            <TabsContent value="cutlist" className="space-y-6">
              <CutListTable cutList={design.cutList} />
            </TabsContent>

            <TabsContent value="steps" className="space-y-6">
              <PiecingSteps steps={design.steps} />
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Assembly Layout</h3>
                <div className="bg-muted rounded-md p-8 flex items-center justify-center min-h-[400px]">
                  <div
                    className="w-full max-w-2xl"
                    dangerouslySetInnerHTML={{ __html: design.design.svgMockup }}
                  />
                </div>
                
                {design.design.quiltingMotifs && design.design.quiltingMotifs.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">Suggested Quilting Motifs</h4>
                    <div className="flex flex-wrap gap-2">
                      {design.design.quiltingMotifs.map((motif, idx) => (
                        <Badge key={idx} variant="outline">
                          {motif}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="supplies" className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <BuySupplies
                  totalYardage={design.design.totalYardage || undefined}
                  fabricColors={design.cutList.map(item => item.fabricColor).filter((v, i, a) => a.indexOf(v) === i)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
