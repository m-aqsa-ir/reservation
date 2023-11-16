import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { backHome, enDigit2Per, nowPersianDateObject, numberTo3Dig, orderPaidSum, timestampScnds2PerDate } from "@/lib/lib";
import { sections } from "@/lib/sections";
import { PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { Col, Row } from "react-bootstrap";
import { createClient } from "soap"


export default function TicketPage(props: TicketPageProps) {

  return <PageContainer>
    <SectionIndicators order={5} sections={sections} />
    <hr />

    {props.orderInfo == null ?
      <>
        <h1 className="mt-2 text-center">پرداخت ناموفق</h1>
      </>
      :
      <>
        <h1 className="text-center fs-4 mt-2">ارودگاه فرهنگی الاقصی</h1>
        <Row>
          <Col md="6" className="fs-5 mt-3">
            <span>نام گروه: </span>
            <span className="fw-bold">{props.orderInfo.groupName}</span>
          </Col>
          <Col md="6" className="fs-5 mt-3">
            <span>برای تاریخ: </span>
            <span className="fw-bold">{props.orderInfo.chosenDay}</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>نام سرگروه:‌ </span>
            <span className="fw-bold">{props.orderInfo.groupLeaderName}</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>تاریخ رزرو: </span>
            <span className="fw-bold">{props.orderInfo.reserveDate}</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>تعداد نفرات: </span>
            <span className="fw-bold">{enDigit2Per(props.orderInfo.volume)}</span>
          </Col>
          <Col md="6" className="mt-3">
            {props.orderInfo.services.length == 1 && props.orderInfo.services[0].type == 'package' ?
              <>
                <span>بسته انتخاب شده: </span>
                <span className="fw-bold">
                  {props.orderInfo.services[0].name}
                  &nbsp;({props.orderInfo.services[0].desc})
                </span>
              </>
              :
              <>
                <span>خدمات انتخاب شده: </span>
                <span>{props.orderInfo.services.map(i => i.name).join(', ')}</span>
              </>
            }
          </Col>
          <Col md="6" className="mt-3">
            <span>هزینه پرداخت شده: </span>
            <span className="fw-bold">{numberTo3Dig(props.orderInfo.prepaidValue)} تومان</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>هزینه باقی مانده: </span>
            <span className="fw-bold">{numberTo3Dig(props.orderInfo.remainedValue)} تومان   </span>
          </Col>
        </Row>
      </>}

  </PageContainer>
}

type MessageTypes = 'payment-canceled' | 'payment-successful' | 'payment-error' |
  'await-payment' | 'paid' | 'pre-paid'

type TicketPageProps = {
  orderInfo: TicketInfo | null,
  message: MessageTypes
}

export const getServerSideProps: GetServerSideProps = async (context) => {

  const query: {
    orderID?: string,
    amount?: string,
    Authority?: string,
    Status?: 'NOK' | 'OK' | string
  } = context.query

  const orderID = query.orderID
  if (!orderID) return backHome()

  const prisma = new PrismaClient()
  const order = await prisma.order.findFirst({
    where: {
      id: { equals: Number(orderID) }
    },
    include: {
      Customer: true,
      Day: true,
      Transaction: true,
      OrderService: {
        include: {
          Service: true
        }
      }
    }
  })
  if (order == null) return backHome()

  const authority = order.paymentAuthority
  const paymentStatus = query["Status"]

  //: TICKET AFTER PAYMENT
  if (paymentStatus != undefined && authority != null) {
    const paymentRes = await verifyPaymentAuthority(authority, order.prePayAmount, paymentStatus)

    // FIXME:
    // if (paymentRes.status) {

    //: create transaction
    const now = nowPersianDateObject()

    let transaction = await prisma.transaction.findFirst({
      where: { payId: authority }
    })


    if (transaction == null) {
      transaction = await prisma.transaction.create({
        data: {
          payId: authority,
          payPortal: 'zarin-pal',
          valuePaid: order.prePayAmount,
          payDate: now.format("YYYY/MM/DD-HH:mm"),
          payDateTimestamp: now.toUnix(),
          orderId: order.id,
          customerId: order.customerId
        },
      })

      //: set order status to paid
      await prisma.order.update({
        data: {
          //: TODO check if it has previously payments
          status: order.status == 'await-payment' ? 'pre-paid' : order.status,
        },
        where: {
          id: order.id
        }
      })
    }

    const reserveDate = timestampScnds2PerDate(order.timeRegistered).format("YYYY/MM/DD - HH:mm")
    const chosenDay = timestampScnds2PerDate(order.Day.timestamp).format("YYYY/MM/DD")

    //: read order info for creating ticket
    const ticketInfo: TicketInfo = {
      groupName: order.groupName,
      groupLeaderName: order.Customer.name,
      chosenDay,
      reserveDate,
      volume: order.volume,
      services: order.OrderService.map(i => i.Service),
      prepaidValue: order.prePayAmount,
      remainedValue: order.calculatedAmount - order.prePayAmount
    }
    return {
      props: {
        orderInfo: ticketInfo,
        message: paymentRes.message
      }
    }
    // FIXME:
    // } else {
    //   return {
    //     props: {
    //       verified: false,
    //       message: paymentRes.message
    //     }
    //   }
    // }
  }

  //: TICKET FROM PANEL

  if (order.status == 'await-payment') {
    return {
      props: {
        orderInfo: null,
        message: 'await-payment'
      } satisfies TicketPageProps
    }
  }

  const d = order.Day
  //: calculate payments of order
  const orderPaymentsSum = orderPaidSum(order)

  const orderInfo: TicketInfo = {
    groupName: order.groupName,
    groupLeaderName: order.Customer.name,
    chosenDay: enDigit2Per(`${d.year}/${d.month}/${d.day}`),
    reserveDate: timestampScnds2PerDate(order.timeRegistered).format("YYYY/MM/DD"),
    volume: order.volume,
    services: order.OrderService.map(i => i.Service),
    prepaidValue: orderPaymentsSum,
    remainedValue: order.calculatedAmount - orderPaymentsSum
  }

  return {
    props: {
      message: order.status as MessageTypes,
      orderInfo
    } satisfies TicketPageProps
  }

}

async function verifyPaymentAuthority(authority: string, prePayAmount: number, paymentStatus: string): Promise<{
  status: boolean,
  code: string,
  message: string
}> {
  var args = {
    'MerchantID': process.env.ZARIN_PAL_MERCHANT_ID!,
    'Authority': authority,
    'Amount': prePayAmount
  };

  return await new Promise((resolve, _) => {
    createClient(process.env.ZARIN_PAL_SOAP_SERVER!, (_, client) => {
      client.PaymentVerification(args, (_: any, result: string) => {
        var parseData: {
          RefID: string;
          Status: string;
        } = JSON.parse(JSON.stringify(result));

        if (paymentStatus != undefined && paymentStatus != "OK")
          resolve({
            status: false,
            code: parseData.RefID,
            message: 'payment-canceled'
          });
        else {
          if (Number(parseData.Status) === 100)
            resolve({
              status: true,
              code: parseData.RefID,
              message: 'payment-successful'
            });
          else
            resolve({
              status: false,
              code: parseData.RefID,
              message: 'payment-error'
            });
        }
      });
    });
  })
}