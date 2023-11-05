import { mdiCheckCircleOutline } from "@mdi/js"
import Icon from "@mdi/react"

export default function Submit() {
  return (<>
    <div className="d-flex pt-5 pb-2 px-3 border justify-content-around bg-white">
      <div className="d-flex flex-column align-items-center">
        <Icon path={mdiCheckCircleOutline} size={2} className="text-success"/>
        <span className="text-success">انتخاب بسته</span>
      </div>
      <div className="d-flex flex-column align-items-center">
        <Icon path={mdiCheckCircleOutline} size={2} className="text-success"/>
        <span className="text-success">انتخاب بسته</span>
      </div>
      <div className="d-flex flex-column align-items-center">
        <Icon path={mdiCheckCircleOutline} size={2} className="text-success"/>
        <span className="text-success">انتخاب بسته</span>
      </div>
    </div>
  </>)
}