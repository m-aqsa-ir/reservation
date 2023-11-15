import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { GetServerSideProps } from "next";

export default function IndexPage() {
  return <div>Hello</div>
}


export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, callbackSuccess: () => ({
      redirect: { destination: '/admin/dashboard' }
      , props: {}
    })
  })
}

