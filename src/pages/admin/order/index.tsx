import { AdminPagesContainer } from "@/components/AdminPagesContainer"
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import {
  enDigit2Per,
  enOrderStatus2Per,
  enPaymentStatus2Per,
  enNumberTo3DigPer,
  time2Str
} from "@/lib/lib"
import { mdiCancel, mdiInformationVariantCircle } from "@mdi/js"
import { PrismaClient } from "@prisma/client"
import { GetServerSideProps } from "next"
import { Fragment } from "react"
import {
  Badge,
  Button,
  Col,
  OverlayTrigger,
  Row,
  Tooltip
} from "react-bootstrap"
import { useRouter } from "next/router"
import Head from "next/head"
import Icon from "@mdi/react"
import { AdminTable } from "@/components/AdminTables"
import { OrderTableRow, PaginatorState } from "@/types"
import Link from "next/link"

export default function AdminOrderPage(props: AdminOrderProps) {
  const router = useRouter()

  return (
    <AdminPagesContainer currentPage="order">
      <Head>
        <title>ادمین - سفارشات</title>
      </Head>
      {props.filter.dayId != null || props.filter.customerId != null ? (
        <Row className="border mb-3 rounded-4 p-2 mx-1 align-items-center">
          <Col md="5">
            {props.filter.customerId == null ? (
              <></>
            ) : (
              <span>
                فیلتر شناسه مشتری: {enDigit2Per(props.filter.customerId)}
              </span>
            )}
          </Col>
          <Col md="5">
            {props.filter.dayId == null ? (
              <></>
            ) : (
              <span>فیلتر شناسه روز: {enDigit2Per(props.filter.dayId)}</span>
            )}
          </Col>
          <Col md="2">
            <Button
              variant="danger"
              onClick={async () => {
                await router.replace("/admin/order", undefined, {
                  shallow: true
                })
                router.reload()
              }}
            >
              حذف فیلترها
            </Button>
          </Col>
        </Row>
      ) : (
        <></>
      )}

      <OrderTable
        orders={props.orders}
        page={{ ...props.page, pageName: "/admin/order" }}
      />
    </AdminPagesContainer>
  )
}

