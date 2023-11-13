import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { mdiPlus } from "@mdi/js";
import Icon from "@mdi/react";
import { PrismaClient, VolumeList } from "@prisma/client";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button, Table } from "react-bootstrap";

const DynamicHead = dynamic(
  () => import('../../components/TableHead'), { ssr: false }
)


export default function AdminVolumeList(props: CapListProps) {

  const [addMode, setAddMode] = useState(false)

  return <AdminPagesContainer currentPage="cap-list">
    <div className="d-flex justify-content-end mb-3">
      <Button onClick={() => setAddMode(m => !m)}>
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        {/* <thead>
          {props.columnNames.map(i =>
            <th key={i}>{i}</th>)}
        </thead> */}
        <DynamicHead columnNames={props.columnNames} />
        <tbody>
          {props.vs.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.volume}</td>
            <td>{i.discountPercent}</td>
            <td></td>
          </tr>)}
        </tbody>
      </Table>
    </div>
  </AdminPagesContainer>
}

type CapListProps = {
  vs: VolumeList[]
  columnNames: string[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, callbackSuccess: async () => {
      const prisma = new PrismaClient()

      const vs = await prisma.volumeList.findMany()

      const columnNames = [
        'شناسه',
        'ظرفیت',
        'درصد تخفیف',
        'عملیات'
      ]

      return {
        props: {
          vs, columnNames
        } satisfies CapListProps
      }
    }
  })
}