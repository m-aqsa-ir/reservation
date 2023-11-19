import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { DynamicHead } from "@/components/DynamicHead";
import { IconButton } from "@/components/IconButton";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { fetchPost, numberTo3Dig } from "@/lib/lib";
import { showMessage } from "@/redux/messageSlice";
import { mdiCancel, mdiCheck, mdiPen, mdiPlus, mdiTrashCan } from "@mdi/js";
import Icon from "@mdi/react";
import { PrismaClient } from "@prisma/client";
import type { Service } from '@prisma/client'
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { EditService } from "../api/admin/edit-service";
import { AreYouSure } from "@/components/AreYouSure";
import Head from "next/head";

const addRowStateInit = {
  desc: '',
  name: '',
  priceNormal: 1,
  priceVip: 1,
  type: 'package'
}

export default function AdminServicePage(props: AdminServiceProps) {
  const [addMode, setAddMode] = useState(false)
  const [addRowState, setAddRowState] = useState<Omit<Service, 'id'>>(addRowStateInit)
  const [services, setServices] = useState(props.services)
  const [editMode, setEditMode] = useState<null | EditService>(null)
  const [delMode, setDelMode] = useState<null | number>(null)


  const dispatch = useDispatch()
  const router = useRouter()

  const handleRadio = (e: any) => setAddRowState(k => ({ ...k, type: e.target.value }))

  const handleAdd = async () => {
    if (addRowState.name == '' || addRowState.priceNormal <= 0 || addRowState.priceVip! <= 0) {
      dispatch(showMessage({ message: "لطفا مقادیر را وارد نمایید!" }))
      return
    }

    const res = await fetchPost('/api/admin/add-service', addRowState)

    if (res.ok) {
      const id = Number(await res.text())
      setServices(i => [...i, { ...addRowState, id }])
      setAddRowState(addRowStateInit)
      setAddMode(false)
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }
  }

  const handleEdit = async () => {
    if (!editMode) return

    if (editMode.name == '' || editMode.priceNormal <= 0 || editMode.priceVip <= 0) {
      dispatch(showMessage({ message: 'لطفا مقادیر را درست وارد نمایید' }))
      return
    }

    const res = await fetchPost('/api/admin/edit-service', editMode)

    if (res.ok) {
      setServices(i => i.map(j => {
        if (j.id == editMode.id) {
          const { name, desc, priceNormal, priceVip } = editMode
          return {
            ...j,
            name, desc, priceNormal, priceVip
          }
        } else {
          return j
        }
      }))

      setEditMode(null)
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }
  }

  const handleDelete = async () => {
    if (delMode == null) return

    const res = await fetchPost('/api/admin/del-service', { id: delMode })

    if (res.ok) {
      setServices(i => i.filter(j => j.id != delMode))
      setDelMode(null)
    } else if (res.status == 403) {
      const t = await res.text()
      dispatch(showMessage({
        message: `خطا: ${t == 'order' ? 'سفارش' : 'روز'
          } به این خدمت متصل است.`
      }))
      setDelMode(null)
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }))
      router.push('/admin')
      return
    } else {
      console.log(res.status)
    }

  }

  return <AdminPagesContainer currentPage="services">
    <Head>
      <title>ادمین - خدمات</title>
    </Head>
    <div className="d-flex justify-content-end mb-3">
      <Button variant="success" onClick={() => setAddMode(a => !a)}>
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <div className="rounded-4 overflow-hidden border">
      <Table striped bordered style={{ tableLayout: 'fixed' }} responsive="sm" className="my-table-table">
        <DynamicHead columnNames={props.columnNames} />
        <tbody className="my-table">
          {/* ADD ROW MODE */}
          {addMode ?
            <tr>
              {/* <td> --- </td> */}
              <td><Form.Control
                value={addRowState.name}
                onChange={e => setAddRowState({ ...addRowState, name: e.target.value })}
              />
              </td>
              <td><Form.Control
                value={addRowState.desc!}
                onChange={e => setAddRowState({ ...addRowState, desc: e.target.value })}
              />
              </td>
              <td>
                <Form.Check
                  name="type"
                  type="radio"
                  value="package"
                  label="بسته"
                  onChange={handleRadio}
                />
                <Form.Check
                  type="radio"
                  name="type"
                  value="service"
                  label="خدمت"
                  onChange={handleRadio}
                  defaultChecked
                />
              </td>
              <td><Form.Control type="number" min={1}
                value={addRowState.priceNormal}
                onChange={e => setAddRowState({ ...addRowState, priceNormal: Number(e.target.value) })}
              /></td>
              <td><Form.Control type="number" min={1}
                value={addRowState.priceVip!}
                onChange={e => setAddRowState({ ...addRowState, priceVip: Number(e.target.value) })}
              /></td>
              <td>
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
            <></>}
          {/* SHOW OR EDIT */}
          {services.map(i =>
            editMode && editMode.id == i.id ?
              /* EDIT MODE */
              <tr key={i.id}>
                {/* <td>{i.id}</td> */}
                <td>
                  <Form.Control
                    value={editMode.name}
                    onChange={e => setEditMode({ ...editMode, name: e.target.value })}
                  />
                </td>
                <td>
                  <Form.Control
                    value={editMode.desc}
                    onChange={e => setEditMode({ ...editMode, desc: e.target.value })}
                  />
                </td>
                <td>{i.type == 'package' ? 'بسته' : 'خدمت'}</td>
                <td>
                  <Form.Control type="number" min={1}
                    value={editMode.priceNormal}
                    onChange={e => setEditMode({ ...editMode, priceNormal: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <Form.Control type="number" min={1}
                    value={editMode.priceVip}
                    onChange={e => setEditMode({ ...editMode, priceVip: Number(e.target.value) })}
                  />
                </td>
                <td className="d-flex justify-content-around">
                  <IconButton
                    iconPath={mdiCancel}
                    variant="danger"
                    onClick={() => setEditMode(null)}
                  />
                  <IconButton
                    iconPath={mdiCheck}
                    variant="success"
                    onClick={handleEdit}
                  />
                </td>
              </tr>
              :
              /* SHOW ROWS */
              <tr key={i.id}>
                {/* <td>{i.id}</td> */}
                <td>{i.name}</td>
                <td>{i.desc}</td>
                <td>{i.type == 'package' ? 'بسته' : 'خدمت'}</td>
                <td>{numberTo3Dig(i.priceNormal)}</td>
                <td>{numberTo3Dig(i.priceVip ?? 0)}</td>
                {/* ACTIONS */}
                <td >
                  <div className="d-flex justify-content-around">
                    {/* DELETE */}
                    <IconButton
                      iconPath={mdiTrashCan}
                      variant="danger"
                      onClick={() => setDelMode(i.id)}
                    />
                    {/* EDIT */}
                    <IconButton
                      iconPath={mdiPen}
                      variant="info"
                      onClick={() => setEditMode({ ...i, desc: i.desc ?? '', priceVip: i.priceVip! })} />
                  </div>
                </td>
              </tr>
          )}
        </tbody>
      </Table>
    </div>
    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={handleDelete} />
  </AdminPagesContainer>
}

type AdminServiceProps = {
  services: Service[]
} & TablePageBaseProps

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess() {
      const prisma = new PrismaClient()

      const services = await prisma.service.findMany({ orderBy: { type: 'asc' } })

      const columnNames = [
        // { name: 'شناسه', width: '3rem' },
        { name: 'نام', width: '6rem' },
        { name: 'توضیحات', width: '7rem' },
        { name: 'نوع', width: '6rem' },
        { name: 'قیمت معمولی', width: '4rem' },
        { name: 'قیمت VIP', width: '4rem ' },
        { name: 'عملیات', width: '6rem' },
      ]

      return {
        props: {
          services, columnNames
        } satisfies AdminServiceProps
      }
    }
  })
}