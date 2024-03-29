import { PageContainer } from "@/components/PageContainer"
import { PerNumberInput2 } from "@/components/PerNumberInput"
import { SectionIndicators } from "@/components/SectionIndicator"
import {
  day2Str,
  enDigit2Per,
  fetchPost,
  nowPersianDateObject,
  enNumberTo3DigPer
} from "@/lib/lib"
import { getPrisma4MainPages } from "@/lib/prismaGlobal"
import { sections } from "@/lib/sections"
import { checkNationalCode } from "@/lib/verifyNationalCode"
import { verifyTokenMain } from "@/lib/verifyToken"
import { showMessage } from "@/redux/messageSlice"
import { AppDispatch } from "@/redux/store"
import { ChosenBundle, GroupLeaderData, PayBundle } from "@/types"
import type { Customer } from "@prisma/client"
import { GetServerSideProps } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Button, Col, Form, Modal, Row } from "react-bootstrap"
import { Controller, useForm } from "react-hook-form"
import { useDispatch } from "react-redux"

const calcPerPay = (value: number, percent: number) => (value * percent) / 100

export default function Submit(props: SubmitPageProps) {
  const [sectionOrder, setSectionOrder] = useState(2)
  const [details, setDetails] = useState<GroupLeaderData>(
    props.customer == null
      ? {
          groupName: "",
          groupLeaderName: "",
          nationalCode: ""
        }
      : {
          groupName: "",
          groupLeaderName: props.customer.name,
          nationalCode: props.customer.nationalCode
        }
  )
  const [chosenBundle, setChosenBundle] = useState<ChosenBundle | null>(null)
  const [paymentAwaiting, setPaymentAwaiting] = useState(false)

  const router = useRouter()
  const dispatch: AppDispatch = useDispatch()

  //: check if any product selected
  useEffect(() => {
    if (!router.isReady) return

    const localVal = localStorage.getItem("chosen-bundle")
    const cp: ChosenBundle | "no-value" = localVal
      ? JSON.parse(localVal)
      : "no-value"

    if (cp == "no-value") {
      router.push("/")
      return
    }

    setChosenBundle(cp)
  }, [router])

  const handleSubmit = async () => {
    if (chosenBundle == null) return router.push("/")

    setPaymentAwaiting(true)

    const now = nowPersianDateObject()

    const body: PayBundle = {
      ...chosenBundle,
      ...details,
      reservedDate: now.format("YYYY/MM/DD"),
      reserveTimeTimestamp: now.toUnix(),
      phoneNum: props.phoneNum,
      prepayAmount: calcPerPay(chosenBundle.calculatePrice, props.perPayPercent)
    }

    const res = await fetchPost("/api/pay/start", body)

    if (res.ok) {
      localStorage.removeItem("chosen-bundle")
      const portalUrl = await res.text()
      router.push(portalUrl)
    } else if (res.status == 403) {
      //: if selected volume is more that remained capacity
      dispatch(showMessage({ message: await res.text() }))
      setTimeout(() => {
        localStorage.removeItem("chosen-bundle")
        router.push("/")
      }, 2000)
      return
    } else if ([404, 401].some((i) => res.status == i)) {
      //: 404 -> no day selected
      //: 401 -> unauthorized
      dispatch(showMessage({ message: "زمان خرید تمام شده است." }))
      localStorage.removeItem("chosen-bundle")
      router.push("/")

      setTimeout(() => {
        localStorage.removeItem("chosen-bundle")
        router.push("/")
      }, 2000)
      return
    } else {
      dispatch(showMessage({ message: "خطای سرور", type: "bg-warning" }))
      console.log(await res.text())

      setPaymentAwaiting(false)
    }
  }

  return (
    <PageContainer>
      <Head>
        <title>ثبت سفارش</title>
      </Head>
      <SectionIndicators order={sectionOrder} sections={sections} />
      <hr />
      {chosenBundle == null ? (
        <p>در حال بالا آمدن</p>
      ) : (
        <>
          <ChosenPackageDay
            chosenBundle={chosenBundle}
            prepayPercent={props.perPayPercent}
          />

          {sectionOrder == 2 ? (
            <DetailsForm
              defaultValues={details}
              paymentAwaiting={paymentAwaiting}
              formSubmit={(data) => {
                setDetails(data)
                setSectionOrder(3)
              }}
            />
          ) : (
            <Confirm
              details={details}
              onModify={() => {
                setSectionOrder(2)
              }}
              onSubmit={handleSubmit}
            />
          )}
        </>
      )}

      <Modal show={paymentAwaiting} centered backdrop="static">
        <Modal.Header className="bg-info">صبر کنید</Modal.Header>
        <Modal.Body>در حال انتقال به صفحه پرداخت</Modal.Body>
      </Modal>
    </PageContainer>
  )
}

