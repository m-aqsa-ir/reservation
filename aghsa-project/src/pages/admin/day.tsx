import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { nowPersianDateObject, timestampSecondsToPersianDate } from "@/lib/lib";
import { mdiPlus } from "@mdi/js";
import { PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { Button, Form, FormCheck, Modal, Table } from "react-bootstrap";
import { Icon } from '@mdi/react'
import DatePicker, { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { useState } from "react";
import dynamic from "next/dynamic";

type DayRow = {
  id: number,
  date: string,
  VIP: boolean,
  capacity: number
}

const columnNames = [
  'شناسه',
  'تاریخ',
  'VIP',
  'ظرفیت',
  'عملیات'
]

const DynamicHead = dynamic(
  () => import('../../components/TableHead'), { ssr: false }
)

export default function AdminDay(props: { days: DayRow[] }) {

  const [addMode, setAddMode] = useState(false)
  const [addRowState, setAddRowState] = useState<{
    timestamp: number,
    isVip: boolean,
    capacity: number
  }>({
    timestamp: nowPersianDateObject().toUnix() * 1000,
    capacity: 0,
    isVip: false
  })

  return <AdminPagesContainer currentPage="day">
    <div className="d-flex justify-content-end mb-3">
      <Button onClick={() => setAddMode(m => !m)}>
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <Table striped bordered>
      <DynamicHead columnNames={columnNames} />
      <tbody>
        {addMode ? <tr>
          <td >---</td>
          <td >
            <DatePicker
              value={addRowState.timestamp}
              onChange={(d: DateObject) => {
                console.log(d)
                console.log(d.toUnix())
                setAddRowState(k => ({ ...k, timestamp: d.toUnix() * 1000 }))
              }}
              calendar={persianCalendar}
              locale={persian_fa_locale}
            />
          </td>
          <td className="text-center"><FormCheck /></td>
          <td ><Form.Control type="number" /></td>
          <td>
            <div className="d-flex">
              <Button size="sm" variant="success">ثبت</Button>
              <Button size="sm" variant="danger">لغو</Button>
            </div>
          </td>
        </tr> : <tr></tr>}
        {props.days.map(i => <tr key={i.id}>
          <td >{i.id}</td>
          <td >{i.date}</td>
          <td className="text-center w-25">
            <FormCheck checked={i.VIP} disabled />
          </td>
          <td >{i.capacity}</td>
          <td></td>
        </tr>)}
      </tbody>
    </Table>

    {/* <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
      <Modal.Header>
        اضافه کردن روز
      </Modal.Header>
    </Modal> */}
  </AdminPagesContainer>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {
      const prisma = new PrismaClient()

      const days = (await prisma.day.findMany({
        orderBy: { timestamp: 'desc' }
      })).map<DayRow>(i => {
        const weekDay = timestampSecondsToPersianDate(i.timestamp)
        return {
          id: i.id,
          date: `${i.year}/${i.month}/${i.day}`,
          VIP: i.isVip,
          capacity: i.maxVolume,

        }
      })

      return {
        props: {
          days
        }
      }
    }
  })
}