import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AreYouSure } from "@/components/AreYouSure";
import { DynamicHead } from "@/components/DynamicHead";
import { IconButton } from "@/components/IconButton";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { fetchPost } from "@/lib/lib";
import { mdiTrashCan } from "@mdi/js";
import { PrismaClient, Transaction } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { Table } from "react-bootstrap";
import { DelResource } from "../api/admin/del";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";


export default function AdminTransactionPage(props: AdminTransactionProps) {
  const [delMode, setDelMode] = useState<number | null>(null)
  const [transactions, setTransactions] = useState(props.transactions)

  const dispatch = useDispatch()
  const router = useRouter()

  async function handleDel() {

    if (delMode == null) return

    const body: DelResource = {
      type: 'transaction',
      id: delMode
    }

    const res = await fetchPost("/api/admin/del", body)

    if (res.ok) {
      setTransactions(ts => ts.filter(t => t.id != delMode))
      setDelMode(null)
    }
    resHandleNotAuth(res, dispatch, router)
  }

  return <AdminPagesContainer currentPage="transaction">
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {transactions.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.valuePaid}</td>
            <td style={{ wordWrap: 'break-word', fontSize: '0.7rem' }}>{i.payId}</td>
            <td>{i.payPortal}</td>
            <td>{i.payDate}</td>
            <td>{i.orderId}</td>
            <td>
              {i.payPortal == 'cash' ? <IconButton
                iconPath={mdiTrashCan}
                variant="danger"
                onClick={() => setDelMode(i.id)} /> : <></>}
            </td>
          </tr>)}
        </tbody>
      </Table>
    </div>
    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={handleDel} />
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
            'شناسه سفارش',
            'عملیات'
          ]
        } satisfies AdminTransactionProps
      }
    }
  })
}