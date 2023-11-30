import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { NewPerNumberInput, } from "@/components/PerNumberInput";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { enDigit2Per, fetchPost } from "@/lib/lib";
import { mdiClose, mdiPlus } from "@mdi/js";
import Icon from "@mdi/react";
import { AppConfig } from "@prisma/client";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { CSSProperties, ChangeEventHandler, ReactNode, useState } from "react";
import { Button, ButtonGroup, Col, Dropdown, Form, Row, Toast } from "react-bootstrap";
import { useDispatch } from "react-redux";


function toEditAppConfig(a: AppConfig) {
  return {
    ...a,
    prePayDiscount: String(a.prePayDiscount),
    daysBeforeDayToReserve: String(a.daysBeforeDayToReserve),
    managerPhoneNum: a.managerPhoneNum.trim() == '' ? [] : a.managerPhoneNum.split(','),
    mangerBaleId: a.mangerBaleId.trim() == '' ? [] : a.mangerBaleId.split(','),
    dayBeforeDayToCancel: String(a.dayBeforeDayToCancel)
  }
}

type EditAppConfig = ReturnType<typeof toEditAppConfig>


export default function AdminSettingsPage(P: AdminSettingsProps) {
  const [appSetting, setAppSetting] = useState<EditAppConfig>(toEditAppConfig(P.appSetting))
  const [showToast, setShowToast] = useState<null | { text: string, variant?: string }>(null)
  function showToastInSeconds(k: { text: string, variant?: string }) {
    setShowToast(k)
    setTimeout(() => setShowToast(null), 1500);
  }

  const [newPhoneNum, setNewPhoneNum] = useState('')
  const [newBaleId, setNewBaleId] = useState('')



  const router = useRouter()
  const dispatch = useDispatch()

  async function handleSubmit() {

    const body: AppConfig = {
      ...appSetting,
      prePayDiscount: Number(appSetting.prePayDiscount),
      daysBeforeDayToReserve: Number(appSetting.daysBeforeDayToReserve),
      managerPhoneNum: appSetting.managerPhoneNum.join(','),
      mangerBaleId: appSetting.mangerBaleId.join(','),
      dayBeforeDayToCancel: Number(appSetting.dayBeforeDayToCancel)
    }

    const res = await fetchPost('/api/admin/change-settings', body)

    if (res.ok) {
      showToastInSeconds({ text: 'ثبت تغییرات موفقیت آمیز بود' })
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
            value={appSetting.prePayDiscount}
            pattern="[1-9][0-9]?|0[1-9]?|100"
            onSet={e => setAppSetting(i => ({ ...i, prePayDiscount: e }))}
            isNum
          />

          <Col md="6" />

          <SettingItem label="ثبت نام تا  چند روز پیش ممکن است" isNum
            value={appSetting.daysBeforeDayToReserve}
            onSet={e => setAppSetting(i => ({ ...i, daysBeforeDayToReserve: e }))} />

          <SettingItem label="لغو تا چند روز قبل ممکن است" isNum
            value={appSetting.dayBeforeDayToCancel}
            onSet={e => setAppSetting(i => ({ ...i, dayBeforeDayToCancel: e }))} />

          <SettingItem label="کد تجاری درگاه پرداخت"
            value={appSetting.paymentPortalMerchantId}
            onSet={e => setAppSetting(i => ({ ...i, paymentPortalMerchantId: e }))} />

          <SettingItemCheck label="برنامه در حالت تست (پرداخت)"
            checked={appSetting.appTestMode}
            onChange={e => setAppSetting(i => ({ ...i, appTestMode: !i.appTestMode }))} />

          <Col md="3">
            شماره همراه مدیران
          </Col>

          <Col md="3" className="mb-2">
            <Dropdown as={ButtonGroup}>
              <NewPerNumberInput
                placeholder={`${enDigit2Per(appSetting.managerPhoneNum.length)} شماره`}
                className="tw-rounded-s-none"
                value={newPhoneNum} style={{ direction: 'ltr' }}
                onSet={s => setNewPhoneNum(s)} />

              <Button
                style={{ borderRadius: 0 }}
                variant="success"
                onClick={() => {
                  if (!/09[0-9]{9}/.test(newPhoneNum)) {
                    return showToastInSeconds({ text: 'شماره صحیح نیست', variant: 'danger' })
                  }

                  if (appSetting.managerPhoneNum.includes(newPhoneNum)) {
                    return showToastInSeconds({ text: 'شماره تکراری', variant: 'danger' })
                  }

                  setAppSetting(x => ({ ...x, managerPhoneNum: [...x.managerPhoneNum, newPhoneNum] }))
                  setNewPhoneNum('')
                }}>
                <Icon path={mdiPlus} size={1} />
              </Button>

              <Dropdown.Toggle
                id="manager-bale-id"
                style={{
                  borderStartStartRadius: 0,
                  borderEndStartRadius: 0,

                  borderEndEndRadius: '.25rem',
                  borderStartEndRadius: '.25rem',
                }}
              />

              <Dropdown.Menu>
                {appSetting.managerPhoneNum.map(i =>
                  <Dropdown.Item key={i} >
                    {enDigit2Per(i)}
                    <span onClick={() =>
                      setAppSetting(x => ({ ...x, managerPhoneNum: x.managerPhoneNum.filter(j => j != i) }))
                    }>
                      <Icon path={mdiClose} className="text-danger" size={1} />
                    </span>
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <SettingItemCheck label="ارسال پیامک برای مدیران"
            checked={appSetting.doSendSmsToManager}
            onChange={e => setAppSetting(i => ({ ...i, doSendSmsToManager: !i.doSendSmsToManager }))}
          />

          <Col md="3">
            شناسه بله مدیران
          </Col>

          <Col md="3" className="mb-2">
            <Dropdown as={ButtonGroup}>
              <Form.Control
                placeholder={`${enDigit2Per(appSetting.mangerBaleId.length)} شناسه`}
                className="tw-rounded-s-none"
                value={newBaleId} style={{ direction: 'ltr' }}
                onChange={e => setNewBaleId(e.target.value)} />

              <Button
                style={{ borderRadius: 0 }}
                variant="success"
                onClick={() => {
                  if (!/[a-zA-Z_][a-zA-Z_0-9]{3,}/.test(newBaleId)) {
                    return showToastInSeconds({ text: 'شماره صحیح نیست', variant: 'danger' })
                  }

                  if (appSetting.mangerBaleId.includes(newBaleId)) {
                    return showToastInSeconds({ text: 'شماره تکراری', variant: 'danger' })
                  }

                  setAppSetting(x => ({ ...x, mangerBaleId: [...x.mangerBaleId, newBaleId] }))
                  setNewBaleId('')
                }}>
                <Icon path={mdiPlus} size={1} />
              </Button>

              <Dropdown.Toggle
                id="manager-phone-num"
                style={{
                  borderStartStartRadius: 0,
                  borderEndStartRadius: 0,

                  borderEndEndRadius: '.25rem',
                  borderStartEndRadius: '.25rem',
                }}
              />

              <Dropdown.Menu>
                {appSetting.mangerBaleId.map(i =>
                  <Dropdown.Item key={i} >
                    {enDigit2Per(i)}
                    <span onClick={() =>
                      setAppSetting(x => ({ ...x, mangerBaleId: x.mangerBaleId.filter(j => j != i) }))
                    }>
                      <Icon path={mdiClose} className="text-danger" size={1} />
                    </span>
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </Col>

          <SettingItemCheck label="ارسال پیام برای مدیر در بله"
            checked={appSetting.doSendMessageToManagerInBale}
            onChange={e => setAppSetting(i => ({ ...i, doSendMessageToManagerInBale: !i.doSendMessageToManagerInBale }))}
          />

          <Col md="3">
            <Form.Label>قوانین و ضوابط برای نمایش در پایین بلیط</Form.Label>
          </Col>
          <Col md="9">
            <textarea
              className="form-control" rows={4}
              onChange={e => setAppSetting({ ...appSetting, ticketTermsAndServices: e.target.value })}
              value={appSetting.ticketTermsAndServices} />
          </Col>

          <Col md="12" className="d-flex tw-justify-center">
            <Button
              type="submit"
              className="mt-4 tw-w-4/5 rounded-4"
              variant="success">ثبت تغییرات</Button>
          </Col>
        </Row>
      </Form>
    </div>

    <Toast
      show={showToast != null}
      onClose={() => setShowToast(null)}
      className="fixed-bottom m-2"
      bg={showToast?.variant ?? 'success'}>
      {showToast && <>
        <Toast.Body className="text-white">
          {showToast.text}
        </Toast.Body>
      </>}
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
        <NewPerNumberInput value={P.value}
          onSet={P.onSet}
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