import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { dayCapToStr, enDigitToPer, groupPer } from "@/lib/lib";
import { sections } from "@/lib/sections";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";

export default function Submit() {

  const [sectionOrder, setSectionOrder] = useState(2)
  const [details, setDetails] = useState<GroupLeaderData>({
    groupName: '',
    groupLeaderName: '',
    nationalCode: ''
  })
  const router = useRouter()

  return (<PageContainer>
    <SectionIndicators order={sectionOrder} sections={sections} />
    <hr />
    <ChosenPackageDay />

    {sectionOrder == 2 ? <DetailsForm
      defaultValues={details}
      formSubmit={data => {
        setDetails(data)
        setSectionOrder(3)
      }}
    /> : <div>

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
        <Button variant="warning" onClick={e => {
          setSectionOrder(2)
        }}>اصلاح اطلاعات</Button>
        <Button variant="success" onClick={e => {
          localStorage.setItem('details', JSON.stringify(details))
          router.push('/ticket')
        }}>
          تایید اطلاعات و پرداخت
        </Button>
      </div>
    </div>}


  </PageContainer>)
}

function ChosenPackageDay() {
  const router = useRouter()
  const [chosenPac, setChosenPac] = useState<ChosenServiceState | null>(null)


  useEffect(() => {
    if (!router.isReady) return

    const localVal = localStorage.getItem('chosen-service')
    const cp: ChosenServiceState | 'no-value' = localVal ? JSON.parse(localVal) : 'no-value'

    if (cp == 'no-value') {
      router.push('/')
      return
    }

    setChosenPac(cp)

  }, [router])

  return (<>{chosenPac == null ? 'loading' : <div>
    <p className="text-center fs-3">{enDigitToPer(dayCapToStr(chosenPac.day))} - {groupPer(chosenPac.group)}</p>
    {
      chosenPac.pac instanceof Array ?
        <>
          {chosenPac.pac.map(i =>
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
            <p className="flex-grow-1">تعداد افراد: {enDigitToPer(chosenPac.peopleCount)}</p>
            <p className="text-center">جمع فاکتور: {enDigitToPer(160000)}</p>
          </div>
          <hr />
        </>
        : <>
          <div key={chosenPac.pac?.name} className="d-flex border rounded-3 mb-2 p-2">
            <div className="flex-grow-1">
              <p className="fs-5">{chosenPac.pac?.name}</p>
              <p>{chosenPac.pac?.products.join('، ')}</p>
            </div>
            <div className="p-3 text-center">
              {enDigitToPer(chosenPac.pac?.price!)}
              <br />
              تومان
            </div>
          </div>
          <div className="d-flex fs-5 mt-3">
            <p className="flex-grow-1">تعداد افراد: {enDigitToPer(chosenPac.peopleCount)}</p>
            <p className="">جمع فاکتور: {enDigitToPer(160000)}</p>
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

      {/* <Controller
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
    /> */}

      <Button type="submit" className="mt-3">تایید</Button>
    </Row>
  </Form>
}