import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { sections } from "@/lib/sections";
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
    <h1 className="text-center fs-3 mt-2">ارودگاه فرهنگی الاقصی</h1>

    {details == null ? 'در حال بالا آمدن' : <Row>
      <Col md="12">
        <span>نام گروه: </span>
        <span className="fw-bold">{details.groupData.groupName}</span>
      </Col>
      <Col md="6">
      <span>نام سرگروه:‌ </span>
        <span className="fw-bold">{details.groupData.groupLeaderName}</span>
      </Col>
      <Col md="6">
      <span>نام سرگروه:‌ </span>
        <span className="fw-bold">{details.groupData.groupLeaderName}</span>
      </Col>
      <Col md="6">
      <span>نام سرگروه:‌ </span>
        <span className="fw-bold">{details.groupData.groupLeaderName}</span>
      </Col>
    </Row>}

  </PageContainer>
}