import { AdminPagesContainer } from "@/components/AdminPagesContainer";
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
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { EditService } from "../api/admin/edit-service";
import { AreYouSure } from "@/components/AreYouSure";
import Head from "next/head";
import { AdminTable } from "@/components/AdminTables";
import { ModalFonted } from "@/components/ModalFonted";
import _ from "lodash/fp";
import { PerNumberInput, PerNumberInputPrice } from "@/components/PerNumberInput";


export default function AdminServicePage(props: AdminServiceProps) {
  const [addRowState, setAddRowState] = useState<ServiceAction | null>(null)
  const [editMode, setEditMode] = useState<ServiceAction & { id: number } | null>(null)


  const [services, setServices] = useState(props.services)
  const [delMode, setDelMode] = useState<null | number>(null)


  const dispatch = useDispatch()
  const router = useRouter()


  async function handleAdd() {
    if (addRowState == null) return

    const nPrice = Number(addRowState.priceNormal.replace(/,/g, ''))
    const nPriceVip = Number(addRowState.priceVip.replace(/,/g, ''))

    if (addRowState.name == '' || nPrice <= 0 || nPriceVip <= 0) {
      dispatch(showMessage({ message: "لطفا مقادیر را وارد نمایید!" }));
      return;
    }

    const body: Omit<Service, 'id'> = {
      ...addRowState,
      priceNormal: nPrice,
      priceVip: nPriceVip,
    }

    const res = await fetchPost('/api/admin/add-service', body);

    if (res.ok) {
      const id = Number(await res.text());
      setServices(i => [...i, { ...body, id }]);
      setAddRowState(null);
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }));
      router.push('/admin');
      return;
    } else {
      console.log(res.status);
    }
  }

  async function handleEdit() {
    if (!editMode) return;

    const nPrice = Number(editMode.priceNormal.replace(/,/g, ''))
    const nPriceVip = Number(editMode.priceVip.replace(/,/g, ''))

    if (editMode.name == '' || nPrice <= 0 || nPriceVip <= 0) {
      dispatch(showMessage({ message: 'لطفا مقادیر را درست وارد نمایید' }));
      return;
    }

    const body: EditService = {
      ...editMode,
      priceNormal: nPrice,
      priceVip: nPriceVip
    }
    const res = await fetchPost('/api/admin/edit-service', body);

    if (res.ok) {
      setServices(i => i.map(j => {
        if (j.id == editMode.id) {
          return {
            ...j,
            ...body
          };
        } else {
          return j;
        }
      }));

      setEditMode(null);
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }));
      router.push('/admin');
      return;
    } else {
      console.log(res.status);
    }
  }

  async function handleDelete() {
    if (delMode == null) return;

    const res = await fetchPost('/api/admin/del-service', { id: delMode });

    if (res.ok) {
      setServices(i => i.filter(j => j.id != delMode));
      setDelMode(null);
    } else if (res.status == 403) {
      const t = await res.text();
      dispatch(showMessage({
        message: `خطا: ${t == 'order' ? 'سفارش' : 'روز'} به این خدمت متصل است.`
      }));
      setDelMode(null);
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }));
      router.push('/admin');
      return;
    } else {
      console.log(res.status);
    }

  }

  return <AdminPagesContainer currentPage="services">
    <Head>
      <title>ادمین - خدمات</title>
    </Head>
    <div className="d-flex justify-content-end mb-3">
      <Button variant="success" onClick={() => setAddRowState(a => a == null ? addServiceInit : null)}>
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <AdminTable columnNames={props.columnNames}>
      <tbody className="my-table">
        {services.map(i =>
          <tr key={i.id}>
            <td>{i.name}</td>
            <td>{i.desc}</td>
            <td>{i.type == 'package' ? 'بسته' : 'خدمت'}</td>
            <td className="text-nowrap">{numberTo3Dig(i.priceNormal)} تومان</td>
            <td className="text-nowrap">{numberTo3Dig(i.priceVip ?? 0)} تومان</td>
            {/* ACTIONS */}
            <td className="table-actions-col-width">
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
                  onClick={() => setEditMode({
                    ...i,
                    desc: i.desc ?? '',
                    priceNormal: i.priceNormal.toLocaleString(),
                    priceVip: i.priceVip?.toLocaleString() ?? ""
                  })}
                />
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </AdminTable>
    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={handleDelete} />

    {/* ADD MODAL */}
    <ServiceActionsModal
      show={addRowState != null}
      onHide={() => setAddRowState(null)}
      state={addRowState!} stateSetter={setAddRowState}
      onSubmit={handleAdd} />

    {/* EDIT MODE */}
    <ServiceActionsModal
      show={editMode != null}
      onHide={() => setEditMode(null)}
      onSubmit={handleEdit}
      state={editMode}
      stateSetter={setEditMode} />

  </AdminPagesContainer>
}

const addServiceInit = {
  desc: '',
  name: '',
  priceNormal: '',
  priceVip: '',
  type: 'package'
}
type ServiceAction = typeof addServiceInit

function ServiceActionsModal<T extends ServiceAction>(p: {
  show: boolean,
  onHide: () => void,
  onSubmit: () => void,
  state: T | null,
  stateSetter: (f: (s: T | null) => T | null) => void
}) {

  return <ModalFonted show={p.show} onHide={p.onHide}>
    <Form onSubmit={e => {
      e.preventDefault()
      p.onSubmit()
    }}>
      <Modal.Body>
        {p.state && <Row>
          <Col md="6" className="mb-2">
            <Form.Label>نام</Form.Label>
            <Form.Control
              required
              placeholder="نام"
              value={p.state.name}
              onChange={e => p.stateSetter(s => _.assign(s, { name: e.target.value }))}
            />
          </Col>
          <Col md="6">
            <Form.Label>توضیحات</Form.Label>
            <Form.Control
              required
              placeholder="توضیحات"
              value={p.state.desc}
              onChange={e => p.stateSetter(s => _.assign(s, { desc: e.target.value }))}
            />
          </Col>
          <Col md="6" className="mt-4 mb-4 px-3 d-flex align-items-center justify-content-between">
            <Form.Label className="mb-0">بسته</Form.Label>
            <Form.Check
              name="type"
              type="radio"
              value="package"
              onChange={e => p.stateSetter(s => _.assign(s, { type: e.target.value }))}
              defaultChecked
            />
            <Form.Label className="mb-0">خدمت</Form.Label>
            <Form.Check
              type="radio"
              name="type"
              value="service"
              onChange={e => p.stateSetter(s => _.assign(s, { type: e.target.value }))}
            />
          </Col>
          <Col md="6" className="mb-2">
            <Form.Label>قیمت عادی</Form.Label>
            <PerNumberInputPrice
              value={p.state.priceNormal} required min={1}
              onSet={v => p.stateSetter(s => _.assign(s, { priceNormal: v }))}
            />
          </Col>
          <Col md="6" className="mb-2 d-flex align-items-center justify-content-between">

          </Col>
          <Col md="6">
            <Form.Label>قیمت ویژه</Form.Label>
            <PerNumberInputPrice
              value={p.state.priceVip} min={1} required placeholder="۰ تومان"
              onSet={e => p.stateSetter(s => _.assign(s, { priceVip: e }))}
            />
          </Col>
        </Row>}
      </Modal.Body>
      <Modal.Footer>
        <IconButton
          iconPath={mdiCancel}
          variant="danger"
          onClick={() => p.onHide()} />
        <IconButton iconPath={mdiCheck}
          variant="success"
          type="submit" />
      </Modal.Footer>
    </Form>
  </ModalFonted>
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
        'نام',
        'توضیحات',
        'نوع',
        'قیمت معمولی',
        'قیمت VIP',
        'عملیات',
      ]

      return {
        props: {
          services, columnNames
        }
      }
    }
  })
}