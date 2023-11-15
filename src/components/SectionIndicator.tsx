import Icon from "@mdi/react";
import { useRouter } from "next/router";


export function SectionIndicators(p: { order: number, sections: Section[] }) {

  return <div className="d-flex pt-4 pb-2 px- justify-content-center">
    {p.sections.slice().sort((a, b) => a.order - b.order).map(s =>
      <SectionIndicator
        section={s}
        state={s.order > p.order ? 'remained' : s.order < p.order ? 'passed' : 'current'}
        key={s.name} />
    )}
  </div>
}

function SectionIndicator(p: { state: 'passed' | 'current' | 'remained', section: Section }) {
  const router = useRouter()

  const colorForState = p.state == 'current' ?
    'text-primary' :
    p.state === 'passed'
      ? 'text-success'
      : 'text-secondary';


  return <div
    className="d-flex flex-column align-items-center me-2 me-lg-4"
  >
    <Icon path={p.section.icon} size={1} className={`${colorForState}`} />
    <span className={`${colorForState} text-center SectionIndicator-Span`}>{p.section.name}</span>
  </div >
}