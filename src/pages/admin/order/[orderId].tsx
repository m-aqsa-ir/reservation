import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import { Customer, Day, Discount, Order, OrderService, PrismaClient, Service, Transaction } from "@prisma/client"
import { GetServerSideProps } from "next"


type OrderDetailsPageProps = {
  order: Order & {
    Customer: Customer,
    Day: Day,
    Discount: Discount,
    Transaction: Transaction,
    OrderService: OrderService & {
      Service: Service
    }
  }
}

export default function OrderDetailsPage(P: OrderDetailsPageProps) {
  return 
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {

      const param = context.params?.orderId

      if (param == undefined) {
        return {
          props: {},
          redirect: {
            destination: '/admin/order'
          }
        }
      }


      const orderId = Number(param)

      if (Number.isNaN(orderId)) {
        return {
          props: {},
          redirect: {
            destination: '/admin/order'
          }
        }
      }

      const prisma = new PrismaClient()


      const order = await prisma.order.findFirst({
        where: {
          id: orderId
        },
        include: {
          Customer: true,
          Day: true,
          Discount: true,
          Transaction: true,
          OrderService: {
            include: {
              Service: true
            }
          }
        }
      })

      if (order == null) {
        return {
          props: {},
          redirect: {
            destination: '/404'
          }
        }
      }


      return {
        props: {
          order
        }
      }
    }
  })
}