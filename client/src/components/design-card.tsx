import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Ruler, Layers, TrendingUp } from "lucide-react";
import type { DesignVariation } from "@shared/schema";

interface DesignCardProps {
  design: DesignVariation;
  onClick: () => void;
}

const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Intermediate", "Advanced", "Expert"];

export function DesignCard({ design, onClick }: DesignCardProps) {
  const difficultyLabel = DIFFICULTY_LABELS[design.difficulty || 3] || "Intermediate";

  return (
    <Card
      data-testid={`card-design-${design.id}`}
      className="group cursor-pointer overflow-hidden hover-elevate active-elevate-2 transition-all"
      onClick={onClick}
    >
      {/* Preview Image */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {design.previewPng ? (
          <img
            src={design.previewPng}
            alt={design.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full p-4"
            dangerouslySetInnerHTML={{ __html: design.svgMockup }}
          />
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {design.blockPattern}
          </Badge>
          {design.scrapFriendly === 1 && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-primary text-primary">
              Scrap Friendly
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-design-name-${design.id}`}>
            {design.name}
          </h3>
          <p className="text-sm text-muted-foreground">{design.layoutStrategy}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Difficulty:</span>
            <span className="font-medium">{difficultyLabel}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium font-mono">{design.estimatedHours || 8}-{(design.estimatedHours || 8) + 4}h</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium font-mono">{design.totalYardage?.toFixed(2) || "0.00"} yd</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{design.blockSizeIn || 12}″ blocks</span>
          </div>
        </div>

        {/* Quilting motifs */}
        {design.quiltingMotifs && design.quiltingMotifs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {design.quiltingMotifs.slice(0, 3).map((motif, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {motif}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
