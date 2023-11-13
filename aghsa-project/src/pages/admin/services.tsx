import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { GetServerSideProps } from "next";

export default function Dashboard() {
  return <AdminPagesContainer currentPage="services">
    داشبورد
  </AdminPagesContainer>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({ context })
}