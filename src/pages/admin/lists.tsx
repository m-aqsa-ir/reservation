import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { AdminTable } from "@/components/AdminTables";
import { AreYouSure } from "@/components/AreYouSure";
import { IconButton } from "@/components/IconButton";
import { ModalFonted } from "@/components/ModalFonted";
import { PerNumberInput } from "@/components/PerNumberInput";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { enDigit2Per, fetchPost } from "@/lib/lib";
import { showMessage } from "@/redux/messageSlice";
import { mdiAccountSchool, mdiBorderNoneVariant, mdiBusSchool, mdiCancel, mdiCheck, mdiHumanCane, mdiHumanFemaleBoy, mdiHumanFemaleFemale, mdiHumanFemaleFemaleChild, mdiHumanFemaleGirl, mdiHumanMaleBoard, mdiHumanMaleBoy, mdiHumanMaleChild, mdiHumanMaleFemale, mdiHumanMaleFemaleChild, mdiHumanMaleGirl, mdiHumanMaleMale, mdiHumanMaleMaleChild, mdiHumanQueue, mdiMosque, mdiPen, mdiPencilOutline, mdiPlus, mdiRabbit, mdiTownHall, mdiTrashCan, mdiTrashCanOutline } from "@mdi/js";
import Icon from "@mdi/react";
import { GroupType, PrismaClient, } from "@prisma/client";
import { VolumeList } from '@prisma/client'
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { useDispatch } from "react-redux";
import _ from 'lodash/fp'

export default function AdminVolumeList(props: ListsPageProp) {
  return <AdminPagesContainer currentPage="lists">
    <Head>
      <title>ادمین - لیست ها</title>
    </Head>
    <VolumeListPart {...props.volumeList} />
    <GroupsListPart {...props.groupList} />
  </AdminPagesContainer>
}

