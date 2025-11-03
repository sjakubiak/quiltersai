import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PiecingStep } from "@shared/schema";

interface PiecingStepsProps {
  steps: PiecingStep[];
}

const STEP_TYPE_LABELS: Record<string, string> = {
  block_assembly: "Block Assembly",
  row_assembly: "Row Assembly",
  final_assembly: "Final Assembly",
};

export function PiecingSteps({ steps }: PiecingStepsProps) {
  // Sort steps by step number
  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Assembly Instructions</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Follow these steps in order to piece your quilt top. All seams are 1/4″ unless otherwise noted.
        </p>

        <div className="space-y-6">
          {sortedSteps.map((step, idx) => (
            <div key={step.id} className="flex gap-4">
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {step.stepNumber}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-base leading-relaxed">{step.instruction}</p>
                  </div>
                  {step.type && (
                    <Badge variant="outline" className="flex-shrink-0">
                      {STEP_TYPE_LABELS[step.type] || step.type}
                    </Badge>
                  )}
                </div>

                {/* Diagram if available */}
                {step.diagramSvg && (
                  <div className="rounded-md border border-border bg-muted p-4">
                    <div
                      className="max-w-md"
                      dangerouslySetInnerHTML={{ __html: step.diagramSvg }}
                    />
                  </div>
                )}

                {/* Divider between steps (not after last one) */}
                {idx < sortedSteps.length - 1 && (
                  <div className="h-px bg-border mt-4" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-semibold mb-2">Finishing Tips</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Press seams as you go, alternating directions for nesting</li>
          <li>• Square up blocks before assembly to ensure accurate sizing</li>
          <li>• Pin at seam intersections for perfect points</li>
          <li>• Check your 1/4″ seam allowance frequently</li>
        </ul>
      </Card>
    </div>
  );
}
