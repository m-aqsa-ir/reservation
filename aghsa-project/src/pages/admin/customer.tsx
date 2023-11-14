import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { Customer, PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { Button, Table } from "react-bootstrap";


export default function AdminCustomerPage(props: AdminCustomerProps) {
  return <AdminPagesContainer currentPage="customer">
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {props.customers.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.name}</td>
            <td>{i.phone}</td>
            <td>{i.nationalCode}</td>
            <td><Link href={`/admin/order?customerId=${i.id}`}>
              <Button>
                سفارشات
              </Button></Link></td>
          </tr>)}
        </tbody>
      </Table>
    </div>
  </AdminPagesContainer>
}

type AdminCustomerProps = {
  columnNames: string[],
  customers: Customer[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {

      const prisma = new PrismaClient()

      const customers = await prisma.customer.findMany()


      return {
        props: {
          columnNames: [
            'شناسه',
            'نام',
            'تلفن',
            'کد ملی',
            'عملیات'
          ],
          customers
        } satisfies AdminCustomerProps
      }
    }
  })
}