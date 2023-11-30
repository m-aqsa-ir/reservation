import '@/styles/global.scss'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Provider, useDispatch, useSelector } from 'react-redux'
import store, { AppDispatch, RootState } from '@/redux/store'
import { Modal, ThemeProvider } from 'react-bootstrap'
import { hideMessage } from '@/redux/messageSlice'

export default function App({ Component, pageProps }: AppProps) {

  return (
    <ThemeProvider dir='rtl'>
      <Provider store={store}>
        <div>
          <Component {...pageProps} />
          <ModalProvider />
        </div>
      </Provider>
    </ThemeProvider>
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
