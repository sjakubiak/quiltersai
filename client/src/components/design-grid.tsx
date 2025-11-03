import { DesignCard } from "@/components/design-card";
import type { DesignVariation } from "@shared/schema";

interface DesignGridProps {
  designs: DesignVariation[];
  onSelectDesign: (id: string) => void;
}

export function DesignGrid({ designs, onSelectDesign }: DesignGridProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Design Variations</h2>
          <p className="text-sm text-muted-foreground">
            {designs.length} unique {designs.length === 1 ? "design" : "designs"} generated
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            onClick={() => onSelectDesign(design.id)}
          />
        ))}
      </div>
    </div>
  );
}
