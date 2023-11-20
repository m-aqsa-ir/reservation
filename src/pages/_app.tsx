import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, useDispatch, useSelector } from 'react-redux'
import store, { AppDispatch, RootState } from '@/redux/store'
import { Modal } from 'react-bootstrap'
import { hideMessage } from '@/redux/messageSlice'

export default function App({ Component, pageProps }: AppProps) {

  return (
    <Provider store={store}>
      <div style={{ fontFamily: 'ir-sans' }}>
        <Component {...pageProps} />
        <ModalProvider />
      </div>
    </Provider>
  )
}

function ModalProvider() {
  const messageState = useSelector((state: RootState) => state.message)
  const dispatchMessage: AppDispatch = useDispatch()

  return <Modal
    style={{ fontFamily: 'ir-sans' }}
    show={messageState.show}
    onHide={() => { dispatchMessage(hideMessage()) }}>
    <Modal.Header className={messageState.type}>
      <Modal.Title>{messageState.type == 'bg-danger' ? 'خطا' : 'هشدار'}</Modal.Title>
    </Modal.Header>
    <Modal.Body>{messageState.message}</Modal.Body>
  </Modal>
}
