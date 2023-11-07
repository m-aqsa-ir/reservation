import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { enDigitToPer } from "@/lib/lib";
import { sections } from "@/lib/sections";
import { ChosenServiceState, GroupLeaderData } from "@/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";


export default function TicketPage() {

  const [details, setDetails] = useState<{
    groupData: GroupLeaderData, chosenService: ChosenServiceState
  } | null>(null)

  const router = useRouter()


  useEffect(() => {
    if (!router.isReady) return

    setDetails({
      chosenService: JSON.parse(localStorage.getItem('chosen-service')!),
      groupData: JSON.parse(localStorage.getItem('details')!)
    })

  }, [router])


  return <PageContainer>
    <SectionIndicators order={5} sections={sections} />
    <hr />
    <h1 className="text-center fs-4 mt-2">ارودگاه فرهنگی الاقصی</h1>

    {details == null ? 'در حال بالا آمدن' : <Row>
      <Col md="12" className="fs-5">
        <span>نام گروه: </span>
        <span className="fw-bold">{details.groupData.groupName}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>نام سرگروه:‌ </span>
        <span className="fw-bold">{details.groupData.groupLeaderName}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>تاریخ رزرو: </span>
        <span className="fw-bold">{details.chosenService.reserveDate}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>تعداد نفرات: </span>
        <span className="fw-bold">{enDigitToPer(details.chosenService.peopleCount)}</span>
      </Col>
      <Col md="6" className="mt-3">
        <span>{details.chosenService.pac instanceof Array ? 'خدمات انتخاب شده: ' : 'بسته‌ی انتخاب شده: '}</span>
        <span className="fw-bold">{details.chosenService.pac instanceof Array ?
          details.chosenService.pac.join('، ') :
          details.chosenService.pac?.name}</span>
      </Col>
    </Row>}

  </PageContainer>
}