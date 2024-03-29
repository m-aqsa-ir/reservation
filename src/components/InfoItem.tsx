import { enDigit2Per } from "@/lib/lib"
import { ReactNode } from "react"

export function InfoItem(P: {
  name: string
  value?: string | number
  threeDigit?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <p className={P.className ?? ""}>
      <span className="fw-bold">{P.name}: </span>
      {P.children == undefined
        ? enDigit2Per(P.value ?? "", P.threeDigit)
        : P.children}
    </p>
  )
}
