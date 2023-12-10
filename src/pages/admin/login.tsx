import { fetchPost } from "@/lib/lib"
import { useRouter } from "next/router"
import { Button, Container, Form } from "react-bootstrap"
import { Controller, useForm } from "react-hook-form"
import Cookies from "js-cookie"
import { GetServerSideProps } from "next"
import { verifyTokenAdmin } from "@/lib/verifyToken"
import Head from "next/head"
import Image from "next/image"

type LoginFormState = {
  username: string
  password: string
}

export default function Admin() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<LoginFormState>()
  const router = useRouter()

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center vh-100">
      <Head>
        <title>ادمین - ورود</title>
      </Head>
      <Image
        width={150}
        height={150}
        alt="logo"
        src="/icon.png"
        className="mb-3"
      />
      <h1 className="fs-2 mb-3">فرم ورود</h1>
      <Form
        onSubmit={handleSubmit(async (formState) => {
          const res = await fetchPost("/api/admin/login", formState)

          if (res.ok) {
            const jwtKey = await res.text()
            Cookies.set("AUTH_ADMIN", jwtKey, { path: "/" })
            router.push("/admin/dashboard")
            return
          } else if (res.status == 401) {
            setError("root", { message: "نام کاربری یا رمز عبور اشتباه است!" })
            setTimeout(() => {
              clearErrors("root")
            }, 1000)
          }
        })}
      >
        <Controller
          name="username"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Form.Group>
              <Form.Label>نام کاربری</Form.Label>
              <Form.Control
                {...field}
                isInvalid={errors.username != undefined}
              />
              <Form.Control.Feedback type="invalid">
                {errors.username?.type == "required" ? "لازم" : ""}
              </Form.Control.Feedback>
            </Form.Group>
          )}
        ></Controller>
        <Controller
          name="password"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Form.Group>
              <Form.Label>رمز عبور</Form.Label>
              <Form.Control
                {...field}
                type="password"
                isInvalid={errors.password != undefined}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.type == "required" ? "لازم" : ""}
              </Form.Control.Feedback>
            </Form.Group>
          )}
        ></Controller>

        {errors.root != undefined ? (
          <p className="mt-3 text-danger">نام کاربری یا رمز عبور اشتباه است.</p>
        ) : (
          ""
        )}

        <Button type="submit" className="w-100 mt-2">
          ورود
        </Button>
      </Form>
    </Container>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies["AUTH_ADMIN"]

  if (token == undefined) {
    return { props: {} }
  }

  const verify = verifyTokenAdmin(token)

  if (verify == "expired" || verify == "invalid") {
    return { props: {} }
  }

  return {
    redirect: { destination: "/admin/dashboard" },
    props: {}
  }
}
