import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigit2Per, fetchPost, nowPersianDateObject, orderStatusEnum, timestampScnds2PerDate } from "@/lib/lib";
import { mdiCancel, mdiCheck, mdiPencilBox, mdiPlus, mdiTrashCanOutline } from "@mdi/js";
import { PrismaClient } from "@prisma/client";
import type { GroupType, Service } from '@prisma/client';
import { GetServerSideProps } from "next";
import { Alert, Badge, Button, Col, Dropdown, DropdownButton, Form, FormCheck, FormCheckProps, Modal, Row } from "react-bootstrap";
import { Icon } from '@mdi/react'
import DatePicker, { DateObject } from "react-multi-date-picker";
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { AddDayBody } from "../api/admin/add-day";
import { showMessage } from "@/redux/messageSlice";
import { IconButton } from "@/components/IconButton";
import { EditDayBody } from "../api/admin/edit-day";
import { useRouter } from "next/router";
import Head from "next/head";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { AdminTable } from "@/components/AdminTables";
import { NewPerNumberInput2 } from "@/components/PerNumberInput";
import { AreYouSure } from "@/components/AreYouSure";

type DayRow = {
  id: number,
  date: string,
  desc: string,
  VIP: boolean,
  capacity: number,
  reservedCap: number,
  minVolume: number,
  services: Service[],
  groups: GroupType[]
}

type AddRowArguments = {
  time: DateObject,
  isVip: boolean,
  capacity: number,
  desc: string,
  services: Service[],
  groupTypes: GroupType[]
}

type EditState = {
  id: number,
  date: string,
  capacity: string,
  minVolume: string,
  isVip: boolean,
  serviceIds: number[],
  groupIds: number[],
  desc: string,
}

type AdminDayProps = {
  days: DayRow[],
  columnNames: string[],
  services: Service[],
  groupTypes: GroupType[],
  page: PaginatorState
}

