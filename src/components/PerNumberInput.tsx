import { enDigit2Per, enNumberTo3DigPer, perDigit2En } from "@/lib/lib";
import { CSSProperties, useEffect, useState } from "react";
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

export function NewPerNumberInput(P: {
  value: string, onSet: (s: string) => void, to3digit?: boolean,
  required?: boolean, placeholder?: string, style?: CSSProperties,
  className?: string, pattern?: string, maxLength?: number,
  minLength?: number,
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
    maxLength={P.maxLength}
    minLength={P.minLength}
    pattern={P.pattern ? enDigit2Per(P.pattern) : undefined} />
}