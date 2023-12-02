import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AreYouSure } from "@/components/AreYouSure";
import { IconButton } from "@/components/IconButton";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigit2Per, fetchPost, enNumberTo3DigPer } from "@/lib/lib";
import { mdiTrashCan } from "@mdi/js";
import { PrismaClient, } from "@prisma/client";
import type { Transaction } from '@prisma/client';
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { DelResource } from "../api/admin/del";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Head from "next/head";
import { AdminTable } from "@/components/AdminTables";
import { PaginatorState } from "@/types";


export default function AdminTransactionPage(props: AdminTransactionProps) {

  const router = useRouter()

  return <AdminPagesContainer currentPage="transaction">
    <Head>
      <title>ادمین - پرداخت ها</title>
    </Head>
    <TransactionTable page={{ ...props.page, pageName: "/admin/transaction" }}
      transactions={props.transactions} />
  </AdminPagesContainer>
}

export function TransactionTable(props: {
  page?: PaginatorState & { pageName: string; },
  transactions: Transaction[], forOrderDetail?: boolean,
  onRemoveTransaction?: (id: number, status: string, orderStatus: string) => void
}) {
  const [delMode, setDelMode] = useState<number | null>(null)

  const [transactions, setTransactions] = useState(props.transactions)
  useEffect(() => setTransactions(props.transactions), [props.transactions])

  const dispatch = useDispatch()
  const router = useRouter()

  const columnNames = [
    'پرداخت شده',
    'شناسه پرداخت',
    'روش پرداخت',
    'زمان پرداخت',
    'شناسه سفارش',
    'عملیات'
  ].filter(i => {
    if (props.forOrderDetail && i == 'شناسه سفارش') {
      return false
    } else {
      return true
    }
  })

  async function handleDel(id: number) {

    const reqBody: DelResource = {
      type: 'transaction',
      id: id
    }

    const res = await fetchPost("/api/admin/del", reqBody)

    if (res.ok) {
      const body: {
        status: string,
        orderStatus: string
      } = await res.json()
      setTransactions(ts => ts.filter(t => t.id != id))
      props.onRemoveTransaction?.(reqBody.id, body.status, body.orderStatus)
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  return <>
    <AdminTable
      columnNames={columnNames}
      page={props.page}
      notAddBottomMargin={props.forOrderDetail}
    >
      <tbody>
        {transactions.map(i => <tr key={i.id}>
          <td>{enNumberTo3DigPer(i.valuePaid)} تومان</td>
          <td style={{ wordWrap: 'break-word', fontSize: '0.7rem' }}>{i.payId}</td>
          <td>
            {i.payPortal != 'cash' ? i.payPortal : i.desc}
          </td>
          <td className="text-nowrap">{i.payDate}</td>
          {!props.forOrderDetail ? <td>{enDigit2Per(i.orderId)}</td> : <></>}
          <td className="table-actions-col-width">
            {i.payPortal == 'cash' ? <IconButton
              iconPath={mdiTrashCan}
              variant="danger"
              onClick={() => setDelMode(i.id)} /> : <></>}
          </td>
        </tr>)}
      </tbody>
    </AdminTable>
    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={() => {
        if (delMode == null) return
        setDelMode(null)
        handleDel(delMode)
      }} />
  </>
}

type AdminTransactionProps = {
  transactions: Transaction[],
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
      const totalCount = await prisma.transaction.count()
      //: >>>

      const transactions = await prisma.transaction.findMany({
        orderBy: {
          payDateTimestamp: 'desc',
        },
        take: pageCount,
        skip: (page - 1) * pageCount
      })
      return {
        props: {
          transactions,
          page: { page, pageCount, totalCount }
        } satisfies AdminTransactionProps
      }
    }
  })
}