"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface SettingsModalProps {
  consolidateStocksEnabled: boolean;
  onConsolidateStocksChange: (enabled: boolean) => void;
}

export default function SettingsModal({
  consolidateStocksEnabled,
  onConsolidateStocksChange,
}: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Display Settings</DialogTitle>
          <DialogDescription>
            Configure how data is displayed in the charts and tables.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="consolidate-stocks"
              checked={consolidateStocksEnabled}
              onCheckedChange={(checked) =>
                onConsolidateStocksChange(checked as boolean)
              }
            />
            <Label htmlFor="consolidate-stocks" className="text-sm">
              Consolidate stocks (group individual stocks as "Stocks")
            </Label>
          </div>
          <div className="text-xs text-gray-500">
            When enabled, individual stock symbols (BBAS3, BBDC4, etc.) will be
            grouped together under a single "Stocks" category for cleaner
            visualization.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
