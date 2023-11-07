import { ChosenServiceContext } from "@/components/ChosenServiceProvider";
import { PageContainer } from "@/components/PageContainer";
import { SectionIndicators } from "@/components/SectionIndicator";
import { dayCapToStr, enDigitToPer, groupPer } from "@/lib";

import { useContext } from "react";
import { Button, Col, Form, FormGroup, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";


type GroupLeaderForm = {
  groupName: string
  groupLeaderName: string
  birthDay: string
  nationalCode: string
}

export default function Submit() {

  const { control, handleSubmit, formState: { errors } } = useForm<GroupLeaderForm>({
    defaultValues: {
      groupName: '',
      groupLeaderName: '',
      birthDay: '1390/01/01',
      nationalCode: ''
    }
  })

  const formSubmit = () => {

  }

  return (<PageContainer>
    <SectionIndicators order={2} />
    <hr />
    <ChosenPackageDay />

    <Form onSubmit={handleSubmit(formSubmit)}>
      <Row>
        <Controller
          name="groupLeaderName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Form.Group as={Col} md="4">
            <Form.Label>نام سرگروه</Form.Label>
            <Form.Control {...field} isInvalid={errors.groupLeaderName != undefined} />
            <Form.Control.Feedback type="invalid">
              {errors.groupLeaderName?.type == 'required' ? 'لازم' : ''}
            </Form.Control.Feedback>
          </Form.Group>}
        ></Controller>

        <Controller
          name="groupName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Form.Group as={Col} md="4">
            <Form.Label>نام گروه</Form.Label>
            <Form.Control {...field} isInvalid={errors.groupName != undefined} />
            <Form.Control.Feedback type="invalid">
              {errors.groupName?.type == 'required' ? 'لازم' : ''}
            </Form.Control.Feedback>
          </Form.Group>}
        ></Controller>

        <Controller
          name="nationalCode"
          control={control}
          rules={{ required: true, pattern: /\d{10}/ }}
          render={({ field }) => <Form.Group as={Col} md="4">
            <Form.Label>کد ملی</Form.Label>
            <Form.Control {...field} isInvalid={errors.nationalCode != undefined} />
            <Form.Control.Feedback type="invalid">
              {errors.nationalCode?.type == 'required' ? 'لازم'
                : errors.nationalCode?.type == 'pattern' ? 'صحیح نیست' : ''}
            </Form.Control.Feedback>
          </Form.Group>}
        ></Controller>

        {/* <Controller
          control={control}
          name="birthDay"
          rules={} */}

        <Button type="submit" className="mt-2">تایید</Button>
      </Row>
    </Form>
  </PageContainer>)
}

function ChosenPackageDay() {
  const { chosenServiceState: chosenPac } = useContext(ChosenServiceContext)
  return (<div>
    <p className="text-center fs-3">{enDigitToPer(dayCapToStr(chosenPac.day))} - {groupPer(chosenPac.group)}</p>
    {
      chosenPac.pac instanceof Array ?
        chosenPac.pac.map(i =>
          <div key={i.name} className="d-flex border rounded-3 mb-2 p-2">
            <div className="flex-grow-1">
              <p className="fs-5">{i.name}</p>
              <p>{i.desc}</p>
            </div>
            <div className="p-3 text-center">
              {enDigitToPer(i.price)}
              <br />
              تومان
            </div>
          </div>)
        : <div key={chosenPac.pac?.name} className="d-flex border rounded-3 mb-2 p-2">
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
    }
  </div>)
}