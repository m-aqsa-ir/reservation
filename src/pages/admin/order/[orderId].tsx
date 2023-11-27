import { AdminPagesContainer } from "@/components/AdminPagesContainer"
import { AdminTable } from "@/components/AdminTables"
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import { enDigit2Per, enServiceType2Per, fetchPost, orderStatusEnum, paymentStatusEnum, time2Str } from "@/lib/lib"
import { Customer, Day, Discount, Order, OrderService, PrismaClient, Service, Transaction } from "@prisma/client"
import { GetServerSideProps } from "next"
import { ReactNode, useState } from "react"
import { Button, Col, Row } from "react-bootstrap"
import { AddTransactionModal, OrderPaymentStatusBadge, OrderStatusBadge } from "."
import { TransactionTable } from "../transaction"
import Head from "next/head"
import Icon from "@mdi/react"
import { mdiCashPlus, mdiCloseOctagon, mdiRestore, mdiTicketConfirmation } from "@mdi/js"
import { AddTransaction } from "@/pages/api/admin/add-transaction"
import { resHandleNotAuth } from "@/lib/apiHandle"
import { useDispatch } from "react-redux"
import { useRouter } from "next/router"
import { showMessage } from "@/redux/messageSlice"
import { AreYouSure } from "@/components/AreYouSure"
import { OrderActionApi } from "@/pages/api/admin/order"
import { InfoItem } from "@/components/InfoItem"


type OrderDetailed = Order & {
  Customer: Customer,
  Day: Day,
  Discount: Discount[],
  Transaction: Transaction[],
  OrderService: (OrderService & {
    Service: Service
  })[]
} & { paidAmount: number }

type OrderDetailsPageProps = {
  order: OrderDetailed
}

export default function OrderDetailsPage(P: OrderDetailsPageProps) {

  const [order, setOrder] = useState<OrderDetailed>(P.order)
  const [doCancel, setDoCancel] = useState(false)
  const [doRestore, setDoRestore] = useState(false)


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
        Transaction: [...x.Transaction, body.transaction]
      }))


      setAddPayState(null);
      return;
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  function handleRemoveTransaction(id: number) {

    const transaction = order.Transaction.find(i => i.id == id)
    if (!transaction) return

    const newPaidAmount = order.paidAmount - transaction.valuePaid

    const newPayStatus = newPaidAmount == 0 ?
      paymentStatusEnum.awaitPayment :
      paymentStatusEnum.prePaid

    setOrder(x => ({
      ...x,
      paidAmount: newPaidAmount,
      status: newPayStatus,
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
            <InfoItem name="روز" value={time2Str(order.Day.timestamp, order.Day.desc)} />
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
          <br /><br />
          <Col md="12">
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

        <div className="d-flex flex-column mt-3">
          {order.orderStatus == orderStatusEnum.canceled ?
            <>
              <Button variant="success" onClick={e => setDoRestore(true)}>
                <Icon path={mdiRestore} className="ms-2" size={1} />
                برگرداندن سفارش
              </Button>
            </> :
            <>
              {order.calculatedAmount > order.paidAmount ?
                <Button variant="success" className="mb-1" onClick={e => setAddPayState({
                  amount: '',
                  customerId: order.customerId,
                  maxAmount: order.calculatedAmount - order.paidAmount,
                  orderId: order.id
                })}>
                  <Icon path={mdiCashPlus} size={1} className="ms-2" />
                  اضافه کردن پرداخت نقدی
                </Button> :
                <></>}
              {order.status != paymentStatusEnum.awaitPayment ?
                <Button variant="primary" className="mb-1" href={`/ticket?orderID=${order.id}`} target="_blank">
                  <Icon path={mdiTicketConfirmation} className="ms-2" size={1} />
                  مشاهده بلیت
                </Button> : <></>
              }

              <Button variant="danger" className="mb-1" onClick={() => setDoCancel(true)}>
                <Icon path={mdiCloseOctagon} className="ms-2" size={1} />
                لغو سفارش
              </Button>
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
          Day: true,
          Discount: true,
          Transaction: true,
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


      return {
        props: {
          order: {
            ...order,
            paidAmount: order.Transaction.reduce((sum, i) => sum + i.valuePaid, 0)
          }
        } satisfies OrderDetailsPageProps
      }
    }
  })
}