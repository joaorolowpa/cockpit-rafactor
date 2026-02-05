export const tableColumns = [
  {
    accessorKey: "description",
    header: "Description",
    text_position: "left",
    sticky: true,
    column_width: "250px",
    formatRow: false,
  },
  {
    accessorKey: "unit",
    header: "Unit",
    text_position: "center",
    sticky: true,
    column_width: "100px",
    formatRow: false,
  },
  ...Array.from({ length: 20 }, (_, i) => {
    const year = 2016 + i;
    return {
      accessorKey: `${year}-12-31`,
      header: `${year}`,
      text_position: "right",
      sticky: false,
      formatRow: true,
    };
  }),
];
