import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { NewPerNumberInput, perNumStr2Num, } from "@/components/PerNumberInput";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { enDigit2Per, fetchPost, perDigit2En } from "@/lib/lib";
import { AppConfig } from "@prisma/client";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { CSSProperties, ChangeEventHandler, ReactNode, useState } from "react";
import { Button, Col, Form, Row, Toast } from "react-bootstrap";
import { useDispatch } from "react-redux";


function toEditAppConfig(a: AppConfig) {
  return {
    ...a,
    prePayDiscount: enDigit2Per(a.prePayDiscount),
    daysBeforeDayToReserve: enDigit2Per(a.daysBeforeDayToReserve),
    managerPhoneNum: enDigit2Per(a.managerPhoneNum)
  }
}

type EditAppConfig = ReturnType<typeof toEditAppConfig>


export default function AdminSettingsPage(P: AdminSettingsProps) {
  const [appSetting, setAppSetting] = useState<EditAppConfig>(toEditAppConfig(P.appSetting))
  const [showToast, setShowToast] = useState(false)

  const router = useRouter()
  const dispatch = useDispatch()

  async function handleSubmit() {
    const body: AppConfig = {
      ...appSetting,
      prePayDiscount: perNumStr2Num(appSetting.prePayDiscount),
      daysBeforeDayToReserve: perNumStr2Num(appSetting.daysBeforeDayToReserve),
      managerPhoneNum: perDigit2En(appSetting.managerPhoneNum)
    }

    const res = await fetchPost('/api/admin/change-settings', body)

    if (res.ok) {
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
      }, 2000);
    } else {
      resHandleNotAuth(res, dispatch, router);
    }
  }

  return <AdminPagesContainer currentPage="settings">
    <Head>
      <title>تنظیمات</title>
    </Head>

    <div className="rounded-4 bg-white p-3 border">
      <Form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}>
        <Row className="align-items-center">
          <SettingItem label="درصد پیش پرداخت"
            value={appSetting.prePayDiscount} pattern="[۱-۹][۰-۹]?|۰[۱-۹]?|۱۰۰"
            onSet={e => setAppSetting(i => ({ ...i, prePayDiscount: e }))}
            isNum min={1} max={99}
          />
          <SettingItem label="ثبت نام تا  چند روز پیش از روز مدنظر ممکن است" isNum
            value={appSetting.daysBeforeDayToReserve}
            onSet={e => setAppSetting(i => ({ ...i, daysBeforeDayToReserve: e }))} />

          <SettingItem label="شماره مدیر" isNum
            value={appSetting.managerPhoneNum}
            pattern="^۰۹[۰-۹]{9}$"
            onSet={e => setAppSetting(i => ({
              ...i, managerPhoneNum: e
            }))} />

          <SettingItemCheck label="ارسال پیامک برای مدیر"
            checked={appSetting.doSendSmsToManager}
            onChange={e => setAppSetting(i => ({ ...i, doSendSmsToManager: !i.doSendSmsToManager }))}
          />

          <SettingItem label="شناسه بله مدیر"
            value={appSetting.mangerBaleId}
            onSet={e => setAppSetting(i => ({ ...i, mangerBaleId: e }))}
          />

          <SettingItemCheck label="ارسال پیام برای مدیر در بله"
            checked={appSetting.doSendMessageToManagerInBale}
            onChange={e => setAppSetting(i => ({ ...i, doSendMessageToManagerInBale: !i.doSendMessageToManagerInBale }))}
          />

          <Col className="d-flex tw-justify-center">
            <Button
              type="submit"
              className="mt-4 tw-w-4/5 rounded-4"
              variant="success">ثبت تغییرات</Button>
          </Col>
        </Row>
      </Form>
    </div>

    <Toast show={showToast} onClose={() => setShowToast(false)} className="fixed-bottom m-3" bg="success">
      <Toast.Header className="tw-justify-between">
        پیام سیستم
      </Toast.Header>
      <Toast.Body>
        ثبت تغییرات موفقیت آمیز بود
      </Toast.Body>
    </Toast>
  </AdminPagesContainer>
}

function SettingItem(P: {
  label: string,
  value: string,
  onSet: (v: string) => void,
  isNum?: boolean,
  min?: number,
  max?: number,
  required?: boolean,
  pattern?: string,
  style?: CSSProperties
}) {
  return <SettingItemContainer label={P.label}>
    {P.isNum ?
      <>

        {/* <PerNumberInput
        value={P.value}
        onChange={P.onChange}
        min={P.min}
        max={P.max}
        required={P.required}
        pattern={P.pattern}
      /> */}

        <NewPerNumberInput value={P.value}
          onSet={P.onSet}
          min={P.min}
          max={P.max}
          required={P.required}
          pattern={P.pattern}
        />
      </>


      :
      <Form.Control
        value={P.value}
        onChange={e => P.onSet(e.target.value)}
        required={P.required}
        pattern={P.pattern}
        style={P.style}
      />
    }
  </SettingItemContainer>
}

function SettingItemCheck(P: {
  label: string,
  checked: boolean,
  onChange: ChangeEventHandler<HTMLInputElement>
}) {
  return <SettingItemContainer label={P.label}>
    <Form.Check
      checked={P.checked}
      onChange={P.onChange}
    />
  </SettingItemContainer>
}

function SettingItemContainer(P: { children: ReactNode, label: string }) {
  return <>
    <Col md="6" lg="3">
      <Form.Label>{P.label}</Form.Label>
    </Col>
    <Col md="6" lg="3" className="mb-2">
      {P.children}
    </Col>
  </>
}

type AdminSettingsProps = {
  appSetting: AppConfig
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess(prisma) {

      const appSetting = await prisma.appConfig.findFirst()

      return {
        props: {
          appSetting: appSetting!
        }
      }

    }
  })
}