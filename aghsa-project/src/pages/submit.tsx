import { ChosenServiceContext } from "@/components/ChosenServiceProvider";
import { PageContainer } from "@/components/PageContainer";
import { dayCapToStr, enDigitToPer } from "@/lib";
import { mdiAccountDetails, mdiCardAccountDetailsStar, mdiCashFast, mdiCheckCircleOutline, mdiTicket } from "@mdi/js"
import Icon from "@mdi/react"
import { useContext } from "react";
import { Container } from "react-bootstrap";

export default function Submit() {


  return (<PageContainer>

    <div className="d-flex pt-5 pb-2 px- justify-content-center">
      <SectionIndicator name="انتخاب بسته" icon={mdiCheckCircleOutline} state="passed" />
      <SectionIndicator name="مشخصات" icon={mdiAccountDetails} state="passed" />
      <SectionIndicator name="تایید اطلاعات" icon={mdiCardAccountDetailsStar} state="current" />
      <SectionIndicator name="پرداخت" icon={mdiCashFast} state="remained" />
      <SectionIndicator name="دریافت بلیط" icon={mdiTicket} state="remained" />
    </div>
    <hr />

    <ChosenPackageDay />
  </PageContainer>)
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

function ChosenPackageDay(/* p: { pac: Package | Service[], day: DayCap } */) {
  const { chosenServiceState: chosenPac } = useContext(ChosenServiceContext)
  return (<div>
    <p className="text-center fs-3">{enDigitToPer(dayCapToStr(chosenPac.day))}</p>
    {
      chosenPac.pac instanceof Array ?
        chosenPac.pac.map(i =>
          <div key={i.name} className="d-flex border rounded-3 mb-2 p-2">
            <div className="flex-grow-1">
              <p className="fs-5">{i.name}</p>
              <p>{i.desc}</p>
            </div>
            <div className="p-3 text-center">
              {enDigitToPer(i.price)}
              <br />
              تومان
            </div>
          </div>
        )
        : <div key={chosenPac.pac?.name} className="d-flex border rounded-3 mb-2 p-2">
          <div className="flex-grow-1">
            <p className="fs-5">{chosenPac.pac?.name}</p>
            <p>{chosenPac.pac?.products.join('، ')}</p>
          </div>
          <div className="p-3 text-center">
            {enDigitToPer(chosenPac.pac?.price!)}
            <br />
            تومان
          </div>
        </div>
    }
  </div>)
}