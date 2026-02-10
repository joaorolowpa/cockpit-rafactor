import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface ChartCardProps {
  children: ReactNode;
  className?: string;
}

export default function ChartCard({
  children,
  className = "",
}: ChartCardProps) {
  return (
    <Card className={`min-h-[400px] ${className}`}>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}


