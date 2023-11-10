import { Button, Form, Nav } from "react-bootstrap";
import { useRef, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiHumanFemaleFemale,
  mdiHumanMaleFemaleChild,
  mdiHumanMaleMale
} from "@mdi/js";
import { dayCapToStr, enDigitToPer } from "@/lib/lib";
import { useRouter } from "next/router";
import { PageContainer } from "@/components/PageContainer";
import {
  ChooseAbleService,
  ChosenBundle,
  Day,
  DayService,
  GroupTypes,
  OurPackage,
  Service,
  VolumeItem
} from "@/types";
import { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { showMessage } from "@/redux/messageSlice";


const scrollValue = 100


export default function Home(props: { dayServices: DayService[], volumeList: VolumeItem[] }) {

  const [packages, setPackages] = useState<OurPackage[]>([])
  const [services, setServices] = useState<ChooseAbleService[]>([])

  const [servicesOrPackage, setServicesOrPackage] = useState<'package' | 'services'>('package')

  const dispatchMessage: AppDispatch = useDispatch()

  const [chosenPackage, setChosenPackage] = useState<OurPackage | null>(null)
  const [chosenDay, setChosenDay] = useState<Day | null>(null)
  const [chosenGroup, setChosenGroup] = useState<GroupTypes>('family')
  const [chosenVolume, setChosenVolume] = useState<VolumeItem | null>(null)

  const router = useRouter()
  const scrollableRef = useRef<HTMLDivElement | null>(null)


  function calcPrice() {
    if (!chosenDay || !chosenVolume) return 0

    const discount = chosenVolume.discountPercent

    if (servicesOrPackage == 'package')
      if (chosenPackage == null) return 0
      else return chosenPackage.price - (discount / 100 * chosenPackage.price)
    else
      if (services.length == 0) return 0
      else {
        const value = services.filter(s => s.chosen).reduce((sum, i) => sum + i.price, 0)
        return value - (discount / 100 * value)
      }
  }

  function handleSubmit() {
    if (chosenVolume == null) {
      dispatchMessage(showMessage({
        message: 'لطفا تعداد افراد را انتخاب کنید!'
      }))
      return
    }
    if (chosenDay == null) {
      dispatchMessage(showMessage({
        message: 'لطفا روز را انتخاب کنید!'
      }))
      return
    }

    if (servicesOrPackage == 'package') {
      if (chosenPackage == null) {
        dispatchMessage(showMessage({
          message: 'لطفا بسته مورد نظر را انتخاب کنید!'
        }))
        return
      }
    } else if (!services.some(s => s.chosen)) {
      dispatchMessage(showMessage({
        message: 'لطفا خدمات مورد نظر را انتخاب کنید!'
      }))
      return
    }

    const now = new DateObject({
      locale: persian_fa_locale,
      calendar: persianCalendar
    })

    const chosenBundle: ChosenBundle = {
      day: chosenDay,
      pac: servicesOrPackage == 'package' ? chosenPackage! : services.filter(i => i.chosen),
      groupType: chosenGroup,
      volume: chosenVolume,
      calculatePrice: calcPrice()
    }

    localStorage.setItem('chosen-bundle', JSON.stringify(chosenBundle))

    router.push('/phone-register')
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
      <Form.Select
        className="mt-3"
        value={chosenVolume == null ? 'no-value' : chosenVolume.id}
        onChange={e => {
          const eValue: string = e.target.value

          const value: VolumeItem | null = eValue == 'no-value' ?
            null :
            props.volumeList.find(v => v.id == Number(eValue))!

          setChosenVolume(value)

          if (
            value != null &&
            chosenDay != null &&
            chosenDay.capacity < value.volume
          ) {
            setServices([])
            setPackages([])
            setChosenDay(null)
          }
        }}>
        <option value='no-value'>انتخاب ظرفیت</option>
        {props.volumeList.map(i =>
          <option key={i.id} value={i.id}>{enDigitToPer(i.volume)} نفر &nbsp;&nbsp;-&nbsp;&nbsp; {enDigitToPer(i.discountPercent)}% تخفیف</option>
        )}
      </Form.Select>

      {/* choose day */}
      {chosenVolume == null ?
        <></>
        : <div className="d-flex align-items-stretch border rounded-4 mt-2">
          <button className="bg-white border-0 rounded-end-4" onClick={() => {
            scrollableRef.current!.scrollLeft = scrollableRef.current!.scrollLeft + scrollValue
          }}>
            <i className="bi bi-chevron-right"></i>
          </button>
          <div
            ref={scrollableRef}
            style={{ scrollBehavior: 'smooth' }}
            className="d-flex justify-content-start bg-white flex-grow-1 p-2 overflow-x-scroll">
            {props.dayServices.map(i =>
              <DayCapacity
                chosenCapacity={chosenVolume ? chosenVolume.volume : 0}
                key={dayCapToStr(i.day)}
                day={dayCapToStr(i.day)}
                capacity={i.day.capacity}
                chosen={dayCapToStr(i.day) === dayCapToStr(chosenDay)}
                onChoose={() => {
                  // change services and make them unchosen
                  setServices(i.services.map(s => ({ ...s, chosen: false })))
                  setPackages(i.packages)
                  setChosenPackage(null)
                  setChosenDay(i.day)
                }}
              />
            )}
          </div>
          <button className="bg-white border-0 rounded-start-4" onClick={() => {
            scrollableRef.current!.scrollLeft = scrollableRef.current!.scrollLeft - scrollValue
          }}>
            <i className="bi bi-chevron-left"></i>
          </button>
        </div>}

      {/* choose package or service(s) */}
      <div className="border rounded-4 mt-2">
        {chosenDay == null || chosenVolume == null ? <></> : <>
          <Nav variant="underline" fill activeKey={servicesOrPackage} onSelect={e => {
            setChosenPackage(null)
            setServices(ps => ps.map(p => ({ ...p, chosen: false })))
            setServicesOrPackage(e as 'package' | 'services')
          }}>
            <Nav.Item>
              <Nav.Link eventKey="package">
                <span className="fs-5">انتخاب بسته</span> (فقط یکی)
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link className="fs-5" eventKey="services">
                انتخاب خدمات
              </Nav.Link>
            </Nav.Item>
          </Nav>
          {/* choose package */}

          {servicesOrPackage == 'package' ?
            <>
              {packages.length == 0 ?
                <p className="text-center mt-4 fs-5">بسته ای موجود نیست</p>
                :
                <>
                  <p className="text-center mt-4 fs-3">بسته های موجود</p>
                  {packages.map(pac =>
                    <PackageComponent
                      pac={pac}
                      key={pac.name}
                      reserved={chosenPackage?.name === pac.name}
                      onReserve={() => setChosenPackage(pac)}
                    />
                  )}
                </>
              }
            </>
            :
            <>
              {services.length == 0 ?
                <p className="text-center mt-4 fs-5">خدمتی موجود نیست</p>
                :
                <>
                  <p className="text-center mt-4 fs-3">خدمات موجود</p>
                  {services.map(s => <ServiceComp
                    service={s}
                    onChoose={() => setServices(
                      ss => ss.map(k => k.name == s.name ? { ...k, chosen: !k.chosen } : k)
                    )}
                    key={s.name} />)}
                </>
              }
            </>}
        </>}
      </div>

      {/* end */}
      <div className="d-flex align-items-baseline mt-5">
        <p className="flex-grow-1">با کلیک روی تایید و ادامه با قوانین و مقررات سایت موافقت کرده‌اید.</p>
        <p className="ms-2">{enDigitToPer(calcPrice())} تومان</p>
        <Button variant="primary" onClick={handleSubmit}>
          تایید و ادامه
        </Button>
      </div>
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

function ServiceComp(p: { service: ChooseAbleService, onChoose: () => void }) {
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


function PackageComponent(p: { pac: OurPackage, reserved: boolean, onReserve: () => void }) {
  return <div className="d-flex align-items-center border rounded-4 m-2 p-2 flex-wrap">
    <div className="flex-grow-1">
      <p className="fs-2">{p.pac.name}</p>
      <p>{p.pac.desc}</p>
    </div>
    <div className="ms-3 d-flex flex-column justify-content-center">
      <p>{enDigitToPer(p.pac.price)} تومان</p>
      <Button variant={p.reserved ? 'success' : 'primary'} disabled={p.reserved} onClick={p.onReserve}>
        {p.reserved ? 'رزرو شد' : 'رزرو کردن'}
      </Button>
    </div>
  </div>
}

export const getServerSideProps: GetServerSideProps = async () => {
  const db = new PrismaClient()

  //: check auth TODO
  /* if (context.req.cookies['auth']) {
    const authToken = context.req.cookies['auth']


    try {
      const payload = verify(authToken, process.env.AUTH_JWT_KEY!)

      return {
        redirect: {
          destination: '/'
        }
      }
      }
    } catch (error) {
      if (error instanceof TokenExpiredError)  {

      } else if (error instanceof JsonWebTokenError) {
        
      }
    } */

  const now = new DateObject({ calendar: persianCalendar, locale: persian_fa_locale })
  const nowTimestamp = now.toUnix()

  const days = await db.day.findMany({
    where: {
      timestamp: { gte: nowTimestamp }
    },
    include: {
      services: true,
      Order: true
    }
  })

  const dayServices: DayService[] = days.map<DayService>(d => {
    const reservedVol = d.Order.reduce((acc, v) => acc + v.volume, 0)
    const remainedVol = d.maxVolume - reservedVol

    return {
      day: {
        capacity: remainedVol,
        day: d.day,
        month: d.month,
        year: d.year,
        weekName: new DateObject({
          locale: persian_fa_locale, calendar: persianCalendar,
          day: d.day, month: d.month, year: d.year
        }).weekDay.name,
        isVip: d.isVip,
      },
      services: d.services.filter(i => i.type == 'service').map<Service>(i => ({
        id: i.id,
        name: i.name,
        desc: i.desc ?? "",
        price: i.priceNormal
      })),
      packages: d.services.filter(i => i.type == 'package').map<OurPackage>(i => ({
        id: i.id,
        name: i.name,
        price: d.isVip ? i.priceNormal : i.priceNormal,
        desc: i.desc ?? ""
      }))
    }
  })

  const volumeList = await db.volumeList.findMany()

  return { props: { dayServices, volumeList } }
}