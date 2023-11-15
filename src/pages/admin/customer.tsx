import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { MyPaginator } from "@/components/MyPaginator";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { PrismaClient } from "@prisma/client";
import type { Customer } from '@prisma/client'
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
      <MyPaginator {...props.page} pageName="/admin/customer" />
    </div>
  </AdminPagesContainer>
}

type AdminCustomerProps = {
  columnNames: string[],
  customers: Customer[],
  page: PaginatorState
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {

      const prisma = new PrismaClient()

      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 20
      const totalCount = await prisma.order.count()

      const customers = await prisma.customer.findMany({
        take: pageCount,
        skip: (page - 1) * pageCount
      })

      return {
        props: {
          columnNames: [
            'شناسه',
            'نام',
            'تلفن',
            'کد ملی',
            'عملیات'
          ],
          customers,
          page: { page, pageCount, totalCount }
        } satisfies AdminCustomerProps
      }
    }
  })
}