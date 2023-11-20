import { Form, FormControlProps } from "react-bootstrap";


export function PerNumberInput(p: FormControlProps & { max?: number, min?: number, required? : boolean }) {
  return <Form.Control
    style={{ fontFamily: 'yekan' }}
    type="number"
    {...p}
  />
}