import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import { SSRProvider } from 'react-bootstrap'
import { Noto_Naskh_Arabic } from 'next/font/google'
const notoNaskhArabicFont = Noto_Naskh_Arabic({ subsets: ['latin', 'arabic'] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SSRProvider>
      <div className={notoNaskhArabicFont.className}>
        <Component {...pageProps} />
      </div>
    </SSRProvider>
  )
}
