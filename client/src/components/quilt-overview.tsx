import { Card } from "@/components/ui/card";
import { Ruler, Scissors, DollarSign, Clock, Layers, Package } from "lucide-react";
import type { DesignWithDetails } from "@shared/schema";

interface QuiltOverviewProps {
  design: DesignWithDetails;
}

const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Intermediate", "Advanced", "Expert"];

export function QuiltOverview({ design }: QuiltOverviewProps) {
  const { design: d, backing, batting, binding, cutList } = design;
  const difficultyLabel = DIFFICULTY_LABELS[d.difficulty || 3] || "Intermediate";

  // Calculate total fabric cost estimate (assuming $10/yard average)
  const estimatedCost = (d.totalYardage || 0) * 10;

  return (
    <div className="space-y-6">
      {/* Preview and Key Stats */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* SVG Preview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Design Mockup</h3>
          <div className="bg-muted rounded-md p-6 flex items-center justify-center">
            <div
              className="w-full max-w-md"
              dangerouslySetInnerHTML={{ __html: d.svgMockup }}
            />
          </div>
        </Card>

        {/* Key Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Difficulty</p>
                <p className="font-semibold">{difficultyLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="font-semibold font-mono">
                  {d.estimatedHours || 8}-{(d.estimatedHours || 8) + 4} hours
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Fabric</p>
                <p className="font-semibold font-mono">{d.totalYardage?.toFixed(2) || "0.00"} yards</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Est. Cost (fabric)</p>
                <p className="font-semibold">${estimatedCost.toFixed(0)}-${(estimatedCost * 1.3).toFixed(0)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Ruler className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Block Size</p>
                <p className="font-semibold font-mono">{d.blockSizeIn || 12}″ × {d.blockSizeIn || 12}″</p>
              </div>
            </div>

            {d.sashingIn && d.sashingIn > 0 && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Sashing Width</p>
                  <p className="font-semibold font-mono">{d.sashingIn}″</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Material Requirements */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Backing</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Width:</span>
              <span className="font-mono font-medium">{backing.widthIn.toFixed(1)}″</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Height:</span>
              <span className="font-mono font-medium">{backing.heightIn.toFixed(1)}″</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yardage:</span>
              <span className="font-mono font-medium">{backing.yardage.toFixed(2)} yd</span>
            </div>
            {backing.piecingPlan && (
              <div className="pt-2 mt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">{backing.piecingPlan}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Batting</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Width:</span>
              <span className="font-mono font-medium">{batting.widthIn.toFixed(1)}″</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Height:</span>
              <span className="font-mono font-medium">{batting.heightIn.toFixed(1)}″</span>
            </div>
            <div className="pt-2 mt-2 border-t border-border text-xs text-muted-foreground">
              <p>Includes 2-4″ overhang on all sides</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Binding</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strip Width:</span>
              <span className="font-mono font-medium">{binding.stripWidthIn}″</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Length:</span>
              <span className="font-mono font-medium">{binding.totalLengthIn.toFixed(1)}″</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yardage:</span>
              <span className="font-mono font-medium">{binding.yardage.toFixed(2)} yd</span>
            </div>
            <div className="pt-2 mt-2 border-t border-border text-xs text-muted-foreground">
              <p>Includes 10% extra for mitering</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pattern Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pattern Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Block Pattern</p>
            <p className="font-medium">{d.blockPattern}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Layout Strategy</p>
            <p className="font-medium">{d.layoutStrategy}</p>
          </div>
          {d.metadata && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Piecing Method</p>
                <p className="font-medium">Machine Piecing</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Seam Allowance</p>
                <p className="font-medium font-mono">1/4″</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
