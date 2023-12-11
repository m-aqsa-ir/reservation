import { AdminPagesContainer } from "@/components/AdminPagesContainer"
import { InfoItem } from "@/components/InfoItem"
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import { enDigit2Per, fetchPost } from "@/lib/lib"
import { OrderTableRow, PaginatorState } from "@/types"
import { Customer } from "@prisma/client"
import { GetServerSideProps } from "next"
import Head from "next/head"
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap"
import { OrderTable } from "../order"
import Icon from "@mdi/react"
import { mdiCancel, mdiCheck, mdiPencil } from "@mdi/js"
import { useEffect, useState } from "react"
import { NewPerNumberInput } from "@/components/PerNumberInput"
import { IconButton } from "@/components/IconButton"
import { CustomerApi } from "@/pages/api/admin/customer"
import { useDispatch } from "react-redux"
import { showMessage } from "@/redux/messageSlice"
import { resHandleNotAuth } from "@/lib/apiHandle"
import { useRouter } from "next/router"
import { useAlert } from "@/lib/useAlert"

export default function CustomerDetailsPage(P: CustomerDetailsPageProps) {
  const [customer, setCustomer] = useState(P.customer)
  const [showMyModal, setShowMyModal] = useState(false)

  const dispatch = useDispatch()
  const router = useRouter()

  async function handleEditModal(editModal: Customer) {
    const { id, name, nationalCode } = editModal
    const res = await fetchPost("/api/admin/customer", {
      reqType: "edit",
      body: { id, name, nationalCode }
    } satisfies CustomerApi)

    if (res.ok) {
      setCustomer({
        ...customer,
        ...editModal
      })

      setShowMyModal(false)
    } else if (res.status == 409) {
      dispatch(showMessage({ message: "فردی دیگر با این کد ملی موجود است" }))
    } else {
      resHandleNotAuth(res, dispatch, router)
    }
  }

  const EditModalComp = (P: Customer & { onHide: () => void }) => {
    const { showAlert, alertMessage } = useAlert()
    const [editModal, setEditModal] = useState<null | Customer>(null)

    useEffect(() => setEditModal(P), [P])

    return (
      <Modal show={showMyModal} onHide={P.onHide}>
        {editModal && (
          <Form
            onSubmit={(e) => {
              e.preventDefault()

              if (editModal.nationalCode.length != 10)
                return showAlert("کد ملی درست وارد نشده است.")

              handleEditModal(editModal)
            }}
          >
            <Modal.Header>تغییر مشخصات مشتری</Modal.Header>

            <Modal.Body>
              <Form.Label>نام</Form.Label>
              <Form.Control
                required
                value={editModal.name}
                onChange={(e) =>
                  setEditModal({ ...editModal, name: e.target.value })
                }
              />

              <Form.Label>کد ملی</Form.Label>
              <NewPerNumberInput
                required
                minLength={10}
                value={editModal.nationalCode}
                onSet={(s) => setEditModal({ ...editModal, nationalCode: s })}
              />

              {alertMessage && (
                <Alert variant="danger" className="mt-2">
                  {alertMessage}
                </Alert>
              )}
            </Modal.Body>

            <Modal.Footer>
              <IconButton
                iconPath={mdiCancel}
                variant="danger"
                onClick={P.onHide}
              />
              <IconButton iconPath={mdiCheck} variant="success" type="submit" />
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    )
  }

  return (
    <AdminPagesContainer currentPage="customer">
      <Head>
        <title>{`جزئیات مشتری ${customer.name}`}</title>
      </Head>

      <Col md="12">
        <h1 className="fs-3">مشخصات مشتری: {enDigit2Per(customer.name)}</h1>
        <hr />
      </Col>

      <Row className="align-items-center">
        <Col md="4">
          <InfoItem
            name="شماره همراه"
            value={customer.phone}
            className="mb-md-0"
          />
        </Col>

        <Col md="3">
          <InfoItem name="نام" value={customer.name} className="mb-md-0" />
        </Col>

        <Col md="3">
          <InfoItem
            name="کد ملی"
            value={customer.nationalCode}
            className="mb-md-0"
          />
        </Col>

        <Col md="2">
          <Button className="w-100" onClick={() => setShowMyModal(true)}>
            <Icon path={mdiPencil} size={1} /> &nbsp; تغییر
          </Button>
        </Col>
      </Row>

      <hr />

      <OrderTable
        orders={customer.Order}
        page={{ ...P.page, pageName: `/admin/customer/${customer.id}` }}
        forCustomerDetailPage
      />

      <EditModalComp {...P.customer} onHide={() => setShowMyModal(false)} />
    </AdminPagesContainer>
  )
}

type CustomerDetailsPageProps = {
  customer: Customer & {
    Order: OrderTableRow[]
  }
  page: PaginatorState
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context,
    async callbackSuccess(prisma) {
      const param = context.params?.customerId

      if (param == undefined) {
        return {
          props: {},
          redirect: {
            destination: "/admin/order"
          }
        }
      }

      const customerId = Number(param)

      if (Number.isNaN(customerId)) {
        return {
          props: {},
          redirect: {
            destination: "/admin/order"
          }
        }
      }

      //: PAGE <<<
      const page =
        context.query["page"] == undefined ? 1 : Number(context.query["page"])
      //: TODO read from front
      const pageCount = 30
      const totalCount = await prisma.order.count()
      //: >>>

      const customer = await prisma.customer.findFirst({
        where: { id: customerId },

        include: {
          Order: {
            include: {
              Day: true,
              Discount: true,
              OrderService: {
                include: { Service: true }
              },
              Transaction: true,
              Customer: true,
              OrderCancel: true
            },
            take: pageCount,
            skip: (page - 1) * pageCount
          }
        }
      })

      if (customer == null) {
        return {
          props: {},
          redirect: {
            destination: "/404"
          }
        }
      }

      return {
        props: {
          customer: {
            ...customer,
            Order: customer.Order.map((i) => {
              const { Transaction, Discount, ...without } = i

              const paidAmount = Transaction.reduce(
                (sum, i) => sum + i.valuePaid,
                0
              )

              const discountSum = Discount.reduce((sum, i) => sum + i.value, 0)
              const discountsStr = Discount.map((i) => i.desc).join(", ")

              const orderVip = i.OrderService.every((i) => i.isVip)

              const cancelReq =
                i.OrderCancel.length == 0 ? null : i.OrderCancel[0].reason

              return {
                ...without,
                paidAmount,
                discountSum,
                discountsStr,
                orderVip,
                cancelReq
              }
            })
          },
          page: {
            page,
            pageCount,
            totalCount
          }
        } satisfies CustomerDetailsPageProps
      }
    }
  })
}
