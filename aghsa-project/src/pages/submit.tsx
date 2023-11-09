import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { dayCapToStr, enDigitToPer, fetchPost, groupPer, nowPerDateObject } from "@/lib/lib";
import { sections } from "@/lib/sections";
import { verifyToken } from "@/lib/verifyToken";
import { ChosenBundle, GroupLeaderData, PayBundle } from "@/types";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";

export default function Submit(props: { phoneNum: string }) {

  const [sectionOrder, setSectionOrder] = useState(2)
  const [details, setDetails] = useState<GroupLeaderData>({
    groupName: '',
    groupLeaderName: '',
    nationalCode: ''
  })
  const router = useRouter()

  const [chosenBundle, setChosenBundle] = useState<ChosenBundle | null>(null)


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

    const now = nowPerDateObject()

    const body: PayBundle = {
      ...chosenBundle!,
      ...details,
      reservedDate: now.format("YYYY/MM/DD"),
      reserveTimeTimestamp: now.toUnix(),
      phoneNum: props.phoneNum
    }

    const res = fetchPost('/api/pay', body)

    //: TODO
    localStorage.removeItem('chosen-bundle')
    localStorage.setItem('pay-bundle', JSON.stringify(body))

    router.push('/ticket')
  }

  return (<PageContainer>
    <SectionIndicators order={sectionOrder} sections={sections} />
    <hr />
    <ChosenPackageDay chosenBundle={chosenBundle!} />

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


  </PageContainer>)
}

function ChosenPackageDay({ chosenBundle }: { chosenBundle: ChosenBundle }) {


  return (<>{chosenBundle == null ? 'loading' : <div>
    <p className="text-center fs-3">{enDigitToPer(dayCapToStr(chosenBundle.day))} - {groupPer(chosenBundle.groupType)}</p>
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
                {enDigitToPer(i.price)}
                <br />
                تومان
              </div>
            </div>)}
          <div className="d-flex fs-5 mt-3">
            <p className="flex-grow-1">تعداد افراد: {enDigitToPer(chosenBundle.volume.volume)}</p>
            <p className="text-center">جمع فاکتور: {enDigitToPer(160000)}</p>
          </div>
          <hr />
        </>
        : <>
          <div key={chosenBundle.pac?.name} className="d-flex border rounded-3 mb-2 p-2">
            <div className="flex-grow-1">
              <p className="fs-5">{chosenBundle.pac?.name}</p>
              <p>{chosenBundle.pac.desc}</p>
            </div>
            <div className="p-3 text-center">
              {enDigitToPer(chosenBundle.pac?.price!)}
              <br />
              تومان
            </div>
          </div>
          <div className="d-flex fs-5 mt-3">
            <p className="flex-grow-1">تعداد افراد: {enDigitToPer(chosenBundle.volume.volume)}</p>
            <p className="">جمع فاکتور: {enDigitToPer(chosenBundle.calculatePrice)}</p>
          </div>
          <hr />
        </>
    }
  </div>}</>)
}

function DetailsForm(p: { formSubmit: (data: GroupLeaderData) => void, defaultValues: GroupLeaderData }) {
  const { control, handleSubmit, formState: { errors } } = useForm<GroupLeaderData>({
    defaultValues: p.defaultValues
  })

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

      {
        /* <Controller
          control={control}
          name="birthDay"
          rules={{ required: true }}
          render={({ field }) => <Form.Group
            as={Col} md="4">
            <Form.Label>تاریخ تولد</Form.Label>
            <DatePicker
              value={field.value || ""}
              onChange={date => field.onChange(date)}
              name={field.name}
              locale={persian_fa}
              calendar={persian_calendar}
            />

            <div className="text-danger">
              {errors.nationalCode?.type == 'required' ? 'لازم' : ''}
            </div>
          </Form.Group>}
        /> 
      */}

      <Button type="submit" className="mt-3">تایید</Button>
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

  const isVerified = verifyToken(
    authToken,
    process.env.AUTH_JWT_KEY! /* TODO if undefined do sth  */
  )

  if (isVerified == 'expired' || isVerified == 'invalid') {
    return {
      redirect: { destination: '/' },
      props: {}
    }
  }

  // TODO check previous orders from db

  return { props: { phoneNum: isVerified.phone } }
}