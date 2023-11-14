import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { PrismaClient, Transaction } from "@prisma/client";
import { GetServerSideProps } from "next";
import { Table } from "react-bootstrap";


export default function AdminTransactionPage(props: AdminTransactionProps) {
  return <AdminPagesContainer currentPage="transaction">
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {props.transactions.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.valuePaid}</td>
            <td style={{ wordWrap: 'break-word', fontSize: '0.7rem' }}>{i.payId}</td>
            <td>{i.payPortal}</td>
            <td>{i.payDate}</td>
            <td>{i.orderId}</td>
          </tr>)}
        </tbody>
      </Table>
    </div>
  </AdminPagesContainer>
}

type AdminTransactionProps = {
  columnNames: string[],
  transactions: Transaction[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {
      const prisma = new PrismaClient()
      const transactions = await prisma.transaction.findMany()
      return {
        props: {
          transactions,
          columnNames: [
            'شناسه',
            'پرداخت شده',
            'شناسه پرداخت',
            'درگاه پرداخت',
            'زمان پرداخت',
            'شناسه سفارش'
          ]
        } satisfies AdminTransactionProps
      }
    }
  })
}