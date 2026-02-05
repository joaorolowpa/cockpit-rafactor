import React from "react";

const TableHeader = ({ columns, addCheckbox = true, variant = "concise" }) => {
  let leftOffset = addCheckbox ? 40 : 0; // Start offset with checkbox width if present
  const isConcise = variant === "concise";
  const checkboxWidth = 40; // Set a narrower width for the checkbox column

  return (
    <thead
      className={`sticky top-0 z-20 bg-blue-800 text-white ${
        isConcise ? "text-sm" : "text-base"
      }`}
      style={{ height: isConcise ? "40px" : "50px" }}
    >
      <tr>
        {addCheckbox && (
          <th
            className={`sticky left-0 top-0 ${
              isConcise ? "px-1 py-2" : "px-2 py-3"
            } bg-blue-800 text-left font-semibold`}
            style={{
              minWidth: `${checkboxWidth}px`,
              maxWidth: `${checkboxWidth}px`,
              zIndex: 40,
            }} // Higher z-index for sticky
          >
            {/* Empty header for checkboxes */}
          </th>
        )}
        {columns.map((col, index) => {
          const colWidth = parseInt(col.column_width || "100px", 10); // Ensure integer width for calculation
          const style = {
            minWidth: colWidth,
            whiteSpace: "nowrap",
            left: col.sticky ? `${leftOffset}px` : "auto",
            zIndex: col.sticky ? 35 : 10, // Higher z-index for sticky columns
          };

          if (col.sticky) {
            leftOffset += colWidth; // Update offset based on column width
          }

          return (
            <th
              key={col.accessorKey}
              className={`sticky top-0 ${
                isConcise ? "px-2 py-2.5" : "px-3 py-3.5"
              } font-semibold ${
                col.text_position === "right"
                  ? "text-right"
                  : col.text_position === "center"
                    ? "text-center"
                    : "text-left"
              } ${col.sticky ? "sticky" : ""} bg-blue-800`}
              style={style}
            >
              {col.header}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default TableHeader;
