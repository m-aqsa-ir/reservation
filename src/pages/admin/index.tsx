import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { GetServerSideProps } from "next";
import Head from "next/head";

export default function IndexPage() {
  return <div>
    <Head>
      ادمین
    </Head>
    Hello</div>
}


export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, callbackSuccess: () => ({
      redirect: { destination: '/admin/dashboard' }
      , props: {}
    })
  })
}

