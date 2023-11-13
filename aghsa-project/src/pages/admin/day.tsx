import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { fetchPost, nowPersianDateObject, timestampSecondsToPersianDate } from "@/lib/lib";
import { mdiCancel, mdiCheck, mdiCross, mdiPen, mdiPlus } from "@mdi/js";
import { PrismaClient, Service } from "@prisma/client";
import { GetServerSideProps } from "next";
import { Button, Col, Form, FormCheck, FormControl, Modal, Row, Table } from "react-bootstrap";
import { Icon } from '@mdi/react'
import DatePicker, { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { useState } from "react";
import dynamic from "next/dynamic";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { AddDayBody } from "../api/admin/add-day";
import { showMessage } from "@/redux/messageSlice";
import { IconButton } from "@/components/IconButton";

type DayRow = {
  id: number,
  date: string,
  VIP: boolean,
  capacity: number,
  reservedCap: number,
  services: Service[]
}

type AdminDayProps = {
  days: DayRow[],
  columnNames: string[],
  services: Service[]
}

const DynamicHead = dynamic(
  () => import('../../components/TableHead'), { ssr: false }
)


export default function AdminDay(props: AdminDayProps) {

  const [addMode, setAddMode] = useState(false)
  const [days, setDays] = useState<(DayRow)[]>(props.days)
  const [lastAddRowDate, setLastAddRowDate] = useState<DateObject | null>(null)



  const [rowEditMode, setRowEditMode] = useState<{
    id: number,
    capacity: number
  } | null>(null)


  const dispatch: AppDispatch = useDispatch()


  const handleAddRow = async (addRowState: AddRowState) => {
    const { capacity, isVip, time } = addRowState

    if (capacity <= 0) {
      dispatch(showMessage({ message: 'لطفا ظرفیت را درست وارد کنید!' }))
      return
    }

    const body: AddDayBody = {
      cap: capacity,
      vip: isVip,
      timestamp: time.toUnix(),
      day: time.day,
      month: time.month.number,
      year: time.year,
      serviceIds: addRowState.services.map(i => i.id)
    }

    const res = await fetchPost('/api/admin/add-day', body)

    if (res.ok) {
      const json = await res.json()

      setDays(ds => [{
        id: json.id,
        capacity,
        date: `${time.year}/${time.month}/${time.day}`,
        reservedCap: 0,
        VIP: isVip,
        editMode: false
        , services: addRowState.services
      }, ...ds])

      setAddMode(false)

      setLastAddRowDate(addRowState.time)
    } else if (res.status == 400) {
      dispatch(showMessage({ message: 'این تاریخ قبلا انتخاب شده بود' }))
    } else {
      console.log(res.status)
      console.log(await res.text())
    }
  }

  const handleEditRow = async () => {
    if (!rowEditMode) return

    if (rowEditMode.capacity <= 0) {
      dispatch(showMessage({ message: 'لطفا ظرفیت را درست انتخاب نمایید!' }))
      return
    }

    const body = {
      id: rowEditMode.id,
      cap: rowEditMode.capacity
    }

    const res = await fetchPost('/api/admin/edit-day', body)

    if (res.ok) {
      setDays(ds => ds.map(i => {
        if (i.id == body.id)
          return { ...i, capacity: body.cap }
        else return i
      }))
      setRowEditMode(null)
    } else if (res.status == 403) {
      dispatch(showMessage({ message: 'مقدار انتخابی، از مجموع حجم سفارشات پرداخت شده کمتر است.' }))
    }
  }

  return <AdminPagesContainer currentPage="day">
    <div className="d-flex justify-content-end mb-3">
      <Button onClick={() => setAddMode(m => !m)}>
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {addMode ? <AddRow
            hideAddRow={() => setAddMode(false)}
            handleAddRow={handleAddRow}
            lastAddRowDate={lastAddRowDate}
            services={props.services}
            tableColumns={props.columnNames.length}
          />
            :
            <tr></tr>}
          {days.map(i => <>
            <tr key={i.id}>
              <td >{i.id}</td>
              <td >{i.date}</td>
              <td className="text-center w-25">
                <FormCheck checked={i.VIP} disabled />
              </td>
              <td >{rowEditMode && rowEditMode.id == i.id ?
                <FormControl
                  type="number"
                  min={0}
                  className="text-center"
                  value={rowEditMode.capacity}
                  onChange={e => setRowEditMode(m => ({
                    id: m!.id, capacity: Number(e.target.value)
                  }))}
                />
                :
                <span>{i.capacity}</span>
              }</td>
              <td>{i.reservedCap}</td>
              <td>
                <div className="d-flex justify-content-around">
                  {rowEditMode && rowEditMode.id == i.id ?
                    <>
                      <IconButton variant="danger" iconPath={mdiCancel} onClick={e => setRowEditMode(null)} />
                      <IconButton variant="success" iconPath={mdiCheck} onClick={handleEditRow} />
                    </>
                    :
                    <IconButton iconPath={mdiPen} variant="info" onClick={e => {
                      if (rowEditMode)
                    /* if (rowEditMode.id == i.id) setRowEditMode(null)
                    else  */setRowEditMode({ id: i.id, capacity: i.capacity })
                      else setRowEditMode({ id: i.id, capacity: i.capacity })
                    }} />}
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={props.columnNames.length}>
                <div className="d-flex">
                  <span>سرویس ها: {i.
                    services.
                    filter(j => j.type == 'service').
                    map(j => j.name).
                    join(', ')}</span>
                  &nbsp;||&nbsp;
                  <span>پکیج ها: {i.
                    services.
                    filter(j => j.type == 'package').
                    map(j => j.name).
                    join(', ')}</span>
                </div>
              </td>
            </tr>
          </>)}
        </tbody>
      </Table>
    </div>
  </AdminPagesContainer>
}

type AddRowState = {
  time: DateObject,
  isVip: boolean,
  capacity: number
  services: Service[]
}

function AddRow(props: {
  hideAddRow: () => void, handleAddRow: (a: AddRowState) => void,
  lastAddRowDate: DateObject | null,
  tableColumns: number,
  services: Service[]
}) {
  const [addRowState, setAddRowState] = useState<AddRowState>({
    time: props.lastAddRowDate ?? nowPersianDateObject(),
    capacity: 1,
    isVip: false,
    services: []
  })

  const [selectableServices, setSelectableServices] = useState<
    (Service & { select: boolean })[]
  >(props.services.map(i => ({ ...i, select: false })))


  return <>
    <tr>
      <td > --- </td>
      <td >
        <DatePicker
          value={addRowState.time}
          onChange={(d: DateObject) => {
            setAddRowState(k => ({ ...k, time: d }))
          }}
          calendar={persianCalendar}
          locale={persian_fa_locale}
        />
      </td>
      <td className="text-center"><FormCheck
        checked={addRowState.isVip}
        onChange={() => setAddRowState(s => ({ ...s, isVip: !s.isVip }))}
      /></td>
      <td ><Form.Control
        type="number" min={1}
        value={addRowState.capacity}
        onChange={e => setAddRowState(s => ({
          ...s, capacity: Number(e.target.value)
        }))}
      /></td>
      <td> --- </td>
      <td rowSpan={2}>
        <div className="d-flex justify-content-around">
          <Button variant="success" onClick={e => props.handleAddRow({ ...addRowState, services: selectableServices.filter(i => i.select) })}>ثبت</Button>
          <Button variant="danger" onClick={props.hideAddRow}>لغو</Button>
        </div>
      </td>
    </tr>
    <tr>
      <td colSpan={props.tableColumns - 1}>
        <Row>
          <Col md="6">
            <p>بسته ها</p>
            <hr />
            <div>
              {selectableServices.filter(i => i.type == 'package').map(i => <div key={i.id} className="d-flex">
                <Form.Check
                  checked={i.select}
                  onChange={e => setSelectableServices(xs => xs.map(x => x.id == i.id ? { ...x, select: !x.select } : x))} />
                &nbsp;
                <Form.Label>{i.name}</Form.Label>
              </div>)}
            </div>
          </Col>
          <Col md="6">
            <p>خدمات</p>
            <hr />
            <div>
              {selectableServices.filter(i => i.type == 'service').map(i => <div key={i.id} className="d-flex">
                <Form.Check
                  checked={i.select}
                  onChange={e => setSelectableServices(xs => xs.map(x => x.id == i.id ? { ...x, select: !x.select } : x))} />
                &nbsp;
                <Form.Label>{i.name}</Form.Label>
              </div>)}
            </div>
          </Col>
        </Row>
        <hr />
      </td>

    </tr>
  </>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {
      const prisma = new PrismaClient()

      const days = (await prisma.day.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
          Order: {
            where: { status: "paid" }
          },
          services: true
        }
      })).map<DayRow>(i => {
        const weekDay = timestampSecondsToPersianDate(i.timestamp)
        return {
          id: i.id,
          date: `${i.year}/${i.month}/${i.day}`,
          VIP: i.isVip,
          capacity: i.maxVolume,
          reservedCap: i.Order.reduce((sum, i) => sum + i.volume, 0),
          services: i.services
        }
      })

      const columnNames = [
        'شناسه',
        'تاریخ',
        'VIP',
        'ظرفیت',
        'ظرفیت استفاده شده',
        'عملیات'
      ]

      const services = await prisma.service.findMany()

      return {
        props: {
          days, columnNames, services
        }
      } satisfies { props: AdminDayProps }
    }
  })
}