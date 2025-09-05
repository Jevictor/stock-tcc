import { ReactNode } from "react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: ReactNode;
  className?: string;
}

interface ResponsiveTableCellProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export const ResponsiveTable = ({ children, className }: ResponsiveTableProps) => {
  return (
    <div className={cn("space-y-2 md:space-y-0", className)}>
      {/* Desktop table header - hidden on mobile */}
      <div className="hidden md:block">
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full">
            {children}
          </table>
        </div>
      </div>
      
      {/* Mobile cards - hidden on desktop */}
      <div className="md:hidden space-y-3">
        {children}
      </div>
    </div>
  );
};

export const ResponsiveTableHeader = ({ children }: ResponsiveTableRowProps) => {
  return (
    <thead className="hidden md:table-header-group">
      {children}
    </thead>
  );
};

export const ResponsiveTableBody = ({ children }: ResponsiveTableRowProps) => {
  return (
    <tbody className="hidden md:table-row-group">
      {children}
    </tbody>
  );
};

export const ResponsiveTableRow = ({ children, className }: ResponsiveTableRowProps) => {
  return (
    <>
      {/* Desktop row */}
      <tr className={cn("hidden md:table-row border-b hover:bg-muted/50 transition-colors", className)}>
        {children}
      </tr>
      
      {/* Mobile card */}
      <Card className="md:hidden">
        <CardContent className="p-4 space-y-3">
          {children}
        </CardContent>
      </Card>
    </>
  );
};

export const ResponsiveTableHead = ({ children, className }: ResponsiveTableCellProps) => {
  return (
    <th className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground", className)}>
      {children}
    </th>
  );
};

export const ResponsiveTableCell = ({ children, label, className }: ResponsiveTableCellProps) => {
  return (
    <>
      {/* Desktop cell */}
      <td className={cn("hidden md:table-cell p-4 align-middle", className)}>
        {children}
      </td>
      
      {/* Mobile cell with label */}
      <div className="md:hidden flex justify-between items-start">
        {label && (
          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
            {label}:
          </span>
        )}
        <div className="text-right flex-1">
          {children}
        </div>
      </div>
    </>
  );
};