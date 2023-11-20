import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { ModalFonted } from "@/components/ModalFonted";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigit2Per, enOrderStatus2Per, fetchPost, numberTo3Dig, timestampScnds2PerDate } from "@/lib/lib";
import { mdiCashPlus, mdiCashRefund, mdiTicketConfirmation } from "@mdi/js";
import { PrismaClient } from "@prisma/client";
import type { Order } from '@prisma/client'
import { GetServerSideProps } from "next";
import { Fragment, useState } from "react";
import { Badge, Button, Col, Dropdown, DropdownButton, Form, Modal, OverlayTrigger, Row, Table, Tooltip } from "react-bootstrap";
import { AddTransaction } from "../api/admin/add-transaction";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { MyPaginator } from "@/components/MyPaginator";
import Head from "next/head";
import Icon from "@mdi/react";


export default function AdminOrderPage(props: AdminOrderProps) {

  const [addPayState, setAddPayState] = useState<AddTransaction | null>()
  const [orders, setOrders] = useState(props.orders)

  const dispatch = useDispatch()
  const router = useRouter()

  const handleAddTransaction = async () => {
    const res = await fetchPost('/api/admin/add-transaction', addPayState!)

    if (res.ok) {
      const status = await res.text()
      setOrders(xs => xs.map(x => {
        if (x.id == addPayState?.orderId) {
          return {
            ...x,
            paidAmount: x.paidAmount + addPayState.amount,
            status
          }
        } else {
          return x
        }
      }))

      setAddPayState(null)
      return
    }

    resHandleNotAuth(res, dispatch, router)
  }

  return <AdminPagesContainer currentPage="order">
    <Head>
      <title>ادمین - سفارشات</title>
    </Head>
    {props.filter.dayId != null || props.filter.customerId != null ?
      <Row className="border mb-3 rounded-4 p-2 mx-1 align-items-center">
        <Col md="5">
          {props.filter.customerId == null ? <></> : <span>فیلتر شناسه مشتری: {props.filter.customerId}</span>}
        </Col>
        <Col md="5">
          {props.filter.dayId == null ? <></> : <span>فیلتر شناسه روز: {props.filter.dayId}</span>}
        </Col>
        <Col md="2">
          <Button variant="danger" onClick={async () => {
            await router.replace('/admin/order', undefined, { shallow: true })
            router.reload()
          }}>حذف فیلترها</Button>
        </Col>
      </Row> : <></>
    }

    <div className="rounded-4 border p-1 bg-white">
      <Table responsive>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {orders.map(i => <Fragment key={i.id}>
            <tr >
              <td>{enDigit2Per(i.id)}</td>
              <td className="text-nowrap">{enDigit2Per(i.volume)} نفر</td>
              <td>{i.groupType}</td>
              <td>{i.groupName}</td>
              {/* DAY */}
              <td className="text-nowrap">
                {i.isVip ? <Badge className="ms-1" bg="success" pill>VIP</Badge> : <></>}
                {i.dayStr}
              </td>
              <td className="text-nowrap">{i.timeStr}</td>
              <td>
                <Badge
                  pill
                  bg={i.status == 'await-payment' ? 'danger' :
                    i.status == 'paid' ? 'success' :
                      'warning'}>{enOrderStatus2Per(i.status)}</Badge>
              </td>

              {/* PRICE */}
              <td className="text-nowrap">{i.discountSum == 0 ? <></> :
                <>
                  <OverlayTrigger
                    trigger={['hover', 'click']}
                    overlay={p => <Tooltip {...p}>{i.discountsStr}</Tooltip>}
                  >
                    <Badge pill
                      style={{ fontSize: '.7rem' }}
                    // title={i.discountsStr}
                    >
                      {enDigit2Per(i.discountSum)}%
                    </Badge>
                  </OverlayTrigger> &nbsp;
                </>}
                {numberTo3Dig(i.calculatedAmount)}
              </td>

              <td>{numberTo3Dig(i.paidAmount)}</td>
              <td>
                {i.customerName}
                <br />
                {enDigit2Per(i.customerPhone)}
              </td>

              {/* PACKAGES */}
              <td style={{ width: '13rem' }}>
                <div className="d-flex flex-wrap justify-content-center align-items-center">
                  {i.services.map(({ name, price, isVip, id }) =>
                    <Badge
                      key={id} pill
                      className="m-1"
                      bg="success"
                      style={{ fontSize: '.7rem', padding: '.4rem' }}
                    >
                      {name} - ({enDigit2Per(price)})</Badge>
                  )}
                </div>
              </td>

              {/* ACTIONS */}
              <td>
                <DropdownButton id="dropdown-basic-button" title="" variant="light" className="bg-gray">
                  {i.calculatedAmount > i.paidAmount ?
                    <Dropdown.Item className="text-end"
                      onClick={() => setAddPayState({
                        orderId: i.id,
                        maxAmount: i.calculatedAmount - i.paidAmount,
                        amount: 1, customerId: i.customerId
                      })}
                    >
                      <Icon path={mdiCashPlus} size={1} className="ms-2 text-success" />
                      پرداخت نقدی
                    </Dropdown.Item> : <></>}
                  {i.status == 'await-payment' ? <></> :
                    <Dropdown.Item className="text-end"
                      href={`/admin/transaction?orderId=${i.id}`}
                    >
                      <Icon path={mdiCashRefund} size={1} className="ms-2 text-warning" />
                      پرداخت های مربوطه
                    </Dropdown.Item>}
                  <Dropdown.Item
                    href={`/ticket?orderID=${i.id}`} target="_blank" className="text-end"
                  >
                    <Icon path={mdiTicketConfirmation} className="ms-2 text-primary" size={1} />
                    باز کردن بلیت
                  </Dropdown.Item>
                </DropdownButton>
              </td>
            </tr>
          </Fragment>)}
        </tbody>
      </Table>

      <MyPaginator {...props.page} pageName="/admin/order" />
    </div>

    <ModalFonted show={addPayState != null} onHide={() => setAddPayState(null)}>
      <Form onSubmit={async e => {
        e.preventDefault()
        await handleAddTransaction()
      }}>
        <Modal.Body>
          <Row className="align-items-center">
            <Col md="8">
              <Form.Control
                type="number"
                required
                placeholder="مقدار"
                max={addPayState?.maxAmount}
                value={addPayState?.amount}
                onChange={v => setAddPayState(a => ({ ...a!, amount: Number(v.target.value) }))}
              />
            </Col>
            <Col md="4">
              حداکثر تا {numberTo3Dig(addPayState?.maxAmount!)}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" type="submit">ثبت</Button>
        </Modal.Footer>
      </Form>
    </ModalFonted>
  </AdminPagesContainer>
}

