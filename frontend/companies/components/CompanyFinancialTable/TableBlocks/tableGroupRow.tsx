import React from "react";

const TableGroupRow = ({
  name,
  columns,
  leftOffsets,
  addCheckbox = true,
  variant = "concise",
}) => {
  const isConcise = variant === "concise";
  const checkboxWidth = isConcise ? 40 : 50; // Adjust width based on variant

  return (
    <tr
      className={`sticky bg-gray-200 text-gray-600 ${
        isConcise ? "top-10" : "top-12"
      } z-20 ${isConcise ? "text-sm" : "text-base"}`}
    >
      {addCheckbox && (
        <th
          className={`${
            isConcise ? "py-1 pr-2" : "py-2 pr-3"
          } z-10 bg-gray-200 pl-2 text-left font-semibold`}
          style={{ minWidth: `${checkboxWidth}px` }} // Adjusted width
        ></th>
      )}
      {columns.map((col, index) => {
        const style = {
          left: col.sticky ? `${leftOffsets[index]}px` : "auto",
          minWidth: col.sticky ? col.column_width || "100px" : "100px",
        };

        return (
          <th
            key={col.accessorKey}
            scope="colgroup"
            className={`${
              isConcise ? "py-1 pr-2" : "py-2 pr-3"
            } pl-2 text-left font-semibold ${
              col.sticky ? "sticky" : ""
            } z-10 bg-gray-200`}
            style={style}
          >
            {index === 0 ? name : ""}
          </th>
        );
      })}
    </tr>
  );
};

export default TableGroupRow;
