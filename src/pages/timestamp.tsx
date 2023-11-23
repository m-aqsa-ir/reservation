import { NewPerNumberInput, perNumStr2Num } from "@/components/PerNumberInput";
import { timestampScnds2PerDate } from "@/lib/lib";
import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";


export default function TimeStamp() {
  const [dateValue, setDateValue] = useState(0)

  const [persianNumber, setPersianNumber] = useState('')


  function show(value: number) {
    const d = timestampScnds2PerDate(value)
    return d.format("YYYY/MM/DD - HH:mm:ss")
  }

  return <Container className="mt-3">
    <Row>
      <Col md="6">
        <p suppressHydrationWarning>{show(dateValue)}</p>
      </Col>
      <Col md="6">
        <Form.Control type="number" value={dateValue} onChange={(e) => setDateValue(Number(e.target.value))} />
      </Col>
      <Col md="6">
        <NewPerNumberInput value={persianNumber} onSet={s => setPersianNumber(s)} />
      </Col>
      <Col md="6">
        {persianNumber}
      </Col>
      <Col md="6">
        <Button onClick={e => alert(perNumStr2Num(persianNumber))}>show result</Button>
      </Col>
    </Row>
  </Container>
}