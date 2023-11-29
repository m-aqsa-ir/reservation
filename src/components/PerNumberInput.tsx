import { enDigit2Per, enNumberTo3DigPer, perDigit2En } from "@/lib/lib";
import { CSSProperties, ChangeEventHandler, useEffect, useState } from "react";
import { Form, FormControlProps } from "react-bootstrap";


export function PerNumberInput(p: FormControlProps & {
  style?: CSSProperties
  max?: number,
  min?: number,
  required?: boolean,
  pattern?: string
}) {

  const { style, ...pWithout } = p
  return <Form.Control
    style={{ fontFamily: 'yekan', ...style }}
    type="number"
    {...pWithout}
  />
}

export function PerNumberInputPrice(P: {
  value: string, onSet: (s: string) => void, required?: boolean
  style?: CSSProperties, max?: number, placeholder?: string,
  min?: number,
}) {
  return <Form.Control
    style={{ fontFamily: 'yekan', ...P.style }}
    value={P.value}
    onChange={e => P.onSet(e.target.value == '' ? e.target.value : Number(
      e.target.value
        .split('')
        .filter(i => /[0-9]/.test(i))
        .join('')
    ).toLocaleString())}

    required={P.required} min={P.min} max={P.max} placeholder={P.placeholder}
  />
}

export function NewPerNumberInput(P: {
  value: string, onSet: (s: string) => void, to3digit?: boolean,
  min?: number, max?: number, required?: boolean, placeholder?: string, style?: CSSProperties,
  pattern?: string
}) {
  return <Form.Control
    value={P.value}
    onChange={e => {
      const v = e.target.value
      const filtered = v.split('').filter(i => /[0-9]|[۰-۹]/.test(i)).join('')

      P.onSet(
        enDigit2Per(P.to3digit ?
          (filtered == '' ? filtered : BigInt(perDigit2En(filtered)).toLocaleString()) :
          filtered
        )
      )
    }}

    required={P.required} min={P.min} max={P.max} placeholder={P.placeholder}
    pattern={P.pattern} />
}

export function perNumStr2Num(value: string) {
  return Number(
    perDigit2En(
      value.replace(/,/g, '')
    )
  )
}

export function NewPerNumberInput2(P: {
  value: string, onSet: (s: string) => void, to3digit?: boolean,
  required?: boolean, placeholder?: string, style?: CSSProperties,
  className?: string, pattern?: string
}) {

  const [s, setS] = useState<string>(
    P.value == '' ? '' : P.to3digit ? enNumberTo3DigPer(P.value) : enDigit2Per(P.value)
  )

  useEffect(() => {
    setS(
      P.value == '' ? '' : P.to3digit ? enNumberTo3DigPer(P.value) : enDigit2Per(P.value)
    )
  }, [P.value, P.to3digit])

  return <Form.Control
    value={s}
    onChange={e => {
      const filtered = e.target.value.replace(/,/g, '').split('').filter(i => /[0-9]|[۰-۹]/.test(i)).join('')
      const v = perDigit2En(filtered)

      P.onSet(v)
    }}

    required={P.required}
    placeholder={P.placeholder}
    style={P.style}
    className={P.className}
    pattern={P.pattern ? enDigit2Per(P.pattern) : undefined} />
}