import { ReactNode } from "react";
import { Modal, ModalProps } from "react-bootstrap";


export function ModalFonted(props: ModalProps) {
  return <Modal style={{ fontFamily: 'ir-sans' }} {...props}>
    {props.children}
  </Modal>
}