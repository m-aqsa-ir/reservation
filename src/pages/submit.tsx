import { PageContainer } from "@/components/PageContainer";
import { PerNumberInput } from "@/components/PerNumberInput";
import { SectionIndicators } from "@/components/SectionIndicator";
import {
  day2Str,
  enDigit2Per,
  fetchPost,
  nowPersianDateObject,
  enNumberTo3DigPer
} from "@/lib/lib";
import { sections } from "@/lib/sections";
import { verifyTokenMain } from "@/lib/verifyToken";
import { showMessage } from "@/redux/messageSlice";
import { AppDispatch } from "@/redux/store";
import { ChosenBundle, GroupLeaderData, PayBundle } from "@/types";
import { PrismaClient } from "@prisma/client";
import type { Customer } from '@prisma/client'
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";


const calcPerPay = (value: number, percent: number) => (value * percent / 100)


export default function Submit(props: SubmitPageProps) {

  const [sectionOrder, setSectionOrder] = useState(2)
  const [details, setDetails] = useState<GroupLeaderData>(props.customer == null ? {
    groupName: '',
    groupLeaderName: '',
    nationalCode: ''
  } : {
    groupName: '',
    groupLeaderName: props.customer.name,
    nationalCode: props.customer.nationalCode
  })
  const [chosenBundle, setChosenBundle] = useState<ChosenBundle | null>(null)

  const router = useRouter()
  const dispatchMessage: AppDispatch = useDispatch()

  //: check if any product selected
  useEffect(() => {
    if (!router.isReady) return

    const localVal = localStorage.getItem('chosen-bundle')
    const cp: ChosenBundle | 'no-value' = localVal ? JSON.parse(localVal) : 'no-value'

    if (cp == 'no-value') {
      router.push('/')
      return
    }

    setChosenBundle(cp)

  }, [router])

  const handleSubmit = async () => {

    if (chosenBundle == null)
      return router.push('/')

    const now = nowPersianDateObject()

    const body: PayBundle = {
      ...chosenBundle!,
      ...details,
      reservedDate: now.format("YYYY/MM/DD"),
      reserveTimeTimestamp: now.toUnix(),
      phoneNum: props.customer.phone,
      prepayAmount: calcPerPay(chosenBundle.calculatePrice, props.perPayPercent)
    }

    const res = await fetchPost('/api/pay/start', body)

    if (res.ok) {
      localStorage.removeItem('chosen-bundle')
      router.push(await res.text())
    } else if (res.status == 403) { //: if selected volume is more that remained capacity
      dispatchMessage(showMessage({ message: (await res.text()) }))
      setTimeout(() => {
        localStorage.removeItem('chosen-bundle')
        router.push('/')
      }, 2000);
      return
    } else if ([404, 401].some(i => res.status == i)) { //: if day not selected 404 - unauthorized 401
      localStorage.removeItem('chosen-bundle')
      router.push('/')
      return
    } else {
      dispatchMessage(showMessage({ message: 'خطای سرور', type: 'bg-warning' }))
      console.log(await res.text())
    }
  }

  return (<PageContainer>
    <Head>
      <title>ثبت سفارش</title>
    </Head>
    <SectionIndicators order={sectionOrder} sections={sections} />
    <hr />
    {chosenBundle == null ?
      <p>در حال بالا آمدن</p>
      :
      <>
        <ChosenPackageDay chosenBundle={chosenBundle} prepayPercent={props.perPayPercent} />

        {sectionOrder == 2 ? <DetailsForm
          defaultValues={details}
          formSubmit={data => {
            setDetails(data)
            setSectionOrder(3)
          }}
        />
          :
          <Confirm
            details={details}
            onModify={() => {
              setSectionOrder(2)
            }}
            onSubmit={handleSubmit}
          />}
      </>}
  </PageContainer>)
}


