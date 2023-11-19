import { ReactNode } from "react";
import { DynamicHead } from "./DynamicHead";
import { Table } from "react-bootstrap";


export function AdminTable(p: { children: ReactNode, className?: string, responsive?: string } & TablePageBaseProps) {
  return <div className={`${p.className ?? ''} rounded-4 overflow-hidden border`}>
    <Table striped bordered style={{ tableLayout: 'fixed' }} responsive={p.responsive ?? false}>
      <DynamicHead columnNames={p.columnNames} />
      {p.children}
    </Table>
  </div>
}