const TableHead = (props: { columnNames: string[] }) => <thead>
  {props.columnNames.map(c => <th key={c} className="text-center p-2 border">{c}</th>)}
</thead>

export default TableHead