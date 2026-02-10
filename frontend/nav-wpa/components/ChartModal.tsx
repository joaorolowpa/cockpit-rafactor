"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";

interface ChartModalProps {
  title: string;
  children: ReactNode;
  expandedChildren: ReactNode;
}

export default function ChartModal({
  title,
  children,
  expandedChildren,
}: ChartModalProps) {
  return (
    <div className="relative">
      {children}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-2 z-10"
          >
            <Expand className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">{expandedChildren}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
