import { fetchPost } from "@/lib/lib";
import { showMessage } from "@/redux/messageSlice";
import { AppDispatch } from "@/redux/store";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Button, Container, Form, Modal } from "react-bootstrap";
import { useDispatch } from "react-redux";
import VerificationInput from "react-verification-input";

function timeFormat(milliseconds: number) {
  const seconds = milliseconds / 1000

  const minute = Math.floor(seconds / 60)
  const second = seconds % 60

  return `${minute}:${second}`
}

// TODO read from env or db
const CODE_EXPIRE_TIME = 1 * 1000 /* second */ * 60 * 2

export default function PhoneRegister() {

  const [phoneNum, setPhoneNum] = useState('')
  const [phoneNumValid, setPhoneNumValid] = useState(true)
  const [clickSubmitOneTime, setClickSubmit] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [codeMode, setCodeMode] = useState(false)

  const [remainedTime, setRemainedTime] = useState(0)
  const [inputCode, setInputCode] = useState('')
  const [showSendCodeAgain, setShowSendCodeAgain] = useState(false)
  const [errorInCode, setErrorInCode] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const dispatchMessage: AppDispatch = useDispatch()
  const router = useRouter()

  //: check if any product selected
  useEffect(() => {
    if (!router.isReady) return

    const chosenBundle = localStorage.getItem('chosen-bundle')

    if (chosenBundle == null)
      router.push('/')

  }, [router])

  function checkPhoneNumValid(clickSubmitOneTime: boolean, phoneNum: string) {
    if (!clickSubmitOneTime) {
      return true
    }
    return phoneNum != '' && phoneNum != null && /^09\d{9}$/.test(phoneNum)
  }

  function createInterval() {
    setRemainedTime(CODE_EXPIRE_TIME)
    const interval = setInterval(() => {
      setRemainedTime(rt => {
        const newVal = rt - 1000
        if (newVal == 0) {
          clearInterval(interval)
          setShowSendCodeAgain(true)
        }
        return newVal
      })
    }, 1000)

    intervalRef.current = interval
  }

  const handleSendCode = async () => {
    const res = await fetchPost('/api/sms/send', { phoneNum })

    if (res.ok) {
      setCodeMode(true)
      createInterval()
    } else {
      dispatchMessage(showMessage({ message: 'خطای سرور', type: 'bg-warning' }))
    }
  }

  const handleVerifyCode = async () => {
    // TODO check must-be-length from ENV
    if (inputCode.length < 5) {
      setErrorInCode(true)
      return
    }

    const res = await fetchPost('/api/sms/verify', { code: inputCode })

    if (res.status == 401 || res.status == 400) {
      setErrorInCode(true)
      dispatchMessage(showMessage({ message: 'کد وارد شده صحیح نیست!' }))
    } else if (res.ok) {
      const token = await res.text()
      document.cookie = `AUTH=${token};`

      router.push('/submit')
    } else {
      dispatchMessage(showMessage({ message: 'خطای برنامه', type: 'bg-warning' }))
      console.log(res.status)
      console.log(await res.text())
    }
  }

  return (<Container className="mt-3 py-5 border rounded-3 d-flex flex-column align-items-center bg-white">
    <Image
      src="/images/verify-code.png"
      height={400}
      width={400}
      alt="verify code"
    />
    <Form.Group className="mt-3">
      {!codeMode && <Form.Label className="w-100 text-center fs-3">
        لطفا شماره خود را وارد نمایید.
      </Form.Label>}
      <Form.Control
        size="lg"
        className="text-center"
        type="number"
        value={phoneNum}
        disabled={codeMode}
        onChange={e => {
          setPhoneNum(e.target.value)
          setPhoneNumValid(
            checkPhoneNumValid(clickSubmitOneTime, e.target.value)
          )
        }}
        placeholder="09XXXXXXXXX"
        pattern=""
        required
      />
    </Form.Group>
    <p className={`text-danger ${phoneNumValid ? 'invisible' : 'visible'}`}>شماره صحیح نیست.</p>
    {!codeMode && <Button
      variant="primary"
      onClick={() => {
        setClickSubmit(true)
        const valid = checkPhoneNumValid(true, phoneNum)
        setPhoneNumValid(valid)
        if (valid) {
          setShowModal(true)
        }
      }}
    >ارسال کد</Button>}

    {codeMode && <>
      <Form.Group className="mt-3">
        <Form.Label className="w-100 text-center fs-3">
          لطفا کد تایید را وارد نمایید.
        </Form.Label>
        <VerificationInput
          length={5}
          validChars="0-9"
          value={inputCode}
          onChange={e => {
            setErrorInCode(false)
            setInputCode(e)
          }}
          classNames={{
            container: 'ltr rounded',
            character: `rounded pt-1 ${errorInCode ? 'border-danger' : ''}`
          }} />
      </Form.Group>

      <p className="mt-2">زمان باقی مانده: {timeFormat(remainedTime)}</p>

      {showSendCodeAgain
        ? <Button
          variant="warning"
          onClick={async e => {
            setShowSendCodeAgain(false)
            await handleSendCode()
            createInterval()
          }}>ارسال دوباره کد</Button>
        : <Button
          variant="primary"
          onClick={handleVerifyCode}>
          تایید کد
        </Button>
      }



      <Button variant="link" onClick={() => {
        setCodeMode(false)
        clearInterval(intervalRef.current!)
        setInputCode('')
      }}>اصلاح شماره</Button>

    </>}


    <Modal show={showModal} onHide={() => setShowModal(false)} style={{ fontFamily: 'ir-sans' }}>
      <Modal.Body>
        آیا این شماره درست است: {phoneNum}؟
      </Modal.Body>
      <Modal.Footer>
        <Button variant="warning" onClick={() => setShowModal(false)}>
          خیر
        </Button>
        <Button variant="success" onClick={async () => {
          setShowModal(false)
          await handleSendCode()
        }}>
          بله - ارسال کد
        </Button>
      </Modal.Footer>
    </Modal>
  </Container>)
}