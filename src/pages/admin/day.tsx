import { AdminPagesContainer } from "@/components/AdminPagesContainer"
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import {
  enDigit2Per,
  fetchPost,
  orderStatusEnum,
  time2Str,
  timestampScnds2PerDate
} from "@/lib/lib"
import {
  mdiCancel,
  mdiCheck,
  mdiPencilBox,
  mdiPlus,
  mdiTrashCanOutline
} from "@mdi/js"
import type { GroupType, Service } from "@prisma/client"
import { GetServerSideProps } from "next"
import {
  Alert,
  Badge,
  Button,
  Col,
  Dropdown,
  DropdownButton,
  Form,
  FormCheckProps,
  Modal,
  Row
} from "react-bootstrap"
import { Icon } from "@mdi/react"
import { Calendar, DateObject } from "react-multi-date-picker"
import persianCalendar from "react-date-object/calendars/persian"
import persian_fa_locale from "react-date-object/locales/persian_fa"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/redux/store"
import { showMessage } from "@/redux/messageSlice"
import { IconButton } from "@/components/IconButton"
import { EditDayBody } from "../api/admin/edit-day"
import { useRouter } from "next/router"
import Head from "next/head"
import { resHandleNotAuth } from "@/lib/apiHandle"
import { AdminTable } from "@/components/AdminTables"
import { NewPerNumberInput } from "@/components/PerNumberInput"
import { AreYouSure } from "@/components/AreYouSure"
import { PaginatorState } from "@/types"
import { AddDayBody, AddRes } from "../api/admin/add-day"
import { getPrisma4AdminPages } from "@/lib/prismaGlobal"

type DayRow = {
  id: number
  date: string
  desc: string
  VIP: boolean
  capacity: number
  reservedCap: number
  minVolume: number
  services: Service[]
  groups: GroupType[]
}

type AddState = {
  times: DateObject[]
  isVip: boolean
  capacity: string
  minVolume: string
  desc: string
  serviceIds: number[]
  groupIds: number[]
}

type EditState = {
  id: number
  date: string
  capacity: string
  minVolume: string
  isVip: boolean
  serviceIds: number[]
  groupIds: number[]
  desc: string
}

type AdminDayProps = {
  days: DayRow[]
  columnNames: string[]
  services: Service[]
  groupTypes: GroupType[]
  page: PaginatorState
}

