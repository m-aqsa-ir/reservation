import { Button, Container, Form, ListGroup, ListGroupItem, Nav } from "react-bootstrap";
import _ from 'lodash'
import { useContext, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiHumanFemaleFemale, mdiHumanMaleFemaleChild, mdiHumanMaleMale } from "@mdi/js";
import { dayCapToStr, enDigitToPer } from "@/lib";
import { ChosenServiceContext } from "@/ChosenServiceProvider";
import { useRouter } from "next/router";

const scrollValue = 100


export default function Home() {
  const scrollableRef = useRef<HTMLDivElement | null>(null)
  const [packageOrProduct, setPackageOrProduct] = useState<'package' | 'products'>('package')
  const [services, setServices] = useState<ChooseService[]>([
    { name: 'راپل', price: 1000, desc: 'پایین آمدن از ساختمان', chosen: false },
    { name: 'سوارکاری', price: 2000, desc: 'اسب های چابک', chosen: false },
    { name: 'بادی جامپینگ', price: 3000, desc: 'پرش از ارتفاع', chosen: false }
  ])
  const [packages, setPackages] = useState<Package[]>([
    {
      name: 'بسته ۱', products: ['راپل', 'سوارکاری'], price: 30000
    }, {
      name: 'بسته ۲', products: ['بادی جامپینگ', 'سوارکاری'], price: 50000
    }, {
      name: 'بسته ۳', products: ['راپل', 'بادی جامپینگ'], price: 30000
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
  const [chosenGroup, setChosenGroup] = useState<GroupTypes>('family')


  const { chosenServiceDispatch } = useContext(ChosenServiceContext)
  const router = useRouter()

  function handleSubmit() {
    chosenServiceDispatch({
      type: 'set',
      payload: {
        pac: packageOrProduct == 'package' ? chosenPackage : services.filter(i => i.chosen),
        day: chosenDay,
        group: chosenGroup
      }
    })

    router.push('/submit')
  }

  return (
    <Container className="border p-5 mt-3 rounded col-md-8">
      <Nav variant="underline" activeKey={chosenGroup} onSelect={e => {
        setChosenGroup(e as GroupTypes)
      }} fill>
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
              key={dayCapToStr(i)}
              day={dayCapToStr(i)}
              capacity={i.capacity}
              chosen={dayCapToStr(i) === dayCapToStr(chosenDay)}
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
          setServices(ps => ps.map(p => ({ ...p, chosen: false })))
          setPackageOrProduct(e as 'package' | 'products')
        }}>
          <Nav.Item>
            <Nav.Link eventKey="package">
              <span className="fs-5">انتخاب بسته</span> (فقط یکی)
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className="fs-5" eventKey="products">
              انتخاب خدمات
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {packageOrProduct == 'package' ? <>
          <p className="text-center mt-4 fs-3">بسته های موجود</p>
          {packages.map(pac =>
            <PackageComponent
              pac={pac}
              key={pac.name}
              reserved={chosenPackage?.name === pac.name}
              onReserve={() => setChosenPackage(pac)}
            />
          )}
        </> : <>
          <p className="text-center mt-4 fs-3">خدمات موجود</p>
          {services.map(p => <ServiceComp
            service={p}
            onChoose={
              () => setServices(
                ss => ss.map(s => s.name == p.name ? { ...s, chosen: !s.chosen } : s)
              )
            }
            key={p.name}
          />)}
        </>}
      </div>

      <div className="d-flex align-items-baseline mt-5">
        <p className="flex-grow-1">با کلیک روی تایید و ادامه با قوانین و مقررات سایت موافقت کرده‌اید.</p>
        <p className="ms-2">{enDigitToPer(160000)} تومان</p>
        <Button variant="primary" onClick={handleSubmit}>
          تایید و ادامه
        </Button>
      </div>
    </Container>
  )
}

function DayCapacity(p: { day: string, capacity: number, chosen: boolean, onChoose: () => void }) {
  return <Button
    variant={p.chosen ? 'success' : 'outline-primary'}
    className="me-2 text-nowrap" disabled={p.chosen} onClick={p.onChoose}>
    {enDigitToPer(p.day)}
    <br />
    {enDigitToPer(p.capacity)} نفر
  </Button>
}

function ServiceComp(p: { service: ChooseService, onChoose: () => void }) {
  return <div className="d-flex align-items-center border rounded-4 m-2 p-2 flex-wrap">
    <div className="flex-grow-1">
      <p className="fs-2">{p.service.name}</p>
      <p>{p.service.desc}</p>
    </div>
    <div className="ms-3 d-flex flex-column justify-content-center">
      <p>{enDigitToPer(p.service.price)} تومان</p>
      <Button
        variant={p.service.chosen ? 'success' : 'primary'} onClick={p.onChoose}>
        {p.service.chosen ? 'رزرو شد' : 'رزرو کردن'}
      </Button>
    </div>
  </div>
}


function PackageComponent(p: { pac: Package, reserved: boolean, onReserve: () => void }) {
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
      <p className="fs-2">{p.pac.name}</p>
      <p>{p.pac.products.join(', ')}</p>
    </div>
    <div className="ms-3 d-flex flex-column justify-content-center">
      <p>{enDigitToPer(p.pac.price)} تومان</p>
      <Button variant={p.reserved ? 'success' : 'primary'} disabled={p.reserved} onClick={p.onReserve}>
        {p.reserved ? 'رزرو شد' : 'رزرو کردن'}
      </Button>
    </div>
  </div>
}