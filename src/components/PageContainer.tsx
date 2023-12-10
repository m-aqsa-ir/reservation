import Link from "next/link"
import { ReactNode } from "react"
import { Container } from "react-bootstrap"

export function PageContainer(p: { className?: string; children: ReactNode }) {
  return (
    <>
      <Container
        className={`${
          p.className ?? ""
        } p-3 p-md-5 border my-3 rounded-4 col-md-8 bg-white`}
      >
        {p.children}
      </Container>

      <Container className="my-2 col-md-8 text-center p-3 non-printable">
        <Link
          href="https://ictpioneers.ir/"
          target="_blank"
          className="text-black text-decoration-none"
        >
          طراحی شده با ❤️ توسط پیشگامان فناوری اطلاعات
        </Link>
      </Container>
    </>
  )
}
