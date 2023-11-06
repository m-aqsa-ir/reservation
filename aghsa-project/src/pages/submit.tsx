import { ChosenServiceContext } from "@/ChosenServiceProvider";
import { dayCapToStr, enDigitToPer } from "@/lib";
import { mdiAccountDetails, mdiCardAccountDetailsStar, mdiCashFast, mdiCheckCircleOutline, mdiTicket } from "@mdi/js"
import Icon from "@mdi/react"
import { useContext } from "react";
import { Container } from "react-bootstrap";

export default function Submit() {


  return (<Container className="bg-white mt-3 border rounded-3 col-md-8">

    <div className="d-flex pt-5 pb-2 px- justify-content-center">
      <SectionIndicator name="انتخاب بسته" icon={mdiCheckCircleOutline} state="passed" />
      <SectionIndicator name="مشخصات" icon={mdiAccountDetails} state="passed" />
      <SectionIndicator name="تایید اطلاعات" icon={mdiCardAccountDetailsStar} state="current" />
      <SectionIndicator name="پرداخت" icon={mdiCashFast} state="remained" />
      <SectionIndicator name="دریافت بلیط" icon={mdiTicket} state="remained" />
    </div>
    <hr />

    <ChosenPackageDay
      /* pac={[
        { name: 'راپل', price: 1000, desc: '', chosen: false },
        { name: 'سوارکاری', price: 2000, desc: '', chosen: false },
      ]}
      day={{ month: '2', day: '01', capacity: 120, weekName: 'شنبه' }} */
    />


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

function ChosenPackageDay(/* p: { pac: Package | Service[], day: DayCap } */) {
  const { chosenServiceState: chosenPac } = useContext(ChosenServiceContext)
  return (<div>
    <h2 className="text-center">{enDigitToPer(dayCapToStr(chosenPac.day))}</h2>
    {
      chosenPac.pac instanceof Array ?
        chosenPac.pac.map(i =>
          <div key={i.name}>
            <p className="fs-5">{i.name}</p>
          </div>
        )
        : <div>

        </div>
    }
  </div>)
}