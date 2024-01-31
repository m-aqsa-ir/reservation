import { PageContainer } from "@/components/PageContainer"
import { PerNumberInput2 } from "@/components/PerNumberInput"
import { SectionIndicators } from "@/components/SectionIndicator"
import { enDigit2Per, fetchPost, perDigit2En } from "@/lib/lib"
import { LocalStorageItems } from "@/lib/localManager"
import { sections } from "@/lib/sections"
import { checkNationalCode } from "@/lib/verifyNationalCode"
import { showMessage } from "@/redux/messageSlice"
import { AppDispatch } from "@/redux/store"
import { GetServerSideProps } from "next"
import Head from "next/head"
import Image from "next/image"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import { Button, Col, Form, Modal, Row } from "react-bootstrap"
import { useDispatch } from "react-redux"
import VerificationInput from "react-verification-input"
import { SendCodeApi } from "./api/v2/send-code"
import { VerifyTokenApi } from "./api/v2/verify-code"

function timeFormat(milliseconds: number) {
  const seconds = milliseconds / 1000

  const minute = Math.floor(seconds / 60)
  const second = seconds % 60

  return enDigit2Per(
    `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`
  )
}

export default function PhoneRegister(props: { CODE_EXPIRE_TIME: number }) {
  const [data, setData] = useState({
    phone: "",
    natCode: "",
    name: ""
  })

  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState("phone" as "phone" | "code" | "info")

  const [loginToken, setLoginToken] = useState("")

  const [remainedTime, setRemainedTime] = useState(0)

  const [inputCode, setInputCode] = useState("")
  const [errorInCode, setErrorInCode] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const dispatchMessage: AppDispatch = useDispatch()
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const order = LocalStorageItems.order.load()

    if (order == null) {
      router.push("_select")
    }
  }, [router.isReady])

  function createInterval() {
    setRemainedTime(props.CODE_EXPIRE_TIME)
    const interval = setInterval(() => {
      setRemainedTime((rt) => {
        const newVal = rt - 1000
        if (newVal == 0) {
          clearInterval(interval)
        }
        return newVal
      })
    }, 1000)

    intervalRef.current = interval
  }

  const handleSendCode = async () => {
    const res = await fetchPost("/api/v2/send-code", data satisfies SendCodeApi)

    if (res.ok) {
      const body: { token: string } = await res.json()

      setLoginToken(body.token)
      setMode("code")
      createInterval()
    } else {
      dispatchMessage(showMessage({ message: "خطای سرور", type: "bg-warning" }))
    }
  }

  const handleVerifyCode = async (code: string) => {
    if (code.length < 5) {
      setErrorInCode(true)
      return
    }

    const res = await fetchPost("/api/v2/verify-code", {
      token: loginToken,
      rand: perDigit2En(code)
    } satisfies VerifyTokenApi)

    if (res.status == 400) {
      setErrorInCode(true)
      dispatchMessage(showMessage({ message: "کد وارد شده صحیح نیست!" }))
    } else if (res.status == 403) {
      setMode("phone")
      dispatchMessage(showMessage({ message: "اعتبار کد منقضی شده است." }))
    } else if (res.ok) {
      const body = await res.json()

      // Cookies.set("AUTH", body.token, { path: "/" })

      setData((d) => ({
        ...d,
        name: body.name,
        natCode: body.natCode
      }))

      setMode("info")
    } else {
      dispatchMessage(
        showMessage({ message: "خطای برنامه", type: "bg-warning" })
      )
      console.log(res.status)
      console.log(await res.text())
    }
  }

  function handleConfirmInfo(natCode: string, name: string) {}

  return (
    <PageContainer className="d-flex flex-column align-items-center ">
      <Head>
        <title>ورود با شماره همراه</title>
      </Head>

      <SectionIndicators sections={sections} order={2} />

      <Row className="mt-5">
        <Col lg="6" sm="12">
          {mode != "info" && (
            <EnterPhoneNat
              enabled={mode == "phone"}
              onEnd={(phone) => {
                setData((i) => ({ ...i, phone }))
                setShowModal(true)
              }}
            />
          )}

          {mode == "code" && (
            <div className="tw-flex tw-flex-col tw-justify-center tw-items-center">
              <Form.Label className="w-100 text-center fs-5">
                لطفا کد تایید را وارد نمایید.
              </Form.Label>
              <VerificationInput
                length={5}
                validChars="0-9۰-۹"
                inputProps={{
                  inputMode: "numeric"
                }}
                value={inputCode}
                onChange={(e) => {
                  setErrorInCode(false)
                  setInputCode(enDigit2Per(e))
                }}
                onComplete={handleVerifyCode}
                classNames={{
                  container: "ltr rounded",
                  character: `rounded ${errorInCode ? "border-danger" : ""}`
                }}
              />

              <p className="mt-2">
                زمان باقی مانده: {timeFormat(remainedTime)}
              </p>

              <Button
                variant="success"
                onClick={() => handleVerifyCode(inputCode)}
              >
                تایید کد
              </Button>

              <Button
                variant="link"
                onClick={() => {
                  setMode("phone")
                  clearInterval(intervalRef.current!)
                  setInputCode("")
                }}
              >
                اصلاح شماره
              </Button>
            </div>
          )}

          {mode == "info" && (
            <EnterNameNat
              name={data.name}
              natCode={data.natCode}
              onEnd={handleConfirmInfo}
            />
          )}
        </Col>
        <Col
          lg="6"
          sm="12"
          className="tw-flex tw-justify-center tw-items-center"
        >
          <Image src="/art-2.jpg" alt="" width={300} height={300} />
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body>
          آیا این شماره درست است: {enDigit2Per(data.phone)}؟
        </Modal.Body>
        <Modal.Footer>
          <Button variant="warning" onClick={() => setShowModal(false)}>
            خیر
          </Button>
          <Button
            variant="success"
            autoFocus
            onClick={async () => {
              setShowModal(false)
              await handleSendCode()
            }}
          >
            بله - ارسال کد
          </Button>
        </Modal.Footer>
      </Modal>
    </PageContainer>
  )
}

