import { verifyTokenAdmin, verifyTokenMain } from "@/lib/verifyToken";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Container } from "react-bootstrap";

export default function Dashboard() {
  return <Container>
    hello world!
  </Container>
}

const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken(context)
}

async function pageVerifyToken(context: GetServerSidePropsContext, callback?: Function) {
  const token = context.req.cookies['AUTH_ADMIN']

  if (token == undefined) {
    return {
      redirect: { destination: '/admin/login' }
      , props: {}
    }
  }

  const verify = verifyTokenAdmin(token)

  if (verify == 'expired' || verify == 'invalid') {
    return {
      redirect: { destination: '/admin/login' }
      , props: {}
    }
  }

  if (callback) return callback()
  else return { props: {} }
}