function VolumeListPart(props: { vs: VolumeList[] } & TablePageBaseProps) {
  const [volumes, setVolumes] = useState(props.vs)

  const [addRowState, setAddRowState] = useState<{
    volume: string,
    discount: string
  } | null>(null)
  const [delMode, setDelMode] = useState<number | null>(null)

  const dispatch = useDispatch()
  const router = useRouter()

  async function handleAdd() {
    console.log(addRowState)
    if (addRowState == null) return;

    const nVolume = Number(addRowState.volume);
    const nDiscount = Number(addRowState.discount);

    if (nVolume <= 0 || nDiscount < 0) {
      dispatch(showMessage({ message: 'لطفا مقدار صحیح را وارد نمایید!' }));
      return;
    }

    const res = await fetchPost('/api/admin/add-vol', {
      volume: nVolume,
      discount: nDiscount
    });

    if (res.ok) {
      const id = Number(await res.text());
      setVolumes(vs => [...vs, {
        id,
        discountPercent: nDiscount,
        volume: nVolume
      }]);

      setAddRowState(null);
    } else if (res.status == 403) {
      dispatch(showMessage({ message: "این مقدار قبلا انتخاب شده است!" }));
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }));
      router.push('/admin');
      return;
    } else {
      console.log(res.status);
    }
  }

  async function handleDel() {
    if (delMode == null) {
      return;
    }

    const res = await fetchPost('/api/admin/del-vol', {
      id: delMode
    });

    if (res.ok) {
      setVolumes(vs => vs.filter(v => v.id != delMode));
      setDelMode(null);
    } else if (res.status == 401) {
      dispatch(showMessage({ message: 'باید دوباره وارد شوید!' }));
      router.push('/admin');
      return;
    } else {
      console.log(res.status);
    }
  }

  return <>
    <div className="d-flex justify-content-between mb-3 align-items-base">
      <h1 className="fs-3 m-0">لیست ظرفیت ها</h1>
      <Button onClick={() => setAddRowState(m => m == null ? { volume: '', discount: '' } : null)} variant="success">
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <AdminTable columnNames={props.columnNames}>
      <tbody className="my-table">
        {volumes.map(i => <tr key={i.id}>
          <td>{enDigit2Per(i.volume)} نفر</td>
          <td>{enDigit2Per(i.discountPercent)} %</td>
          <td className="table-actions-col-width">
            <IconButton
              iconPath={mdiTrashCanOutline}
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

    <ModalFonted show={addRowState != null} onHide={() => setAddRowState(null)}>
      <Form onSubmit={async (e) => {
        e.preventDefault()
        await handleAdd()
      }}>
        <Modal.Body>
          {addRowState == null ? <></> : <Row>
            <Col md="6" className="mb-2">
              <PerNumberInput
                placeholder="نفر"
                min={1} required
                value={addRowState.volume}
                onChange={e => setAddRowState(r => ({ ...r!, volume: e.target.value }))}
              />
            </Col>
            <Col md="6">
              <PerNumberInput
                placeholder="تخفیف 0-100"
                min={0} max={100}
                value={addRowState.discount}
                onChange={e => setAddRowState(r => ({ ...r!, discount: e.target.value }))}
              />
            </Col>
          </Row>}
        </Modal.Body>
        <Modal.Footer>
          <IconButton
            iconPath={mdiCancel}
            variant="danger"
            onClick={() => setAddRowState(null)} />
          <IconButton iconPath={mdiCheck}
            type="submit"
            variant="success" />
        </Modal.Footer>
      </Form>
    </ModalFonted>
  </>
}

const listAvailableIcons = [
  mdiHumanMaleFemaleChild,
  mdiHumanMaleMale,
  mdiHumanMaleMaleChild,
  mdiHumanFemaleFemale,
  mdiHumanFemaleFemaleChild,
  mdiHumanCane, mdiHumanFemaleBoy,
  mdiHumanFemaleGirl, mdiHumanMaleBoy, mdiHumanMaleChild, mdiHumanMaleFemale, mdiHumanMaleGirl,
  mdiHumanQueue, mdiBusSchool, mdiAccountSchool, mdiTownHall, mdiMosque, mdiHumanMaleBoard
]

function GroupsListPart(props: { groups: GroupType[] } & TablePageBaseProps) {
  const [groups, setGroups] = useState(props.groups)
  const [addMode, setAddMode] = useState<{ name: string, iconPath: string } | null>(null)
  const [editMode, setEditMode] = useState<{ id: number, name: string, iconPath: string } | null>(null)
  const [delMode, setDelMode] = useState<number | null>(null)


  const dispatch = useDispatch()
  const router = useRouter()

  async function handleAdd() {
    if (addMode == null) return;

    const res = await fetchPost('/api/admin/group', {
      type: 'add',
      ...addMode
    });

    if (res.ok) {
      const id = Number(await res.text());
      setGroups(gs => [...gs, { ...addMode, id }]);
      setAddMode(null);
    }

    resHandleNotAuth(res, dispatch, router);
  }

  async function handleEdit() {
    if (editMode == null || editMode.name == '') return;

    const res = await fetchPost('/api/admin/group', {
      type: 'edit',
      ...editMode
    });

    if (res.ok) {
      setGroups(gs => gs.map(g => g.id == editMode.id ? { ...g, ...editMode } : g));
      setEditMode(null);
    }
    resHandleNotAuth(res, dispatch, router);
  }

  async function handleDel() {
    if (delMode == null) return;

    const res = await fetchPost('/api/admin/group', {
      type: 'del',
      id: delMode
    });

    if (res.ok) {
      setGroups(gs => gs.filter(g => g.id != delMode));
      setDelMode(null);
    } else if (res.status == 403) {
      setDelMode(null);
      dispatch(showMessage({ message: "روزهای به این گروه متصل هستند!" }));
    }

    resHandleNotAuth(res, dispatch, router);
  }

  return <>
    <div className="d-flex justify-content-between mb-3 align-items-base mt-3">
      <h1 className="fs-3 m-0">لیست گروه ها</h1>
      <Button variant="success" onClick={() => setAddMode(a => a ? null : { name: '', iconPath: listAvailableIcons[0] })}>
        اضافه کردن <Icon path={mdiPlus} size={1} />
      </Button>
    </div>
    <AdminTable columnNames={props.columnNames} responsive="lg">
      <tbody className="my-table">
        {groups.map(i => <Fragment key={i.id}>
          <tr key={i.id}>
            <td>{i.name}</td>
            <td><Icon path={i.iconPath == '' ? mdiBorderNoneVariant : i.iconPath} size={1} /> </td>
            {/* ACTION */}
            <td className="table-actions-col-width">
              <div className="d-flex justify-content-around">
                <IconButton iconPath={mdiPencilOutline} variant="info" onClick={() => setEditMode(em => {
                  const { id, name, iconPath } = i
                  return { id, name, iconPath }
                })} />

                <IconButton iconPath={mdiTrashCanOutline} variant="danger" onClick={() => setDelMode(i.id)} />
              </div>
            </td>
          </tr>
        </Fragment>)}
      </tbody>
    </AdminTable>

    {/* EDIT */}
    <ModalFonted show={editMode != null} onHide={() => setEditMode(null)}>
      <Form onSubmit={e => {
        e.preventDefault()
        handleEdit()
      }}>
        <Modal.Body>
          <Form.Control className="mb-4"
            value={editMode?.name ?? ""}
            required
            placeholder="نام"
            onChange={(e) => setEditMode({ ...editMode!, name: e.target.value })}
          />
          <p className="text-center mt-2">انتخاب آیکون</p>
          <div className="d-flex justify-content-around mt-3 flex-wrap">
            {listAvailableIcons.map((i) =>
              <div key={i} className="d-flex align-items-center flex-column">
                <Icon path={i} size={2} className="text-primary" />
                <Form.Check
                  name="icon"
                  type="radio"
                  checked={editMode?.iconPath == i}
                  value={i}
                  onChange={e => setEditMode({ ...editMode!, iconPath: e.target.value })}
                />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <IconButton iconPath={mdiCancel} variant="danger" onClick={() => setEditMode(null)} />
          <IconButton iconPath={mdiCheck} variant="success" type="submit" />
        </Modal.Footer>
      </Form>
    </ModalFonted>

    {/* ADD */}
    <ModalFonted show={addMode != null} onHide={() => setAddMode(null)}>
      <Form onSubmit={e => {
        e.preventDefault()
        handleAdd()
      }}>
        <Modal.Body>
          <Form.Control className="mb-4"
            value={addMode?.name ?? ""}
            required
            placeholder="نام"
            onChange={(e) => setAddMode({ ...addMode!, name: e.target.value })}
          />
          <p className="text-center mt-2">انتخاب آیکون</p>
          <div className="d-flex justify-content-around mt-3 flex-wrap">
            {listAvailableIcons.map((i) =>
              <div key={i} className="d-flex align-items-center flex-column">
                <Icon path={i} size={2} className="text-primary" />
                <Form.Check
                  name="icon"
                  type="radio"
                  checked={addMode?.iconPath == i}
                  value={i}
                  onChange={e => setAddMode({ ...addMode!, iconPath: e.target.value })}
                />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <IconButton iconPath={mdiCancel} variant="danger" onClick={() => setAddMode(null)} />
          <IconButton iconPath={mdiCheck} variant="success" type="submit" />
        </Modal.Footer>
      </Form>
    </ModalFonted>

    <AreYouSure
      show={delMode != null}
      hideAction={() => setDelMode(null)}
      yesAction={handleDel} />
  </>
}

type ListsPageProp = {
  volumeList: {
    vs: VolumeList[]
  } & TablePageBaseProps,
  groupList: {
    groups: GroupType[],
  } & TablePageBaseProps
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
              'ظرفیت',
              'درصد تخفیف',
              'عملیات'
            ]
          },
          groupList: {
            groups,
            columnNames: [
              { name: 'نام', width: '5rem' },
              { name: 'آیکون', width: '5rem' },
              { name: 'عملیات', width: '7rem' },
            ]
          }
        } satisfies ListsPageProp
      }
    }
  })
}