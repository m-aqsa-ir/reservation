import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { backHome, enDigitToPer, nowPersianDateObject, timestampSecondsToPersianDate } from "@/lib/lib";
import { sections } from "@/lib/sections";
import { TicketInfo } from "@/types";
import { PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { Col, Row } from "react-bootstrap";
import { createClient } from "soap"


export default function TicketPage(props: {
  verified: boolean,
  orderInfo?: TicketInfo,
  message: string // NOT USED
}) {

  return <PageContainer>
    <SectionIndicators order={5} sections={sections} />
    <hr />

    {props.orderInfo == undefined ?
      <>
        <h1 className="mt-2 text-center">پرداخت ناموفق</h1>
      </>
      :
      <>
        <h1 className="text-center fs-4 mt-2">ارودگاه فرهنگی الاقصی</h1>
        <Row>
          <Col md="12" className="fs-5">
            <span>نام گروه: </span>
            <span className="fw-bold">{props.orderInfo.groupName}</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>نام سرگروه:‌ </span>
            <span className="fw-bold">{props.orderInfo.groupLeaderName}</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>تاریخ رزرو: </span>
            <span className="fw-bold">{
              timestampSecondsToPersianDate(
                props.orderInfo.reserveDateTimestamp
              ).format("HH:MM - YYYY/MM/DD")}</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>تعداد نفرات: </span>
            <span className="fw-bold">{enDigitToPer(props.orderInfo.volume)}</span>
          </Col>
          <Col md="6" className="mt-3">
            {props.orderInfo.services.length == 1 && props.orderInfo.services[0].type == 'package' ?
              <>
                <span>بسته انتخاب شده</span>
                <span className="fw-bold">{props.orderInfo.services[0].name}</span>
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
            <span className="fw-bold">{enDigitToPer(props.orderInfo.prepaidValue)} تومان</span>
          </Col>
          <Col md="6" className="mt-3">
            <span>هزینه باقی مانده: </span>
            <span className="fw-bold">{enDigitToPer(props.orderInfo.remainedValue)} تومان   </span>
          </Col>
        </Row>
      </>}

  </PageContainer>
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
      OrderService: {
        include: {
          Service: true
        }
      }
    }
  })

  if (order == null) return backHome()

  const authority = order.paymentAuthority

  if (authority == null) return backHome()

  //: verify
  var args = {
    'MerchantID': process.env.ZARIN_PAL_MERCHANT_ID!,
    'Authority': authority,
    'Amount': order.prePayAmount
  };

  const paymentStatus = query["Status"]

  const paymentRes: {
    status: boolean,
    code: string,
    message: string
  } = await new Promise((resolve, _) => {
    createClient(process.env.ZARIN_PAL_SOAP_SERVER!, (_, client) => {
      client.PaymentVerification(args, (_: any, result: string) => {
        var parseData: {
          RefID: string;
          Status: string;
        } = JSON.parse(JSON.stringify(result));

        if (paymentStatus === "OK") {
          if (Number(parseData.Status) === 100) {
            resolve({
              status: true,
              code: parseData.RefID,
              message: 'payment-successful'
            });
          } else {
            resolve({
              status: false,
              code: parseData.RefID,
              message: 'payment-error'
            });
          }
        } else {
          resolve({
            status: false,
            code: parseData.RefID,
            message: 'payment-canceled'
          });
        }
      });
    });
  })

  // FIXME:
  // if (paymentRes.status) {

  //: create transaction
  const now = nowPersianDateObject()

  const transaction = await prisma.transaction.upsert({
    create: {
      payId: authority,
      payPortal: 'zarin-pal',
      valuePaid: order.prePayAmount,
      payDate: now.format("YYYY/MM/DD-HH:mm"),
      payDateTimestamp: now.toUnix(),
      orderId: order.id,
      customerId: order.customerId
    },
    update: {},
    where: {
      payId: authority
    }
  })


  //: set order status to paid
  await prisma.order.update({
    data: {
      status: 'paid',
    },
    where: {
      id: order.id
    }
  })

  //: read order info for creating ticket
  const ticketInfo: TicketInfo = {
    groupName: order.groupName,
    groupLeaderName: order.Customer.name,
    reserveDateTimestamp: transaction.payDateTimestamp,
    volume: order.volume,
    services: order.OrderService.map(i => i.Service),
    prepaidValue: order.prePayAmount,
    remainedValue: order.calculatedAmount - order.prePayAmount
  }
  return {
    props: {
      verified: true,
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