export function OrderTable(P: {
  page?: PaginatorState & { pageName: string }
  orders: OrderTableRow[]
  pageName?: string
  forCustomerDetailPage?: boolean
}) {
  const columnNames = [
    "#",
    "تعداد",
    "نوع گروه",
    "نام گروه",
    "برای روز",
    "زمان ثبت",
    "هزینه",
    "پرداخت شده",
    "وضعیت سفارش",
    "وضعیت پرداخت",
    "پرداخت کننده",
    "سرویس ها",
    ""
  ].filter((i) => {
    if (P.forCustomerDetailPage && i == "پرداخت کننده") {
      return false
    } else {
      return true
    }
  })

  return (
    <>
      <AdminTable columnNames={columnNames} page={P.page}>
        <tbody className="my-table">
          {P.orders.map((i) => (
            <Fragment key={i.id}>
              <tr>
                <td
                  style={{
                    position: "relative"
                  }}
                >
                  {enDigit2Per(i.id)}
                  {i.cancelReq && (
                    <OverlayTrigger
                      trigger={["click", "hover"]}
                      overlay={(p) => (
                        <Tooltip {...p}>
                          درخواست لغو به علت: <br /> {i.cancelReq}
                        </Tooltip>
                      )}
                    >
                      <Badge bg="danger" style={{ padding: "3px" }}>
                        <Icon
                          path={mdiCancel}
                          style={{ width: ".8rem", height: ".8rem" }}
                        />
                      </Badge>
                    </OverlayTrigger>
                  )}
                </td>

                <td className="text-nowrap">{enDigit2Per(i.volume)} نفر</td>

                <td>{i.groupType}</td>

                <td>{i.groupName}</td>
                {/* DAY */}
                <td className="text-nowrap">
                  {i.orderVip ? (
                    <Badge className="ms-1" bg="success" pill>
                      VIP
                    </Badge>
                  ) : (
                    <></>
                  )}
                  {time2Str(i.Day.timestamp, i.Day.desc)}
                </td>
                {/* REGISTERED TIME */}
                <td className="text-nowrap">
                  {time2Str(i.timeRegistered, "", true)}
                </td>
                {/* PRICE */}
                <td className="text-nowrap">
                  {i.discountSum == 0 ? (
                    <></>
                  ) : (
                    <>
                      <OverlayTrigger
                        trigger={["hover", "click"]}
                        overlay={(p) => (
                          <Tooltip {...p}>
                            {enDigit2Per(i.discountsStr)}
                          </Tooltip>
                        )}
                      >
                        <Badge pill style={{ fontSize: ".7rem" }}>
                          {enDigit2Per(i.discountSum)}%
                        </Badge>
                      </OverlayTrigger>{" "}
                      &nbsp;
                    </>
                  )}
                  {enNumberTo3DigPer(i.calculatedAmount)}
                </td>

                <td>{enNumberTo3DigPer(i.paidAmount)}</td>

                {/* ORDER STATUS */}
                <td>
                  <OrderStatusBadge orderStatus={i.orderStatus} />
                </td>

                {/* PAYMENT STATUS */}
                <td>
                  <OrderPaymentStatusBadge status={i.status} />
                </td>

                {/* CUSTOMER */}
                {!P.forCustomerDetailPage && (
                  <td>
                    {i.Customer.name}
                    <br />
                    {enDigit2Per(i.Customer.phone)}
                  </td>
                )}

                {/* PACKAGES */}
                <td style={{ width: "13rem" }}>
                  <div className="d-flex flex-wrap justify-content-center align-items-center">
                    {i.OrderService.map(
                      ({ Service: { name, type }, price, id }) => (
                        <Badge
                          key={id}
                          pill
                          className="m-1"
                          bg={type == "package" ? "success" : "primary"}
                          style={{ fontSize: ".7rem", padding: ".4rem" }}
                        >
                          {name} - ({enDigit2Per(price)})
                        </Badge>
                      )
                    )}
                  </div>
                </td>

                {/* info page */}
                <td>
                  <Link href={"/admin/order/" + i.id} target="_blank">
                    <Icon
                      path={mdiInformationVariantCircle}
                      style={{ width: "2rem", height: "2rem" }}
                    />
                  </Link>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </AdminTable>
    </>
  )
}

export function OrderPaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      pill
      className={`tw-py-2  ${
        status == "pre-paid"
          ? "tw-bg-yellow-500"
          : status == "paid"
          ? "tw-bg-green-500"
          : "tw-bg-red-500"
      } `}
    >
      {enPaymentStatus2Per(status)}
    </Badge>
  )
}

export function OrderStatusBadge({ orderStatus }: { orderStatus: string }) {
  return (
    <Badge
      pill
      className={`tw-py-2  ${
        orderStatus == "reserved"
          ? "tw-bg-green-600"
          : orderStatus == "not-reserved"
          ? "tw-bg-yellow-500"
          : "tw-bg-red-500"
      } `}
    >
      {enOrderStatus2Per(orderStatus)}
    </Badge>
  )
}

type AdminOrderProps = {
  filter: {
    dayId: string | null
    customerId?: string | null
  }
  orders: OrderTableRow[]
  page: PaginatorState
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context,
    async callbackSuccess() {
      const prisma = new PrismaClient()

      //: filters
      const customerId = context.query["customerId"] as string | undefined
      const dayId = context.query["dayId"] as string | undefined

      const filter = {
        dayId: typeof dayId == "string" ? dayId : null,
        customerId: typeof customerId == "string" ? customerId : null
      }

      //: PAGE <<<
      const page =
        context.query["page"] == undefined ? 1 : Number(context.query["page"])
      //: TODO read from front
      const pageCount = 30
      const totalCount = await prisma.order.count()
      //: >>>

      const orders = await prisma.order.findMany({
        where: {
          customerId:
            typeof customerId == "string" ? Number(customerId) : undefined,
          dayId: typeof dayId == "string" ? Number(dayId) : undefined
        },
        include: {
          Customer: true,
          Day: true,
          Transaction: true,
          OrderService: {
            include: {
              Service: true
            }
          },
          Discount: true,
          OrderCancel: true
        },
        orderBy: {
          timeRegistered: "desc"
        },
        take: pageCount,
        skip: (page - 1) * pageCount
      })

      return {
        props: {
          filter,
          orders: orders.map((i) => {
            const { Transaction, Discount, ...without } = i

            const paidAmount = Transaction.reduce(
              (sum, i) => sum + i.valuePaid,
              0
            )

            const discountSum = Discount.reduce((sum, i) => sum + i.value, 0)
            const discountsStr = Discount.map((i) => i.desc).join(", ")

            const orderVip = i.OrderService.every((i) => i.isVip)

            const cancelReq =
              i.OrderCancel.length == 0 ? null : i.OrderCancel[0].reason

            return {
              ...without,
              paidAmount,
              discountSum,
              discountsStr,
              orderVip,
              cancelReq
            }
          }),
          page: { page, pageCount, totalCount }
        } satisfies AdminOrderProps
      }
    }
  })
}
