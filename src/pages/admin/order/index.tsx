import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import {
  enDigit2Per, enOrderStatus2Per, enPaymentStatus2Per, fetchPost, enNumberTo3DigPer,
  orderStatusEnum, paymentStatusEnum, timestampScnds2PerDate, time2Str
} from "@/lib/lib";
import {
  mdiCashPlus, mdiCloseOctagon, mdiInformationVariantCircle, mdiRestore,
  mdiTicketConfirmation
} from "@mdi/js";
import { PrismaClient } from "@prisma/client";
import type { Customer, Order } from '@prisma/client'
import { GetServerSideProps } from "next";
import { Fragment, useEffect, useState } from "react";
import { Alert, Badge, Button, Col, Dropdown, DropdownButton, Form, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { AddTransaction } from "@/pages/api/admin/add-transaction";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Head from "next/head";
import Icon from "@mdi/react";
import { AdminTable } from "@/components/AdminTables";
import { AreYouSure } from "@/components/AreYouSure";
import { OrderActionApi } from "@/pages/api/admin/order";
import { showMessage } from "@/redux/messageSlice";
import { OrderTableRow, PaginatorState, TablePageBaseProps } from "@/types";
import Link from "next/link";
import { NewPerNumberInput2 } from "@/components/PerNumberInput";


export default function AdminOrderPage(props: AdminOrderProps) {


  const router = useRouter()



  return <AdminPagesContainer currentPage="order">
    <Head>
      <title>ادمین - سفارشات</title>
    </Head>
    {props.filter.dayId != null || props.filter.customerId != null ?
      <Row className="border mb-3 rounded-4 p-2 mx-1 align-items-center">
        <Col md="5">
          {props.filter.customerId == null ? <></> : <span>فیلتر شناسه مشتری: {enDigit2Per(props.filter.customerId)}</span>}
        </Col>
        <Col md="5">
          {props.filter.dayId == null ? <></> : <span>فیلتر شناسه روز: {enDigit2Per(props.filter.dayId)}</span>}
        </Col>
        <Col md="2">
          <Button variant="danger" onClick={async () => {
            await router.replace('/admin/order', undefined, { shallow: true })
            router.reload()
          }}>حذف فیلترها</Button>
        </Col>
      </Row> : <></>
    }

    <OrderTable orders={props.orders} page={{ ...props.page, pageName: "/admin/order" }} />
  </AdminPagesContainer>
}

export function OrderTable(P: {
  page?: PaginatorState & { pageName: string },
  orders: OrderTableRow[], pageName?: string,
  forCustomerDetailPage?: boolean
}) {

  const [orders, setOrders] = useState(P.orders)
  const [orderToCancelId, setOrderToCancelId] = useState<number | null>(null)
  const [orderToRestoreId, setOrderToRestoreId] = useState<number | null>(null)

  const [addPayState, setAddPayState] = useState<AddTransaction | null>(null)

  const dispatch = useDispatch()
  const router = useRouter()

  useEffect(() => setOrders(P.orders), [P.orders])

  const columnNames = [
    '#',
    'تعداد',
    'نوع گروه',
    'نام گروه',
    'برای روز',
    'زمان ثبت',
    'هزینه',
    'پرداخت شده',
    'وضعیت سفارش',
    'وضعیت پرداخت',
    'پرداخت کننده',
    'سرویس ها',
    '',
    'عملیات',
  ].filter(i => {
    if (P.forCustomerDetailPage && i == 'پرداخت کننده') {
      return false
    } else {
      return true
    }
  })

  async function handleAddTransaction(aps: AddTransaction) {
    const res = await fetchPost('/api/admin/add-transaction', aps);

    if (res.ok) {
      const body = await res.json();
      setOrders(xs => xs.map(x => {
        if (x.id == aps.orderId) {
          return {
            ...x,
            paidAmount: x.paidAmount + Number(aps.amount),
            status: body.status
          };
        } else {
          return x;
        }
      }));

      setAddPayState(null);
      return;
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  async function handleCancelOrder() {
    if (orderToCancelId == null) return

    const body: OrderActionApi = {
      type: 'cancel',
      orderId: orderToCancelId
    }

    const res = await fetchPost('/api/admin/order', body)

    if (res.ok) {
      setOrders(xs => xs.map(x => x.id == orderToCancelId ? { ...x, orderStatus: 'canceled' } : x))
      setOrderToCancelId(null)
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  async function handleRestoreOrder() {
    if (orderToRestoreId == null) return

    const body: OrderActionApi = {
      type: 'restore',
      orderId: orderToRestoreId
    }

    const res = await fetchPost('/api/admin/order', body)

    if (res.ok) {
      const newStatus = await res.text()
      setOrders(xs => xs.map(x => x.id == orderToRestoreId ? { ...x, orderStatus: newStatus } : x))
      setOrderToRestoreId(null)
    } else if (res.status == 403) {
      dispatch(showMessage({ message: "ظرفیت روز پر شده است!" }))
      setOrderToRestoreId(null)
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  return <>
    <AdminTable
      columnNames={columnNames}
      page={P.page}
    >
      <tbody className="my-table">
        {orders.map(i => <Fragment key={i.id}>
          <tr >

            <td>{enDigit2Per(i.id)}</td>

            <td className="text-nowrap">{enDigit2Per(i.volume)} نفر</td>

            <td>{i.groupType}</td>

            <td>{i.groupName}</td>
            {/* DAY */}
            <td className="text-nowrap">
              {i.orderVip ? <Badge className="ms-1" bg="success" pill>VIP</Badge> : <></>}
              {time2Str(i.Day.timestamp, i.Day.desc)}
            </td>
            {/* REGISTERED TIME */}
            <td className="text-nowrap">{time2Str(i.timeRegistered, '', true)}</td>
            {/* PRICE */}
            <td className="text-nowrap">{i.discountSum == 0 ? <></> :
              <>
                <OverlayTrigger
                  trigger={['hover', 'click']}
                  overlay={p => <Tooltip {...p}>{enDigit2Per(i.discountsStr)}</Tooltip>}
                >
                  <Badge pill
                    style={{ fontSize: '.7rem' }}>
                    {enDigit2Per(i.discountSum)}%
                  </Badge>
                </OverlayTrigger> &nbsp;
              </>}
              {enNumberTo3DigPer(i.calculatedAmount)}
            </td>

            <td>{enNumberTo3DigPer(i.paidAmount)}</td>

            {/* ORDER STATUS */}
            <td>
              <OrderStatusBadge orderStatus={i.orderStatus} />
            </td>

            {/* PAYMENT STATUS */}
            <td>
              <OrderPaymentStatusBadge status={i.status} />
            </td>

            {/* CUSTOMER */}
            {!P.forCustomerDetailPage && <td>
              {i.Customer.name}
              <br />
              {enDigit2Per(i.Customer.phone)}
            </td>}

            {/* PACKAGES */}
            <td style={{ width: '13rem' }}>
              <div className="d-flex flex-wrap justify-content-center align-items-center">
                {i.OrderService.map(({ Service: { name, type }, price, id }) =>
                  <Badge
                    key={id} pill
                    className="m-1"
                    bg={type == 'package' ? "success" : "primary"}
                    style={{ fontSize: '.7rem', padding: '.4rem' }}
                  >
                    {name} - ({enDigit2Per(price)})
                  </Badge>
                )}
              </div>
            </td>

            {/* info page */}
            <td>
              <Link href={'/admin/order/' + i.id} target="_blank">
                <Icon path={mdiInformationVariantCircle} style={{ width: '2rem', height: '2rem' }} />
              </Link>
            </td>

            {/* ACTIONS */}
            <td>
              <DropdownButton id="dropdown-basic-button" title="" variant="light" className="bg-gray">
                {i.calculatedAmount > i.paidAmount && i.orderStatus != orderStatusEnum.canceled ?
                  <Dropdown.Item className="text-end"
                    onClick={() => setAddPayState({
                      orderId: i.id,
                      maxAmount: i.calculatedAmount - i.paidAmount,
                      amount: '', customerId: i.customerId
                    })}
                  >
                    <Icon path={mdiCashPlus} size={1} className="ms-2 text-success" />
                    پرداخت نقدی
                  </Dropdown.Item> : <></>}

                {i.orderStatus != orderStatusEnum.canceled && i.status != paymentStatusEnum.awaitPayment ?
                  <Dropdown.Item
                    href={`/ticket?orderID=${i.id}`} target="_blank" className="text-end"
                  >
                    <Icon path={mdiTicketConfirmation} className="ms-2 text-primary" size={1} />
                    باز کردن بلیت
                  </Dropdown.Item> : <></>}

                {i.orderStatus != orderStatusEnum.canceled ?
                  <Dropdown.Item className="text-end"
                    onClick={() => setOrderToCancelId(i.id)}>
                    <Icon path={mdiCloseOctagon} className="ms-2 text-danger" size={1} />
                    لغو سفارش
                  </Dropdown.Item>
                  :
                  <Dropdown.Item className="text-end"
                    onClick={() => setOrderToRestoreId(i.id)}>
                    <Icon path={mdiRestore} className="ms-2 text-success" size={1} />
                    برگرداندن سفارش
                  </Dropdown.Item>}
              </DropdownButton>
            </td>
          </tr>
        </Fragment>)}
      </tbody>
    </AdminTable>

    <AddTransactionModal
      show={addPayState != null}
      onHide={() => setAddPayState(null)}
      addPayState={addPayState}
      onEnd={handleAddTransaction}
    />

    <AreYouSure
      show={orderToCancelId != null}
      hideAction={() => setOrderToCancelId(null)}
      yesAction={handleCancelOrder}
    />

    <AreYouSure
      show={orderToRestoreId != null}
      hideAction={() => setOrderToRestoreId(null)}
      yesAction={handleRestoreOrder}
    />
  </>
}

export function AddTransactionModal(P: {
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
            <NewPerNumberInput2
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

export function OrderPaymentStatusBadge({ status }: { status: string }) {
  return <Badge
    pill
    className={`tw-py-2  ${status == 'pre-paid' ? 'tw-bg-yellow-500' :
      status == 'paid' ? 'tw-bg-green-500' :
        'tw-bg-red-500'} `}>
    {enPaymentStatus2Per(status)}</Badge>
}

export function OrderStatusBadge({ orderStatus }: { orderStatus: string }) {
  return <Badge pill
    className={`tw-py-2  ${orderStatus == 'reserved' ? 'tw-bg-green-600' :
      orderStatus == 'not-reserved' ? 'tw-bg-yellow-500' :
        'tw-bg-red-500'} `}>
    {enOrderStatus2Per(orderStatus)}
  </Badge>
}

type AdminOrderProps = {
  filter: {
    dayId: string | null,
    customerId?: string | null
  },
  orders: OrderTableRow[],
  page: PaginatorState
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {
      const prisma = new PrismaClient()

      //: filters
      const customerId = context.query['customerId'] as string | undefined
      const dayId = context.query['dayId'] as string | undefined

      const filter = {
        dayId: typeof dayId == 'string' ? dayId : null,
        customerId: typeof customerId == 'string' ? customerId : null
      }

      //: PAGE <<<
      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 30
      const totalCount = await prisma.order.count()
      //: >>>

      const orders = await prisma.order.findMany({
        where: {
          customerId: typeof customerId == 'string' ? Number(customerId) : undefined,
          dayId: typeof dayId == 'string' ? Number(dayId) : undefined
        },
        include: {
          Customer: true,
          Day: true,
          Transaction: true,
          OrderService: {
            include: {
              Service: true
            }
          },
          Discount: true
        },
        orderBy: {
          timeRegistered: 'desc'
        },
        take: pageCount,
        skip: (page - 1) * pageCount
      })

      return {
        props: {
          filter,
          orders: orders.map(i => {
            const { Transaction, Discount, ...without } = i

            const paidAmount = Transaction.reduce((sum, i) => sum + i.valuePaid, 0)

            const discountSum = Discount.reduce((sum, i) => sum + i.value, 0)
            const discountsStr = Discount.map(i => i.desc).join(', ')

            const orderVip = i.OrderService.every(i => i.isVip)

            return {
              ...without, paidAmount,
              discountSum, discountsStr,
              orderVip
            }

          }),
          page: { page, pageCount, totalCount }
        } satisfies AdminOrderProps
      }
    }
  })
}