import { AdminPagesContainer } from "@/components/AdminPagesContainer"
import { AdminTable } from "@/components/AdminTables"
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import {
  enDigit2Per, enNumberTo3DigPer, enServiceType2Per, fetchPost, nowPersianDateObject,
  orderStatusEnum, paymentStatusEnum, serviceTypeEnum, time2Str
} from "@/lib/lib"
import { Customer, Discount, Order, OrderService, PrismaClient, Service, Transaction } from "@prisma/client"
import { GetServerSideProps } from "next"
import { ReactNode, useEffect, useState } from "react"
import { Accordion, Alert, Badge, Button, Col, Form, ListGroup, Modal, Row } from "react-bootstrap"
import { OrderPaymentStatusBadge, OrderStatusBadge } from "."
import { TransactionTable } from "../transaction"
import Head from "next/head"
import Icon from "@mdi/react"
import { mdiCancel, mdiCashPlus, mdiCheck, mdiCloseOctagon, mdiPencilBox, mdiRestore, mdiTicketConfirmation } from "@mdi/js"
import { AddTransaction } from "@/pages/api/admin/add-transaction"
import { resHandleNotAuth } from "@/lib/apiHandle"
import { useDispatch } from "react-redux"
import { useRouter } from "next/router"
import { showMessage } from "@/redux/messageSlice"
import { AreYouSure } from "@/components/AreYouSure"
import { OrderActionApi, OrderEditPayload } from "@/pages/api/admin/order"
import { InfoItem } from "@/components/InfoItem"
import { NewPerNumberInput } from "@/components/PerNumberInput"
import { IconButton } from "@/components/IconButton"
import { useAlert } from "@/lib/useAlert"

type OurDay = {
  id: number;
  timestamp: number;
  maxVolume: number;
  desc: string;
  isVip: boolean;

  reserved: number;
  remained: number;
}

type OrderDetailed = Order & {
  Customer: Customer,
  Day: OurDay;
  Discount: Discount[],
  Transaction: Transaction[],
  OrderService: (OrderService & {
    Service: Service
  })[]
} & { paidAmount: number, cancelRequest: null | string }

type OrderDetailsPageProps = {
  order: OrderDetailed,

  availableDays: (OurDay & {
    Order: {
      id: number;
      volume: number;
    }[];
  })[]

  availableServices: {
    id: number;
    name: string;
    desc: string | null;
    type: string;
    priceNormal: number;
    priceVip: number | null;
  }[]
}