type AdminOrderProps = {
  filter: {
    dayId: string | null,
    customerId?: string | null
  },
  orders: (Order & {
    timeStr: string,
    customerName: string,
    customerPhone: string,
    dayStr: string,
    services: {
      name: string,
      price: number,
      isVip: boolean,
      id: number,
      type: string
    }[],
    paidAmount: number,
    discountSum: number,
    discountsStr: string,
    isVip: boolean
  })[],
  page: PaginatorState
} & TablePageBaseProps

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

      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 20
      const totalCount = await prisma.order.count()

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
          columnNames: [
            '#',
            'تعداد',
            'نوع گروه',
            'نام گروه',
            'برای روز',
            'زمان ثبت',
            'وضعیت پرداخت',
            'هزینه',
            'پرداخت شده',
            'پرداخت کننده',
            'سرویس ها',
            'عملیات',
          ],
          orders: orders.map(i => {
            const timeStr = timestampScnds2PerDate(i.timeRegistered).format("YYYY/MM/DD - HH:mm")
            const { day, month, year, desc } = i.Day
            const dayStr = enDigit2Per(`${year}/${month}/${day}${desc == '' ? '' : ' - ' + desc}`)

            const services = i.OrderService.map(({ Service, price, isVip, id }) => ({
              name: Service.name, price, isVip, id, type: Service.type
            }))
            const paidAmount = i.Transaction.reduce((sum, j) => sum + j.valuePaid, 0)

            const discountSum = i.Discount.reduce((sum, j) => sum + j.value, 0)
            const discountsStr = i.Discount.map(j => j.desc).join('; ')

            const isVip = i.Day.isVip

            return {
              ...i,
              timeStr, dayStr, paidAmount, services, isVip,
              discountsStr, discountSum,
              customerName: i.Customer.name, customerPhone: i.Customer.phone,
            }
          }),
          page: { page, pageCount, totalCount }
        } satisfies AdminOrderProps
      }
    }
  })
}