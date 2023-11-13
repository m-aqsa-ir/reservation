import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { fetchPost, nowPersianDateObject, timestampSecondsToPersianDate } from "@/lib/lib";
import { mdiPlus } from "@mdi/js";
import { PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { Button, Col, Form, FormCheck, Modal, Row, Table } from "react-bootstrap";
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

type DayRow = {
  id: number,
  date: string,
  VIP: boolean,
  capacity: number,
  reservedCap: number
}

const DynamicHead = dynamic(
  () => import('../../components/TableHead'), { ssr: false }
)


export default function AdminDay(props: { days: DayRow[], columnNames: string[] }) {

  const [addMode, setAddMode] = useState(false)
  const [addRowState, setAddRowState] = useState<{
    time: DateObject,
    isVip: boolean,
    capacity: number
  }>({
    time: nowPersianDateObject(),
    capacity: 1,
    isVip: false
  })
  const [days, setDays] = useState(props.days)


  const dispatch: AppDispatch = useDispatch()


  const handleAddRow = async () => {
    const { capacity, isVip, time } = addRowState

    if (capacity == 0) {
      dispatch(showMessage({ message: 'لطفا ظرفیت را وارد کنید!' }))
      return
    }

    const body: AddDayBody = {
      cap: capacity,
      vip: isVip,
      timestamp: time.toUnix(),
      day: time.day,
      month: time.month.number,
      year: time.year,
    }

    const res = await fetchPost('/api/admin/add-day', body)

    if (res.ok) {
      const json = await res.json()

      setDays(ds => [{
        id: json.id,
        capacity,
        date: `${body.year}/${body.month}/${body.day}`,
        reservedCap: 0,
        VIP: isVip
      }, ...ds])

      setAddMode(false)

      setAddRowState(s => ({ ...s, capacity: 1 }))
    } else if (res.status == 400) {
      dispatch(showMessage({ message: 'این تاریخ قبلا انتخاب شده بود' }))
    } else {
      console.log(res.status)
      console.log(await res.text())
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
          {addMode ? <tr>
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
            <td>
              <div className="d-flex justify-content-around">
                <Button size="sm" variant="success" onClick={handleAddRow}>ثبت</Button>
                <Button size="sm" variant="danger" onClick={
                  e => setAddMode(false)
                }>لغو</Button>
              </div>
            </td>
          </tr> : <tr></tr>}
          {days.map(i => <tr key={i.id}>
            <td >{i.id}</td>
            <td >{i.date}</td>
            <td className="text-center w-25">
              <FormCheck checked={i.VIP} disabled />
            </td>
            <td >{i.capacity}</td>
            <td>{i.reservedCap}</td>
            <td></td>
          </tr>)}
        </tbody>
      </Table>
    </div>
  </AdminPagesContainer>
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
          }
        }
      })).map<DayRow>(i => {
        const weekDay = timestampSecondsToPersianDate(i.timestamp)
        return {
          id: i.id,
          date: `${i.year}/${i.month}/${i.day}`,
          VIP: i.isVip,
          capacity: i.maxVolume,
          reservedCap: i.Order.reduce((sum, i) => sum + i.volume, 0)
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

      return {
        props: {
          days, columnNames
        }
      }
    }
  })
}