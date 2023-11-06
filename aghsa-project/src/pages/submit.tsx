import { mdiAccountDetails, mdiCardAccountDetailsStar, mdiCashFast, mdiCheckCircleOutline, mdiTicket } from "@mdi/js"
import Icon from "@mdi/react"
import { Container } from "react-bootstrap";

export default function Submit() {
  return (<Container className="bg-white mt-3 border rounded-3">
    <div className="d-flex pt-5 pb-2 px- justify-content-center">
      <SectionIndicator name="انتخاب بسته" icon={mdiCheckCircleOutline} state="passed" />
      <SectionIndicator name="مشخصات" icon={mdiAccountDetails} state="passed" />
      <SectionIndicator name="تایید اطلاعات" icon={mdiCardAccountDetailsStar} state="current" />
      <SectionIndicator name="پرداخت" icon={mdiCashFast} state="remained" />
      <SectionIndicator name="دریافت بلیط" icon={mdiTicket} state="remained" />
    </div>
    <hr />
    <div className="row gx-2">
      <div className="container d-flex col-12 justify-content-between px-0 py-3">
        <legend>مشخصات گروه</legend>

      </div>
      <div className="row text-start justify-content-start mb-4">
        <div className="container col-12 col-md-6 col-lg-5 col-xl-4 g-2 mx-0">
          <label> نام و نام خانوادگی:</label>
        </div>
        <div className="container col-12 col-md-6 col-lg-5 col-xl-4 g-2 mx-0">
          <label>تاریخ تولد: </label>
        </div>
        <div className="container col-12 col-md-6 col-lg-5 col-xl-4 g-2 mx-0">
          <label> کد ملی:</label>
        </div>
        <div className="container col-12 col-md-6 col-lg-5 col-xl-4 g-2 mx-0">
          <label>شماره تماس:</label>
        </div>
        <div className="container col-12 col-md-6 col-lg-5 col-xl-4 g-2 mx-0">
          <label>نام گروه:</label>
        </div>
      </div>
    </div>
  </Container>)
}

function SectionIndicator(p: { state: 'passed' | 'current' | 'remained', name: string, icon: string }) {
  const colorForState = p.state == 'current' ?
    'text-primary' :
    p.state === 'passed'
      ? 'text-success'
      : 'text-secondary';

  return <div className="d-flex flex-column align-items-center me-4">
    <Icon path={p.icon} size={1} className={`${colorForState}`} />
    <span className={`${colorForState}`}>{p.name}</span>
  </div>
}