import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AreYouSure } from "@/components/AreYouSure";
import { DynamicHead } from "@/components/DynamicHead";
import { IconButton } from "@/components/IconButton";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { fetchPost, numberTo3Dig } from "@/lib/lib";
import { mdiTrashCan } from "@mdi/js";
import { PrismaClient, } from "@prisma/client";
import type { Transaction } from '@prisma/client'
import { GetServerSideProps } from "next";
import { useState } from "react";
import { Button, Col, Row, Table } from "react-bootstrap";
import { DelResource } from "../api/admin/del";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { MyPaginator } from "@/components/MyPaginator";


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
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {transactions.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{numberTo3Dig(i.valuePaid)}</td>
            <td style={{ wordWrap: 'break-word', fontSize: '0.7rem' }}>{i.payId}</td>
            <td>{i.payPortal == 'cash' ? 'نقدی' : i.payPortal}</td>
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
      <MyPaginator {...props.page} pageName="/admin/transaction" />
    </div>
    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={handleDel} />
  </AdminPagesContainer>
}

type AdminTransactionProps = {
  columnNames: string[],
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

      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 20
      const totalCount = await prisma.order.count()

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
          columnNames: [
            'شناسه',
            'پرداخت شده',
            'شناسه پرداخت',
            'درگاه پرداخت',
            'زمان پرداخت',
            'شناسه سفارش',
            'عملیات'
          ],
          filter,
          page: { page, pageCount, totalCount }
        } satisfies AdminTransactionProps
      }
    }
  })
}