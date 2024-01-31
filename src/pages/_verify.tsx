import { PageContainer } from "@/components/PageContainer"
import { pageGetAuth } from "@/lib/verifyToken"
import { GetServerSideProps } from "next"

export default function Page() {
  return <PageContainer></PageContainer>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = pageGetAuth(context)

  if (auth.status == "redirect") {
    return auth.obj
  }

  const payload = auth.obj

  return {
    props: {}
  }
}