export default function OrderDetailsPage(P: OrderDetailsPageProps) {

  const [order, setOrder] = useState<OrderDetailed>(P.order)
  const [doCancel, setDoCancel] = useState(false)
  const [doRestore, setDoRestore] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [addPayState, setAddPayState] = useState<AddTransaction | null>(null)

  const dispatch = useDispatch()
  const router = useRouter()

  async function handleAddTransaction(aps: AddTransaction) {
    const res = await fetchPost('/api/admin/add-transaction', aps);

    if (res.ok) {
      const body = await res.json()

      setOrder(x => ({
        ...x,
        paidAmount: x.paidAmount + Number(aps.amount),
        status: body.status,
        orderStatus: body.orderStatus,
        Transaction: [...x.Transaction, body.transaction]
      }))


      setAddPayState(null);
      return;
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  function handleRemoveTransaction(id: number, status: string, orderStatus: string) {

    const transaction = order.Transaction.find(i => i.id == id)
    if (!transaction) return

    const newPaidAmount = order.paidAmount - transaction.valuePaid

    setOrder(x => ({
      ...x,
      paidAmount: newPaidAmount,
      status,
      orderStatus,
      Transaction: x.Transaction.filter(i => i.id != id)
    }))
  }

  async function handleCancelOrder() {
    if (!doCancel) return

    const body: OrderActionApi = {
      type: 'cancel',
      orderId: order.id
    }

    const res = await fetchPost('/api/admin/order', body)

    if (res.ok) {

      setOrder(x => ({ ...x, orderStatus: orderStatusEnum.canceled }))
      setDoCancel(false)
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  async function handleRestoreOrder() {
    if (!doRestore) return

    const body: OrderActionApi = {
      type: 'restore',
      orderId: order.id
    }

    const res = await fetchPost('/api/admin/order', body)

    if (res.ok) {
      const newStatus = await res.text()
      setOrder(x => ({ ...x, orderStatus: newStatus }))
      setDoRestore(false)
    } else if (res.status == 403) {
      dispatch(showMessage({ message: "ظرفیت روز پر شده است!" }))
      setDoRestore(false)
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  async function handleEdit(newOrder: OrderEditPayload) {


    const body: OrderActionApi = {
      type: 'edit',
      ...newOrder
    }

    const res = await fetchPost('/api/admin/order', body)

    if (res.ok) {
      const { calculatedAmount, serviceIds }: { calculatedAmount: number, serviceIds: number[] } = await res.json()

      const newDay = newOrder.dayId == order.dayId ? order.Day : P.availableDays.find(i => i.id == newOrder.dayId)!

      setOrder({
        ...order,
        calculatedAmount,
        groupName: newOrder.groupName,
        volume: newOrder.volume,
        dayId: newOrder.dayId,
        Day: newDay,
        Discount: newOrder.deleteDiscounts ? [] : order.Discount,
        OrderService: P.availableServices.filter(i => serviceIds.includes(i.id)).map((i, index) => {
          return {
            id: index,
            isVip: newDay.isVip,
            orderId: order.id,
            price: newDay.isVip ? (i.priceVip ?? 0) : i.priceNormal,
            serviceId: i.id,
            Service: i
          }
        })
      })

      setShowEditModal(false)
    } else {
      resHandleNotAuth(res, dispatch, router)
    }
  }

  return <AdminPagesContainer currentPage="order">
    <Head>
      <title>{`جزئیات سفارش ${order.id}`}</title>
    </Head>
    <Row className="bg-white border rounded-4 p-2">
      <Col md="9">
        <Row>
          <Col md="12">
            <h1 className="fs-3">مشخصات سفارش به شناسه {enDigit2Per(order.id)}</h1>
            <hr />
          </Col>

          <Col md="6">
            <InfoItem name="شناسه" value={order.id} />
          </Col>
          <Col md="6">
            <InfoItem name="تعداد" value={order.volume} />
          </Col>

          <Col md="6">
            <InfoItem name="سفارش دهنده" value={order.Customer.name} />
          </Col>
          <Col md="6">
            <InfoItem name="شماره" value={order.Customer.phone} />
          </Col>

          <Col md="6">
            <InfoItem name="نوع گروه" value={order.groupType} />
          </Col>
          <Col md="6">
            <InfoItem name="نام گروه" value={order.groupName} />
          </Col>

          <Col md="6">
            <InfoItem name="روز">
              {time2Str(order.Day.timestamp, order.Day.desc)}
              {order.Day.isVip && <>&nbsp;<Badge bg="success">VIP</Badge></>}
            </InfoItem>
          </Col>
          <Col md="6">
            <InfoItem name="زمان ثبت" value={time2Str(order.timeRegistered, '', true)} />
          </Col>

          <Col md="6">
            <InfoItem name="هزینه" value={order.calculatedAmount} threeDigit />
          </Col>
          <Col md="6">
            <InfoItem name="پرداخت شده" value={order.paidAmount} threeDigit />
          </Col>

          <Col md="6">
            <InfoItem name="وضعیت سفارش">
              <OrderStatusBadge orderStatus={order.orderStatus} />
            </InfoItem>
          </Col>

          <Col md="6">
            <InfoItem name="وضعیت پرداخت">
              <OrderPaymentStatusBadge status={order.status} />
            </InfoItem>
          </Col>
          {order.cancelRequest && <Col md="6" className="tw-bg-red-300 p-2 rounded">
            <InfoItem name="درخواست لغو" className="mb-0">
              {order.cancelRequest}
            </InfoItem>
          </Col>}

          <Col md="12" className="mt-3">
            <p className="text-center tw-text-lg">پرداخت ها</p>
            <TransactionTable
              transactions={order.Transaction}
              forOrderDetail
              onRemoveTransaction={handleRemoveTransaction} />
          </Col>
        </Row>
      </Col>

      <Col md="3" className="mt-3 mt-md-3">
        <p className="tw-text-center">خدمات خریداری شده</p>
        <AdminTable columnNames={[
          'نام',
          'نوع',
          'هزینه',
        ]} notAddBottomMargin>
          <tbody>
            {order.OrderService.map((s) =>
              <tr key={s.id}>
                <td>{s.Service.name}</td>
                <td>{enServiceType2Per(s.Service.type)}</td>
                <td>{enDigit2Per(s.price, true)}</td>
              </tr>
            )}
          </tbody>
        </AdminTable>
        <br />
        {order.Discount.length != 0 && <>
          <p className="tw-text-center">تخفیف ها</p>
          <AdminTable columnNames={[
            'درصد تخفیف',
            'توضیح'
          ]}
            notAddBottomMargin>
            <tbody>
              {order.Discount.map(i =>
                <tr key={i.id}>
                  <td>{enDigit2Per(i.value)}</td>
                  <td>{enDigit2Per(i.desc)}</td>
                </tr>)}
            </tbody>
          </AdminTable>
        </>}

        <div className="d-flex flex-column mt-3">
          <ActionIconButton iconPath={mdiPencilBox} onClick={() => setShowEditModal(true)}>
            ویرایش
          </ActionIconButton>
          {order.orderStatus == orderStatusEnum.canceled ?
            <>
              <ActionIconButton variant="success" onClick={() => setDoRestore(true)} iconPath={mdiRestore}>
                برگرداندن سفارش
              </ActionIconButton>
            </> :
            <>
              {order.calculatedAmount > order.paidAmount &&

                <ActionIconButton variant="success" onClick={() => setAddPayState({
                  amount: '',
                  customerId: order.customerId,
                  maxAmount: order.calculatedAmount - order.paidAmount,
                  orderId: order.id
                })} iconPath={mdiCashPlus}>
                  پرداخت نقدی
                </ActionIconButton>}

              {order.status != paymentStatusEnum.awaitPayment &&
                <ActionIconButton variant="secondary" href={`/ticket?orderID=${order.id}`} target="_blank"
                  iconPath={mdiTicketConfirmation}>
                  مشاهده بلیت
                </ActionIconButton>}

              <ActionIconButton variant="danger" iconPath={mdiCloseOctagon} onClick={() => setDoCancel(true)}>
                لغو سفارش
              </ActionIconButton>
            </>}
        </div>
      </Col>
    </Row>

    <AddTransactionModal
      show={addPayState != null}
      onHide={() => setAddPayState(null)}
      addPayState={addPayState}
      onEnd={handleAddTransaction}
    />

    <EditOrderModal
      order={order}
      show={showEditModal}
      currentDay={order.Day}
      availableDays={P.availableDays.filter(i => i.id != order.dayId)}
      availableServices={P.availableServices}
      onHide={() => setShowEditModal(false)}
      onEnd={handleEdit}
    />

    <AreYouSure
      show={doCancel}
      hideAction={() => setDoCancel(false)}
      yesAction={handleCancelOrder}
    />

    <AreYouSure
      show={doRestore}
      hideAction={() => setDoRestore(false)}
      yesAction={handleRestoreOrder}
    />
  </AdminPagesContainer>
}

function ActionIconButton(P: {
  iconPath: string, onClick?: () => void, children: ReactNode,
  variant?: string, className?: string, href?: string, target?: string
}) {
  return <Button className={"mb-1 text-end " + (P.className ?? '')} onClick={P.onClick} variant={P.variant}
    href={P.href} target={P.target}>
    <Icon path={P.iconPath} className="ms-2" size={1} />
    {P.children}
  </Button>
}

function AddTransactionModal(P: {
  show: boolean, onHide: Function, addPayState: AddTransaction | null,
  onEnd: (a: AddTransaction) => void
}) {
  const [addPayState, setAddPayState] = useState(P.addPayState)
  const [addTransactError, setAddTransactError] = useState<string | null>(null)

  useEffect(() => {
    setAddPayState(P.addPayState)
  }, [P.addPayState])


  return <Modal show={addPayState != null} onHide={() => setAddPayState(null)}>
    {addPayState && <Form onSubmit={e => {
      e.preventDefault()

      const nAmount = Number(addPayState.amount)
      if (Number.isNaN(nAmount) || nAmount > addPayState.maxAmount) {
        setAddTransactError('مقدار وارد شده اشتباه است.')
        setTimeout(() => {
          setAddTransactError(null)
        }, 2000);
      } else {
        return P.onEnd(addPayState)
      }
    }}>
      <Modal.Body>
        <Row className="align-items-center">
          <Col md="8">
            <NewPerNumberInput
              value={addPayState.amount}
              onSet={s => setAddPayState(({ ...addPayState, amount: s }))}
              required
              placeholder="مقدار"
              to3digit
            />
          </Col>
          <Col md="4">
            حداکثر تا {enNumberTo3DigPer(addPayState.maxAmount!)}
          </Col>
        </Row>
        {addTransactError == null ? <></> :
          <Alert variant="danger" className="mt-2">{addTransactError}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" type="submit">ثبت</Button>
      </Modal.Footer>
    </Form>}
  </Modal>
}


const orderEdit2Editable = (a: OrderEditPayload) => ({
  ...a,
  volume: String(a.volume)
})
type OrderEditPayloadEdit = ReturnType<typeof orderEdit2Editable>

function EditOrderModal(P: {
  order: OrderDetailed, show: boolean, onHide: () => void,
  currentDay: OurDay,
  availableDays: OrderDetailsPageProps['availableDays'],
  availableServices: OrderDetailsPageProps['availableServices'],
  onEnd: (o: OrderEditPayload) => void
}) {

  const initOrder = () => ({
    orderId: P.order.id,
    groupName: P.order.groupName,
    serviceIds: P.order.OrderService.map(i => i.serviceId),
    dayId: P.order.dayId,
    volume: String(P.order.volume),
    deleteDiscounts: false,
  })

  const [order, setOrder] = useState<OrderEditPayloadEdit>(initOrder())

  const { alertMessage, showAlert } = useAlert()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setOrder(initOrder()), [P.order, P.show])

  return <Modal show={P.show} onHide={P.onHide} >
    {order && <Form onSubmit={e => {
      e.preventDefault()

      const nVol = Number(order.volume)

      if (nVol < 1) {
        showAlert("تعداد نفرات انتخابی صحیح نیست.")
        return
      }

      if (order.dayId == P.currentDay.id) {
        if (P.currentDay.remained + P.order.volume < nVol) {
          showAlert("ظرفیت انتخابی از ظرفیت روز بیشتر است.")
          return
        }
      } else {
        const day = P.availableDays.find(i => i.id == order.dayId)
        if (day && day.remained < nVol) {
          showAlert("ظرفیت انتخابی از ظرفیت روز بیشتر است.")
          return
        }
      }

      if (order.serviceIds.length == 0) {
        showAlert("سرویسی انتخاب نشده است.")
        return
      }


      P.onEnd({
        ...order,
        volume: nVol
      })
    }}>
      <Modal.Header>
        ویرایش روز
      </Modal.Header>

      <Modal.Body>

        <Form.Label>نام گروه</Form.Label>
        <Form.Control className="w-100 mb-2"
          value={order.groupName} required
          onChange={e => setOrder({ ...order, groupName: e.target.value })} />

        <Form.Label>تعداد نفرات</Form.Label>
        <NewPerNumberInput className="w-100 mb-3"
          value={order.volume}
          onSet={s => setOrder({ ...order, volume: s })} />

        <Accordion>

          <Accordion.Item eventKey="1">
            <Accordion.Header className="justify-content-between">انتخاب روز &nbsp;&nbsp;</Accordion.Header>
            <Accordion.Body className="p-0">
              <ListGroup className="overflow-y-scroll" style={{ height: '50vh' }}>
                {/* for current day */}
                <ListGroup.Item className="d-flex justify-content-between p-2">
                  <span>
                    <span className="fw-bold">روز فعلی: </span>
                    {time2Str(P.currentDay.timestamp, P.currentDay.desc)}
                    - باقی مانده: {enDigit2Per(P.currentDay.remained)}
                    &nbsp;{P.currentDay.isVip && <Badge>VIP</Badge>}
                  </span>
                  <Form.Check type="radio" name="choose-day"
                    checked={order.dayId == P.currentDay.id}
                    onChange={() => setOrder({ ...order, dayId: P.currentDay.id })} />
                </ListGroup.Item>

                {P.availableDays.map(i =>
                  <ListGroup.Item key={i.id} className="d-flex justify-content-between p-2">
                    <span>
                      {time2Str(i.timestamp, i.desc)} - {enDigit2Per(i.remained)} نفر
                      &nbsp;{i.isVip && <Badge >VIP</Badge>}
                    </span>
                    <Form.Check type="radio" name="choose-day"
                      checked={order.dayId == i.id}
                      onChange={() => setOrder({ ...order, dayId: i.id })} />
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header>انتخاب بسته &nbsp;&nbsp;</Accordion.Header>
            <Accordion.Body className="p-0">
              <ListGroup>
                {P.availableServices.filter(i => i.type == serviceTypeEnum.package).map(i =>
                  <ListGroup.Item key={i.id} className="d-flex p-2 justify-content-between">
                    {i.name} <Form.Check
                      checked={order.serviceIds.includes(i.id)}
                      onChange={e => setOrder(e.target.checked ? {
                        ...order, serviceIds: [...order.serviceIds, i.id]
                      } : {
                        ...order, serviceIds: order.serviceIds.filter(j => j != i.id)
                      })}
                    />
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="3">
            <Accordion.Header>انتخاب خدمت &nbsp;&nbsp;</Accordion.Header>
            <Accordion.Body className="p-0">
              <ListGroup>
                {P.availableServices.filter(i => i.type == serviceTypeEnum.service).map(i =>
                  <ListGroup.Item key={i.id} className="d-flex p-2 justify-content-between">
                    {i.name} <Form.Check
                      checked={order.serviceIds.includes(i.id)}
                      onChange={e => setOrder(e.target.checked ? {
                        ...order, serviceIds: [...order.serviceIds, i.id]
                      } : {
                        ...order, serviceIds: order.serviceIds.filter(j => j != i.id)
                      })} />
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>

        </Accordion>

        {P.order.Discount.length != 0 && <div className="d-flex align-items-center justify-content-between mt-2">
          حذف تخفیف ها
          <Form.Check
            checked={order.deleteDiscounts}
            onChange={e => setOrder({ ...order, deleteDiscounts: e.target.checked })} />
        </div>}


        {alertMessage && <Alert variant="danger" className="my-2">{alertMessage}</Alert>}

      </Modal.Body>
      <Modal.Footer>
        <IconButton
          iconPath={mdiCancel}
          variant="danger"
          onClick={P.onHide} />
        <IconButton
          iconPath={mdiCheck}
          variant="success"
          type="submit" />
      </Modal.Footer>
    </Form>}
  </Modal>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {

      const param = context.params?.orderId

      if (param == undefined) {
        return {
          props: {},
          redirect: {
            destination: '/admin/order'
          }
        }
      }


      const orderId = Number(param)

      if (Number.isNaN(orderId)) {
        return {
          props: {},
          redirect: {
            destination: '/admin/order'
          }
        }
      }

      const prisma = new PrismaClient()


      const order = await prisma.order.findFirst({
        where: {
          id: orderId
        },
        include: {
          Customer: true,
          Day: {
            select: {
              id: true,
              timestamp: true,
              maxVolume: true,
              desc: true,
              isVip: true,
            }
          },
          Discount: true,
          Transaction: true,
          OrderCancel: true,
          OrderService: {
            include: {
              Service: true
            }
          }
        }
      })

      if (order == null) {
        return {
          props: {},
          redirect: {
            destination: '/404'
          }
        }
      }

      const orderDay = await prisma.day.findFirst({
        where: { id: order.dayId },
        select: {
          Order: { where: { orderStatus: orderStatusEnum.reserved } },
          maxVolume: true
        }
      })
      const orderDayReserved = orderDay!.Order.reduce((sum, i) => sum + i.volume, 0)
      const orderDayRemained = orderDay!.maxVolume - orderDayReserved

      const now = nowPersianDateObject()

      const availableDays = await prisma.day.findMany({
        where: {
          timestamp: { gte: now.toUnix() }
        },
        select: {
          id: true,
          timestamp: true,
          maxVolume: true,
          desc: true,
          isVip: true,
          Order: {
            select: { id: true, volume: true },
            where: { orderStatus: orderStatusEnum.reserved }
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      })

      const availableServices = await prisma.service.findMany()

      return {
        props: {
          order: {
            ...order,
            paidAmount: order.Transaction.reduce((sum, i) => sum + i.valuePaid, 0),
            cancelRequest: order.OrderCancel.length == 0 ? null : order.OrderCancel[0].reason,
            Day: {
              ...order.Day,
              reserved: orderDayReserved,
              remained: orderDayRemained,
            }
          },
          availableServices,
          availableDays: availableDays.map(i => {

            const reserved = i.Order.reduce((sum, j) => sum + j.volume, 0)
            const remained = i.maxVolume - reserved

            return {
              ...i, reserved, remained
            }
          }).filter(i => i.remained != 0),
        } satisfies OrderDetailsPageProps
      }
    }
  })
}