function ChosenPackageDay({
  chosenBundle,
  prepayPercent
}: {
  chosenBundle: ChosenBundle
  prepayPercent: number
}) {
  const pac = chosenBundle.package
  return (
    <>
      {chosenBundle == null ? (
        "loading"
      ) : (
        <div>
          <p className="text-center fs-4">
            {enDigit2Per(day2Str(chosenBundle.day)) +
              " " +
              chosenBundle.day.desc}{" "}
            - {chosenBundle.groupType}
          </p>
          <p className="fs-5">بسته انتخابی</p>
          {pac == null ? (
            <></>
          ) : (
            <div key={pac.name} className="d-flex border rounded-3 mb-2 p-2">
              <div className="flex-grow-1">
                <p className="fs-5">{pac.name}</p>
                <p>{pac.desc}</p>
              </div>
              <div className="p-3 text-center">
                {enNumberTo3DigPer(
                  chosenBundle.day.isVip ? pac.priceVip ?? 0 : pac.priceNormal
                )}
                <br />
                تومان
              </div>
            </div>
          )}
          {chosenBundle.services.length == 0 ? (
            <></>
          ) : (
            <>
              <p className="fs-5">خدمت های انتخاب شده</p>
              {chosenBundle.services.map((i) => (
                <div key={i.name} className="d-flex border rounded-3 mb-2 p-2">
                  <div className="flex-grow-1">
                    <p>{i.name}</p>
                    <p style={{ fontSize: "0.8rem" }}>{i.desc}</p>
                  </div>
                  <div className="p-2 text-center">
                    {enNumberTo3DigPer(
                      chosenBundle.day.isVip ? i.priceVip ?? 0 : i.priceNormal
                    )}
                    <br />
                    تومان
                  </div>
                </div>
              ))}
            </>
          )}
          <Row>
            <Col md="6">
              تعداد افراد: {enDigit2Per(chosenBundle.volume.volume)}
            </Col>
            <Col md="6">
              {chosenBundle.volume.discountPercent == 0 ? (
                ""
              ) : (
                <>تخفیف: {enDigit2Per(chosenBundle.volume.discountPercent)} %</>
              )}
            </Col>
            <Col md="6">
              جمع فاکتور: {enNumberTo3DigPer(chosenBundle.calculatePrice)}
            </Col>
            <Col md="6">
              پیش پرداخت:{" "}
              {enNumberTo3DigPer(
                calcPerPay(chosenBundle.calculatePrice, prepayPercent)
              )}
            </Col>
          </Row>
          <hr />
        </div>
      )}
    </>
  )
}

