import { Button, Modal } from "react-bootstrap"

export function AreYouSure(props: {
  yesAction: () => void, hideAction: () => void, show: boolean
}) {
  return <Modal
    style={{ fontFamily: 'ir-sans' }}
    show={props.show} onHide={props.hideAction}>
    <Modal.Body>آیا مطمئنید؟</Modal.Body>
    <Modal.Footer>
      <Button variant="success" onClick={props.hideAction}>خیر</Button>
      <Button variant="danger" onClick={props.yesAction}>بله</Button>
    </Modal.Footer>
  </Modal>
}