import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { timestampSecondsToPersianDate } from "@/lib/lib";
import { Order, PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { Table } from "react-bootstrap";


export default function AdminOrderPage(props: AdminOrderProps) {
  return <AdminPagesContainer currentPage="order">
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {props.orders.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.volume}</td>
            <td>{i.groupType == 'family' ? 'خانواده' : i.groupType == 'men-group' ? 'گروه آقایان' : 'گروه بانوان'}</td>
            <td>{i.groupName}</td>
            <td>{i.status == 'await-payment' ? 'منتظر پرداخت' : i.status == 'paid' ? 'پرداخت شده' : i.status}</td>
            <td>{i.timeStr}</td>
            <td>{i.calculatedAmount}</td>
            <td>{i.prePayAmount}</td>
            <td>{i.customerStr}</td>
            <td>{i.dayStr}</td>
          </tr>)}
        </tbody>
      </Table>
    </div>
  </AdminPagesContainer>
}

type AdminOrderProps = {
  columnNames: string[],
  orders: (Order & {
    timeStr: string,
    customerStr: string,
    dayStr: string
  })[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {

      const prisma = new PrismaClient()

      const orders = await prisma.order.findMany({
        include: {
          Customer: true,
          Day: true
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
            'هزینه محاسبه شده',
            'هزینه پیش پرداخت',
            'پرداخت کننده',
            'روز',
          ],
          orders: orders.map(i => {
            const timeStr = timestampSecondsToPersianDate(i.timeRegistered).format("YYYY/MM/DD \n HH:mm")
            const customerStr = i.Customer.name + "\n" + i.Customer.phone
            const { day, month, year } = i.Day
            const dayStr = `${year}/${month}/${day}`

            return {
              ...i,
              timeStr, customerStr, dayStr
            }
          })
        } satisfies AdminOrderProps
      }
    }
  })
}