import { ReactNode } from "react";
import { DynamicHead } from "./DynamicHead";
import { Table } from "react-bootstrap";


export function AdminTable(p: { children: ReactNode, columnNames: string[] }) {
  return <div className="rounded-4 overflow-hidden border">
    <Table striped bordered style={{ tableLayout: 'fixed' }}>
      <DynamicHead columnNames={p.columnNames} />
      {p.children}
    </Table>
  </div>
}