import { Button, Container, Form, Nav } from "react-bootstrap";
import _ from 'lodash'
import Image from "next/image";
import { useRef } from "react";
import Icon from "@mdi/react";
import { mdiHumanFemaleFemale, mdiHumanMaleFemaleChild, mdiHumanMaleMale } from "@mdi/js";

const scrollValue = 100

export default function Home() {
  const scrollableRef = useRef<HTMLDivElement | null>(null)

  return (
    <Container>
      <Container className="border p-5 mt-3 rounded">
        <Nav variant="underline" defaultActiveKey="family" fill>
          <Nav.Item>

            <Nav.Link eventKey="family">
              <Icon path={mdiHumanMaleFemaleChild} size={2} />
              <div>خانوادگی</div>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="men-group">
              <Icon path={mdiHumanMaleMale} size={2} />
              <div>گروهی اقایان</div>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="women-group">
              <Icon path={mdiHumanFemaleFemale} size={2} />
              <div>گروهی بانوان</div>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Form.Select className="mt-3">
          <option>انتخاب ظرفیت</option>
          {_.range(1, 20).map(i => <option key={i} value={i}>{i}</option>)}
        </Form.Select>

        <div className="d-flex align-items-stretch border rounded-4 mt-2">
          <button className="bg-white border-0 rounded-end-4" onClick={() => {
            scrollableRef.current!.scrollLeft = scrollableRef.current!.scrollLeft + scrollValue
          }}>
            <i className="bi bi-chevron-right"></i>
          </button>
          <div
            ref={scrollableRef}
            style={{ scrollBehavior: 'smooth' }}
            className="d-flex justify-content-start bg-white flex-grow-1 p-2 overflow-x-scroll">
            {_.range(1, 20).map(i =>
              <DayCapacity key={i} day={i} />
            )}
          </div>
          <button className="bg-white border-0 rounded-start-4" onClick={() => {
            scrollableRef.current!.scrollLeft = scrollableRef.current!.scrollLeft - scrollValue
          }}>
            <i className="bi bi-chevron-left"></i>
          </button>
        </div>

        <div className="border rounded-4 mt-2">
          <p className="text-center mt-2 fs-3">خدمات موجود</p>
          <Package />
          <Package />
          <Package />
        </div>
      </Container>
      <Container className="border p-3 mt-3 rounded">
        <div className="d-flex align-items-baseline">
          <p className="flex-grow-1">با کلیک روی تایید و ادامه با قوانین و مقررات سایت موافقت کرده‌اید.</p>
          <p className="ms-2">160،000 تومان</p>
          <Button variant="primary">
            تایید و ادامه
          </Button>
        </div>
      </Container>
    </Container>
  )
}

function DayCapacity({ day }: { day: number }) {
  return <Button variant="outline-primary" className="me-2 text-nowrap" active={day == 1} >
    شنبه ۰۸/۰{day}
    <br />
    ۱۲۰ نفر
  </Button>
}


function Package() {
  return <div className="d-flex align-items-center border rounded-4 m-2 p-2 flex-wrap">
    <div className="ms-3">
      <Image
        src='/images/package.jpg'
        alt=""
        height={50}
        width={50}
        className="rounded-circle"
      />
    </div>
    <div className="flex-grow-1">
      <p className="fs-2">بسته ۱</p>
      <p>سوار کاری ، بادی جامپینگ ، راپل</p>
    </div>
    <div className="ms-3 d-flex flex-column justify-content-center">
      <p>120،000 تومان</p>
      <Button variant="primary">
        رزرو کردن
      </Button>
    </div>
  </div>
}