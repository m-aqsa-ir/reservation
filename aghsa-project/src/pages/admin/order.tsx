import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { IconButton } from "@/components/IconButton";
import { ModalFonted } from "@/components/ModalFonted";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigitToPer, fetchPost, timestampSecondsToPersianDate } from "@/lib/lib";
import { mdiCashFast } from "@mdi/js";
import { Order, PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { Button, Form, Modal, Table } from "react-bootstrap";
import { AddTransaction } from "../api/admin/add-transaction";
import { resHandleAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";


export default function AdminOrderPage(props: AdminOrderProps) {

  const [addPayState, setAddPayState] = useState<AddTransaction | null>()
  const [orders, setOrders] = useState(props.orders)

  const dispatch = useDispatch()
  const router = useRouter()

  return <AdminPagesContainer currentPage="order">
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {orders.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.volume}</td>
            <td>{i.groupType == 'family' ? 'خانواده' : i.groupType == 'men-group' ? 'گروه آقایان' : 'گروه بانوان'}</td>
            <td>{i.groupName}</td>
            <td>{i.status == 'await-payment' ? 'منتظر پرداخت' : i.status == 'paid' ? 'پرداخت شده' : i.status}</td>
            <td>{i.timeStr}</td>
            <td>{i.calculatedAmount}</td>
            <td>{i.paidAmount}</td>
            <td>{i.customerStr}</td>
            <td>{i.dayStr}</td>
            <td style={{ fontSize: '.8rem' }}>{i.servicesStr}</td>
            <td>
              {i.calculatedAmount >= i.paidAmount ? <IconButton
                variant="info"
                iconPath={mdiCashFast}
                title="پرداخت نقدی"
                onClick={() => setAddPayState({
                  orderId: i.id,
                  maxAmount: i.calculatedAmount - i.paidAmount,
                  amount: 1, customerId: i.customerId
                })}
              /> : <></>}
            </td>
          </tr>)}
        </tbody>
      </Table>
    </div>

    <ModalFonted show={addPayState != null} onHide={() => setAddPayState(null)}>
      <Form onSubmit={async e => {
        e.preventDefault()


        const res = await fetchPost('/api/admin/add-transaction', addPayState!)

        if (res.ok) {
          setOrders(os => os.map(o => {
            if (o.id == addPayState?.orderId) {
              return {
                ...o,
                paidAmount: o.paidAmount + addPayState.amount
              }
            } else {
              return o
            }
          }))

          setAddPayState(null)
          return
        }

        resHandleAuth(res, dispatch, router)
      }}>
        <Modal.Body>
          <Form.Label>مقدار</Form.Label>
          <Form.Control
            type="number"
            required
            placeholder="مقدار"
            max={addPayState?.maxAmount}
            value={addPayState?.amount}
            onChange={v => setAddPayState(a => ({ ...a!, amount: Number(v.target.value) }))}
          />
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
  orders: (Order & {
    timeStr: string,
    customerStr: string,
    dayStr: string,
    servicesStr: string,
    paidAmount: number,
  })[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {

      const prisma = new PrismaClient()

      const orders = await prisma.order.findMany({
        include: {
          Customer: true,
          Day: true,
          Transaction: true,
          OrderService: {
            include: {
              Service: true
            }
          }
        }
      })

      return {
        props: {
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
            'خدمات',
            'عملیات'
          ],
          orders: orders.map(i => {
            const timeStr = timestampSecondsToPersianDate(i.timeRegistered).format("YYYY/MM/DD \n HH:mm")
            const customerStr = i.Customer.name + "\n" + i.Customer.phone
            const { day, month, year } = i.Day
            const dayStr = enDigitToPer(`${year}/${month}/${day}`)

            const servicesStr = i.OrderService.map(j => j.Service.name).join('، ')
            const paidAmount = i.Transaction.reduce((sum, j) => sum + j.valuePaid, 0)

            return {
              ...i,
              timeStr, customerStr, dayStr, servicesStr, paidAmount
            }
          })
        } satisfies AdminOrderProps
      }
    }
  })
}