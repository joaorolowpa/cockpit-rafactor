"use client";
import React, { useState } from "react";

const formatPercentage = (value, decimalPlaces) => {
  return value !== null && value !== undefined
    ? `${(value * 100).toFixed(decimalPlaces)}%`
    : "-";
};

const formatValue = (value, decimalPlaces, divider = 1) => {
  if (value !== null && value !== undefined) {
    const formattedValue = (value / divider).toFixed(decimalPlaces);
    return formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } else {
    return "-";
  }
};

const getDescriptionPadding = (dataType) => {
  switch (dataType) {
    case "financials":
    case "operating":
    case "bs_metrics":
      return "pl-2";
    case "growth":
    case "metrics":
    case "bs_raw":
      return "pl-8";
    default:
      return "";
  }
};

const getRowBackground = (dataType) => {
  switch (dataType) {
    case "financials":
    case "bs_metrics":
      return "bg-gray-100"; // Very light gray background
    case "operating":
    case "bs_raw":
    case "growth":
    case "metrics":
      return "bg-white"; // White background for other types
    default:
      return "";
  }
};

const getTextStyles = (dataType) => {
  switch (dataType) {
    case "growth":
    case "bs_raw":
    case "metrics":
      return "italic text-gray-500"; // Italics and grayish text
    default:
      return "";
  }
};

const TableRow = ({
  row,
  columns,
  percentageDecimalPlaces = 1,
  valueDecimalPlaces = 0,
  divider = 1,
  addCheckbox = true,
  onSelectRow,
  variant = "concise",
}) => {
  let leftOffset = addCheckbox ? 40 : 0; // Account for the checkbox column width if present

  const isConcise = variant === "concise";
  const rowBackgroundClass = getRowBackground(row.data_type);
  const rowTextClass = getTextStyles(row.data_type);

  const [isSelected, setIsSelected] = useState(false);

  const handleCheckboxChange = () => {
    setIsSelected(!isSelected);
    onSelectRow(row, !isSelected);
  };

  const handleRowClick = (e) => {
    // Prevent the row click event from firing when clicking directly on the checkbox
    if (e.target.type === "checkbox") return;
    handleCheckboxChange();
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`border-b border-t border-gray-300 md:border-none ${rowBackgroundClass} ${rowTextClass} cursor-pointer hover:bg-blue-100 ${
        isConcise ? "text-sm" : "text-base"
      }`}
    >
      {addCheckbox && (
        <td
          className={`sticky left-0 border p-1 text-center md:border-none ${rowBackgroundClass} ${rowTextClass} z-10`} // Apply row styles
          style={{ width: "40px" }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className={`${isConcise ? "h-4 w-4" : "h-5 w-5"} cursor-pointer`} // Adjust size of checkbox
          />
        </td>
      )}
      {columns.map((col) => {
        const style = {
          left: col.sticky ? `${leftOffset}px` : "auto",
          minWidth: col.sticky ? col.column_width || "100px" : "100px",
          backgroundColor: "inherit",
        };

        if (col.sticky) {
          leftOffset += parseInt(col.column_width || "100px", 10); // Convert width to integer for left offset
        }

        let cellValue = row[col.accessorKey];

        if (col.formatRow) {
          if (row.unit === "%") {
            cellValue = formatPercentage(cellValue, percentageDecimalPlaces);
          } else {
            cellValue = formatValue(cellValue, valueDecimalPlaces, divider);
          }
        }

        const descriptionPaddingClass =
          col.accessorKey === "description"
            ? getDescriptionPadding(row.data_type)
            : "";

        return (
          <td
            key={col.accessorKey}
            className={`border md:border-none ${
              col.sticky ? "sticky z-10" : ""
            } ${
              col.text_position === "right"
                ? "text-right"
                : col.text_position === "center"
                  ? "text-center"
                  : "text-left"
            } ${descriptionPaddingClass}`}
            style={style}
          >
            {cellValue !== undefined ? cellValue : "-"}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
