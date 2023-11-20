import { ReactNode } from "react";
import { DynamicHead } from "./DynamicHead";
import { Table } from "react-bootstrap";


export function AdminTable(p: { children: ReactNode, className?: string, responsive?: string } & TablePageBaseProps) {
  return <div className={`${p.className ?? ''} rounded-4 border p-1 bg-white`}>
    <Table responsive>
      <DynamicHead columnNames={p.columnNames} />
      {p.children}
    </Table>
  </div>
}