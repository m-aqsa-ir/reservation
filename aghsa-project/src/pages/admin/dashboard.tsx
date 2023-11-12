import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { verifyTokenAdmin, verifyTokenMain } from "@/lib/verifyToken";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Col, Container, ListGroup, Row } from "react-bootstrap";

export default function Dashboard() {
  return <AdminPagesContainer currentPage="dashboard">
    داشبورد
  </AdminPagesContainer>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({ context })
}