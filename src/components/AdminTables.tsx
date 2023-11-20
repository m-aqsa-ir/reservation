import { ReactNode } from "react";
import { DynamicHead } from "./DynamicHead";
import { Table } from "react-bootstrap";
import { MyPaginator } from "./MyPaginator";


export function AdminTable(p: {
  children: ReactNode,
  className?: string,
  responsive?: string,
  page?: PaginatorState & { pageName: string },
} & TablePageBaseProps) {
  return <div className={`${p.className ?? ''} rounded-4 border p-1 bg-white`}>
    <Table responsive>
      <DynamicHead columnNames={p.columnNames} />
      {p.children}
    </Table>
    {p.page && <MyPaginator {...p.page} />}
  </div>
}