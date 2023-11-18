import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigit2Per, fetchPost, nowPersianDateObject, timestampScnds2PerDate } from "@/lib/lib";
import { mdiBasketUnfill, mdiCancel, mdiCheck, mdiPen, mdiPlus, mdiTrashCan } from "@mdi/js";
import { PrismaClient } from "@prisma/client";
import type { GroupType, Service } from '@prisma/client';
import { GetServerSideProps } from "next";
import { Button, Col, Form, FormCheck, FormControl, Row, Table } from "react-bootstrap";
import { Icon } from '@mdi/react'
import DatePicker, { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { Fragment, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { AddDayBody } from "../api/admin/add-day";
import { showMessage } from "@/redux/messageSlice";
import { IconButton } from "@/components/IconButton";
import { EditDayBody } from "../api/admin/edit-day";
import { AreYouSure } from "@/components/AreYouSure";
import { useRouter } from "next/router";
import { DynamicHead } from "@/components/DynamicHead";
import Link from "next/link";
import { MyPaginator } from "@/components/MyPaginator";
import Head from "next/head";

type DayRow = {
  id: number,
  date: string,
  desc: string,
  VIP: boolean,
  capacity: number,
  reservedCap: number,
  services: Service[],
  groups: GroupType[]
}

type AdminDayProps = {
  days: DayRow[],
  columnNames: string[],
  services: Service[],
  groupTypes: GroupType[],
  page: PaginatorState
}

type AddRowArguments = {
  time: DateObject,
  isVip: boolean,
  capacity: number,
  desc: string,
  services: Service[],
  groupTypes: GroupType[]
}

export default function AdminDay(props: AdminDayProps) {

  const [addMode, setAddMode] = useState(false)
  const [days, setDays] = useState(props.days)
  const [lastAddRowDate, setLastAddRowDate] = useState<DateObject | null>(null)
  const [rowEditMode, setRowEditMode] = useState<{
    id: number,
    capacity: number,
    isVip: boolean,
    services: (Service & { select: boolean })[],
    groupIds: number[],
    desc: string,
  } | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const dispatch: AppDispatch = useDispatch()
  const router = useRouter()


  const handleAddRow = async (addRowState: AddRowArguments) => {
    const { capacity, isVip, time, desc } = addRowState

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
      desc: desc,
      serviceIds: addRowState.services.map(i => i.id),
      groupIds: addRowState.groupTypes.map(i => i.id)
    }

    const res = await fetchPost('/api/admin/add-day', body)

    if (res.ok) {
      const json = await res.json()

      setDays(ds => [{
        id: json.id,
        capacity,
        date: `${time.year}/${time.month}/${time.day}`,
        reservedCap: 0,
        desc: addRowState.desc,
        VIP: isVip,
        editMode: false
        , services: addRowState.services,
        groups: addRowState.groupTypes
      }, ...ds])

      setAddMode(false)
      setLastAddRowDate(addRowState.time)
    } else if (res.status == 403) {
      dispatch(showMessage({ message: 'این تاریخ قبلا انتخاب شده بود' }))
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }
  }

  const handleEditRow = async () => {
    if (!rowEditMode) return

    if (rowEditMode.capacity <= 0) {
      dispatch(showMessage({ message: 'لطفا ظرفیت را درست انتخاب نمایید!' }))
      return
    }

    const body: EditDayBody = {
      id: rowEditMode.id,
      cap: rowEditMode.capacity,
      isVip: rowEditMode.isVip,
      services: rowEditMode.services.filter(i => i.select).map(i => i.id),
      groupIds: rowEditMode.groupIds,
      desc: rowEditMode.desc
    }

    const res = await fetchPost('/api/admin/edit-day', body)

    if (res.ok) {
      setDays(ds => ds.map(i => {
        if (i.id == body.id)
          return {
            ...i,
            capacity: body.cap,
            desc: body.desc,
            VIP: body.isVip,
            services: rowEditMode.services.filter(i => i.select),
            groups: props.groupTypes.filter(i => rowEditMode.groupIds.includes(i.id))
          }
        else return i
      }))
      setRowEditMode(null)
    } else if (res.status == 403) {
      dispatch(showMessage({ message: 'مقدار انتخابی، از مجموع حجم سفارشات پرداخت شده کمتر است.' }))
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }
  }

  const handleDelete = async (id: number) => {
    const body = { id }

    const res = await fetchPost('/api/admin/del-day', body)

    if (res.ok) {
      setDays(ds => ds.filter(d => d.id != id))
      setDeleteId(null)
      return
    } else if (res.status == 403) {
      dispatch(showMessage({ message: 'سفارشاتی برای این روز ثبت شده اند!' }))
      setDeleteId(null)
      return
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }
  }

  return <AdminPagesContainer currentPage="day">
    <Head>
      <title>ادمین - روزها</title>
    </Head>
    <div className="d-flex justify-content-end mb-3">
      <Button onClick={() => setAddMode(m => !m)} variant="success">
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        <DynamicHead columnNames={props.columnNames} />

        {/* ADD ROW */}
        <tbody className="my-table">
          {addMode ?
            <AddRow
              hideAddRow={() => setAddMode(false)}
              handleAddRow={handleAddRow}
              lastAddRowDate={lastAddRowDate}
              services={props.services}
              tableColumns={props.columnNames.length}
              groupTypes={props.groupTypes}
            />
            :
            <tr></tr>}

          {/* ROWS */}
          {days.map(i => <Fragment key={i.id}>
            {rowEditMode && rowEditMode.id == i.id ?
              /* EDIT MODE */
              <>
                <tr>
                  <td >{i.id}</td>
                  <td >{enDigit2Per(i.date)}</td>
                  <td>
                    <FormControl
                      className="text-center"
                      value={rowEditMode.desc}
                      onChange={e => setRowEditMode(m => ({
                        ...m!, desc: e.target.value
                      }))} />
                  </td>
                  <td className="text-center w-25">
                    <FormCheck checked={rowEditMode.isVip} onClick={() => {
                      setRowEditMode(r => ({ ...r!, isVip: r!.isVip }))
                    }} />
                  </td>
                  <td >
                    <FormControl
                      type="number"
                      min={0}
                      className="text-center"
                      value={rowEditMode.capacity}
                      onChange={e => setRowEditMode(m => ({
                        ...m!, capacity: Number(e.target.value)
                      }))}
                    />
                  </td>

                  <td>{i.reservedCap}</td>

                  <td rowSpan={2}>
                    <div className="d-flex justify-content-around">
                      <IconButton
                        variant="danger"
                        iconPath={mdiCancel}
                        onClick={e => setRowEditMode(null)} />
                      <IconButton
                        variant="success"
                        iconPath={mdiCheck}
                        onClick={handleEditRow} />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={props.columnNames.length - 1}>
                    <Row>
                      <Col md="6">
                        <p>بسته ها</p>
                        <hr />
                        <div>
                          {rowEditMode.services.filter(i => i.type == 'package').map(i =>
                            <div key={i.id} className="d-flex">
                              <Form.Check
                                checked={i.select}
                                onChange={e => setRowEditMode(rem => {
                                  return {
                                    ...rem!,
                                    services: rem!.services.map(x => x.id == i.id ? { ...x, select: !x.select } : x)
                                  }
                                })} />
                              &nbsp;
                              <Form.Label>{i.name}</Form.Label>
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md="6">
                        <p>خدمات</p>
                        <hr />
                        <div>
                          {rowEditMode.services.filter(i => i.type == 'service').map(i =>
                            <div key={i.id} className="d-flex">
                              <Form.Check
                                checked={i.select}
                                onChange={e => setRowEditMode(rem => {
                                  return {
                                    ...rem!,
                                    services: rem!.services.map(x => x.id == i.id ? { ...x, select: !x.select } : x)
                                  }
                                })} />
                              &nbsp;
                              <Form.Label>{i.name}</Form.Label>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <hr />
                    <p>انواع گروه</p>
                    <div className="d-flex">
                      {props.groupTypes.map(({ id, name }) =>
                        <Form.Check key={id}
                          label={name} className="me-3"
                          checked={rowEditMode.groupIds.includes(id)}
                          onChange={() => {
                            const { groupIds } = rowEditMode
                            if (groupIds.includes(id))
                              setRowEditMode({ ...rowEditMode, groupIds: groupIds.filter(j => j != id) })
                            else
                              setRowEditMode({ ...rowEditMode, groupIds: [...groupIds, id] })
                          }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              </>
              :
              /* SHOW MODE */
              <>
                <tr>
                  <td >{i.id}</td>
                  <td >{enDigit2Per(i.date)}</td>
                  <td>{i.desc}</td>
                  <td className="text-center w-25">
                    <FormCheck checked={i.VIP} disabled />
                  </td>
                  <td ><span>{enDigit2Per(i.capacity)}</span></td>

                  <td>{enDigit2Per(i.reservedCap)}</td>

                  <td rowSpan={2}>
                    <div className="d-flex justify-content-around">
                      <IconButton
                        iconPath={mdiPen}
                        variant="info"
                        onClick={e => {
                          setRowEditMode({
                            id: i.id,
                            capacity: i.capacity,
                            isVip: i.VIP,
                            services: props.services.map(m => {
                              const select = i.services.find(n => n.id == m.id) != undefined
                              return { ...m, select }
                            }),
                            groupIds: i.groups.map(i => i.id),
                            desc: i.desc
                          })
                        }} />

                      <IconButton
                        iconPath={mdiTrashCan}
                        variant="danger"
                        onClick={e => setDeleteId(i.id)} />
                      <Link href={`/admin/order?dayId=${i.id}`}>
                        <IconButton
                          iconPath={mdiBasketUnfill}
                          variant="success"
                          title="باز کردن سفارشات مربوطه"
                        />
                      </Link>
                    </div>
                  </td>
                </tr>

                {/* PACKAGES AND SERVICES ROW */}
                <tr>
                  <td colSpan={props.columnNames.length - 1}>
                    <div className="d-flex">
                      <span>پکیج ها: {i.
                        services.
                        filter(j => j.type == 'package').
                        map(j => j.name).
                        join(', ')}</span>
                      &nbsp;||&nbsp;
                      <span>سرویس ها: {i.
                        services.
                        filter(j => j.type == 'service').
                        map(j => j.name).
                        join(', ')}</span>
                      &nbsp;||&nbsp;
                      <span>
                        گروه ها: {i.groups.map(j => j.name).join(', ')}
                      </span>
                    </div>
                  </td>
                </tr>
              </>}
          </Fragment>)}
        </tbody>
      </Table>
      <MyPaginator {...props.page} pageName="/admin/day" />
    </div>
    <AreYouSure
      show={deleteId != null}
      hideAction={() => setDeleteId(null)}
      yesAction={() => handleDelete(deleteId!)}
    />
  </AdminPagesContainer>
}

function AddRow(props: {
  hideAddRow: () => void,
  handleAddRow: (a: AddRowArguments) => void,
  lastAddRowDate: DateObject | null,
  tableColumns: number,
  services: Service[],
  groupTypes: GroupType[]
}) {
  const [addRowState, setAddRowState] = useState<{
    time: DateObject,
    capacity: number,
    isVip: boolean,
    desc: string
  }>({
    time: props.lastAddRowDate ?? nowPersianDateObject(),
    capacity: 1,
    isVip: false,
    desc: ''
  })
  const [selectableServices, setSelectableServices] = useState<
    (Service & { select: boolean })[]
  >(props.services.map(i => ({ ...i, select: false })))

  const [groupIds, setGroupIds] = useState<number[]>([])


  const dispatch = useDispatch()

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
      <td>
        <Form.Control
          value={addRowState.desc}
          onChange={e => setAddRowState(s => ({
            ...s, desc: e.target.value
          }))}
        />
      </td>
      <td className="text-center">
        <FormCheck
          checked={addRowState.isVip}
          onChange={() => setAddRowState(s => ({ ...s, isVip: !s.isVip }))}
        />
      </td>
      <td >
        <Form.Control
          type="number" min={1}
          value={addRowState.capacity}
          onChange={e => setAddRowState(s => ({
            ...s, capacity: Number(e.target.value)
          }))}
        />
      </td>
      <td> --- </td>
      <td rowSpan={2}>
        <div className="d-flex justify-content-around">
          <IconButton
            variant="danger"
            iconPath={mdiCancel}
            onClick={props.hideAddRow} />
          <IconButton
            variant="success"
            iconPath={mdiCheck}
            onClick={() => {
              const services = selectableServices.filter(i => i.select)

              if (services.length == 0) {
                dispatch(showMessage({ message: 'خدمتی انتخاب نشده است!' }))
                return
              }

              if (groupIds.length == 0) {
                dispatch(showMessage({ message: 'گروهی انتخاب نشده است!' }))
                return
              }

              props.handleAddRow({
                ...addRowState,
                services,
                groupTypes: props.groupTypes.filter(i => groupIds.includes(i.id))
              })
            }} />
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
                  onChange={e => setSelectableServices(xs => xs.map(x => x.id == i.id ? {
                    ...x, select: !x.select
                  } : x))} />
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
                  onChange={
                    e => setSelectableServices(xs => xs.map(x => x.id == i.id ? { ...x, select: !x.select } : x))
                  } />
                &nbsp;
                <Form.Label>{i.name}</Form.Label>
              </div>)}
            </div>
          </Col>
        </Row>
        <hr />
        <p>انواع گروه</p>
        <div className="d-flex">
          {props.groupTypes.map(({ id, name }) =>
            <Form.Check key={id}
              label={name} className="me-3"
              checked={groupIds.includes(id)}
              onChange={() => groupIds.includes(id) ?
                setGroupIds(groupIds.filter(j => j != id)) :
                setGroupIds([...groupIds, id])}
            />
          )}
        </div>
      </td>

    </tr>
  </>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {
      const prisma = new PrismaClient()

      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 20
      const totalCount = await prisma.order.count()

      const days = (await prisma.day.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
          Order: {
            where: { status: { not: 'await-payment' } }
          },
          services: true,
          GroupTypes: true
        },
        take: pageCount,
        skip: (page - 1) * pageCount
      })).map<DayRow>(i => {
        const weekDay = timestampScnds2PerDate(i.timestamp)
        return {
          id: i.id,
          date: `${i.year}/${i.month}/${i.day}`,
          desc: i.desc,
          VIP: i.isVip,
          capacity: i.maxVolume,
          reservedCap: i.Order.reduce((sum, i) => sum + i.volume, 0),
          services: i.services,
          groups: i.GroupTypes
        }
      })

      const columnNames = [
        'شناسه',
        'تاریخ',
        'توضیح',
        'VIP',
        'ظرفیت',
        'ظرفیت استفاده شده',
        'عملیات'
      ]

      const services = await prisma.service.findMany()
      const groupTypes = await prisma.groupType.findMany()

      return {
        props: {
          days, columnNames, services, groupTypes,
          page: { page, pageCount, totalCount }
        }
      } satisfies { props: AdminDayProps }
    }
  })
}