import { ReactNode } from "react";
import { Container } from "react-bootstrap";

export function PageContainer(p: { className?: string, children: ReactNode }) {
  return <Container className={`${p.className ?? ''} p-3 p-md-5 border mt-3 mb-3 rounded col-md-8 bg-white`}>
    {p.children}
  </Container>
}