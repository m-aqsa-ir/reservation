import Link from "next/link";
import { ReactNode, useState } from "react";
import { Button, Col, Container, ListGroup, Navbar, Offcanvas, Row } from "react-bootstrap";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import Image from "next/image";
import { mdiAccountChild, mdiBackburger, mdiBasketFill, mdiCalendarTodayOutline, mdiCashFast, mdiHomeAssistant, mdiLocationExit, mdiPackageVariant, mdiPlaylistEdit } from "@mdi/js";
import Icon from "@mdi/react";

const links = [
  { name: 'dashboard', text: 'داشبورد', icon: mdiHomeAssistant },
  { name: 'lists', text: 'لیست های قابل انتخاب', icon: mdiPlaylistEdit },
  { name: 'services', text: 'خدمات و بسته ها', icon: mdiPackageVariant },
  { name: 'day', text: 'روزها', icon: mdiCalendarTodayOutline },
  { name: 'customer', text: 'مشتری ها', icon: mdiAccountChild },
  { name: 'order', text: 'سفارشات', icon: mdiBasketFill },
  { name: 'transaction', text: 'پرداخت', icon: mdiCashFast },
]


export function AdminPagesContainer({ currentPage, children }: { currentPage: string, children: ReactNode }) {

  const [showDrawer, setShowDrawer] = useState(false)

  const router = useRouter()
  return <>
    <Navbar bg="success" expand="lg">
      <Container>
        <Button
          className=""
          style={{ backgroundColor: 'transparent', border: 'none' }}
          variant="light" onClick={() => setShowDrawer(true)}
        >
          <Icon
            path={mdiBackburger} size={1} className="text-white" />
        </Button>
        <Navbar.Brand className="flex-grow-1">

          <Image
            alt="logo"
            src="/icon.png"
            width={40}
            height={40}
            className="ms-2"
          />
          <Link href="/admin" className="text-white text-decoration-none">سامانه أقصی</Link>
        </Navbar.Brand>
        {/* <Navbar.Toggle aria-controls="basic-navbar-nav"></Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <ListOfLinks currentPage={currentPage} className="d-lg-none" />
        </Navbar.Collapse> */}
      </Container>
    </Navbar>
    <Container fluid className="vh-100 my-3">
      {children}

      <Offcanvas
        placement="end"
        show={showDrawer}
        style={{ fontFamily: 'ir-sans' }}
        onHide={() => setShowDrawer(false)}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>منوی برنامه</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <ListOfLinks currentPage={currentPage} />
        </Offcanvas.Body>
      </Offcanvas>
      {/* <Row className="h-100">
        <Col md="3" className="mt-2 d-none d-lg-block">
          <ListOfLinks currentPage={currentPage} />
        </Col>
        <Col md="12">
          <Container fluid className="bg-white rounded-3 border h-100 mt-2 p-3">
            {children}
          </Container>
        </Col>

      </Row> */}
    </Container></>
}

function ListOfLinks({ currentPage, className }: { currentPage: string, className?: string }) {
  return <ListGroup className={className ?? ''}>
    {links.map(i =>
      <Link href={`/admin/${i.name}`} key={i.name} className="text-decoration-none rounded mb-1">
        <ListGroup.Item active={currentPage == i.name}>
          <Icon
            path={i.icon ?? mdiHomeAssistant}
            size={1}
            className="ms-2"
          />
          {i.text}
        </ListGroup.Item>
      </Link>
    )}
    <Link className="text-decoration-none rounded mb-1" href="/admin" onClick={() => { Cookies.remove('AUTH_ADMIN') }}>
      <ListGroup.Item className="bg-danger text-white">
        <Icon
          path={mdiLocationExit}
          size={1}
          className="ms-2"
        />
        خروج
      </ListGroup.Item>
    </Link>

  </ListGroup>
}