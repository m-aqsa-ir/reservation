import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import {
  day2Str,
  enDigit2Per,
  fetchPost,
  groupPer,
  nowPersianDateObject,
  numberTo3Dig
} from "@/lib/lib";
import { sections } from "@/lib/sections";
import { verifyTokenMain } from "@/lib/verifyToken";
import { showMessage } from "@/redux/messageSlice";
import { AppDispatch } from "@/redux/store";
import { PrismaClient } from "@prisma/client";
import type { Customer } from '@prisma/client'
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";

export default function Submit(props: { phoneNum: string, customer: Customer | null }) {

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
      phoneNum: props.phoneNum
    }

    const res = await fetchPost('/api/pay/start', body)

    if (res.ok) {
      localStorage.removeItem('chosen-bundle')
      router.push(await res.text())
    } else if (res.status == 403) { //: if selected volume is more that remained capacity
      dispatchMessage(showMessage({ message: "به علت تغییر ظرفیت، سفارش قابل ثبت نیست!" }))
      setTimeout(() => {
        localStorage.removeItem('chosen-bundle')
        router.push('/')
      }, 2000);
      return
    } else if (res.status == 401) { //: if day not selected
      localStorage.removeItem('chosen-bundle')
      router.push('/')
      return
    } else {
      dispatchMessage(showMessage({ message: 'خطای سرور', type: 'bg-warning' }))
      console.log(await res.text())
    }
  }

  return (<PageContainer>
    <SectionIndicators order={sectionOrder} sections={sections} />
    <hr />
    {chosenBundle == null ?
      <p>در حال بالا آمدن</p>
      :
      <>
        <ChosenPackageDay chosenBundle={chosenBundle} />

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


function ChosenPackageDay({ chosenBundle }: { chosenBundle: ChosenBundle }) {
  return <>
    {chosenBundle == null ?
      'loading' :
      <div>
        <p className="text-center fs-3">{enDigit2Per(day2Str(chosenBundle.day))} - {groupPer(chosenBundle.groupType)}</p>
        {
          chosenBundle.pac instanceof Array ?
            <>
              {chosenBundle.pac.map(i =>
                <div key={i.name} className="d-flex border rounded-3 mb-2 p-2">
                  <div className="flex-grow-1">
                    <p>{i.name}</p>
                    <p style={{ fontSize: '0.8rem' }}>{i.desc}</p>
                  </div>
                  <div className="p-2 text-center">
                    {numberTo3Dig(chosenBundle.day.isVip ? i.priceVip : i.price)}
                    <br />
                    تومان
                  </div>
                </div>)}
            </>
            : <>
              <div key={chosenBundle.pac.name} className="d-flex border rounded-3 mb-2 p-2">
                <div className="flex-grow-1">
                  <p className="fs-5">{chosenBundle.pac.name}</p>
                  <p>{chosenBundle.pac.desc}</p>
                </div>
                <div className="p-3 text-center">
                  {numberTo3Dig(chosenBundle.day.isVip ? chosenBundle.pac.priceVip : chosenBundle.pac.price)}
                  <br />
                  تومان
                </div>
              </div>
            </>
        }
        <div className="d-flex fs-5 mt-3 justify-content-between">
          <p>تعداد افراد: {enDigit2Per(chosenBundle.volume.volume)}
            &nbsp;- &nbsp; تخفیف: {enDigit2Per(chosenBundle.volume.discountPercent)} %</p>
          <p className="text-center">جمع فاکتور: {numberTo3Dig(chosenBundle.calculatePrice)}</p>
          <p>پیش پرداخت: {numberTo3Dig(chosenBundle.prepayAmount)}</p>
        </div>
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
        render={({ field }) => <Form.Group as={Col} md="6">
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
        render={({ field }) => <Form.Group as={Col} md="6">
          <Form.Label>کد ملی</Form.Label>
          <Form.Control {...field} isInvalid={!!errors.nationalCode} />
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
        <p className="fw-bold">{details.nationalCode}</p>
      </Col>
    </Row>

    <div className="d-flex mt-3 justify-content-between">
      <Button variant="warning" onClick={onModify}>اصلاح اطلاعات</Button>
      <Button variant="success" onClick={onSubmit}>
        تایید اطلاعات و پرداخت
      </Button>
    </div>
  </div>
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

  // TODO check previous orders from db

  return {
    props: {
      phoneNum: isVerified.phone,
      customer
    }
  }
}