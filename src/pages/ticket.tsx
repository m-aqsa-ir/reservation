import { SectionIndicators } from "@/components/SectionIndicator"
import {
  backHome,
  enDigit2Per,
  nowPersianDateObject,
  enNumberTo3DigPer,
  orderStatusEnum,
  fetchPost,
  time2Str
} from "@/lib/lib"
import { sections } from "@/lib/sections"
import { TicketInfo as OrderInfo } from "@/types"
import { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { toCanvas } from "qrcode"
import React, { useEffect, useRef, useState } from "react"
import { Button, Col, Modal, Row, Form } from "react-bootstrap"
import { useRouter } from "next/router"
import { useDispatch, useSelector } from "react-redux"
import { removeRedirect, setRedirect } from "@/redux/redirectAfterLogin"
import { RootState } from "@/redux/store"
import { resHandleNotAuth } from "@/lib/apiHandle"
import { showMessage } from "@/redux/messageSlice"
import { AreYouSure } from "@/components/AreYouSure"
import { PageContainer } from "@/components/PageContainer"
import { apVerify } from "@/lib/aqhayePardakht"
import { checkAndModifyOrderState } from "@/lib/orderCheckState"
import { getPrisma4MainPages } from "@/lib/prismaGlobal"

export default function TicketPage(props: TicketPageProps) {
  const [showCancelModal, setShowCancelModal] = useState<null | {
    text: string
  }>(null)
  const [cancelSure, setCancelSure] = useState(false)

  const qrCodeRef = useRef<HTMLCanvasElement | null>(null)
  const redirectStore = useSelector((s: RootState) => s.redirectAfterLogin)
  const dispatch = useDispatch()
  const router = useRouter()

  //: show qr code
  useEffect(() => {
    if (!props.orderInfo) return

    if (qrCodeRef.current == null) return

    toCanvas(qrCodeRef.current, props.ticketLink, (error) => {
      if (error) console.log(error)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeRef, props.orderInfo])

  //: check if logged in after ordering cancel
  useEffect(() => {
    if (!props.orderInfo) return

    if (redirectStore.doRedirect) {
      //: check again to see if logged in with true phone number
      fetchPost("/api/cancel/check", { orderId: props.orderInfo.id }).then(
        async (res) => {
          if (res.ok) {
            setShowCancelModal({ text: "" })
            setCancelSure(false)
          } else if (res.status == 401) {
            dispatch(
              showMessage({
                message: "با شماره صحیح وارد نشده اید",
                type: "bg-danger"
              })
            )
            setCancelSure(false)
          } else if (res.status == 409) {
            dispatch(
              showMessage({
                message: "درخواست لغو قبلا ثبت شده است.",
                type: "bg-danger"
              })
            )
            setCancelSure(false)
          } else if (res.status == 403) {
            const body = await res.json()
            dispatch(
              showMessage({
                message: `باید از ${enDigit2Per(
                  body.value
                )} روز قبل از روز سفارش، اقدام به لغو بلیت می کردید.`
              })
            )
            setCancelSure(false)
          }
        }
      )
      dispatch(removeRedirect())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCancelClick() {
    if (props.orderInfo == null) return

    const res = await fetchPost("/api/cancel/check", {
      orderId: props.orderInfo.id
    })

    if (res.ok) {
      setShowCancelModal({ text: "" })
      setCancelSure(false)
      //: not logged in
    } else if (res.status == 401) {
      dispatch(
        setRedirect({
          path: "/ticket?orderID=" + props.orderInfo?.id,
          body: { orderId: props.orderInfo?.id }
        })
      )
      router.push("/phone-register")
    } else if (res.status == 403) {
      const body = await res.json()
      dispatch(
        showMessage({
          message: `باید از ${enDigit2Per(
            body.value
          )} روز قبل از روز سفارش، اقدام به لغو بلیت می کردید.`
        })
      )
      setCancelSure(false)
    } else if (res.status == 409) {
      dispatch(
        showMessage({
          message: "قبلا درخواست لغو ثبت شده است.",
          type: "bg-danger"
        })
      )
      setCancelSure(false)
    } else {
      resHandleNotAuth(res, dispatch, router)
    }
  }

  async function handleCancelOrder() {
    if (!props.orderInfo || !showCancelModal) return

    const body = {
      orderId: props.orderInfo.id,
      reason: showCancelModal.text
    }

    const res = await fetchPost("/api/cancel/enter", body)

    if (res.ok) {
      dispatch(
        showMessage({
          message:
            "درخواست لغو شما ثبت شد. پس از تایید مدیر، سفارش لغو خواهد شد.",
          type: "bg-success"
        })
      )
      setShowCancelModal(null)
    } else {
      resHandleNotAuth(res, dispatch, router)
    }
  }

  const ReturnHomeBt = (P: any) => (
    <Link href={"/"}>
      <Button className={"w-100 " + P.className} variant="secondary">
        بازگشت به صفحه ثبت سفارش
      </Button>
    </Link>
  )

  return (
    <PageContainer className="print-padding-zero ">
      <Head>
        <title>بلیت سفارش</title>
      </Head>
      <SectionIndicators order={5} sections={sections} />
      <hr />

      {props.orderInfo == null ? (
        <>
          {props.message == "canceled" ? (
            <h1 className="mt-2 text-center">سفارش لغو شده است.</h1>
          ) : (
            <h1 className="mt-2 text-center">پرداخت ناموفق</h1>
          )}

          <ReturnHomeBt className="mt-4" />
        </>
      ) : (
        <>
          <div className="printable">
            <h1 className="text-center fs-4 mt-2">ارودگاه فرهنگی الاقصی</h1>
            <Row>
              <Col md="6" className="mt-3">
                <span>نام گروه: </span>
                <span className="fw-bold">{props.orderInfo.groupName}</span>
              </Col>
              <Col md="6" className="mt-3">
                <span>نوع گروه: </span>
                <span className="fw-bold">{props.orderInfo.groupType}</span>
              </Col>
              <Col md="6" className="mt-3">
                <span>برای تاریخ: </span>
                <span className="fw-bold">{props.orderInfo.chosenDay}</span>
              </Col>
              <Col md="6" className="mt-3">
                <span>نام سرگروه:‌ </span>
                <span className="fw-bold">
                  {props.orderInfo.groupLeaderName}
                </span>
              </Col>

              <Col md="6" className="mt-3">
                <span>تعداد نفرات: </span>
                <span className="fw-bold">
                  {enDigit2Per(props.orderInfo.volume)}
                </span>
              </Col>
              <Col md="6" className="mt-3">
                {props.orderInfo.services.length == 1 &&
                props.orderInfo.services[0].type == "package" ? (
                  <>
                    <span>بسته انتخاب شده: </span>
                    <span className="fw-bold">
                      {props.orderInfo.services[0].name}
                      &nbsp;({props.orderInfo.services[0].desc})
                    </span>
                  </>
                ) : (
                  <>
                    <span>خدمات انتخاب شده: </span>
                    <span>
                      {props.orderInfo.services.map((i) => i.name).join(", ")}
                    </span>
                  </>
                )}
              </Col>
              <Col md="6" className="mt-3">
                <span>هزینه پرداخت شده: </span>
                <span className="fw-bold">
                  {enNumberTo3DigPer(props.orderInfo.prepaidValue)} تومان
                </span>
              </Col>
              <Col md="6" className="mt-3">
                <span>هزینه باقی مانده: </span>
                <span className="fw-bold">
                  {enNumberTo3DigPer(props.orderInfo.remainedValue)} تومان{" "}
                </span>
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

          <Row className="mt-4 non-printable">
            <Col md="6">
              <ReturnHomeBt />
            </Col>

            <Col md="6" className="mt-2 mt-md-0">
              <Button
                className="w-100 mb-2"
                variant="danger"
                onClick={() => setCancelSure(true)}
              >
                درخواست لغو سفارش
              </Button>
            </Col>
          </Row>
        </>
      )}

      <AreYouSure
        show={cancelSure}
        hideAction={() => setCancelSure(false)}
        yesAction={handleCancelClick}
      />

      <Modal
        show={showCancelModal != null}
        onHide={() => setShowCancelModal(null)}
        centered
      >
        {showCancelModal && (
          <Form
            onSubmit={async (e) => {
              e.preventDefault()
              await handleCancelOrder()
            }}
          >
            <Modal.Header>لغو سفارش</Modal.Header>

            <Modal.Body>
              <Form.Label>لطفا علت لغو سفارش را بنویسید:</Form.Label>
              <Form.Control
                value={showCancelModal.text}
                required
                onChange={(e) => setShowCancelModal({ text: e.target.value })}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="success"
                onClick={(e) => setShowCancelModal(null)}
              >
                منصرف شدم
              </Button>
              <Button variant="danger" type="submit">
                تایید لغو
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </PageContainer>
  )
}

type TicketPageProps =
  | {
      orderInfo: null
      message: "canceled"
    }
  | {
      orderInfo: null
      message: "await-payment"
    }
  | {
      orderInfo: OrderInfo
      message: "paid"
      ticketLink: string
      termsAndConditions: string
    }

export const getServerSideProps: GetServerSideProps = async (context) => {
  const query: {
    orderID?: string
  } = context.query

  const orderID = query.orderID
  if (!orderID) return backHome()

  const prisma = getPrisma4MainPages()
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

  //: check if order canceled
  if (order.orderStatus == orderStatusEnum.canceled) {
    return {
      props: {
        orderInfo: null,
        message: "canceled"
      } satisfies TicketPageProps
    }
  }

  const appConfig = await prisma.appConfig.findFirst()
  if (!appConfig) {
    return {
      props: {},
      redirect: {
        destination: "/not-ready"
      }
    }
  }

  //: check if previously verified and un-successful
  const checkedButUnverified = order.paymentAuthority == null

  const paymentTransaction = order.Transaction.find(
    (i) => i.payId == order.paymentAuthority
  )
  const checkedButVerified = paymentTransaction != undefined
  const checked = checkedButUnverified || checkedButVerified

  if (!checked) {
    const verifyRes = await apVerify({
      transid: order.paymentAuthority!,
      amount: order.calculatedAmount,
      pin: appConfig.paymentPortalMerchantId
    })

    if (verifyRes == "verified") {
      const now = nowPersianDateObject()

      await prisma.transaction.create({
        data: {
          payId: order.paymentAuthority!,
          payPortal: `درگاه پرداخت (آقای پرداخت)`,
          valuePaid: order.prePayAmount,
          payDate: now.format("YYYY/MM/DD-HH:mm"),
          payDateTimestamp: now.toUnix(),
          orderId: order.id,
          customerId: order.customerId
        }
      })
    }
  }

  const { orderStatus } = await checkAndModifyOrderState(order.id, prisma)

  if (orderStatus == orderStatusEnum.reserved) {
    const reserveDate = time2Str(order.timeRegistered, "", true)
    const chosenDay = time2Str(order.Day.timestamp, order.Day.desc)

    return {
      props: {
        orderInfo: {
          id: order.id,
          phoneNum: order.Customer.phone,
          groupName: order.groupName,
          groupLeaderName: order.Customer.name,
          groupType: order.groupType,
          chosenDay,
          reserveDate,
          volume: order.volume,
          services: order.OrderService.map((i) => i.Service),
          prepaidValue: order.prePayAmount,
          remainedValue: order.calculatedAmount - order.prePayAmount
        },
        message: "paid",
        ticketLink:
          context.req.headers.host + "/ticket?orderID=" + orderID,
        termsAndConditions: appConfig.ticketTermsAndServices
      } satisfies TicketPageProps
    }
  } else {
    return {
      props: {
        message: "await-payment",
        orderInfo: null
      } satisfies TicketPageProps
    }
  }
}

// /* ZARIN PAL CODES */ //
/* type MessageTypes = 'payment-canceled' | 'payment-successful' | 'payment-error' |
  'await-payment' | 'paid' | 'pre-paid' | 'canceled' | 'server-error'

type TicketPageProps = {
  orderInfo: null,
  message: MessageTypes,
} | {
  orderInfo: OrderInfo,
  message: MessageTypes,
  ticketLink: string,
  termsAndConditions: string
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

  if (!appConfig?.paymentPortalMerchantId) {
    return {
      props: {
        message: 'server-error',
        orderInfo: null
      } satisfies TicketPageProps
    }
  }

  //: TICKET AFTER PAYMENT
  if (authority != null) {
    if (order.orderStatus == orderStatusEnum.canceled) {
      return {
        props: {
          message: 'canceled',
          orderInfo: null,
        } satisfies TicketPageProps
      }
    }

    const paymentRes = await verifyPaymentAuthority(
      authority,
      order.prePayAmount,
      paymentStatus,
      appConfig.paymentPortalMerchantId
    )

    const paymentDebugMode = appConfig.appTestMode

    if (paymentRes.status || paymentDebugMode) {
      //: create transaction
      const now = nowPersianDateObject()

      let transaction = await prisma.transaction.findFirst({
        where: { payId: authority }
      })

      //: add transaction if not ready
      if (transaction == null) {
        transaction = await prisma.transaction.create({
          data: {
            payId: authority,
            payPortal: 'زرین پال',
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
        await sendSmsToManager(appConfig, {
          "phone": order.Customer.phone.toString(),
          "order-id": order.id,
        }, process.env.SMS_PATTERN_SUCCESS_ORDER_ADMIN!)
      }

      const reserveDate = time2Str(order.timeRegistered, '', true)
      const chosenDay = time2Str(order.Day.timestamp, order.Day.desc)
      return {
        props: {
          orderInfo: {
            id: order.id,
            phoneNum: order.Customer.phone,
            groupName: order.groupName,
            groupLeaderName: order.Customer.name,
            groupType: order.groupType,
            chosenDay,
            reserveDate,
            volume: order.volume,
            services: order.OrderService.map(i => i.Service),
            prepaidValue: order.prePayAmount,
            remainedValue: order.calculatedAmount - order.prePayAmount
          },
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
        orderInfo: null,
        message: paymentRes.message as MessageTypes
      } satisfies TicketPageProps
    }
  }
  //: TICKET FROM PANEL (JUST WITH ORDER) ⬇️⬇️⬇️
  else {
    if (order.status == paymentStatusEnum.awaitPayment) {
      return {
        props: {
          orderInfo: null,
          message: 'await-payment'
        } satisfies TicketPageProps
      }
    } else if (order.orderStatus == orderStatusEnum.canceled) {
      return {
        props: {
          orderInfo: null,
          message: 'canceled'
        } satisfies TicketPageProps
      }
    } else {
      const d = order.Day
      //: calculate payments of order
      const orderPaymentsSum = orderPaidSum(order)

      const orderInfo: OrderInfo = {
        id: order.id,
        phoneNum: order.Customer.phone,
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

async function verifyPaymentAuthority(
  authority: string,
  prePayAmount: number,
  paymentStatus: string | undefined,
  merchantId: string
): Promise<{
  status: boolean,
  code: string,
  message: string
}> {
  var args = {
    'MerchantID': merchantId,
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
} */
