// components/helper/FinancialTableContextMenu.js

import React from "react";
import {
  FaChartArea,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaCopy,
  FaTable,
} from "react-icons/fa";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Define the props for the FinancialTableContextMenu component
interface TableContextMenuProps {
  onCopySelectedRows: () => void;
  onCopyTable: () => void;
  onCreateChart: (type: string) => void;
  children: React.ReactNode; // Add children to the props
}

// Create the FinancialTableContextMenu component
const TableContextMenu: React.FC<TableContextMenuProps> = ({
  onCopySelectedRows,
  onCopyTable,
  onCreateChart,
  children, // Destructure children from props
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {children} {/* Render children inside ContextMenuTrigger */}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem disabled onClick={onCopySelectedRows}>
          <FaCopy className="mr-2" />
          Copy Selected Rows
        </ContextMenuItem>
        <ContextMenuItem disabled onClick={onCopyTable}>
          <FaTable className="mr-2" />
          Copy Table
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Create Chart</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onCreateChart("multiLine")}>
              <FaChartLine className="mr-2" />
              Multiline
            </ContextMenuItem>
            <ContextMenuItem disabled onClick={() => onCreateChart("Line")}>
              <FaChartLine className="mr-2" />
              Line
            </ContextMenuItem>
            <ContextMenuItem disabled onClick={() => onCreateChart("Bar")}>
              <FaChartBar className="mr-2" />
              Bar
            </ContextMenuItem>
            <ContextMenuItem disabled onClick={() => onCreateChart("Pie")}>
              <FaChartPie className="mr-2" />
              Pie
            </ContextMenuItem>
            <ContextMenuItem disabled onClick={() => onCreateChart("Area")}>
              <FaChartArea className="mr-2" />
              Area
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TableContextMenu;
