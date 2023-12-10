import { enDigit2Per } from "@/lib/lib"
import { PaginatorState } from "@/types"
import { Pagination } from "react-bootstrap"

export function MyPaginator({
  page,
  pageCount,
  totalCount,
  pageName
}: PaginatorState & { pageName: string }) {
  const maxPageCount = Math.ceil(totalCount / pageCount)

  const pages = [page - 2, page - 1, page, page + 1, page + 2].filter(
    (i) => i >= 1 && i <= maxPageCount
  )

  const showLeftEllipses = !pages.includes(1)
  const showRightEllipses = !pages.includes(maxPageCount)
  const showLeftDoubleArrow = page != 1
  const showRightDoubleArrow = page != maxPageCount
  const showLeftArrow = page != 1
  const showRightArrow = page != maxPageCount

  return (
    <Pagination className="justify-content-center">
      {showLeftDoubleArrow && (
        <Pagination.First href={`${pageName}?page=${1}`} />
      )}
      {showLeftArrow && (
        <Pagination.Prev href={`${pageName}?page=${page - 1}`} />
      )}
      {showLeftEllipses && <Pagination.Ellipsis />}
      {pages.map((i) => (
        <Pagination.Item
          href={`${pageName}?page=${i}`}
          key={i}
          active={page == i}
        >
          {enDigit2Per(i)}
        </Pagination.Item>
      ))}
      {showRightEllipses && <Pagination.Ellipsis />}
      {showRightArrow && (
        <Pagination.Next href={`${pageName}?page=${page + 1}`} />
      )}
      {showRightDoubleArrow && (
        <Pagination.Last href={`${pageName}?page=${maxPageCount}`} />
      )}
    </Pagination>
  )
}
