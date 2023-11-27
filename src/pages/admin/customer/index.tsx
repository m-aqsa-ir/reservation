import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AdminTable } from "@/components/AdminTables";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigit2Per } from "@/lib/lib";
import { PaginatorState } from "@/types";
import { mdiInformationVariantCircle } from "@mdi/js";
import Icon from "@mdi/react";
import { PrismaClient } from "@prisma/client";
import type { Customer } from '@prisma/client'
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { Button } from "react-bootstrap";


export default function AdminCustomerPage(props: AdminCustomerProps) {
  return <AdminPagesContainer currentPage="customer">
    <Head>
      <title>ادمین - مشتریان</title>
    </Head>
    <AdminTable
      columnNames={props.columnNames}
      page={{ ...props.page, pageName: "/admin/customer" }}>
      <tbody className="my-table">
        {props.customers.map(i => <tr key={i.id}>
          <td>{i.name}</td>
          <td>{enDigit2Per(i.phone)}</td>
          <td>{enDigit2Per(i.nationalCode)}</td>
          <td>
            <Link href={'/admin/customer/' + i.id} target="_blank">
              <Icon path={mdiInformationVariantCircle} style={{ width: '2rem', height: '2rem' }} />
            </Link>
          </td>
        </tr>)}
      </tbody>
    </AdminTable>
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

      //: PAGE <<<
      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 30
      const totalCount = await prisma.customer.count()
      //: >>>

      const customers = await prisma.customer.findMany({
        take: pageCount,
        skip: (page - 1) * pageCount
      })

      return {
        props: {
          columnNames: [
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