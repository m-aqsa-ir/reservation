import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { enDigitToPer } from "@/lib/lib";
import { sections } from "@/lib/sections";
import { PayBundle } from "@/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";


export default function TicketPage() {

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