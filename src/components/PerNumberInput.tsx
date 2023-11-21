import { CSSProperties, ChangeEventHandler } from "react";
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
  const {
    value, onSet, style, required, min, max, placeholder,
  } = P
  return <Form.Control
    style={{ fontFamily: 'yekan', ...P.style }}
    value={P.value}
    onChange={e => P.onSet(e.target.value == '' ? e.target.value : Number(
      e.target.value
        .split('')
        .filter(i => /[0-9]/.test(i))
        .join('')
    ).toLocaleString())}

    required={required} min={min} max={max} placeholder={placeholder}
  />
}