import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import { ChosenServiceProvider } from '@/components/ChosenServiceProvider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChosenServiceProvider>
      <div style={{ fontFamily: 'ir-sans' }}>
        <Component {...pageProps} />
      </div>
    </ChosenServiceProvider>
  )
}