function EnterPhoneNat(p: {
  enabled: boolean
  onEnd: (phone: string) => void
}) {
  const [submitted, setSubmitted] = useState(false)

  const [phoneNum, setPhoneNum] = useState({
    val: "",
    err: false
  })

  function checkPhoneNumValid(phoneNum: string) {
    return phoneNum != "" && phoneNum != null && /^09\d{9}$/.test(phoneNum)
  }

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault()

        const phoneValid = checkPhoneNumValid(phoneNum.val)

        if (!phoneValid) {
          setPhoneNum((i) => ({
            val: i.val,
            err: !phoneValid
          }))

          setSubmitted(true)
        } else {
          p.onEnd(phoneNum.val)
        }
      }}
      className="d-flex flex-column align-items-center"
    >
      <Form.Group className="w-100">
        {p.enabled && (
          <Form.Label className="w-100 my-3">شماره همراه</Form.Label>
        )}
        <PerNumberInput2
          className="text-center"
          value={phoneNum.val}
          disabled={!p.enabled}
          onChange={(event: any) => {
            const e = event.target.value
            if (e.length > 11) return

            setPhoneNum((i) => ({
              val: e,
              err: submitted && !checkPhoneNumValid(e)
            }))
          }}
          placeholder="۰۹۰۰۰۰۰۰۰۰۰۰"
          isInvalid={phoneNum.err}
        />
        <p className={`text-danger ${!phoneNum.err ? "invisible" : "visible"}`}>
          شماره صحیح نیست.
        </p>
      </Form.Group>

      {p.enabled && (
        <Button variant="primary" type="submit" className="mt-4 w-100">
          ارسال کد
        </Button>
      )}
    </Form>
  )
}

function EnterNameNat(p: {
  onEnd: (natCode: string, name: string) => void
  name: string
  natCode: string
}) {
  const [submitted, setSubmitted] = useState(false)

  const [natCode, setNatCode] = useState({
    val: p.name,
    err: false
  })

  const [name, setName] = useState({
    val: p.natCode,
    err: false
  })

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault()

        const natCodeValid = checkNationalCode(natCode.val, false)
        const nameValid = name.val.length > 5

        if (!(natCodeValid && nameValid)) {
          setNatCode((i) => ({
            val: i.val,
            err: !natCodeValid
          }))

          setName({
            val: name.val,
            err: !nameValid
          })

          setSubmitted(true)
        } else {
          p.onEnd(natCode.val, name.val)
        }
      }}
      className="d-flex flex-column align-items-center"
    >
      <Form.Group className="w-100">
        <Form.Label className="w-100 my-3">نام</Form.Label>

        <Form.Control
          className="text-center"
          autoFocus
          value={name.val}
          onChange={(e) => {
            setName({
              val: e.target.value,
              err: submitted && e.target.value.length < 5
            })
          }}
          isInvalid={name.err}
        />
        <p className={`text-danger ${!name.err ? "invisible" : "visible"}`}>
          کوتاه است.
        </p>
      </Form.Group>

      <Form.Group className="w-100">
        <Form.Label className="w-100 my-3">کد ملی</Form.Label>
        <PerNumberInput2
          className="text-center"
          value={natCode.val}
          autoFocus
          onChange={(event: any) => {
            const e = event.target.value
            if (e.length > 10) return

            setNatCode((i) => ({
              ...i,
              val: e,
              err: !checkNationalCode(e, false)
            }))
          }}
          isInvalid={natCode.err}
        />

        <p className={`text-danger ${!natCode.err ? "invisible" : "visible"}`}>
          کد ملی صحیح نیست.
        </p>
      </Form.Group>

      <Button variant="primary" type="submit" className="mt-4 w-100">
        تایید اطلاعات
      </Button>
    </Form>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      CODE_EXPIRE_TIME:
        1 * 1000 /* second */ * Number(process.env.SMS_EXPIRE_TIME!)
    }
  }
}
