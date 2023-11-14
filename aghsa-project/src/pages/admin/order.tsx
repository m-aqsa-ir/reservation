import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { IconButton } from "@/components/IconButton";
import { ModalFonted } from "@/components/ModalFonted";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigitToPer, enGroupType2Per, enOrderStatus2Per, fetchPost, timestampSecondsToPersianDate } from "@/lib/lib";
import { mdiCashFast } from "@mdi/js";
import { Order, PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { Button, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { AddTransaction } from "../api/admin/add-transaction";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";


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
    <div className="rounded-4 overflow-hidden border">
      
      <Table striped bordered>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {orders.map(i => <tr key={i.id}>
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
        await handleAddTransaction()
      }}>
        <Modal.Body>
          <Row className="align-items-center">
            <Col md="8">
              {/* <Form.Label>مقدار</Form.Label> */}
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
              حداکثر تا {enDigitToPer(addPayState?.maxAmount!)}
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
    dayId?: string,
    customerId?: string
  },
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

      const customerId = context.query['customerId'] as string | undefined
      const dayId = context.query['dayId'] as string | undefined

      const filter = {
        dayId, customerId
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
          }
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