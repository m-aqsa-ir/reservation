import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"
import { Container } from "react-bootstrap"

export function PageContainer(p: { className?: string; children: ReactNode }) {
  return (
    <div className="my-background py-2 px-1">
      <Container
        className={`
          p-2  rounded-4 bg-primary col-md-8 text-black tw-font-black
          d-flex align-items-center tw-bg-white/60
          non-printable
        `}
      >
        <span
          className="bg-white tw-rounded-full ms-2"
          style={{
            paddingRight: "3px",
            paddingTop: "2px",
            paddingBottom: "2px"
          }}
        >
          <Image
            alt="logo"
            src="/icon.png"
            width={35}
            height={35}
            className="ms-2"
          />
        </span>
        <span className="flex-grow-1 text-center fs-5">
          سامانه رزرو گروهی اقصی
        </span>
      </Container>
      <Container
        className={`
          ${p.className ?? ""}
           tw-bg-white/50
          p-3 p-md-5 my-2 rounded-4 col-md-8
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
