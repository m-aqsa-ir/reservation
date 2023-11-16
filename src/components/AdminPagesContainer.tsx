import Link from "next/link";
import { ReactNode } from "react";
import { Col, Container, ListGroup, Nav, Navbar, Row } from "react-bootstrap";
import Cookies from "js-cookie";
import { useRouter } from "next/router";

const links = [
  { name: 'dashboard', text: 'خانه' },
  { name: 'lists', text: 'لیست های قابل انتخاب' },
  { name: 'day', text: 'روزها' },
  { name: 'services', text: 'خدمات و بسته ها' },
  { name: 'customer', text: 'مشتری ها' },
  { name: 'order', text: 'سفارشات' },
  { name: 'transaction', text: 'پرداخت' },
]


export function AdminPagesContainer({ currentPage, children }: { currentPage: string, children: ReactNode }) {
  const router = useRouter()
  return <>
    <Navbar bg="success">
      <Container>
        <Navbar.Brand>
          <Link href="/admin" className="text-white text-decoration-none">سامانه أقصی</Link>
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link className="text-white" onClick={() => {
            Cookies.remove('AUTH_ADMIN')
            router.push('/admin')
          }}>خروج</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
    <Container fluid className="vh-100">
      <Row className="h-100">
        <Col md="3" className="mt-2">
          <ListGroup>
            {links.map(i =>
              <Link href={`/admin/${i.name}`} key={i.name} className="text-decoration-none rounded mb-1">
                <ListGroup.Item active={currentPage == i.name}>
                  {i.text}
                </ListGroup.Item>
              </Link>
            )}
          </ListGroup>
        </Col>
        <Col md="9">
          <Container fluid className="bg-white rounded-3 border h-100 mt-2 p-3">
            {children}
          </Container>
        </Col>

      </Row>
    </Container></>
}