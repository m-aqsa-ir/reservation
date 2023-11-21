import { PageContainer } from "@/components/PageContainer";
import Head from "next/head";


export default function AppNotReadyPage() {


  return <PageContainer className="text-center">
    <Head>
      <title>سامانه آماده نیست</title>
    </Head>
    <h1>سامانه هنوز آماده نیست.</h1>
    <br />
    <h2>لطفا با ادمین سامانه تماس بگیرید.</h2>
  </PageContainer>
}