export default function AdminDay(props: AdminDayProps) {
  const [addMode, setAddMode] = useState(false)
  const [days, setDays] = useState(props.days)
  const [editMode, setEditMode] = useState<EditState | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const dispatch: AppDispatch = useDispatch()
  const router = useRouter()

  async function handleAddRows(addRowState: AddState) {
    const body: AddDayBody = {
      ...addRowState,
      cap: Number(addRowState.capacity),
      minVolume: Number(addRowState.minVolume),
      times: addRowState.times.map((i) => i.toUnix())
    }

    const res = await fetchPost("/api/admin/add-day", body)

    if (res.ok) {
      const json: AddRes[] = await res.json()

      const success = json.filter((i) => i.state == "success")
      const duplicate = json.filter((i) => i.state == "duplicate")

      setAddMode(false)

      if (success.length != 0) {
        setDays([
          ...success.map<DayRow>((i) => ({
            id: i.id!,
            capacity: body.cap,
            date: time2Str(i.timestamp, ""),
            desc: body.desc,
            groups: props.groupTypes.filter((j) =>
              body.groupIds.includes(j.id)
            ),
            services: props.services.filter((j) =>
              body.serviceIds.includes(j.id)
            ),
            minVolume: body.minVolume,
            reservedCap: 0,
            VIP: body.isVip
          })),
          ...days
        ])
      }

      if (duplicate.length != 0) {
        dispatch(
          showMessage({
            message:
              success.length == 0
                ? "تمام تاریخ به علت تکراری بودن وارد نشدند."
                : `این تاریخ ها به علت تکراری بودن وارد نشدند: ${duplicate
                    .map((i) => time2Str(i.timestamp, body.desc))
                    .join(", ")}`,
            type: success.length == 0 ? "bg-danger" : "bg-warning"
          })
        )
      }
    } else {
      resHandleNotAuth(res, dispatch, router)
    }
  }

  async function handleEditRow(editState: EditState) {
    if (!editMode) return

    const body: EditDayBody = {
      ...editState,
      cap: Number(editState.capacity),
      minVolume: Number(editState.minVolume)
    }

    const res = await fetchPost("/api/admin/edit-day", body)

    if (res.ok) {
      setDays((ds) =>
        ds.map((i) => {
          if (i.id == body.id)
            return {
              id: i.id,
              reservedCap: i.reservedCap,
              date: i.date,
              desc: body.desc,

              minVolume: body.minVolume,
              capacity: body.cap,
              VIP: body.isVip,
              services: props.services.filter((j) =>
                editState.serviceIds.includes(j.id)
              ),
              groups: props.groupTypes.filter((i) =>
                editMode.groupIds.includes(i.id)
              )
            }
          else return i
        })
      )
      setEditMode(null)
    } else if (res.status == 403) {
      dispatch(
        showMessage({
          message: "مقدار انتخابی، از مجموع حجم سفارشات پرداخت شده کمتر است."
        })
      )
    } else {
      resHandleNotAuth(res, dispatch, router)
    }
  }

  async function handleDelete() {
    if (deleteId == null) return

    const body = { id: deleteId }

    const res = await fetchPost("/api/admin/del-day", body)

    if (res.ok) {
      setDays((ds) => ds.filter((d) => d.id != deleteId))
      setDeleteId(null)
      return
    } else if (res.status == 403) {
      dispatch(showMessage({ message: "سفارشاتی برای این روز ثبت شده اند!" }))
      setDeleteId(null)
      return
    } else {
      resHandleNotAuth(res, dispatch, router)
    }
  }

  return (
    <AdminPagesContainer currentPage="day">
      <Head>
        <title>ادمین - روزها</title>
      </Head>
      <div className="d-flex justify-content-end mb-3">
        <Button onClick={() => setAddMode((m) => !m)} variant="success">
          اضافه کردن <Icon path={mdiPlus} size={1} />
        </Button>
      </div>
      <AdminTable
        columnNames={props.columnNames}
        page={{ ...props.page, pageName: "/admin/day" }}
      >
        <tbody>
          {days.map((i) => (
            <tr key={i.id}>
              <td className="text-nowrap">
                {enDigit2Per(i.date)}
                {i.desc != "" ? ` - ${i.desc}` : ""}
                {i.VIP ? (
                  <>
                    &nbsp;&nbsp;
                    <Badge bg="success">VIP</Badge>
                  </>
                ) : (
                  <></>
                )}
              </td>

              <td className="text-nowrap">
                <pre
                  style={{
                    fontFamily: "ir-sans",
                    marginBottom: 0
                  }}
                >
                  {enDigit2Per(
                    `${i.capacity}\t-\t${i.reservedCap}\t=\t${
                      i.capacity - i.reservedCap
                    }`
                  )}
                </pre>
              </td>

              <td>{enDigit2Per(i.minVolume)}</td>

              <td style={{ minWidth: "13rem" }}>
                {i.services
                  .sort((a, b) => (a.type == "service" ? 1 : -1))
                  .map(({ name, id, type }) => (
                    <Badge
                      key={id}
                      pill
                      className="m-1"
                      bg={type == "package" ? "success" : "primary"}
                      style={{ fontSize: ".7rem", padding: ".4rem" }}
                    >
                      {name}
                    </Badge>
                  ))}
              </td>

              <td>
                {i.groups.map((j) => (
                  <Badge
                    key={j.id}
                    pill
                    className="m-1 text-black tw-border-cyan-500 tw-border tw-border-solid"
                    bg="light"
                    style={{ fontSize: ".7rem", padding: ".4rem" }}
                  >
                    {j.name}
                  </Badge>
                ))}
              </td>
              {/* ACTIONS */}
              <td>
                <DropdownButton
                  id="dropdown-basic-button"
                  title=""
                  variant="light"
                  className="bg-gray"
                >
                  <Dropdown.Item
                    className="text-end"
                    onClick={() =>
                      setEditMode({
                        id: i.id,
                        date: i.date,
                        minVolume: String(i.minVolume),
                        capacity: String(i.capacity),
                        desc: i.desc,
                        serviceIds: i.services.map((j) => j.id),
                        groupIds: i.groups.map((j) => j.id),
                        isVip: i.VIP
                      })
                    }
                  >
                    <Icon
                      path={mdiPencilBox}
                      size={1}
                      className="ms-2 text-info"
                    />
                    ویرایش
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="text-end"
                    onClick={() => setDeleteId(i.id)}
                  >
                    <Icon
                      path={mdiTrashCanOutline}
                      size={1}
                      className="ms-2 text-danger"
                    />
                    حذف
                  </Dropdown.Item>
                </DropdownButton>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>

      <EditModal
        show={editMode != null}
        onHide={() => setEditMode(null)}
        onEnd={handleEditRow}
        editState={editMode}
        allGroups={props.groupTypes}
        allServices={props.services}
      />

      <AddModal
        show={addMode}
        onHide={() => setAddMode(false)}
        allGroups={props.groupTypes}
        allServices={props.services}
        onEnd={handleAddRows}
      />

      <AreYouSure
        show={deleteId != null}
        hideAction={() => setDeleteId(null)}
        yesAction={handleDelete}
      />
    </AdminPagesContainer>
  )
}

function EditModal(P: {
  show: boolean
  onHide: () => void
  editState: EditState | null
  allGroups: GroupType[]
  allServices: Service[]
  onEnd: (e: EditState) => void
}) {
  const [state, setState] = useState(P.editState)
  const [errorAlert, setErrorAlert] = useState<null | string>(null)

  function showAlert(message: string, time = 1000) {
    setErrorAlert(message)
    setTimeout(() => {
      setErrorAlert(null)
    }, time)
  }

  async function handle() {
    if (state == null) return

    const nCapacity = Number(state.capacity)

    if (nCapacity <= 0) return showAlert("ظرفیت انتخاب نشده است.")
    if (state.serviceIds.length == 0)
      return showAlert("خدمت یا بسته ای انتخاب نشده است.")
    if (state.groupIds.length == 0) return showAlert("گروهی انتخاب نشده است.")

    P.onEnd(state)
  }

  useEffect(() => {
    setState(P.editState)
  }, [P.editState])

  return (
    <Modal show={P.show} onHide={P.onHide}>
      {state == null ? (
        <></>
      ) : (
        <>
          <Modal.Header>
            <h1 className="fs-4">
              ویرایش روز: &nbsp;
              {enDigit2Per(state.date)}
              {state.desc != "" ? ` - ${state.desc}` : ""}
            </h1>
          </Modal.Header>
          <Form
            onSubmit={(e) => {
              e.preventDefault()
              handle()
            }}
          >
            <Modal.Body>
              <Row>
                <Col md="5" as={Form.Group}>
                  <Form.Label>ظرفیت روز</Form.Label>
                  <NewPerNumberInput
                    required
                    value={state.capacity}
                    onSet={(s) => setState({ ...state, capacity: s })}
                  />
                </Col>
                <Col md="5">
                  <Form.Label>حداقل ظرفیت قابل انتخاب</Form.Label>
                  <NewPerNumberInput
                    value={state.minVolume}
                    onSet={(s) => setState({ ...state, minVolume: s })}
                  />
                </Col>
                <Col md="2">
                  <div className="mt-2 mt-md-0 border rounded p-1">
                    <CheckBox
                      label="ویژه"
                      column
                      checked={state.isVip}
                      onChange={() =>
                        setState({ ...state, isVip: !state.isVip })
                      }
                    />
                  </div>
                </Col>
                <Col md="6" className="mt-2">
                  <div className="p-2 border rounded">
                    <Form.Label className="text-center w-100 fw-bold">
                      بسته ها
                    </Form.Label>
                    {P.allServices
                      .filter((i) => i.type == "service")
                      .map((i) => (
                        <CheckBox
                          key={i.id}
                          label={i.name}
                          checked={state.serviceIds.includes(i.id)}
                          onChange={() => {
                            if (state.serviceIds.includes(i.id))
                              setState({
                                ...state,
                                serviceIds: state.serviceIds.filter(
                                  (j) => j != i.id
                                )
                              })
                            else
                              setState({
                                ...state,
                                serviceIds: [i.id, ...state.serviceIds]
                              })
                          }}
                        />
                      ))}
                    <hr />
                    <Form.Label className="text-center w-100 fw-bold">
                      خدمت ها
                    </Form.Label>
                    {P.allServices
                      .filter((i) => i.type == "package")
                      .map((i) => (
                        <CheckBox
                          key={i.id}
                          label={i.name}
                          checked={state.serviceIds.includes(i.id)}
                          onChange={() => {
                            if (state.serviceIds.includes(i.id))
                              setState({
                                ...state,
                                serviceIds: state.serviceIds.filter(
                                  (j) => j != i.id
                                )
                              })
                            else
                              setState({
                                ...state,
                                serviceIds: [i.id, ...state.serviceIds]
                              })
                          }}
                        />
                      ))}
                  </div>
                </Col>
                <Col md="6" className="mt-2">
                  <div className="p-2 border rounded">
                    <Form.Label className="text-center w-100 fw-bold">
                      گروه های قابل انتخاب
                    </Form.Label>
                    {P.allGroups.map((i) => (
                      <CheckBox
                        key={i.id}
                        label={i.name}
                        checked={state.groupIds.includes(i.id)}
                        onChange={() => {
                          if (state.groupIds.includes(i.id))
                            setState({
                              ...state,
                              groupIds: state.groupIds.filter((j) => j != i.id)
                            })
                          else
                            setState({
                              ...state,
                              groupIds: [i.id, ...state.groupIds]
                            })
                        }}
                      />
                    ))}
                  </div>
                </Col>
              </Row>
              {errorAlert && (
                <Alert variant="danger" className="mt-2">
                  {errorAlert}
                </Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <IconButton
                variant="danger"
                iconPath={mdiCancel}
                onClick={P.onHide}
              />
              <IconButton variant="success" iconPath={mdiCheck} type="submit" />
            </Modal.Footer>
          </Form>
        </>
      )}
    </Modal>
  )
}

function AddModal(P: {
  show: boolean
  onHide: () => void
  allGroups: GroupType[]
  allServices: Service[]
  onEnd: (a: AddState) => void
}) {
  const [S, setS] = useState<AddState | null>(null)
  const [errorAlert, setErrorAlert] = useState<null | string>(null)

  function showAlert(message: string, time = 1000) {
    setErrorAlert(message)
    setTimeout(() => {
      setErrorAlert(null)
    }, time)
  }

  useEffect(() => {
    if (P.show)
      setS({
        times: [],
        capacity: "",
        desc: "",
        groupIds: [],
        serviceIds: [],
        isVip: false,
        minVolume: ""
      })
  }, [P.show])

  async function handleSubmit() {
    if (S == null) return

    if (S.times.length == 0) return showAlert("روزی انتخاب نشده است.")
    if (S.serviceIds.length == 0)
      return showAlert("خدمت یا بسته ای انتخاب نشده است.")
    if (S.groupIds.length == 0) return showAlert("گروهی انتخاب نشده است.")
    const nCap = Number(S.capacity)
    if (Number.isNaN(nCap) || nCap < 1) return showAlert("ظرفیت وارد نشده است.")
    const nMinVolume = Number(S.minVolume)
    if (Number.isNaN(nMinVolume) || nMinVolume < 0)
      return showAlert("حداقل ظرفیت وارده شده اشتباه است.")

    P.onEnd(S)
  }

  return (
    <Modal show={P.show} onHide={P.onHide} size="lg">
      {S && (
        <Form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <Modal.Header>اضافه کردن روز</Modal.Header>

          <Modal.Body>
            <Row>
              <Col md="5">
                <Calendar
                  className="m-auto"
                  calendar={persianCalendar}
                  locale={persian_fa_locale}
                  multiple
                  value={S.times}
                  onChange={(ds) => setS({ ...S, times: ds as DateObject[] })}
                />
              </Col>
              <Col md="7" className="mt-2 mt-md-0">
                <Form.Label>روز های انتخاب شده</Form.Label>
                <div
                  className="border rounded p-2"
                  style={{ minHeight: "100px" }}
                >
                  {S.times.map((d) => (
                    <Badge
                      key={d.toUnix()}
                      className="tw-text-sm me-1 mb-1"
                      onClick={() =>
                        setS({ ...S, times: S.times.filter((m) => m != d) })
                      }
                    >
                      {enDigit2Per(`${d.year}/${d.month.number}/${d.day}`)}
                    </Badge>
                  ))}
                </div>
              </Col>
              <Col md="5" className="mt-2">
                <Form.Label>توضیح</Form.Label>
                <Form.Control
                  value={S.desc}
                  onChange={(e) => setS({ ...S, desc: e.target.value })}
                />
              </Col>
              <Col md="3" className="mt-2">
                <Form.Label>ظرفیت</Form.Label>
                <NewPerNumberInput
                  value={S.capacity}
                  required
                  onSet={(v) => setS({ ...S, capacity: v })}
                />
              </Col>
              <Col md="3" className="mt-2">
                <Form.Label>حداقل ظرفیت قابل انتخاب</Form.Label>
                <NewPerNumberInput
                  value={S.minVolume}
                  onSet={(v) => setS({ ...S, minVolume: v })}
                />
              </Col>
              <Col md="1">
                <div className="rounded p-2 border mt-2 mt-md-0">
                  <CheckBox
                    label="ویژه"
                    column
                    checked={S.isVip}
                    onChange={() => setS({ ...S, isVip: !S.isVip })}
                  />
                </div>
              </Col>
              <Col md="4" className="mt-2">
                <div className="p-2 border rounded">
                  <Form.Label className="text-center w-100 fw-bold">
                    خدمت ها
                  </Form.Label>
                  {P.allServices
                    .filter((i) => i.type == "service")
                    .map((i) => (
                      <CheckBox
                        key={i.id}
                        label={i.name}
                        checked={S.serviceIds.includes(i.id)}
                        onChange={() => {
                          if (S.serviceIds.includes(i.id))
                            setS({
                              ...S,
                              serviceIds: S.serviceIds.filter((j) => j != i.id)
                            })
                          else
                            setS({ ...S, serviceIds: [i.id, ...S.serviceIds] })
                        }}
                      />
                    ))}
                </div>
              </Col>
              <Col md="4" className="mt-2">
                <div className="p-2 border rounded">
                  <Form.Label className="text-center w-100 fw-bold">
                    بسته ها
                  </Form.Label>
                  {P.allServices
                    .filter((i) => i.type == "package")
                    .map((i) => (
                      <CheckBox
                        key={i.id}
                        label={i.name}
                        checked={S.serviceIds.includes(i.id)}
                        onChange={() => {
                          if (S.serviceIds.includes(i.id))
                            setS({
                              ...S,
                              serviceIds: S.serviceIds.filter((j) => j != i.id)
                            })
                          else
                            setS({ ...S, serviceIds: [i.id, ...S.serviceIds] })
                        }}
                      />
                    ))}
                </div>
              </Col>
              <Col md="4" className="mt-2">
                <div className="p-2 border rounded">
                  <Form.Label className="text-center w-100 fw-bold">
                    گروه های قابل انتخاب
                  </Form.Label>
                  {P.allGroups.map((i) => (
                    <CheckBox
                      key={i.id}
                      label={i.name}
                      checked={S.groupIds.includes(i.id)}
                      onChange={() => {
                        if (S.groupIds.includes(i.id))
                          setS({
                            ...S,
                            groupIds: S.groupIds.filter((j) => j != i.id)
                          })
                        else setS({ ...S, groupIds: [i.id, ...S.groupIds] })
                      }}
                    />
                  ))}
                </div>
              </Col>
              {errorAlert && (
                <Alert variant="danger" className="mt-2">
                  {errorAlert}
                </Alert>
              )}
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <IconButton
              variant="danger"
              iconPath={mdiCancel}
              onClick={P.onHide}
            />
            <IconButton variant="success" iconPath={mdiCheck} type="submit" />
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  )
}

function CheckBox(P: FormCheckProps & { column?: boolean }) {
  const { label, column, ...without } = P
  return (
    <div
      className={
        "d-flex justify-content-between align-items-center" +
        (column ? " flex-md-column " : "")
      }
    >
      <Form.Label>{label}</Form.Label>
      <Form.Check {...without} className="my-check-input" />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context,
    async callbackSuccess(prisma) {

      //: PAGE <<<
      const page =
        context.query["page"] == undefined ? 1 : Number(context.query["page"])
      //: TODO read from front
      const pageCount = 30
      const totalCount = await prisma.day.count()
      //: >>>

      const days = (
        await prisma.day.findMany({
          orderBy: { timestamp: "desc" },
          include: {
            Order: {
              where: { orderStatus: orderStatusEnum.reserved }
            },
            services: true,
            GroupTypes: true
          },
          take: pageCount,
          skip: (page - 1) * pageCount
        })
      ).map<DayRow>((i) => {
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
        "تاریخ",
        "ظرفیت - استفاده شده  = باقی مانده",
        "حداقل ظرفیت",
        "خدمات",
        "گروه ها",
        "عملیات"
      ]

      const services = await prisma.service.findMany({
        orderBy: { type: "asc" }
      })
      const groupTypes = await prisma.groupType.findMany({
        orderBy: { name: "asc" }
      })

      return {
        props: {
          days,
          columnNames,
          services,
          groupTypes,
          page: { page, pageCount, totalCount }
        }
      } satisfies { props: AdminDayProps }
    }
  })
}
