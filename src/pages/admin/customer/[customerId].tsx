import { AdminPagesContainer } from "@/components/AdminPagesContainer"
import { InfoItem } from "@/components/InfoItem"
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import { enDigit2Per } from "@/lib/lib"
import { OrderTableRow, PaginatorState } from "@/types"
import { Customer, Day, Discount, Order, OrderService, PrismaClient, Service } from "@prisma/client"
import { GetServerSideProps } from "next"
import Head from "next/head"
import { Col, Row } from "react-bootstrap"
import { OrderTable } from "../order"


export default function CustomerDetailsPage(P: CustomerDetailsPageProps) {
  return <AdminPagesContainer currentPage="customer">
    <Head>
      <title>{`جزئیات مشتری ${P.customer.name}`}</title>
    </Head>

    <Col md="12">
      <h1 className="fs-3">مشخصات مشتری: {enDigit2Per(P.customer.name)}</h1>
      <hr />
    </Col>

    <Row>
      <Col md="4">
        <InfoItem name="نام" value={P.customer.name} />
      </Col>
      <Col md="4">
        <InfoItem name="شماره همراه" value={P.customer.phone} />
      </Col>
      <Col md="4">
        <InfoItem name="کد ملی" value={P.customer.nationalCode} />
      </Col>

      <OrderTable
        orders={P.customer.Order}
        page={{ ...P.page, pageName: `/admin/customer/${P.customer.id}` }}
        forCustomerDetailPage />
    </Row>
  </AdminPagesContainer>
}


type CustomerDetailsPageProps = {
  customer: Customer & {
    Order: OrderTableRow[]
  },
  page: PaginatorState
}



export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {


      const param = context.params?.customerId

      if (param == undefined) {
        return {
          props: {},
          redirect: {
            destination: '/admin/order'
          }
        }
      }


      const customerId = Number(param)

      if (Number.isNaN(customerId)) {
        return {
          props: {},
          redirect: {
            destination: '/admin/order'
          }
        }
      }

      const prisma = new PrismaClient()

      //: PAGE <<<
      const page = context.query['page'] == undefined ? 1 : Number(context.query['page'])
      //: TODO read from front
      const pageCount = 30
      const totalCount = await prisma.order.count()
      //: >>>


      const customer = await prisma.customer.findFirst({
        where: { id: customerId },

        include: {
          Order: {
            include: {
              Day: true,
              Discount: true,
              OrderService: {
                include: { Service: true }
              },
              Transaction: true,
              Customer: true,
            },
            take: pageCount,
            skip: (page - 1) * pageCount
          }
        }
      })

      if (customer == null) {
        return {
          props: {},
          redirect: {
            destination: '/404'
          }
        }
      }


      return {
        props: {
          customer: {
            ...customer, Order: customer.Order.map(i => {
              const { Transaction, Discount, ...without } = i

              const paidAmount = Transaction.reduce((sum, i) => sum + i.valuePaid, 0)

              const discountSum = Discount.reduce((sum, i) => sum + i.value, 0)
              const discountsStr = Discount.map(i => i.desc).join(', ')

              const orderVip = i.OrderService.every(i => i.isVip)

              return {
                ...without, paidAmount,
                discountSum, discountsStr,
                orderVip
              }

            })
          },
          page: {
            page, pageCount, totalCount
          }
        } satisfies CustomerDetailsPageProps
      }

    }
  })
}