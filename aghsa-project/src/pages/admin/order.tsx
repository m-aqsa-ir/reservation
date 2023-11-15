import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { IconButton } from "@/components/IconButton";
import { ModalFonted } from "@/components/ModalFonted";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigit2Per, enGroupType2Per, enOrderStatus2Per, fetchPost, timestampSecondsToPersianDate } from "@/lib/lib";
import { mdiCashFast, mdiCashPlus, mdiCashRefund } from "@mdi/js";
import { Order, PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { Button, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { AddTransaction } from "../api/admin/add-transaction";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";


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
    {props.filter.dayId != null || props.filter.customerId != null ?
      <Row className="border mb-3 rounded-4 p-2 mx-1 align-items-center">
        <Col md="5">
          {props.filter.customerId == null ? <></> : <span>فیلتر شناسه مشتری: {props.filter.customerId}</span>}
        </Col>
        <Col md="5">
          {props.filter.dayId == null ? <></> : <span>فیلتر شناسه روز: {props.filter.dayId}</span>}
        </Col>
        <Col md="2">
          <Button onClick={async () => {
            await router.replace('/admin/order')
            router.reload()
          }}>حذف فیلترها</Button>
        </Col>
      </Row> : <></>
    }

    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {orders.map(i => <>
            <tr key={i.id}>
              <td>{i.id}</td>
              <td>{i.volume}</td>
              <td>{enGroupType2Per(i.groupType)}</td>
              <td>{i.groupName}</td>
              <td>{enOrderStatus2Per(i.status)}</td>
              <td>{i.timeStr}</td>
              <td>{i.calculatedAmount}</td>
              <td>{i.paidAmount}</td>
              <td>{i.customerStr}</td>
              <td>{i.dayStr}</td>
              <td rowSpan={2}>
                {i.calculatedAmount >= i.paidAmount ? <IconButton
                  variant="info"
                  iconPath={mdiCashPlus}
                  title="پرداخت نقدی"
                  onClick={() => setAddPayState({
                    orderId: i.id,
                    maxAmount: i.calculatedAmount - i.paidAmount,
                    amount: 1, customerId: i.customerId
                  })}
                /> : <></>}

                <IconButton
                  variant="success"
                  className="mt-2"
                  iconPath={mdiCashRefund} />
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ fontSize: '0.8rem' }}>
                سرویس: {i.servicesStr}
              </td>
              <td colSpan={5} style={{ fontSize: '0.8rem' }}>
                تخفیفات: {enDigit2Per(i.discountSum)}٪ {
                  i.discountSum == 0 ? <></> : <>- توضیحات: {enDigit2Per(i.discountsStr)}</>
                }
              </td>
            </tr>
          </>)}
        </tbody>
      </Table>
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
              حداکثر تا {enDigit2Per(addPayState?.maxAmount!)}
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
  columnNames: string[],
  filter: {
    dayId: string | null,
    customerId?: string | null
  },
  orders: (Order & {
    timeStr: string,
    customerStr: string,
    dayStr: string,
    servicesStr: string,
    paidAmount: number,
    discountSum: number,
    discountsStr: string
  })[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {

      const customerId = context.query['customerId'] as string | undefined
      const dayId = context.query['dayId'] as string | undefined

      const filter = {
        dayId: typeof dayId == 'string' ? dayId : null, 
        customerId: typeof customerId == 'string' ? customerId : null
      }

      const prisma = new PrismaClient()
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
        }
      })

      return {
        props: {
          filter,
          columnNames: [
            '#',
            'تعداد',
            'نوع گروه',
            'نام گروه',
            'وضعیت پرداخت',
            'زمان ثبت',
            'هزینه',
            'پرداخت شده',
            'پرداخت کننده',
            'روز',
            // 'خدمات',
            'عملیات'
          ],
          orders: orders.map(i => {
            const timeStr = timestampSecondsToPersianDate(i.timeRegistered).format("YYYY/MM/DD - HH:mm")
            const customerStr = i.Customer.name + " - " + i.Customer.phone
            const { day, month, year } = i.Day
            const dayStr = enDigit2Per(`${year}/${month}/${day}`)

            const servicesStr = i.OrderService.map(j => j.Service.name).join('، ')
            const paidAmount = i.Transaction.reduce((sum, j) => sum + j.valuePaid, 0)

            const discountSum = i.Discount.reduce((sum, j) => sum + j.value, 0)
            const discountsStr = i.Discount.map(j => j.desc).join('; ')


            return {
              ...i,
              timeStr, customerStr, dayStr, servicesStr, paidAmount,
              discountsStr, discountSum
            }
          })
        } satisfies AdminOrderProps
      }
    }
  })
}