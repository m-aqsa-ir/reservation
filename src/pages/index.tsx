import { Badge, Button, Col, Form, Modal, Nav, Row } from "react-bootstrap";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { enDigit2Per, enNumberTo3DigPer, fetchPost } from "@/lib/lib";
import { useRouter } from "next/router";
import { PageContainer } from "@/components/PageContainer";
import { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { Day, GroupType, Order, PrismaClient, VolumeList, Service as dbService } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { showMessage } from "@/redux/messageSlice";
import Head from "next/head";
import { ChosenBundle, VolumeItem } from "@/types";


const scrollValue = 100

export type NewDay = Day & {
  services: dbService[],
  Order: Order[],
  weekName: string,
  availableWith: null | number,
}


export default function Home(props: IndexPageProps) {

  const [days, setDays] = useState<NewDay[]>([])
  const [chosenDay, setChosenDay] = useState<NewDay | null>(null)
  const packages = () => chosenDay == null ? [] : chosenDay.services.filter(i => i.type == 'package')
  const services = () => chosenDay == null ? [] : chosenDay.services.filter(i => i.type == 'service')

  //: for days require to change volume
  const [changeVolumeMode, setChangeVolumeMode] = useState<NewDay | null>(null)


  const [chosenVolume, setChosenVolume] = useState<VolumeItem | null>(null)
  const [chosenGroup, setChosenGroup] = useState<number>(props.groupTypes[0].id)

  const [servicesOrPackage, setServicesOrPackage] = useState<'package' | 'services'>('package')

  const [chosenServices, setChosenServices] = useState<dbService[]>([])

  const router = useRouter()
  const dispatchMessage: AppDispatch = useDispatch()
  const scrollableRef = useRef<HTMLDivElement | null>(null)

  //: for changing services or packages tabs when one is empty
  useEffect(() => {
    if (services().length == 0) setServicesOrPackage('package')
    else if (packages().length == 0) setServicesOrPackage('services')

    setChosenServices([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenDay])


  function calcPrice() {
    if (!chosenDay || !chosenVolume) return 0
    if (chosenServices.length == 0) return 0

    const discount = chosenVolume.discountPercent
    const volume = chosenVolume.volume

    const wholePrice = chosenServices
      .reduce(
        (sum, i) => (sum + (chosenDay.isVip ? (i.priceVip ?? 0) : i.priceNormal)), 0
      ) * volume

    return wholePrice - (wholePrice * discount / 100)
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

    if (chosenServices.length == 0) {
      dispatchMessage(showMessage({
        message: 'لطفا بسته یا خدمات مورد نظر را انتخاب کنید!'
      }))
      return
    }

    if (chosenServices.filter(i => i.type == 'package').length > 1) {
      dispatchMessage(showMessage({
        message: 'بیش از یک بسته انتخاب شده است!'
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
      package: chosenServices.find(i => i.type == 'package') ?? null,
      services: chosenServices.filter(i => i.type == 'service'),
      groupType: props.groupTypes.find(i => i.id == chosenGroup)!.name,
      volume: chosenVolume,
      calculatePrice
    }

    localStorage.setItem('chosen-bundle', JSON.stringify(chosenBundle))

    router.push('/phone-register')
  }

  async function handleFetchDay(chosenVolume: number) {
    const body = {
      groupId: chosenGroup,
      chosenVolume,
    }
    const res = await fetchPost('/api/suggest', body)

    if (res.ok) {
      const body: NewDay[] = await res.json()
      setDays(body)
    } else {
      setDays([])
    }
  }

  async function handleChangeVol(e: ChangeEvent<HTMLSelectElement>) {

    const eValue: string = e.target.value

    const value: VolumeItem | null = eValue == 'no-value' ?
      null :
      props.volumeList.find(v => v.id == Number(eValue))!

    setChosenVolume(value)

    if (value == null) {
      setDays([])
      setChosenDay(null)
    } else {
      handleFetchDay(props.volumeList.find(v => v.id == Number(eValue))!.volume)
      setChosenDay(null)
    }
  }

  return (
    <PageContainer>
      <Head>
        <title>سامانه اقصی</title>
      </Head>
      {/* choose group */}
      <Nav variant="underline" className="flex-nowrap" activeKey={chosenGroup} onSelect={e => {
        setChosenGroup(Number(e))
        setChosenVolume(null)
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
        onChange={handleChangeVol}>
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
            className="d-flex justify-content-start bg-white flex-grow-1 p-1 overflow-x-scroll tw-touch-pan-x border">
            {days.map(i =>
              <DayCapacity
                chosenVolume={chosenVolume ? chosenVolume.volume : 0}
                key={i.id}
                day={i}
                chosen={i.id == (chosenDay ? chosenDay.id : -1)}
                onChoose={() => {
                  // change services and make them unchosen
                  if (i.availableWith == null) {
                    setChosenDay(i)
                  } else {
                    setChangeVolumeMode(i)
                  }
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
            {packages().length == 0 ? <></> : <Nav.Item>
              <Nav.Link eventKey="package" className="index-nav-item">
                <span >انتخاب بسته</span> (فقط یکی)
              </Nav.Link>
            </Nav.Item>}
            {services().length == 0 ? <></> : <Nav.Item>
              <Nav.Link eventKey="services" className="index-nav-item">
                انتخاب خدمات
              </Nav.Link>
            </Nav.Item>}
          </Nav>

          {/* choose package */}
          {servicesOrPackage == 'package' ?
            packages().map(pac =>
              <PackageComponent
                pac={pac}
                key={pac.name}
                reserved={chosenServices.find(i => i.id == pac.id) != undefined}
                onReserve={() => {
                  const anotherPac = chosenServices.find(i => i.type == 'package')
                  if (anotherPac == undefined) {
                    setChosenServices([...chosenServices, pac])
                  } else if (anotherPac.id != pac.id) {
                    setChosenServices([...chosenServices.filter(i => i.type != 'package'), pac])
                  } else {
                    setChosenServices(chosenServices.filter(i => i.id != pac.id))
                  }
                }}
                vipDay={chosenDay.isVip}
              />
            )
            :
            services().map(s => <PackageComponent
              pac={s}
              vipDay={chosenDay.isVip}
              reserved={chosenServices.find(i => i.id == s.id) != undefined}
              onReserve={() => {
                if (chosenServices.find(j => j.id == s.id) == undefined) {
                  setChosenServices([...chosenServices, s])
                } else {
                  setChosenServices(chosenServices.filter(j => j.id != s.id))
                }
              }}
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

      <Modal show={changeVolumeMode != null} onHide={() => setChangeVolumeMode(null)}>
        <Modal.Body>
          با انتخاب این روز، ظرفیت شما به
          <span className="fw-bold">&nbsp; {enDigit2Per(changeVolumeMode?.availableWith ?? 0)} &nbsp; </span>
          نفر تغییر خواهد کرد.
          آیا مطمئنید؟
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={e => {
              if (changeVolumeMode == null) return

              const chosenVol = props.volumeList.find(i => i.volume == changeVolumeMode.availableWith) ?? null
              if (chosenVol != null) {
                setChosenVolume(chosenVol)
                handleFetchDay(chosenVol.volume)
                setChosenDay(changeVolumeMode)

                setChangeVolumeMode(null)
              }
            }}
          >بله</Button>
        </Modal.Footer>
      </Modal>
    </PageContainer>
  )
}

function DayCapacity(p: {
  day: NewDay
  chosen: boolean,
  onChoose: () => void,
  chosenVolume: number
}) {
  return <Button
    variant={p.chosen ? 'success' : p.day.availableWith != null ? 'outline-info' : 'outline-primary'}
    className={
      "me-2 text-nowrap day-selector-button tw-p-2 " +
      (p.day.availableWith && ' tw-font-black tw-text-cyan-600')
    }
    disabled={p.chosen}
    style={{ position: 'relative' }}
    onClick={p.onChoose}
  >
    {p.day.weekName}{p.day.isVip && <>&nbsp;<Badge bg="danger">VIP</Badge></>}
    <br />

    {enDigit2Per(`${p.day.year}/${p.day.month}/${p.day.day}`)}
    {p.day.desc && <>
      <br />
      {p.day.desc}
    </>}

    {p.day.availableWith == null ? '' : <>
      <br />
      قابل انتخاب با ظرفیت {enDigit2Per(p.day.availableWith)}
    </>}

  </Button>
}


function PackageComponent(p: { pac: dbService, reserved: boolean, onReserve: () => void, vipDay: boolean }) {
  return <Row className="border rounded-4 m-2 p-2">
    <Col md="9">
      <div className="flex-grow-1 text-center text-md-end">
        <p className="fs-2">{p.pac.name}</p>
        <p>{p.pac.desc}</p>
      </div>
    </Col>
    <Col md="3">
      <div className="d-flex flex-column justify-content-center align-items-center">
        <p>{enNumberTo3DigPer(p.vipDay ? (p.pac.priceVip ?? 0) : p.pac.priceNormal)} تومان</p>
        <Button variant={p.reserved ? 'success' : 'primary'} onClick={p.onReserve} className="w-100">
          {p.reserved ? 'رزرو شد' : 'رزرو کردن'}
        </Button>
      </div>
    </Col>

  </Row>
}

type IndexPageProps = {
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
      volumeList,
      groupTypes
    } satisfies IndexPageProps
  }
}