function ChosenPackageDay({ chosenBundle, prepayPercent }: { chosenBundle: ChosenBundle, prepayPercent: number }) {
  const pac = chosenBundle.package
  return <>
    {chosenBundle == null ?
      'loading' :
      <div>
        <p className="text-center fs-4">{enDigit2Per(day2Str(chosenBundle.day)) + " " + chosenBundle.day.desc} - {chosenBundle.groupType}</p>
        <p className="fs-5">بسته انتخابی</p>
        {pac == null ? <></> : <div key={pac.name} className="d-flex border rounded-3 mb-2 p-2">
          <div className="flex-grow-1">
            <p className="fs-5">{pac.name}</p>
            <p>{pac.desc}</p>
          </div>
          <div className="p-3 text-center">
            {enNumberTo3DigPer(chosenBundle.day.isVip ? (pac.priceVip ?? 0) : pac.priceNormal)}
            <br />
            تومان
          </div>
        </div>}
        {chosenBundle.services.length == 0 ? <></> : <>
          <p className="fs-5">خدمت های انتخاب شده</p>
          {
            chosenBundle.services.map(i =>
              <div key={i.name} className="d-flex border rounded-3 mb-2 p-2">
                <div className="flex-grow-1">
                  <p>{i.name}</p>
                  <p style={{ fontSize: '0.8rem' }}>{i.desc}</p>
                </div>
                <div className="p-2 text-center">
                  {enNumberTo3DigPer(chosenBundle.day.isVip ? (i.priceVip ?? 0) : i.priceNormal)}
                  <br />
                  تومان
                </div>
              </div>)
          }
        </>}
        <Row>
          <Col md="6">
            تعداد افراد: {enDigit2Per(chosenBundle.volume.volume)}
          </Col>
          <Col md="6">
            {chosenBundle.volume.discountPercent == 0 ?
              '' :
              <>تخفیف: {enDigit2Per(chosenBundle.volume.discountPercent)} %</>}
          </Col>
          <Col md="6">
            جمع فاکتور: {enNumberTo3DigPer(chosenBundle.calculatePrice)}
          </Col>
          <Col md="6">
            پیش پرداخت: {enNumberTo3DigPer(calcPerPay(chosenBundle.calculatePrice, prepayPercent))}
          </Col>
        </Row>
        <hr />
      </div>
    }
  </>
}

function DetailsForm(p: { formSubmit: (data: GroupLeaderData) => void, defaultValues: GroupLeaderData }) {
  const { control, handleSubmit, formState: { errors } } = useForm<GroupLeaderData>({
    defaultValues: p.defaultValues
  })

  const router = useRouter()

  return <Form onSubmit={handleSubmit(p.formSubmit)}>
    <Row>
      <Controller
        name="groupName"
        control={control}
        rules={{ required: true }}
        render={({ field }) => <Form.Group as={Col} md="12">
          <Form.Label>نام گروه</Form.Label>
          <Form.Control {...field} isInvalid={errors.groupName != undefined} />
          <Form.Control.Feedback type="invalid">
            {errors.groupName?.type == 'required' ? 'لازم' : ''}
          </Form.Control.Feedback>
        </Form.Group>}
      ></Controller>

      <Controller
        name="groupLeaderName"
        control={control}
        rules={{ required: true }}
        render={({ field }) => <Form.Group as={Col} md="6" className="mt-2">
          <Form.Label>نام سرگروه</Form.Label>
          <Form.Control {...field} isInvalid={errors.groupLeaderName != undefined} />
          <Form.Control.Feedback type="invalid">
            {errors.groupLeaderName?.type == 'required' ? 'لازم' : ''}
          </Form.Control.Feedback>
        </Form.Group>}
      ></Controller>

      <Controller
        name="nationalCode"
        control={control}
        rules={{ required: true, pattern: /^\d{10}$/ }}
        render={({ field }) => <Form.Group as={Col} md="6" className="mt-2">
          <Form.Label>کد ملی</Form.Label>
          <PerNumberInput {...field} isInvalid={!!errors.nationalCode} />
          <Form.Control.Feedback type="invalid">
            {errors.nationalCode?.type == 'required' ? 'لازم'
              : errors.nationalCode?.type == 'pattern' ? '۱۰ رقم با اعداد انگلیسی' : ''}
          </Form.Control.Feedback>
        </Form.Group>}
      ></Controller>
      <div className="d-flex mt-3">
        <Button type="submit" className="flex-grow-1">تایید</Button>
        <Button
          type="button"
          variant="danger"
          className="me-2"
          onClick={() => {
            localStorage.removeItem('chosen-bundle')
            router.push('/')
          }}
        >لغو سفارش</Button>
      </div>
    </Row>
  </Form>
}

function Confirm({ details, onModify, onSubmit }: { details: GroupLeaderData, onModify: () => void, onSubmit: () => void }) {
  return <div>

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
      <Button variant="warning" onClick={onModify}>اصلاح اطلاعات</Button>
      <Button variant="success" onClick={onSubmit} className="me-2">
        تایید اطلاعات و پرداخت
      </Button>
    </div>
  </div>
}


type SubmitPageProps = {
  customer: Customer,
  perPayPercent: number
}


export const getServerSideProps: GetServerSideProps = async (context) => {
  //: check auth
  const authToken = context.req.cookies['AUTH']

  if (!authToken) {
    return {
      redirect: { destination: '/' },
      props: {}
    }
  }

  const isVerified = verifyTokenMain(authToken)

  if (isVerified == 'expired' || isVerified == 'invalid') {
    return {
      redirect: { destination: '/' },
      props: {}
    }
  }

  //: check db for customer info
  const prisma = new PrismaClient()

  const customer = await prisma.customer.findFirst({
    where: { phone: isVerified.phone }
  })

  const appSetting = await prisma.appConfig.findFirst()

  if (appSetting == null) {
    return {
      props: {},
      redirect: {
        destination: '/not-ready'
      }
    }
  }

  return {
    props: {
      customer: customer!,
      perPayPercent: appSetting.prePayDiscount
    } satisfies SubmitPageProps
  }
}