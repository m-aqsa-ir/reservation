import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { backHome, enDigitToPer, nowPersianDateObject } from "@/lib/lib";
import { sections } from "@/lib/sections";
import { PayBundle } from "@/types";
import { PrismaClient } from "@prisma/client";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import ZarinPal from "zarinpal-checkout";


export default function TicketPage(props: { verified: boolean }) {

  const [details, setDetails] = useState<PayBundle | null>(null)
  const router = useRouter()


  useEffect(() => {
    if (!router.isReady) return

    const payBundle = localStorage.getItem('pay-bundle')

    if (!payBundle) {
      router.push('/')
      return
    }

    setDetails(JSON.parse(payBundle))

    localStorage.removeItem('pay-bundle')

  }, [router])


  return <PageContainer>
    <SectionIndicators order={5} sections={sections} />
    <hr />
    <h1 className="text-center fs-4 mt-2">ارودگاه فرهنگی الاقصی</h1>

    {details == null ? 'در حال بالا آمدن' : <Row>
      <Col md="12" className="fs-5">
        <span>نام گروه: </span>
        <span className="fw-bold">{details.groupName}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>نام سرگروه:‌ </span>
        <span className="fw-bold">{details.groupLeaderName}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>تاریخ رزرو: </span>
        <span className="fw-bold">{details.reservedDate}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>تعداد نفرات: </span>
        <span className="fw-bold">{enDigitToPer(details.volume.volume)}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>{details.pac instanceof Array ? 'خدمات انتخاب شده: ' : 'بسته‌ی انتخاب شده: '}</span>
        <span className="fw-bold">{details.pac instanceof Array ?
          details.pac.join('، ') :
          details.pac?.name}</span>
      </Col>
    </Row>}

  </PageContainer>
}

export const getServerSideProps: GetServerSideProps = async (context) => {

  const query = context.query
  const orderID = query['orderID'] as string | undefined

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
  const zarin = ZarinPal.create(process.env.ZARIN_PAL_MERCHANT_ID!, false)

  const payVerifyRes = await zarin.PaymentVerification({
    Amount: order.prePayAmount,
    Authority: authority
  })

  //: TODO check if unverified
  // if (payVerifyRes.status === -21) {
  //   return {
  //     props: { verified: false, }
  //   }
  // } else {
  //: create transaction
  const now = nowPersianDateObject()

  const transaction = await prisma.transaction.create({
    data: {
      payId: authority,
      payPortal: 'zarin-pal',
      valuePaid: order.prePayAmount,
      payDate: now.format("YYYY/MM/DD"),
      payDateTimestamp: now.toUnix(),
      orderId: order.id,
      customerId: order.customerId
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

  const ticketInfo = {
    groupName: order.groupName,
    groupLeaderName: order.Customer.name,
    reserveDate: transaction.payDate,
    volume: order.volume,
    services: order.OrderService.map(i => i.Service)
  }

  return {
    props: { verified: true, orderInfo: ticketInfo }
  }
  // }
}