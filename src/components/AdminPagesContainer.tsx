import Link from "next/link";
import { CSSProperties, ReactNode, useState } from "react";
import { Button, Container, ListGroup, Navbar } from "react-bootstrap";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import Image from "next/image";
import { mdiAccountChild, mdiBackburger, mdiBasketFill, mdiCalendarTodayOutline, mdiCashFast, mdiHomeAssistant, mdiLocationExit, mdiMenu, mdiPackageVariant, mdiPlaylistEdit } from "@mdi/js";
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

  const [showDrawer, setShowDrawer] = useState(true)

  const router = useRouter()
  return <>
    <Navbar bg="success" expand="lg">
      <Container fluid>
        <Button
          className="ms-5"
          style={{ backgroundColor: 'transparent', border: 'none' }}
          variant="light" onClick={() => setShowDrawer(i => !i)}
        >
          <Icon
            path={mdiBackburger} size={1} className={"text-white my-nav-icon " + (showDrawer ? "open" : "close")} />
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
      </Container>
    </Navbar>
    <Container fluid className="vh-100 my-3 d-flex">
      <ListOfLinks
        currentPage={currentPage}
        className={"ms-2 my-nav " + (showDrawer ? "open" : "close")} />
      <Container fluid className="overflow-hidden page-content">
        {children}
      </Container>
    </Container>
  </>
}

function ListOfLinks({ currentPage, className, style }: { currentPage: string, className?: string, style?: CSSProperties }) {
  return <ListGroup className={className ?? ''} style={style}>
    {links.map(i =>
      <Link href={`/admin/${i.name}`} key={i.name} className="text-decoration-none rounded mb-1">
        <ListGroup.Item active={currentPage == i.name} style={{ borderWidth: 0 }}>
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