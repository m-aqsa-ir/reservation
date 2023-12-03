import { enDigit2Per, fetchPost, perDigit2En } from "@/lib/lib";
import { showMessage } from "@/redux/messageSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import VerificationInput from "react-verification-input";
import Cookies from "js-cookie";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { PageContainer } from "@/components/PageContainer";
import { NewPerNumberInput } from "@/components/PerNumberInput";

function timeFormat(milliseconds: number) {
  const seconds = milliseconds / 1000

  const minute = Math.floor(seconds / 60)
  const second = seconds % 60

  return `${minute}:${second}`
}

export default function PhoneRegister(props: { CODE_EXPIRE_TIME: number }) {

  const [phoneNum, setPhoneNum] = useState('')
  const [phoneNumValid, setPhoneNumValid] = useState(true)
  const [clickSubmitOneTime, setClickSubmit] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [codeMode, setCodeMode] = useState(false)

  const [remainedTime, setRemainedTime] = useState(0)
  const [inputCode, setInputCode] = useState('')
  const [errorInCode, setErrorInCode] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const redirectAfterLogin = useSelector((s: RootState) => s.redirectAfterLogin)
  const dispatchMessage: AppDispatch = useDispatch()
  const router = useRouter()

  //: check if any product selected
  useEffect(() => {
    if (!router.isReady) return

    const chosenBundle = localStorage.getItem('chosen-bundle')

    if (chosenBundle == null && redirectAfterLogin.path == '') {
      router.push('/')
    }

  }, [router, redirectAfterLogin])

  function checkPhoneNumValid(clickSubmitOneTime: boolean, phoneNum: string) {
    if (!clickSubmitOneTime) {
      return true
    }
    return phoneNum != '' && phoneNum != null && /^09\d{9}$/.test(phoneNum)
  }

  function createInterval() {
    setRemainedTime(props.CODE_EXPIRE_TIME)
    const interval = setInterval(() => {
      setRemainedTime(rt => {
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
    const res = await fetchPost('/api/sms/send', { phoneNum })

    if (res.ok) {
      setCodeMode(true)
      createInterval()
    } else {
      dispatchMessage(showMessage({ message: 'خطای سرور', type: 'bg-warning' }))
    }
  }

  const handleVerifyCode = async (code: string) => {
    if (code.length < 5) {
      setErrorInCode(true)
      return
    }

    const res = await fetchPost('/api/sms/verify', { code: perDigit2En(code) })

    if (res.status == 401 || res.status == 400) {
      setErrorInCode(true)
      dispatchMessage(showMessage({ message: 'کد وارد شده صحیح نیست!' }))
    } else if (res.ok) {
      const token = await res.text()
      Cookies.set('AUTH', token, { path: '/' })

      if (redirectAfterLogin.path != '') {
        router.push(redirectAfterLogin.path)
      } else {
        router.push('/submit')
      }
    } else {
      dispatchMessage(showMessage({ message: 'خطای برنامه', type: 'bg-warning' }))
      console.log(res.status)
      console.log(await res.text())
    }
  }

  return (<PageContainer className="d-flex flex-column align-items-center">
    <Head>
      <title>ورود با شماره همراه</title>
    </Head>
    <Form
      onSubmit={e => {
        e.preventDefault()

        setClickSubmit(true)
        const valid = checkPhoneNumValid(true, phoneNum)
        setPhoneNumValid(valid)
        if (valid) {
          setShowModal(true)
        }
      }}
      className="d-flex flex-column align-items-center"
    >
      <Form.Group className="mt-3">
        {!codeMode && <Form.Label className="w-100 text-center fs-3">
          لطفا شماره خود را وارد نمایید.
        </Form.Label>}
        <NewPerNumberInput
          size="lg"
          className="text-center"
          value={phoneNum}
          disabled={codeMode}
          onSet={e => {
            setPhoneNum(e)
            setPhoneNumValid(
              checkPhoneNumValid(clickSubmitOneTime, e)
            )
          }}
          placeholder="۰۹۰۰۰۰۰۰۰۰۰۰"
          required
        />
      </Form.Group>
      <p className={`text-danger mt-2 ${phoneNumValid ? 'invisible' : 'visible'}`}>شماره صحیح نیست.</p>
      {!codeMode && <Button
        variant="primary"
        type="submit"
      >ارسال کد</Button>}
    </Form>

    {codeMode && <>
      <Form.Group className="mt-3">
        <Form.Label className="w-100 text-center fs-3">
          لطفا کد تایید را وارد نمایید.
        </Form.Label>
        <VerificationInput
          length={5}
          validChars="0-9۰-۹"
          inputProps={{
            inputMode: 'numeric'
          }}
          value={inputCode}
          onChange={e => {
            setErrorInCode(false)
            setInputCode(enDigit2Per(e))
          }}
          onComplete={handleVerifyCode}
          classNames={{
            container: 'ltr rounded',
            character: `rounded ${errorInCode ? 'border-danger' : ''}`
          }} />
      </Form.Group>

      <p className="mt-2">زمان باقی مانده: {enDigit2Per(timeFormat(remainedTime))}</p>

      <Button
        variant="success"
        onClick={() => handleVerifyCode(inputCode)}>
        تایید کد
      </Button>

      <Button variant="link" onClick={() => {
        setCodeMode(false)
        clearInterval(intervalRef.current!)
        setInputCode('')
      }}>اصلاح شماره</Button>

    </>}


    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
      <Modal.Body>
        آیا این شماره درست است: {enDigit2Per(phoneNum)}؟
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
  </PageContainer>)
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      CODE_EXPIRE_TIME: 1 * 1000 /* second */ * Number(process.env.SMS_EXPIRE_TIME!)
    }
  }
}