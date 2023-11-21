import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { PerNumberInput } from "@/components/PerNumberInput";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { fetchPost } from "@/lib/lib";
import { AppConfig } from "@prisma/client";
import { GetServerSideProps } from "next";
import { ChangeEventHandler, useState } from "react";
import { Button, Col, Form, Row, Toast } from "react-bootstrap";


function toEditAppConfig(a: AppConfig) {
  return {
    ...a,
    prePayDiscount: String(a.prePayDiscount),
    daysBeforeDayToReserve: String(a.daysBeforeDayToReserve)
  }
}

type EditAppConfig = ReturnType<typeof toEditAppConfig>


export default function AdminSettingsPage(P: AdminSettingsProps) {
  const [appSetting, setAppSetting] = useState<EditAppConfig>(toEditAppConfig(P.appSetting))

  const [showToast, setShowToast] = useState(false)



  async function handleSubmit() {
    const body: AppConfig = {
      ...appSetting,
      prePayDiscount: Number(appSetting.prePayDiscount),
      daysBeforeDayToReserve: Number(appSetting.daysBeforeDayToReserve)
    }

    const res = await fetchPost('/api/admin/change-settings', body)

    if (res.ok) {
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
      }, 2000);
    }
  }

  return <AdminPagesContainer currentPage="settings">

    <div className="rounded-4 bg-white p-3 border">
      <Form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}>
        <Row className="align-items-center">
          <SettingItem label="درصد پیش پرداخت"
            value={appSetting.prePayDiscount}
            onChange={e => setAppSetting(i => ({ ...i, prePayDiscount: e.target.value }))}
            isNum min={1} max={99}
          />
          <SettingItem label="ثبت نام تا  چند روز پیش از روز مدنظر ممکن است" isNum min={0} max={100}
            value={appSetting.daysBeforeDayToReserve}
            onChange={e => setAppSetting(i => ({ ...i, daysBeforeDayToReserve: e.target.value }))} />

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
  onChange: ChangeEventHandler<HTMLInputElement>,
  isNum?: boolean,
  min?: number,
  max?: number,
  required?: boolean
}) {
  return <>
    <Col md="6" lg="3">
      <Form.Label>{P.label}</Form.Label>
    </Col>
    <Col md="6" lg="3" className="mb-2">
      {P.isNum ?
        <PerNumberInput
          value={P.value}
          onChange={P.onChange}
          min={P.min}
          max={P.max}
          required={P.required}
        />
        :
        <Form.Control
          value={P.value}
          onChange={P.onChange}
          required={P.required}
        />
      }
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