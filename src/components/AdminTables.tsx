import { ReactNode, useEffect, useRef } from "react"
import { DynamicHead } from "./DynamicHead"
import { Table } from "react-bootstrap"
import { MyPaginator } from "./MyPaginator"
import { PaginatorState, TablePageBaseProps } from "@/types"

export function AdminTable(
  p: {
    children: ReactNode
    className?: string
    responsive?: string
    page?: PaginatorState & { pageName: string }
    notAddBottomMargin?: boolean
  } & TablePageBaseProps
) {
  return (
    <div className={`${p.className ?? ""} rounded-4 border p-1 bg-white `}>
      <Table
        responsive
        className={(p.notAddBottomMargin ? "" : " tw-mb-28 ") + " my-table"}
      >
        <DynamicHead columnNames={p.columnNames} />
        {p.children}
      </Table>
      {p.page && <MyPaginator {...p.page} />}
    </div>
  )
}
