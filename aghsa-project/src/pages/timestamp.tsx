import { timestampScnds2PerDate } from "@/lib/lib";
import { useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";


export default function TimeStamp() {
  const [dateValue, setDateValue] = useState(0)

  return <Container className="mt-3">
    <Row>
      <Col md="6">
        <p>{(function () {
          const d = timestampScnds2PerDate(dateValue)
          return d.format("YYYY/MM/DD - HH:mm")
        })()}</p>
      </Col>
      <Col md="6">
        <Form.Control type="number" value={dateValue} onChange={(e) => setDateValue(Number(e.target.value))} />
      </Col>
    </Row>
  </Container>
}