import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Bookmark, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CutListTable } from "@/components/cut-list-table";
import { PiecingSteps } from "@/components/piecing-steps";
import { QuiltOverview } from "@/components/quilt-overview";
import type { DesignWithDetails } from "@shared/schema";

interface DesignDetailProps {
  design: DesignWithDetails;
  onClose: () => void;
}

export function DesignDetail({ design, onClose }: DesignDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-2xl" data-testid="text-design-detail-title">
                {design.design.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{design.design.blockPattern}</Badge>
                <Badge variant="outline">{design.design.layoutStrategy}</Badge>
                {design.design.scrapFriendly === 1 && (
                  <Badge variant="outline" className="border-primary text-primary">
                    Scrap Friendly
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                data-testid="button-save-design"
                size="icon"
                variant="ghost"
                onClick={handleSave}
                disabled={saveMutation.isPending || isSaved}
                className="hover-elevate active-elevate-2"
              >
                {isSaved ? <Check className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
              </Button>
              <Button
                data-testid="button-export-pdf"
                variant="outline"
                onClick={handleExportPDF}
                disabled={exportMutation.isPending}
                className="hover-elevate active-elevate-2"
              >
                {exportMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
              <Button
                data-testid="button-close-detail"
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="hover-elevate active-elevate-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start gap-2 bg-muted p-1">
              <TabsTrigger value="overview" data-testid="tab-overview" className="flex-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="cutlist" data-testid="tab-cutlist" className="flex-1">
                Cut List
              </TabsTrigger>
              <TabsTrigger value="steps" data-testid="tab-steps" className="flex-1">
                Piecing Steps
              </TabsTrigger>
              <TabsTrigger value="layout" data-testid="tab-layout" className="flex-1">
                Assembly Layout
              </TabsTrigger>
            </TabsList>

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
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
