import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AreYouSure } from "@/components/AreYouSure";
import { DynamicHead } from "@/components/DynamicHead";
import { IconButton } from "@/components/IconButton";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { fetchPost } from "@/lib/lib";
import { showMessage } from "@/redux/messageSlice";
import { mdiCancel, mdiCheck, mdiPlus, mdiTrashCan } from "@mdi/js";
import Icon from "@mdi/react";
import { PrismaClient, VolumeList } from "@prisma/client";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { useDispatch } from "react-redux";


export default function AdminVolumeList(props: CapListProps) {

  const [volumes, setVolumes] = useState(props.vs)

  const [addMode, setAddMode] = useState(false)
  const [addRowState, setAddRowState] = useState<{
    volume: number,
    discount: number
  }>({
    volume: 1,
    discount: 0
  })
  const [delMode, setDelMode] = useState<number | null>(null)

  const dispatch = useDispatch()
  const router = useRouter()

  const handleAdd = async () => {
    if (addRowState.volume <= 0 || addRowState.discount < 0) {
      dispatch(showMessage({ message: 'لطفا مقدار صحیح را وارد نمایید!' }))
      return
    }

    const res = await fetchPost('/api/admin/add-vol', addRowState)

    if (res.ok) {
      const id = Number(await res.text())
      setVolumes(vs => [...vs, {
        id,
        discountPercent: addRowState.discount,
        volume: addRowState.volume
      }])

      setAddMode(false)
    } else if (res.status == 403) {
      dispatch(showMessage({ message: "این مقدار قبلا انتخاب شده است!" }))
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }
  }

  const handleDel = async () => {
    if (delMode == null) {
      return
    }

    const res = await fetchPost('/api/admin/del-vol', {
      id: delMode
    })

    if (res.ok) {
      setVolumes(vs => vs.filter(v => v.id != delMode))
      setDelMode(null)
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }
  }

  return <AdminPagesContainer currentPage="volume-list">
    <div className="d-flex justify-content-end mb-3">
      <Button onClick={() => setAddMode(m => !m)} variant="success">
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }}>
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {addMode ? <tr>
            <td> --- </td>
            <td> <Form.Control
              type="number" min={1}
              value={addRowState.volume}
              onChange={e => setAddRowState(r => ({ ...r, volume: Number(e.target.value) }))}

            /> </td>
            <td> <Form.Control
              type="number" min={0} max={100}
              value={addRowState.discount}
              onChange={e => setAddRowState(r => ({ ...r, discount: Number(e.target.value) }))}
            />  </td>
            <td >
              <div className="d-flex justify-content-around h-100">
                <IconButton
                  iconPath={mdiCancel}
                  variant="danger"
                  onClick={() => setAddMode(false)} />
                <IconButton iconPath={mdiCheck}
                  variant="success"
                  onClick={handleAdd} />
              </div>
            </td>

          </tr>
            :
            <tr></tr>}

          {volumes.map(i => <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.volume}</td>
            <td>{i.discountPercent}</td>
            <td className="d-flex justify-content-around">
              <IconButton
                iconPath={mdiTrashCan}
                variant="danger"
                onClick={() => setDelMode(i.id)} />
            </td>
          </tr>)}
        </tbody>
      </Table>
    </div>
    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={handleDel} />
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

      const vs = await prisma.volumeList.findMany({
        orderBy: { volume: 'asc' }
      })

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