import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShoppingBag, Scissors, Package, Sparkles, Ruler } from "lucide-react";
import { AFFILIATE_LINKS, type AffiliateLink } from "@shared/affiliate-config";
import type { LucideIcon } from "lucide-react";

interface BuySuppliesProps {
  totalYardage?: number;
  fabricColors: string[];
}

export function BuySupplies({ totalYardage, fabricColors }: BuySuppliesProps) {
  const renderSupplyCategory = (category: keyof typeof AFFILIATE_LINKS, title: string, Icon: LucideIcon) => {
    const links = AFFILIATE_LINKS[category];
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h4>
        <div className="grid gap-2">
          {links.map((link: AffiliateLink, index: number) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block"
              data-testid={`link-affiliate-${category}-${index}`}
            >
              <Card className="p-3 hover-elevate transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{link.name}</p>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Buy Supplies</h3>
        <Badge variant="secondary" className="text-xs">Affiliate Links</Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Get everything you need for this quilt. As an Amazon Associate and affiliate partner, 
        we earn from qualifying purchases at no extra cost to you. This helps support Quilter's AI!
      </p>

      {totalYardage && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <p className="text-sm">
            <span className="font-medium">Estimated fabric needed:</span> ~{totalYardage.toFixed(2)} yards
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ({fabricColors.length} colors) + backing, batting, and binding
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {renderSupplyCategory("fabric", "Quilting Fabric", Sparkles)}
        {renderSupplyCategory("batting", "Batting & Backing", Package)}
        {renderSupplyCategory("thread", "Thread", Scissors)}
        {renderSupplyCategory("notions", "Cutting & Measuring", Ruler)}
      </div>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          * Prices and availability subject to change. Links support Quilter's AI development.
        </p>
      </div>
    </div>
  );
}
