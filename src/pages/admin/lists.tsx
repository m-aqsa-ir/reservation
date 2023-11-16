import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AdminTable } from "@/components/AdminTables";
import { AreYouSure } from "@/components/AreYouSure";
import { IconButton } from "@/components/IconButton";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { fetchPost } from "@/lib/lib";
import { showMessage } from "@/redux/messageSlice";
import { mdiCancel, mdiCheck, mdiPen, mdiPlus, mdiTrashCan } from "@mdi/js";
import Icon from "@mdi/react";
import { GroupType, PrismaClient, } from "@prisma/client";
import { VolumeList } from '@prisma/client'
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";


export default function AdminVolumeList(props: ListsPageProp) {
  return <AdminPagesContainer currentPage="lists">
    <VolumeListPart {...props.volumeList} />
    <GroupsListPart {...props.groupList} />
  </AdminPagesContainer>
}

function VolumeListPart(props: { vs: VolumeList[], columnNames: string[] }) {
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

  return <>
    <div className="d-flex justify-content-between mb-3 align-items-base">
      <h1 className="fs-3 m-0">لیست ظرفیت ها</h1>
      <Button onClick={() => setAddMode(m => !m)} variant="success">
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <AdminTable columnNames={props.columnNames}>
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
    </AdminTable>


    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={handleDel} />
  </>
}

function GroupsListPart(props: { groups: GroupType[], columNames: string[] }) {
  const [groups, setGroups] = useState(props.groups)
  const [addMode, setAddMode] = useState<{ name: string } | null>(null)
  const [editMode, setEditMode] = useState<{ id: number, name: string } | null>(null)

  const dispatch = useDispatch()
  const router = useRouter()

  const handleAdd = async () => {
    if (addMode == null) return

    const res = await fetchPost('/api/admin/group', {
      type: 'add',
      ...addMode
    })

    if (res.ok) {
      const id = Number(await res.text())
      setGroups(gs => [...gs, { ...addMode, id, iconPath: '' }])
      setAddMode(null)
    }

    resHandleNotAuth(res, dispatch, router)
  }

  const handleEdit = async () => {
    if (editMode == null || editMode.name == '') return

    const res = await fetchPost('/api/admin/group', {
      type: 'edit',
      ...editMode
    })

    if (res.ok) {
      setGroups(gs => gs.map(g => g.id == editMode.id ? { ...g, ...editMode } : g))
      setEditMode(null)
    }
    resHandleNotAuth(res, dispatch, router)
  }

  return <>
    <div className="d-flex justify-content-between mb-3 align-items-base mt-3">
      <h1 className="fs-3 m-0">لیست گروه ها</h1>
      <Button variant="success" onClick={() => setAddMode(a => a ? null : { name: '' })}>
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <AdminTable columnNames={props.columNames}>
      <tbody className="my-table">
        {addMode ? <tr>
          <td>---</td>
          <td>
            <Form.Control className="text-center"
              value={addMode.name}
              onChange={(e) => setAddMode({ ...addMode, name: e.target.value })}
            />
          </td>
          <td>
            <div className="d-flex justify-content-around">
              <IconButton iconPath={mdiCancel} variant="danger" onClick={() => setAddMode(null)} />
              <IconButton iconPath={mdiCheck} variant="success" onClick={handleAdd} />
            </div>
          </td>
        </tr> : <></>}
        {groups.map(i => <Fragment key={i.id}>
          {
            editMode && editMode.id == i.id ? <tr>
              <td>---</td>
              <td>
                <Form.Control className="text-center"
                  value={editMode.name}
                  onChange={(e) => setEditMode({ ...editMode, name: e.target.value })}
                />
              </td>
              <td>
                <div className="d-flex justify-content-around">
                  <IconButton iconPath={mdiCancel} variant="danger" onClick={() => setEditMode(null)} />
                  <IconButton iconPath={mdiCheck} variant="success" onClick={handleEdit} />
                </div>
              </td>
            </tr>
              :
              <tr key={i.id}>
                <td>{i.id}</td>
                <td>{i.name}</td>
                <td>
                  <div className="d-flex justify-content-around">
                    <IconButton iconPath={mdiPen} variant="info" onClick={() => setEditMode(em => {
                      const { id, name } = i
                      return { id, name }
                    })} />
                  </div>
                </td>
              </tr>
          }
        </Fragment>)}
      </tbody>
    </AdminTable>
  </>
}

type ListsPageProp = {
  volumeList: {
    vs: VolumeList[]
    columnNames: string[]
  },
  groupList: {
    groups: GroupType[],
    columNames: string[]
  }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, callbackSuccess: async () => {
      const prisma = new PrismaClient()

      const vs = await prisma.volumeList.findMany({
        orderBy: { volume: 'asc' }
      })

      const groups = await prisma.groupType.findMany()

      return {
        props: {
          volumeList: {
            vs, columnNames: [
              'شناسه',
              'ظرفیت',
              'درصد تخفیف',
              'عملیات'
            ]
          },
          groupList: {
            groups,
            columNames: [
              'شناسه',
              'نام',
              'عملیات'
            ]
          }
        } satisfies ListsPageProp
      }
    }
  })
}