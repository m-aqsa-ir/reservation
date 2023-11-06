import { ReactNode } from "react";
import { Container } from "react-bootstrap";

export function PageContainer(p: { className?: string, children: ReactNode }) {
  return <Container className={`border p-5 mt-3 rounded col-md-8 ${p.className}`}>
    {p.children}
  </Container>
}