function DetailsForm(p: {
  formSubmit: (data: GroupLeaderData) => void
  defaultValues: GroupLeaderData
  paymentAwaiting: boolean
}) {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<GroupLeaderData>({
    defaultValues: p.defaultValues
  })

  const router = useRouter()

  const [nationalCode, setNationalCode] = useState(p.defaultValues.nationalCode)
  const [natCodeError, setNatCodeError] = useState("")

  function verifyNationalCode(natCode: string, onSuccess?: () => void) {
    if (natCode.length == 10) {
      const verify = checkNationalCode(natCode)

      if (verify) {
        setNatCodeError("")
        onSuccess?.()
      } else {
        setNatCodeError("کد ملی صحیح نیست!")
      }
    } else {
      setNatCodeError("۱۰ رقم")
    }
  }

  return (
    <Form
      onSubmit={handleSubmit(
        /* on valid */
        (d) => {
          verifyNationalCode(nationalCode, () =>
            p.formSubmit({ ...d, nationalCode })
          )
        },
        /* On invalid */
        () => {
          verifyNationalCode(nationalCode)
        }
      )}
    >
      <Row>
        {/* group name */}
        <Controller
          name="groupName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Form.Group as={Col} md="12">
              <Form.Label>نام گروه</Form.Label>
              <Form.Control
                {...field}
                autoFocus
                isInvalid={errors.groupName != undefined}
              />
              <Form.Control.Feedback type="invalid">
                {errors.groupName?.type == "required" ? "لازم" : ""}
              </Form.Control.Feedback>
            </Form.Group>
          )}
        ></Controller>
        {/* group leader name */}
        <Controller
          name="groupLeaderName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Form.Group as={Col} md="6" className="mt-2">
              <Form.Label>نام سرگروه</Form.Label>
              <Form.Control
                {...field}
                isInvalid={errors.groupLeaderName != undefined}
              />
              <Form.Control.Feedback type="invalid">
                {errors.groupLeaderName?.type == "required" ? "لازم" : ""}
              </Form.Control.Feedback>
            </Form.Group>
          )}
        ></Controller>
        {/* national code */}
        <Form.Group as={Col} md="6" className="mt-2">
          <Form.Label>کد ملی</Form.Label>
          <PerNumberInput2
            value={nationalCode}
            onChange={(e: any) => {
              const v: string = e.target.value

              if (v.length > 10) return

              setNationalCode(v)
              verifyNationalCode(v)
            }}
            isInvalid={natCodeError != ""}
          />
          <Form.Control.Feedback type="invalid">
            {natCodeError}
          </Form.Control.Feedback>
        </Form.Group>
        {/* SUBMIT */}
        <div className="d-flex mt-3">
          <Button
            type="submit"
            className="flex-grow-1"
            disabled={p.paymentAwaiting}
          >
            تایید
          </Button>
          <Button
            type="button"
            variant="danger"
            className="me-2"
            disabled={p.paymentAwaiting}
            onClick={() => {
              localStorage.removeItem("chosen-bundle")
              router.push("/")
            }}
          >
            لغو سفارش
          </Button>
        </div>
      </Row>
    </Form>
  )
}

function Confirm({
  details,
  onModify,
  onSubmit
}: {
  details: GroupLeaderData
  onModify: () => void
  onSubmit: () => void
}) {
  return (
    <div>
      <Row>
        <Col md="12">
          <Form.Label>نام گروه</Form.Label>
          <p className="fw-bold">{details.groupName}</p>
        </Col>
        <Col md="6">
          <Form.Label>نام سرگروه</Form.Label>
          <p className="fw-bold">{details.groupLeaderName}</p>
        </Col>
        <Col md="6">
          <Form.Label>کد ملی</Form.Label>
          <p className="fw-bold">{enDigit2Per(details.nationalCode)}</p>
        </Col>
      </Row>

      <div className="d-flex mt-3 justify-content-between">
        <Button variant="warning" onClick={onModify}>
          اصلاح اطلاعات
        </Button>
        <Button variant="success" onClick={onSubmit} className="me-2">
          تایید اطلاعات و پرداخت
        </Button>
      </div>
    </div>
  )
}

type SubmitPageProps = {
  customer: Customer | null
  perPayPercent: number
  phoneNum: string
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  //: check auth
  const authToken = context.req.cookies["AUTH"]

  if (!authToken) {
    return {
      redirect: { destination: "/" },
      props: {}
    }
  }

  const isVerified = verifyTokenMain(authToken)

  if (isVerified == "expired" || isVerified == "invalid") {
    return {
      redirect: { destination: "/" },
      props: {}
    }
  }

  //: check db for customer info
  const prisma = getPrisma4MainPages()

  const customer = await prisma.customer.findFirst({
    where: { phone: isVerified.phone }
  })

  const appSetting = await prisma.appConfig.findFirst()

  if (appSetting == null) {
    return {
      props: {},
      redirect: {
        destination: "/not-ready"
      }
    }
  }

  return {
    props: {
      customer: customer,
      perPayPercent: appSetting.prePayDiscount,
      phoneNum: isVerified.phone
    } satisfies SubmitPageProps
  }
}
