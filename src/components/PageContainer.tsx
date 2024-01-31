import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"
import { Container } from "react-bootstrap"

export function PageContainer(p: { className?: string; children?: ReactNode }) {
  return (
    <div className="my-background py-1 px-lg-5 px-1">
      <Container
        className={`
          p-2  rounded-5 bg-primary col-md-8 text-black tw-font-black
          d-flex align-items-center tw-bg-white border
          non-printable
        `}
      >
        <span
          className="bg-success tw-rounded-full ms-2"
          style={{
            paddingRight: "10px",
            paddingTop: "2px",
            paddingBottom: "2px"
          }}
        >
          <Image
            alt="logo"
            src="/logo.png"
            width={35}
            height={35}
            className="ms-2"
          />
        </span>
        <span className="flex-grow-1 text-center fs-5">
          سامانه افزایش اعتبار با چک
        </span>
      </Container>
      <Container
        className={`
          ${p.className ?? ""}
          tw-bg-white
          p-3 p-md-5 my-2 rounded-5 col-md-8 border
        `}

        // tw-border tw-border-solid tw-border tw-border-green-700
      >
        {p.children}
      </Container>

      <Container
        className={`
         tw-bg-white/50
         non-printable
        col-md-8 text-center p-3 non-printable rounded-4
      `}
      >
        <Link
          href="https://ictpioneers.ir/"
          target="_blank"
          className="text-black text-decoration-none"
        >
          طراحی شده با ❤️ توسط پیشگامان فناوری اطلاعات
        </Link>
      </Container>
    </div>
  )
}
