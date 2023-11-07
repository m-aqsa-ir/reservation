import { mdiAccountDetails, mdiCardAccountDetailsStar, mdiCashFast, mdiCheckCircleOutline, mdiTicket } from "@mdi/js"
import Icon from "@mdi/react";

type Section = {
  name: string,
  icon: string,
  order: number
}

export function SectionIndicators(p: { order: number }) {
  const sections: Section[] = [
    { name: "انتخاب بسته", icon: mdiCheckCircleOutline, order: 1 },
    { name: "مشخصات", icon: mdiAccountDetails, order: 2 },
    { name: "تایید اطلاعات", icon: mdiCardAccountDetailsStar, order: 3 },
    { name: "پرداخت", icon: mdiCashFast, order: 4 },
    { name: "دریافت بلیط", icon: mdiTicket, order: 5 },
  ]
  return <div className="d-flex pt-5 pb-2 px- justify-content-center">
    {sections.slice().sort((a, b) => a.order - b.order).map(s =>
      <SectionIndicator
        section={s}
        state={s.order > p.order ? 'remained' : s.order < p.order ? 'passed' : 'current'}
        key={s.name} />
    )}
  </div>
}

function SectionIndicator(p: { state: 'passed' | 'current' | 'remained', section: Section }) {
  const colorForState = p.state == 'current' ?
    'text-primary' :
    p.state === 'passed'
      ? 'text-success'
      : 'text-secondary';

  return <div className="d-flex flex-column align-items-center me-2 me-lg-4">
    <Icon path={p.section.icon} size={1} className={`${colorForState}`} />
    <span className={`${colorForState} text-center SectionIndicator-Span`}>{p.section.name}</span>
  </div>
}