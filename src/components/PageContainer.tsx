import { ReactNode } from "react";
import { Container } from "react-bootstrap";

export function PageContainer(p: { className?: string, children: ReactNode }) {
  return <Container className={`${p.className == undefined ? '' : p.className} p-5 border mt-3 rounded col-md-8 bg-white`}>
    {p.children}
  </Container>
}