import { SectionIndicators } from "@/components/SectionIndicator";
import {
  backHome, enDigit2Per, nowPersianDateObject, enNumberTo3DigPer,
  orderPaidSum, orderStatusEnum, timestampScnds2PerDate, paymentStatusEnum, fetchPost
} from "@/lib/lib";
import { sections } from "@/lib/sections";
import { sendSms } from "@/lib/sendSms";
import { TicketInfo } from "@/types";
import { PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { toCanvas } from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Modal, Row, Form } from "react-bootstrap";
import { createClient } from "soap"
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { removeRedirect, setRedirect } from "@/redux/redirectAfterLogin";
import { RootState } from "@/redux/store";
import { VerifyMainToken } from "@/lib/verifyToken";
import Cookies from "js-cookie";


export default function TicketPage(props: TicketPageProps) {

  const [showCancelModal, setShowCancelModal] = useState<null | { text: string }>(null)

  const qrCodeRef = useRef<HTMLCanvasElement | null>(null)
  const redirectStore = useSelector((s: RootState) => s.redirectAfterLogin)
  const dispatch = useDispatch()
  const router = useRouter()

  async function handleCancelTicket() {

    if (props.orderInfo == null) return

    const redirectLogin = () => {
      dispatch(
        setRedirect({
          path: '/ticket?orderID=' + props.orderInfo?.id, body: { orderId: props.orderInfo?.id }
        })
      )
      router.push('/phone-register')
    }

    //: check authentication
    const authToken = Cookies.get('AUTH')

    if (!authToken) return redirectLogin()

    const verified: { state: VerifyMainToken } = await (
      await fetchPost('/api/check-auth', { token: authToken })
    ).json()

    if (typeof verified.state == 'string') return redirectLogin()

    setShowCancelModal({ text: '' })
  }

  useEffect(() => {
    if (!props.ticketLink) return
    if (qrCodeRef.current == null) return

    toCanvas(qrCodeRef.current, props.ticketLink, (error) => {
      if (error) console.log(error)
    })
  }, [qrCodeRef, props.ticketLink])

  return <Container className="print-padding-zero border mt-3 rounded col-md-8 bg-white">
    <Head>
      <title>بلیت سفارش</title>
    </Head>
    <SectionIndicators order={5} sections={sections} />
    <hr />

    {props.orderInfo == null ?
      <>
        {props.message == 'canceled' ?
          <h1 className="mt-2 text-center">سفارش لغو شده است.</h1> :
          <h1 className="mt-2 text-center">پرداخت ناموفق</h1>}

        <Link href={'/'}>
          <Button className="w-100 mt-5" variant="secondary">بازگشت به صفحه اصلی</Button>
        </Link>
      </>
      :
      <>
        <div className="printable">
          <h1 className="text-center fs-4 mt-2">ارودگاه فرهنگی الاقصی</h1>
          <Row>
            <Col md="4" className="mt-3">
              <span>نام گروه: </span>
              <span className="fw-bold">{props.orderInfo.groupName}</span>
            </Col>
            <Col md="4" className="mt-3">
              <span>نوع گروه: </span>
              <span className="fw-bold">{props.orderInfo.groupType}</span>
            </Col>
            <Col md="4" className="mt-3">
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
              <span className="fw-bold">{enNumberTo3DigPer(props.orderInfo.prepaidValue)} تومان</span>
            </Col>
            <Col md="6" className="mt-3">
              <span>هزینه باقی مانده: </span>
              <span className="fw-bold">{enNumberTo3DigPer(props.orderInfo.remainedValue)} تومان   </span>
            </Col>
            <hr className="mt-3" />
            <Col md="3" className="d-flex justify-content-center">
              <canvas ref={qrCodeRef}></canvas>
            </Col>
            <Col md="9" className="tw-text-xs">
              {props.termsAndConditions}
            </Col>
          </Row>
        </div>

        <Row className="mt-4">
          <Col md="6">
            <Link href={'/'}>
              <Button className="w-100 mb-2" variant="secondary">بازگشت به صفحه اصلی</Button>
            </Link>
          </Col>

          <Col md="6">
            <Button className="w-100 mb-2" variant="danger"
              onClick={handleCancelTicket}>لغو سفارش</Button>
          </Col>
        </Row>
      </>}

    <Modal show={showCancelModal != null} onHide={() => setShowCancelModal(null)}>
      {showCancelModal && <Form onSubmit={e => {
        e.preventDefault()
      }}>
        <Modal.Header>
          لغو سفارش
        </Modal.Header>

        <Modal.Body>
          <Form.Label>لطفا علت لغو سفارش را بنویسید:</Form.Label>
          <Form.Control
            value={showCancelModal.text}
            onChange={e => setShowCancelModal({ text: e.target.value })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={e => setShowCancelModal(null)}>منصرف شدم</Button>
          <Button variant="danger">تایید لغو</Button>
        </Modal.Footer>
      </Form>}
    </Modal>
  </Container>
}

type MessageTypes = 'payment-canceled' | 'payment-successful' | 'payment-error' |
  'await-payment' | 'paid' | 'pre-paid' | 'canceled'

type TicketPageProps = {
  orderInfo: TicketInfo | null,
  message: MessageTypes,
  ticketLink?: string,
  termsAndConditions?: string
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

  const appConfig = await prisma.appConfig.findFirst()

  //: TICKET AFTER PAYMENT
  if (paymentStatus != undefined && authority != null) {
    const paymentRes = await verifyPaymentAuthority(authority, order.prePayAmount, paymentStatus)

    const paymentDebugMode = process.env.PAYMENT_DEBUG_MODE

    const isPaymentDebugMode = paymentDebugMode != null && paymentDebugMode == 'true'

    if (paymentRes.status || isPaymentDebugMode) {
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
            status: order.status == 'await-payment' ? 'pre-paid' : order.status,
            orderStatus: orderStatusEnum.reserved
          },
          where: {
            id: order.id
          }
        })
        //: send sms for order
        await sendSms(order.Customer.phone, { "order-id": order.id }, process.env.SMS_PATTERN_SUCCESS_ORDER!)

        //: send sms to managers
        if (appConfig != null) {
          if (appConfig.doSendSmsToManager && appConfig.managerPhoneNum != '') {
            const phoneNumList = appConfig.managerPhoneNum.split(',')
            await Promise.all(phoneNumList.map(async i => {
              await sendSms(i, {
                "phone": order.Customer.phone.toString(),
                "order-id": order.id,
              }, process.env.SMS_PATTERN_SUCCESS_ORDER_ADMIN!)
            }))
          }
        }
      }

      const reserveDate = timestampScnds2PerDate(order.timeRegistered).format("YYYY/MM/DD - HH:mm")
      const chosenDay = timestampScnds2PerDate(order.Day.timestamp).format("YYYY/MM/DD")

      //: read order info for creating ticket
      const ticketInfo: TicketInfo = {
        id: order.id,
        groupName: order.groupName,
        groupLeaderName: order.Customer.name,
        groupType: order.groupType,
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
          message: paymentRes.message as MessageTypes,
          ticketLink: process.env.PAYMENT_CALLBACK_URL_BASE! + "?orderID=" + orderID,
          termsAndConditions: appConfig?.ticketTermsAndServices
        } satisfies TicketPageProps
      }
    } else if (order.orderStatus == orderStatusEnum.canceled) return {
      props: {
        orderInfo: null,
        message: 'canceled'
      } satisfies TicketPageProps
    }
    else return {
      props: {
        verified: false,
        message: paymentRes.message
      }
    }
  } else {
    //: TICKET FROM PANEL (JUST WITH ORDER) ⬇️⬇️⬇️
    if (order.status == paymentStatusEnum.awaitPayment) return {
      props: {
        orderInfo: null,
        message: 'await-payment'
      } satisfies TicketPageProps
    }
    else if (order.orderStatus == orderStatusEnum.canceled) return {
      props: {
        orderInfo: null,
        message: 'canceled'
      } satisfies TicketPageProps
    }
    else {
      const d = order.Day
      //: calculate payments of order
      const orderPaymentsSum = orderPaidSum(order)

      const orderInfo: TicketInfo = {
        id: order.id,
        groupName: order.groupName,
        groupLeaderName: order.Customer.name,
        groupType: order.groupType,
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
          orderInfo,
          ticketLink: process.env.PAYMENT_CALLBACK_URL_BASE! + "?orderID=" + orderID,
          termsAndConditions: appConfig?.ticketTermsAndServices
        } satisfies TicketPageProps
      }
    }
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
        //: if payment status is present and payment status is not ok
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