export default function AdminDay(props: AdminDayProps) {

  const [addMode, setAddMode] = useState(false)
  const [days, setDays] = useState(props.days)
  const [editMode, setEditMode] = useState<EditState | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const dispatch: AppDispatch = useDispatch()
  const router = useRouter()


  /* async function handleAddRow(addRowState: AddRowArguments) {
    const { capacity, isVip, time, desc } = addRowState;

    if (capacity <= 0) {
      dispatch(showMessage({ message: 'لطفا ظرفیت را درست وارد کنید!' }));
      return;
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
    };

    const res = await fetchPost('/api/admin/add-day', body);

    if (res.ok) {
      const json = await res.json();

      setDays(ds => [{
        id: json.id,
        capacity,
        date: `${time.year}/${time.month}/${time.day}`,
        reservedCap: 0,
        desc: addRowState.desc,
        VIP: isVip,
        editMode: false,
        services: addRowState.services,
        groups: addRowState.groupTypes,
      }, ...ds]);

      setAddMode(false);
      setLastAddRowDate(addRowState.time);
    } else if (res.status == 403) {
      dispatch(showMessage({ message: 'این تاریخ قبلا انتخاب شده بود' }));
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }));
      router.push('/admin');
      return;
    } else {
      console.log(res.status);
    }
  } */

  async function handleEditRow(editState: EditState) {
    if (!editMode) return;

    const body: EditDayBody = {
      ...editState,
      cap: Number(editState.capacity),
      minVolume: Number(editState.minVolume)
    };

    const res = await fetchPost('/api/admin/edit-day', body);

    if (res.ok) {
      setDays(ds => ds.map(i => {
        if (i.id == body.id)
          return {
            id: i.id,
            reservedCap: i.reservedCap,
            date: i.date,
            desc: body.desc,

            minVolume: body.minVolume,
            capacity: body.cap,
            VIP: body.isVip,
            services: props.services.filter(j => editState.serviceIds.includes(j.id)),
            groups: props.groupTypes.filter(i => editMode.groupIds.includes(i.id))
          };
        else return i;
      }));
      setEditMode(null);
    } else if (res.status == 403) {
      dispatch(showMessage({ message: 'مقدار انتخابی، از مجموع حجم سفارشات پرداخت شده کمتر است.' }));
    }

    resHandleNotAuth(res, dispatch, router);
  }

  async function handleDelete() {
    if (deleteId == null) return

    const body = { id: deleteId }

    const res = await fetchPost('/api/admin/del-day', body);

    if (res.ok) {
      setDays(ds => ds.filter(d => d.id != deleteId));
      setDeleteId(null);
      return;
    } else if (res.status == 403) {
      dispatch(showMessage({ message: 'سفارشاتی برای این روز ثبت شده اند!' }));
      setDeleteId(null);
      return;
    }

    resHandleNotAuth(res, dispatch, router)
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
    <AdminTable columnNames={props.columnNames} page={{ ...props.page, pageName: '/admin/day' }}>
      <tbody>
        {days.map(i => <tr key={i.id}>
          <td className="text-nowrap">
            {enDigit2Per(i.date)}{i.desc != '' ? ` - ${i.desc}` : ''}
            {i.VIP ?
              <>
                &nbsp;&nbsp;
                <Badge bg="success">
                  VIP
                </Badge>
              </> :
              <></>}
          </td>

          <td
            className="text-nowrap">
            <pre
              style={{
                fontFamily: 'ir-sans',
                marginBottom: 0,
              }}>
              {enDigit2Per(`${i.capacity}\t-\t${i.reservedCap}\t=\t${i.capacity - i.reservedCap}`)}
            </pre>
          </td>

          <td>{enDigit2Per(i.minVolume)}</td>

          <td style={{ minWidth: '13rem' }}>
            {i.services.sort((a, b) => a.type == 'service' ? 1 : -1).map(({ name, id, type }) =>
              <Badge
                key={id} pill
                className="m-1"
                bg={type == 'package' ? "success" : "primary"}
                style={{ fontSize: '.7rem', padding: '.4rem' }}>
                {name}</Badge>
            )}
          </td>

          <td>
            {i.groups.map(j =>
              <Badge
                key={j.id} pill
                className="m-1 text-black tw-border-cyan-500 tw-border tw-border-solid"
                bg="light"
                style={{ fontSize: '.7rem', padding: '.4rem' }}>
                {j.name}</Badge>
            )}
          </td>
          {/* ACTIONS */}
          <td>
            <DropdownButton
              id="dropdown-basic-button"
              title=""
              variant="light"
              className="bg-gray">
              <Dropdown.Item
                className="text-end"
                onClick={() => setEditMode({
                  id: i.id,
                  date: i.date,
                  minVolume: String(i.minVolume),
                  capacity: String(i.capacity),
                  desc: i.desc,
                  serviceIds: i.services.map(j => j.id),
                  groupIds: i.groups.map(j => j.id),
                  isVip: i.VIP
                })}
              >
                <Icon path={mdiPencilBox} size={1} className="ms-2 text-info" />
                ویرایش
              </Dropdown.Item>
              <Dropdown.Item
                className="text-end"
                onClick={() => setDeleteId(i.id)}>
                <Icon path={mdiTrashCanOutline} size={1} className="ms-2 text-danger" />
                حذف
              </Dropdown.Item>
            </DropdownButton>
          </td>
        </tr>)}
      </tbody>
    </AdminTable>

    <EditModal
      show={editMode != null}
      onHide={() => setEditMode(null)}
      onEnd={handleEditRow}
      editState={editMode}
      allGroups={props.groupTypes}
      allServices={props.services} />

    <AreYouSure
      show={deleteId != null}
      hideAction={() => setDeleteId(null)}
      yesAction={handleDelete}
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

function EditModal(P: {
  show: boolean, onHide: () => void,
  editState: EditState | null,
  allGroups: GroupType[], allServices: Service[],
  onEnd: (e: EditState) => void
}) {

  const [state, setState] = useState(P.editState)

  const [errorAlert, setErrorAlert] = useState<null | string>(null)

  function showAlert(message: string, time = 1000) {
    setErrorAlert(message)
    setTimeout(() => {
      setErrorAlert(null)
    }, time);
  }

  async function handle() {
    if (state == null) return

    const nCapacity = Number(state.capacity)
    const nMinVolume = Number(state.minVolume)

    if (nCapacity <= 0) return showAlert("ظرفیت انتخاب نشده است.")
    if (state.serviceIds.length == 0) return showAlert('خدمت یا بسته ای انتخاب نشده است.')
    if (state.groupIds.length == 0) return showAlert("گروهی انتخاب نشده است.")

    P.onEnd(state)
  }

  useEffect(() => {
    setState(P.editState)
  }, [P.editState])

  return <Modal show={P.show} onHide={P.onHide}>
    {state == null ? <></> : <>
      <Modal.Header>
        <h1 className="fs-4">
          ویرایش روز: &nbsp;
          {enDigit2Per(state.date)}{state.desc != '' ? ` - ${state.desc}` : ''}
        </h1>
      </Modal.Header>
      <Form onSubmit={e => {
        e.preventDefault()
        handle()
      }}>
        <Modal.Body>
          <Row>
            <Col md="5" as={Form.Group}>
              <Form.Label>ظرفیت روز</Form.Label>
              <NewPerNumberInput2 required
                value={state.capacity}
                onSet={s => setState({ ...state, capacity: s })}
              />
            </Col>
            <Col md="5">
              <Form.Label>حداقل ظرفیت قابل انتخاب</Form.Label>
              <NewPerNumberInput2
                value={state.minVolume}
                onSet={s => setState({ ...state, minVolume: s })} />
            </Col>
            <Col md="2">
              <div className="mt-2 mt-md-0 border rounded p-1">
                <CheckBox label="ویژه" column
                  checked={state.isVip} onChange={() => setState({ ...state, isVip: !state.isVip })} />
              </div>
            </Col>
            <Col md="6" className="mt-2">
              <div className="p-2 border rounded">
                <Form.Label className="text-center w-100 fw-bold">بسته ها</Form.Label>
                {P.allServices.filter(i => i.type == 'service').map(i =>
                  <CheckBox key={i.id} label={i.name}
                    checked={state.serviceIds.includes(i.id)}
                    onChange={() => {
                      if (state.serviceIds.includes(i.id))
                        setState({ ...state, serviceIds: state.serviceIds.filter(j => j != i.id) })
                      else
                        setState({ ...state, serviceIds: [i.id, ...state.serviceIds] })
                    }}
                  />
                )}
                <hr />
                <Form.Label className="text-center w-100 fw-bold">خدمت ها</Form.Label>
                {P.allServices.filter(i => i.type == 'package').map(i =>
                  <CheckBox key={i.id} label={i.name}
                    checked={state.serviceIds.includes(i.id)}
                    onChange={() => {
                      if (state.serviceIds.includes(i.id))
                        setState({ ...state, serviceIds: state.serviceIds.filter(j => j != i.id) })
                      else
                        setState({ ...state, serviceIds: [i.id, ...state.serviceIds] })
                    }}
                  />
                )}
              </div>
            </Col>
            <Col md="6" className="mt-2">
              <div className="p-2 border rounded">
                <Form.Label className="text-center w-100 fw-bold">گروه های قابل انتخاب</Form.Label>
                {P.allGroups.map(i =>
                  <CheckBox key={i.id} label={i.name}
                    checked={state.groupIds.includes(i.id)}
                    onChange={() => {
                      if (state.groupIds.includes(i.id))
                        setState({ ...state, groupIds: state.groupIds.filter(j => j != i.id) })
                      else
                        setState({ ...state, groupIds: [i.id, ...state.groupIds] })
                    }}
                  />
                )}
              </div>
            </Col>
          </Row>
          {errorAlert && <Alert variant="danger" className="mt-2">{errorAlert}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <IconButton
            variant="danger"
            iconPath={mdiCancel}
            onClick={P.onHide} />
          <IconButton
            variant="success"
            iconPath={mdiCheck}
            type="submit"
          />
        </Modal.Footer>
      </Form>
    </>}

  </Modal>
}


function CheckBox(P: FormCheckProps & { column?: boolean }) {
  const { label, column, ...without } = P
  return <div className={"d-flex justify-content-between align-items-center" + (column ? ' flex-md-column ' : '')}>
    <Form.Label>{label}</Form.Label>
    <Form.Check {...without} className="my-check-input" />
  </div>
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
            where: { orderStatus: orderStatusEnum.reserved }
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
          desc: i.desc.trim(),
          VIP: i.isVip,
          capacity: i.maxVolume,
          reservedCap: i.Order.reduce((sum, i) => sum + i.volume, 0),
          minVolume: i.minVolume ?? 0,
          services: i.services,
          groups: i.GroupTypes
        }
      })

      const columnNames = [
        'تاریخ',
        'ظرفیت - استفاده شده  = باقی مانده',
        'حداقل ظرفیت',
        'خدمات',
        'گروه ها',
        'عملیات'
      ]

      const services = await prisma.service.findMany({ orderBy: { type: 'asc' } })
      const groupTypes = await prisma.groupType.findMany({ orderBy: { name: 'asc' } })

      return {
        props: {
          days, columnNames, services, groupTypes,
          page: { page, pageCount, totalCount }
        }
      } satisfies { props: AdminDayProps }
    }
  })
}