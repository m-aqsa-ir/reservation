import { Button, Container, Form, ListGroup, ListGroupItem, Modal, Nav } from "react-bootstrap";
import _ from 'lodash'
import { useContext, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiHumanFemaleFemale, mdiHumanMaleFemaleChild, mdiHumanMaleMale } from "@mdi/js";
import { dayCapToStr, enDigitToPer } from "@/lib/lib";
import { ChosenServiceContext } from "@/components/ChosenServiceProvider";
import { useRouter } from "next/router";
import { PageContainer } from "@/components/PageContainer";

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
    { month: '1', day: '25', capacity: 60, weekName: 'شنبه' }, { month: '1', day: '26', capacity: 45, weekName: 'یکشنبه' },
    { month: '1', day: '27', capacity: 48, weekName: 'شنبه' }, { month: '1', day: '28', capacity: 60, weekName: 'یکشنبه' },
    { month: '1', day: '29', capacity: 62, weekName: 'شنبه' }, { month: '1', day: '31', capacity: 70, weekName: 'یکشنبه' },
    { month: '2', day: '01', capacity: 71, weekName: 'شنبه' }, { month: '1', day: '02', capacity: 80, weekName: 'یکشنبه' },
    { month: '1', day: '03', capacity: 100, weekName: 'شنبه' }, { month: '1', day: '04', capacity: 120, weekName: 'یکشنبه' },
  ])
  const [chosenDay, setChosenDay] = useState<DayCap | null>(null)
  const [chosenGroup, setChosenGroup] = useState<GroupTypes>('family')
  const [peopleCount, setPeopleCount] = useState<number | 'no-value'>('no-value')
  const [errorState, setErrorState] = useState({
    show: false,
    message: ''
  })

  const router = useRouter()

  function handleSubmit() {
    if (peopleCount == 'no-value') {
      setErrorState({ show: true, message: 'لطفا تعداد افراد را انتخاب کنید!' })
      return
    }
    if (chosenDay == null) {
      setErrorState({ show: true, message: 'لطفا روز را انتخاب کنید!' })
      return
    }

    if (packageOrProduct == 'package') {
      if (chosenPackage == null) {
        setErrorState({ show: true, message: 'لطفا بسته مورد نظر را انتخاب کنید!' })
        return
      }
    } else if (!services.some(s => s.chosen)) {
      setErrorState({ show: true, message: 'لطفا خدمات مورد نظر را انتخاب کنید!' })
      return
    }

    localStorage.setItem('chosen-service', JSON.stringify({
      pac: packageOrProduct == 'package' ? chosenPackage : services.filter(i => i.chosen),
      day: chosenDay,
      group: chosenGroup,
      peopleCount
    }))

    router.push('/submit')
  }

  return (
    <PageContainer>
      {/* choose group */}
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

      {/* choose people count */}
      <Form.Select className="mt-3" value={peopleCount} onChange={e => {
        const value: number | 'no-value' = e.target.value
          === 'no-value' ? e.target.value : Number(e.target.value)
        setPeopleCount(value)
        if (value != 'no-value' && chosenDay != null && chosenDay.capacity < value) {
          setChosenDay(null)
        }
      }}>
        <option value='no-value'>انتخاب ظرفیت</option>
        {[45, 60, 70, 100].map(i => <option key={i} value={i}>{enDigitToPer(i)}</option>)}
      </Form.Select>

      {/* choose day */}
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
              chosenCapacity={peopleCount == 'no-value' ? NaN : peopleCount}
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

      {/* choose package or service(s) */}
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
        {/* choose package */}
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
        </> :/* choose service */ <>
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

      {/* end */}
      <div className="d-flex align-items-baseline mt-5">
        <p className="flex-grow-1">با کلیک روی تایید و ادامه با قوانین و مقررات سایت موافقت کرده‌اید.</p>
        <p className="ms-2">{enDigitToPer(160000)} تومان</p>
        <Button variant="primary" onClick={handleSubmit}>
          تایید و ادامه
        </Button>
      </div>

      {/* modal for showing errors */}
      <Modal
        style={{ fontFamily: 'ir-sans' }}
        show={errorState.show}
        onHide={() => { setErrorState({ show: false, message: '' }) }}>
        <Modal.Header className="bg-danger">
          <Modal.Title>خطا</Modal.Title>
        </Modal.Header>
        <Modal.Body>{errorState.message}</Modal.Body>
      </Modal>
    </PageContainer>
  )
}

function DayCapacity(p: {
  day: string,
  capacity: number,
  chosen: boolean,
  onChoose: () => void,
  chosenCapacity: number
}) {
  return <Button
    variant={p.chosen ? 'success'
      : p.chosenCapacity > p.capacity ? 'danger' : 'outline-primary'}
    className="me-2 text-nowrap"
    disabled={p.chosen || p.chosenCapacity > p.capacity}
    onClick={p.onChoose}>
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