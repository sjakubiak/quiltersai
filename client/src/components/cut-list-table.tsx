import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { CutListItem } from "@shared/schema";

interface CutListTableProps {
  cutList: CutListItem[];
}

export function CutListTable({ cutList }: CutListTableProps) {
  // Group by fabric color
  const groupedByFabric = cutList.reduce((acc, item) => {
    if (!acc[item.fabricColor]) {
      acc[item.fabricColor] = [];
    }
    acc[item.fabricColor].push(item);
    return acc;
  }, {} as Record<string, CutListItem[]>);

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Cut List</h3>
        <p className="text-sm text-muted-foreground mt-1">
          All measurements include 1/4″ seam allowance
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Fabric</TableHead>
              <TableHead>Piece Type</TableHead>
              <TableHead className="text-right">Size (W × H)</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Yardage</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedByFabric).map(([color, items]) => (
              items.map((item, idx) => (
                <TableRow key={item.id} className={idx % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: item.fabricColor }}
                      />
                      <span className="line-clamp-1">{color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{item.pieceType}</TableCell>
                  <TableCell className="text-right font-mono">
                    {item.widthIn}″ × {item.heightIn}″
                  </TableCell>
                  <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {item.yardage.toFixed(3)} yd
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.notes || "—"}
                  </TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-6 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total Yardage Required:</span>
          <span className="font-mono text-lg font-semibold">
            {cutList.reduce((sum, item) => sum + item.yardage, 0).toFixed(3)} yards
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Tip: Add 10-15% extra for errors and matching patterns
        </p>
      </div>
    </Card>
  );
}
