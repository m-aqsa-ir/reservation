const TableHead = (props: { columnNames: string[] }) => <thead>
  {props.columnNames.map(c => <th key={c} className="text-center">{c}</th>)}
</thead>

export default TableHead