const TableHead = (props: {
  columnNames:
    | string[]
    | {
        name: string
        width: string
      }[]
}) => (
  <thead>
    <tr>
      {props.columnNames.map((c) => {
        if (typeof c == "string") {
          return (
            <th key={c} className="text-center p-2 ">
              {c}
            </th>
          )
        } else {
          return (
            <th
              key={c.name}
              className="text-center p-2 "
              style={{ minWidth: c.width }}
            >
              {c.name}
            </th>
          )
        }
      })}
    </tr>
  </thead>
)

export default TableHead
