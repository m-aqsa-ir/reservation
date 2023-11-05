import { Button, Container, Form, ListGroup, ListGroupItem, Nav } from "react-bootstrap";
import _ from 'lodash'
import Image from "next/image";
import { useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiHumanFemaleFemale, mdiHumanMaleFemaleChild, mdiHumanMaleMale } from "@mdi/js";

const scrollValue = 100

interface Package {
  name: string,
  products: string[],
  price: number
}

interface Product {
  name: string,
  price: number,
  chosen: boolean
}

interface DayCap {
  month: string,
  day: string,
  weekName: string,
  capacity: number
}

export default function Home() {
  const scrollableRef = useRef<HTMLDivElement | null>(null)
  const [packageOrProduct, setPackageOrProduct] = useState('package')

  const [products, setProducts] = useState<Product[]>([
    { name: 'راپل', price: 1000, chosen: false },
    { name: 'سوارکاری', price: 2000, chosen: false },
    { name: 'بادی جامپینگ', price: 3000, chosen: false }
  ])

  const [packages, setPackages] = useState<Package[]>([
    {
      name: 'بسته ۱',
      products: [
        'راپل', 'سوارکاری'
      ],
      price: 30000
    }, {
      name: 'بسته ۲',
      products: [
        'بادی جامپینگ', 'سوارکاری'
      ],
      price: 50000
    }, {
      name: 'بسته ۳',
      products: [
        'راپل', 'بادی جامپینگ'
      ],
      price: 30000
    }
  ])
  const [chosenPackage, setChosenPackage] = useState<Package | null>(null)

  const [days, setDays] = useState<DayCap[]>([
    { month: '1', day: '25', capacity: 120, weekName: 'شنبه' }, { month: '1', day: '26', capacity: 120, weekName: 'یکشنبه' },
    { month: '1', day: '27', capacity: 120, weekName: 'شنبه' }, { month: '1', day: '28', capacity: 120, weekName: 'یکشنبه' },
    { month: '1', day: '29', capacity: 120, weekName: 'شنبه' }, { month: '1', day: '31', capacity: 120, weekName: 'یکشنبه' },
    { month: '2', day: '01', capacity: 120, weekName: 'شنبه' }, { month: '1', day: '02', capacity: 120, weekName: 'یکشنبه' },
    { month: '1', day: '03', capacity: 120, weekName: 'شنبه' }, { month: '1', day: '04', capacity: 120, weekName: 'یکشنبه' },
    { month: '1', day: '05', capacity: 120, weekName: 'شنبه' }
  ])
  const [chosenDay, setChosenDay] = useState<DayCap | null>(null)

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
            {days.map(i =>
              <DayCapacity
                key={`${i.month}/${i.day}`}
                day={`${i.month}/${i.day} - ${i.weekName}`}
                capacity={i.capacity}
                chosen={`${i.month}/${i.day} - ${i.weekName}` === `${chosenDay?.month}/${chosenDay?.day} - ${chosenDay?.weekName}`}
                onChoose={() => setChosenDay(i)}
              />
            )}
          </div>
          <button className="bg-white border-0 rounded-start-4" onClick={() => {
            scrollableRef.current!.scrollLeft = scrollableRef.current!.scrollLeft - scrollValue
          }}>
            <i className="bi bi-chevron-left"></i>
          </button>
        </div>

        <div className="border rounded-4 mt-2">
          <Nav variant="underline" fill activeKey={packageOrProduct} onSelect={e => {
            setChosenPackage(null)
            setProducts(ps => ps.map(p => ({ ...p, chosen: false })))
            setPackageOrProduct(e!)
          }}>
            <Nav.Item>
              <Nav.Link className="fs-5" eventKey="package">
                انتخاب بسته
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link className="fs-5" eventKey="products">
                انتخاب خدمت (خدمات)
              </Nav.Link>
            </Nav.Item>
          </Nav>



          {packageOrProduct == 'package' ? <>
            <p className="text-center mt-2 fs-3">خدمات موجود</p>
            {packages.map(pac =>
              <PackageComponent
                pac={pac}
                key={pac.name}
                reserved={chosenPackage?.name === pac.name}
                onReserve={() => setChosenPackage(pac)}
              />
            )}
          </> : <>
            <p className="text-center mt-2 fs-3">خدمات موجود</p>
            <ListGroup>
              {products.map(p =>
                <ListGroupItem
                  key={p.name}
                  className="fs-5">
                  {p.name} -
                  هر نفر
                  {p.price}
                  &nbsp; تومان

                  <Form.Check
                    checked={p.chosen}
                    inline
                    onChange={() => setProducts(products.map(pp => pp.name == p.name ? { ...p, chosen: !p.chosen } : pp))}
                  />
                </ListGroupItem>)
              }
            </ListGroup>
          </>}
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
    </Container >
  )
}

function DayCapacity({
  day,
  capacity,
  chosen,
  onChoose }: { day: string, capacity: number, chosen: boolean, onChoose: () => void }) {
  return <Button variant={chosen ? 'success' : 'outline-primary'} className="me-2 text-nowrap" disabled={chosen} onClick={onChoose}>
    {day}
    <br />
    {capacity} نفر
  </Button>
}


function PackageComponent({ pac, reserved, onReserve }: { pac: Package, reserved: boolean, onReserve: () => void }) {
  return <div className="d-flex align-items-center border rounded-4 m-2 p-2 flex-wrap">
    {/* <div className="ms-3">
      <Image
        src='/images/package.jpg'
        alt=""
        height={50}
        width={50}
        className="rounded-circle"
      />
    </div> */}
    <div className="flex-grow-1">
      <p className="fs-2">{pac.name}</p>
      <p>{pac.products.join(', ')}</p>
    </div>
    <div className="ms-3 d-flex flex-column justify-content-center">
      <p>{pac.price} تومان</p>
      <Button variant={reserved ? 'success' : 'primary'} disabled={reserved} onClick={onReserve}>
        {reserved ? 'رزرو شد' : 'رزرو کردن'}
      </Button>
    </div>
  </div>
}