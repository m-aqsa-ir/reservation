import { Button, Col, Form, Nav, Row } from "react-bootstrap";
import { useRef, useState } from "react";
import Icon from "@mdi/react";
import { day2Str, enDigit2Per, includesId, enNumberTo3DigPer, orderStatusEnum, timestampScnds2PerDate } from "@/lib/lib";
import { useRouter } from "next/router";
import { PageContainer } from "@/components/PageContainer";
import { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { GroupType, PrismaClient, VolumeList } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { showMessage } from "@/redux/messageSlice";
import Head from "next/head";


const scrollValue = 100


export default function Home(props: IndexPageProps) {

  const [packages, setPackages] = useState<OurPackage[]>([])
  const [services, setServices] = useState<ChooseAbleService[]>([])

  const [servicesOrPackage, setServicesOrPackage] = useState<'package' | 'services'>('package')

  const dispatchMessage: AppDispatch = useDispatch()

  const [chosenPackage, setChosenPackage] = useState<OurPackage | null>(null)
  const [chosenDay, setChosenDay] = useState<Day | null>(null)
  const [chosenGroup, setChosenGroup] = useState<number>(props.groupTypes[0].id)
  const [chosenVolume, setChosenVolume] = useState<VolumeItem | null>(null)

  const router = useRouter()
  const scrollableRef = useRef<HTMLDivElement | null>(null)


  function calcPrice() {
    if (!chosenDay || !chosenVolume) return 0

    const discount = chosenVolume.discountPercent
    const volume = chosenVolume.volume

    const packagePrice = chosenPackage == null ?
      0 :
      (chosenDay.isVip ? chosenPackage.priceVip : chosenPackage.price) * volume;

    const servicesPrice = (
      services.filter(s => s.chosen).reduce((sum, i) => (
        sum + (chosenDay.isVip ? i.priceVip : i.price)
      ), 0)
    ) * volume

    const wholePrice = packagePrice + servicesPrice

    return wholePrice - (discount / 100 * wholePrice)
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

    if (chosenPackage == null && services.every(i => !i.chosen)) {
      dispatchMessage(showMessage({
        message: 'لطفا بسته یا خدمات مورد نظر را انتخاب کنید!'
      }))
      return
    }

    const now = new DateObject({
      locale: persian_fa_locale,
      calendar: persianCalendar
    })


    const calculatePrice = calcPrice()

    const chosenBundle: ChosenBundle = {
      day: chosenDay,
      pac: chosenPackage,
      services: services.filter(i => i.chosen),
      groupType: props.groupTypes.find(i => i.id == chosenGroup)!.name,
      volume: chosenVolume,
      calculatePrice
    }

    localStorage.setItem('chosen-bundle', JSON.stringify(chosenBundle))

    router.push('/phone-register')
  }

  return (
    <PageContainer>
      <Head>
        <title>سامانه اقصی</title>
      </Head>
      {/* choose group */}
      <Nav variant="underline" className="flex-nowrap" activeKey={chosenGroup} onSelect={e => {
        setChosenGroup(Number(e))
      }} fill>
        {props.groupTypes.map(i =>
          <Nav.Item key={i.id}>
            <Nav.Link eventKey={`${i.id}`}>
              <Icon path={i.iconPath} style={{ width: '2rem', height: '2rem' }} />
              <div>{i.name}</div>
            </Nav.Link>
          </Nav.Item>
        )}
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
          <option key={i.id} value={i.id}>{enDigit2Per(i.volume)} نفر {i.discountPercent == 0 ? '' : <>
            &nbsp;&nbsp;-&nbsp;&nbsp; {enDigit2Per(i.discountPercent)}% تخفیف
          </>}</option>
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
            className="d-flex justify-content-start bg-white flex-grow-1 p-1 overflow-x-scroll tw-touch-pan-x">
            {props.dayServices.filter(i => includesId(i.groupTypes, chosenGroup)).map(i =>
              <DayCapacity
                chosenVolume={chosenVolume ? chosenVolume.volume : 0}
                key={i.day.id}
                day={i.day}
                chosen={i.day.id == chosenDay?.id}
                onChoose={() => {
                  // change services and make them unchosen
                  setServices(i.services.map(s => ({ ...s, chosen: false })))
                  setPackages(i.packages)
                  setChosenPackage(null)
                  setChosenDay(i.day)

                  if (i.services.length == 0) setServicesOrPackage('package')
                  else if (i.packages.length == 0) setServicesOrPackage('services')
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
          <Nav
            variant="underline" fill
            className="mb-4"
            activeKey={servicesOrPackage} onSelect={e => {
              setServicesOrPackage(e as 'package' | 'services')
            }}
          >
            {packages.length == 0 ? <></> : <Nav.Item>
              <Nav.Link eventKey="package" className="index-nav-item">
                <span >انتخاب بسته</span> (فقط یکی)
              </Nav.Link>
            </Nav.Item>}
            {services.length == 0 ? <></> : <Nav.Item>
              <Nav.Link eventKey="services" className="index-nav-item">
                انتخاب خدمات
              </Nav.Link>
            </Nav.Item>}
          </Nav>

          {/* choose package */}
          {servicesOrPackage == 'package' ?
            packages.map(pac =>
              <PackageComponent
                pac={pac}
                key={pac.name}
                reserved={chosenPackage?.name === pac.name}
                onReserve={() => {
                  if (chosenPackage && chosenPackage.id == pac.id) {
                    setChosenPackage(null)
                  } else {
                    setChosenPackage(pac)
                  }
                }}
                vipDay={chosenDay.isVip}
              />
            )
            :
            services.map(s => <PackageComponent
              pac={s as OurPackage}
              vipDay={chosenDay.isVip}
              reserved={s.chosen}
              onReserve={() => setServices(
                ss => ss.map(k => k.name == s.name ? { ...k, chosen: !k.chosen } : k)
              )}
              key={s.name} />)}
        </>}
      </div>

      {/* end */}
      <Row className="align-items-baseline mt-3 rounded-4 index-end-part">

        <Col lg="6" className="mb-lg-0 mb-3">
          <p
            className="flex-grow-1 text-center mb-0 text-lg-end"
            style={{ fontSize: '0.7rem' }}>با کلیک روی تایید و ادامه با قوانین و مقررات سایت موافقت کرده‌اید.</p>
        </Col>
        <Col lg="6" className="d-flex">
          <Button variant="primary" onClick={handleSubmit} className="w-100" disabled={calcPrice() == 0}>
            <span className="ms-2">{enNumberTo3DigPer(calcPrice())} تومان</span>
            - تایید و ادامه
          </Button>
        </Col>

      </Row>
    </PageContainer>
  )
}

function DayCapacity(p: {
  // day: string,
  // capacity: number,
  day: Day
  chosen: boolean,
  onChoose: () => void,
  chosenVolume: number
}) {
  return <Button
    variant={p.chosen ? 'success'
      : p.chosenVolume > p.day.capacity ? 'danger' : 'outline-primary'}
    className="me-2 text-nowrap day-selector-button"
    disabled={p.chosen || p.chosenVolume > p.day.capacity}
    onClick={p.onChoose}>
    {enDigit2Per(day2Str(p.day))}
    <br />
    {enDigit2Per(p.day.capacity)} نفر {p.day.isVip ? ' - VIP' : ''}
    <br />
    {p.day.desc}
  </Button>
}


function PackageComponent(p: { pac: OurPackage, reserved: boolean, onReserve: () => void, vipDay: boolean }) {
  return <Row className="border rounded-4 m-2 p-2">
    <Col md="9">
      <div className="flex-grow-1 text-center text-md-end">
        <p className="fs-2">{p.pac.name}</p>
        <p>{p.pac.desc}</p>
      </div>
    </Col>
    <Col md="3">
      <div className="d-flex flex-column justify-content-center align-items-center">
        <p>{enNumberTo3DigPer(p.vipDay ? p.pac.priceVip : p.pac.price)} تومان</p>
        <Button variant={p.reserved ? 'success' : 'primary'} onClick={p.onReserve} className="w-100">
          {p.reserved ? 'رزرو شد' : 'رزرو کردن'}
        </Button>
      </div>
    </Col>

  </Row>
}

type IndexPageProps = {
  dayServices: DayService[]
  volumeList: VolumeList[],
  groupTypes: GroupType[]
}

export const getServerSideProps: GetServerSideProps = async () => {
  const prisma = new PrismaClient()

  const appConfig = await prisma.appConfig.findFirst()

  if (appConfig == null) {
    return {
      redirect: {
        destination: '/not-ready',
      }, props: {}
    }
  }

  const now = new DateObject({ calendar: persianCalendar, locale: persian_fa_locale })
  //: find the start of now day
  now.setHour(0)
  now.setMinute(0)
  now.setSecond(0)
  now.setMillisecond(0)
  //: we can choose a day how many days before it at least
  now.add(appConfig.daysBeforeDayToReserve, 'day')

  const days = await prisma.day.findMany({
    where: {
      timestamp: { gte: now.toUnix() }
    },
    include: {
      services: true,
      Order: {
        where: { orderStatus: orderStatusEnum.reserved }
      },
      GroupTypes: true
    },
    orderBy: {
      timestamp: 'asc'
    }
  })


  const dayServices: DayService[] = days.map(d => {
    const reservedVol = d.Order.reduce((acc, v) => acc + v.volume, 0)
    const remainedVol = d.maxVolume - reservedVol

    return {
      day: {
        id: d.id,
        capacity: remainedVol,
        desc: d.desc,
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
        price: i.priceNormal,
        priceVip: i.priceVip ?? i.priceNormal
      })),
      groupTypes: d.GroupTypes,
      packages: d.services.filter(i => i.type == 'package').map<OurPackage>(i => ({
        id: i.id,
        name: i.name,
        price: d.isVip ? i.priceNormal : i.priceNormal,
        desc: i.desc ?? "",
        priceVip: i.priceVip ?? i.priceNormal
      })),

    }
  }).filter(d => d.day.capacity != 0)

  const volumeList = await prisma.volumeList.findMany()
  const groupTypes = await prisma.groupType.findMany()

  if (volumeList.length == 0 && groupTypes.length == 0) {
    return {
      props: {},
      redirect: {
        destination: '/not-ready'
      }
    }
  }


  return {
    props: {
      dayServices,
      volumeList,
      groupTypes
    } satisfies IndexPageProps
  }
}