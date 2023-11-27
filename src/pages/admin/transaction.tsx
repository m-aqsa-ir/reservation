import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AreYouSure } from "@/components/AreYouSure";
import { IconButton } from "@/components/IconButton";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { enDigit2Per, fetchPost, enNumberTo3DigPer } from "@/lib/lib";
import { mdiTrashCan } from "@mdi/js";
import { PrismaClient, } from "@prisma/client";
import type { Transaction } from '@prisma/client'
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
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
    {props.filter.orderId != null ?
      <Row className="border mb-3 rounded-4 p-2 mx-1 align-items-center">
        <Col md="10">
          <span>فیلتر شناسه سفارش: {props.filter.orderId}</span>
        </Col>
        <Col md="2">
          <Button variant="danger" onClick={async () => {
            await router.replace('/admin/transaction', undefined, { shallow: true })
            router.reload()
          }}>حذف فیلترها</Button>
        </Col>
      </Row>
      :
      <></>}
    <TransactionTable page={{ ...props.page, pageName: "/admin/transaction" }}
      transactions={props.transactions} />
  </AdminPagesContainer>
}

export function TransactionTable(props: {
  page?: PaginatorState & { pageName: string; },
  transactions: Transaction[], forOrderDetail?: boolean,
  onRemoveTransaction?: (id: number) => void
}) {
  const [delMode, setDelMode] = useState<number | null>(null)

  const [transactions, setTransactions] = useState(props.transactions)
  useEffect(() => setTransactions(props.transactions), [props.transactions])

  const dispatch = useDispatch()
  const router = useRouter()

  const columnNames = [
    'پرداخت شده',
    'شناسه پرداخت',
    'درگاه پرداخت',
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

    const body: DelResource = {
      type: 'transaction',
      id: id
    }

    const res = await fetchPost("/api/admin/del", body)

    if (res.ok) {
      setTransactions(ts => ts.filter(t => t.id != id))
      props.onRemoveTransaction?.(body.id)
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
          <td>{i.payPortal == 'cash' ? 'نقدی' : i.payPortal}</td>
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
  filter: { orderId: string | null },
  page: PaginatorState
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {
      const prisma = new PrismaClient()

      const { orderId } = context.query
      const filter = {
        orderId: typeof orderId == 'string' ? orderId : null
      }

      //: PAGE <<<
      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 30
      const totalCount = await prisma.transaction.count()
      //: >>>

      const transactions = await prisma.transaction.findMany({
        where: {
          orderId: typeof orderId == 'string' ? Number(orderId) : undefined
        },
        take: pageCount,
        skip: (page - 1) * pageCount
      })
      return {
        props: {
          transactions,
          filter,
          page: { page, pageCount, totalCount }
        } satisfies AdminTransactionProps
      }
    }
  })
}