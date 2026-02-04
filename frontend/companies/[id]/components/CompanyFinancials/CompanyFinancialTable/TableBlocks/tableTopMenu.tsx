"use client";

import React from "react";

import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from "@/components/ui/menubar";

const TableTopMenu = ({ variant, onVariantChange }) => {
  return (
    <Menubar className="sticky left-0 z-10" style={{ width: "80px" }}>
      <MenubarMenu>
        <MenubarTrigger>Format</MenubarTrigger>
        <MenubarContent>
          <MenubarRadioGroup value={variant} onValueChange={onVariantChange}>
            <MenubarRadioItem value="concise">Concise</MenubarRadioItem>
            <MenubarRadioItem value="large">Large</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default TableTopMenu;
