import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { GetServerSideProps } from "next";


export default function AdminCustomer() {
  return <AdminPagesContainer currentPage="customer">
    customer
  </AdminPagesContainer>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({ context })
}