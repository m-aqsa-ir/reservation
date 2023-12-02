import { enDigit2Per, enNumberTo3DigPer, perDigit2En } from "@/lib/lib";
import { CSSProperties, forwardRef, useEffect, useState } from "react";
import { Form, FormControlProps } from "react-bootstrap";


export const PerNumberInput = forwardRef(function PerNumberInput(p: FormControlProps & {
  style?: CSSProperties
  max?: number,
  min?: number,
  required?: boolean,
  pattern?: string
}, ref: any) {

  const { style, ...pWithout } = p
  return <Form.Control
    style={{ fontFamily: 'yekan', ...style }}
    type="number"
    {...pWithout}
    ref={ref}
  />
})


export function NewPerNumberInput(P: {
  value: string, onSet: (s: string) => void, to3digit?: boolean,
  required?: boolean, placeholder?: string, style?: CSSProperties,
  className?: string, pattern?: string, maxLength?: number,
  minLength?: number, size?: 'sm' | 'lg', disabled?: boolean,
  isInvalid?: boolean
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

    className={P.className} style={P.style}
    placeholder={P.placeholder} size={P.size}

    required={P.required} maxLength={P.maxLength} minLength={P.minLength}
    pattern={P.pattern ? enDigit2Per(P.pattern) : undefined}

    disabled={P.disabled} isInvalid={P.isInvalid} />
}