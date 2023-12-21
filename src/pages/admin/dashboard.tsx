import { AdminPagesContainer } from "@/components/AdminPagesContainer"
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken"
import {
  enDigit2Per,
  fetchPost,
  getPerDataObject,
  nowPersianDateObject,
  time2Str
} from "@/lib/lib"
import { Chart } from "chart.js/auto"
import { range } from "lodash"
import { GetServerSideProps } from "next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import { Badge, Button, Card, Col, Row } from "react-bootstrap"
import { DashboardApi } from "../api/admin/dashboard"
import { resHandleNotAuth } from "@/lib/apiHandle"
import { useDispatch } from "react-redux"

export default function Dashboard(P: DashboardPageProps) {
  const { chart, ordersForToday, ordersInToday } = P

  const [week, setWeek] = useState<DashboardApi["week"]>([])
  const [weekLoading, setWeekLoading] = useState(true)

  const [pageNumber, setPageNumber] = useState(1)
  const [hasNextWeek, setHasNextWeek] = useState(true)

  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const focusRef = useRef<HTMLDivElement | null>(null)

  const dispatch = useDispatch()
  const router = useRouter()

  //: render chart
  useEffect(() => {
    if (chartRef == null) return

    //: remove previous charts
    const a = Chart.getChart(chartRef.current!)
    if (a) a.destroy()

    const c = new Chart(chartRef.current!, {
      type: "line",
      options: {
        scales: {
          y: {
            min: 0,
            max: Math.max(...chart.data) + 2,
            ticks: {
              stepSize: 1
            }
          }
        }
      },
      data: {
        xLabels: chart.label,
        datasets: [
          {
            label: "سفارشات",
            data: chart.data
          }
        ],
        yLabels: range(0, Math.max(...chart.data) + 5, 1).map((i) => String(i))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef])

  useEffect(() => {
    //
    ;(async () => {
      setWeekLoading(true) // >>>

      const res = await fetchPost("/api/admin/dashboard", { page: pageNumber })

      if (res.ok) {
        const { page, week }: DashboardApi = await res.json()

        setWeek(week)
        setHasNextWeek(page.hasNextWeek)
      } else {
        resHandleNotAuth(res, dispatch, router)
      }

      setWeekLoading(false) // <<<
    })().catch(console.error)
    //
  }, [pageNumber])

  return (
    <AdminPagesContainer currentPage="dashboard">
      <Head>
        <title>ادمین - داشبورد</title>
      </Head>
      <div className="border rounded-4 p-3 bg-white">
        <h1 className="fs-3">نمودار سفارشات دو ماه اخیر</h1>
        <canvas ref={chartRef}></canvas>
      </div>

      <div className="border rounded-4 p-3 bg-white mt-3">
        <h1 className="fs-3">آمار وضعیت</h1>

        <Row className="mt-4">
          <Col md="6">
            <p className="fs-6">
              <span className="fw-bold">سفارشات ثبت شده در امروز:</span>{" "}
              {enDigit2Per(ordersInToday)}
            </p>
          </Col>
          <Col md="6">
            <p className="fs-6">
              <span className="fw-bold">سفارشات ثبت شده برای امروز:</span>
              {enDigit2Per(ordersForToday)}
            </p>
          </Col>
        </Row>
      </div>

      <div className="border rounded-4 p-3 bg-white mt-3" ref={focusRef}>
        <h1 className="fs-3">
          سفارشات &nbsp;
          {pageNumber == 1
            ? "این هفته"
            : pageNumber == 2
            ? "هفته بعد"
            : `${enDigit2Per(pageNumber)} هفته بعد`}
        </h1>

        {weekLoading ? (
          <>
            <p>در حال لود ...</p>
          </>
        ) : (
          <div className="d-flex flex-wrap align-items-stretch">
            {week.map((i) => (
              <div key={i.id} className="tw-w-full md:tw-w-1/2 lg:tw-w-1/3 p-2">
                <Card key={i.id} className="h-100">
                  <Card.Header>
                    {i.weekName}: {time2Str(i.timestamp, i.desc)}
                    &nbsp;
                    {i.isVip && <Badge bg="success">VIP</Badge>}
                    <br />
                    باقی مانده: {enDigit2Per(i.maxVolume - i.reserved)}
                  </Card.Header>
                  <Card.Body>
                    <ul>
                      {i.Order.map((j) => (
                        <li key={j.id}>
                          <Link
                            href={"/admin/order/" + j.id}
                            target="_blank"
                            className="text-decoration-none"
                          >
                            {j.Customer.name}: {j.groupName} -{" "}
                            {enDigit2Per(j.volume)} نفر
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
        <div className="d-flex w-100 justify-content-center mt-1">
          {pageNumber != 1 && (
            <Button
              className="ms-2"
              variant="danger"
              onClick={(e) => {
                setWeek([])
                setPageNumber((p) => p - 1)
                focusRef.current?.scrollIntoView(true)
              }}
            >
              <i className="bi bi-chevron-right"></i>
              هفته قبل
            </Button>
          )}
          {hasNextWeek && (
            <Button
              variant="success"
              onClick={() => {
                setWeek([])
                setPageNumber((p) => p + 1)
                focusRef.current?.scrollIntoView(true)
              }}
            >
              هفته بعد
              <i className="bi bi-chevron-left"></i>
            </Button>
          )}
        </div>
      </div>
    </AdminPagesContainer>
  )
}

export type DashboardPageProps = {
  chart: {
    label: string[]
    data: number[]
  }

  ordersForToday: number
  ordersInToday: number
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context,
    async callbackSuccess(prisma) {
      let now = nowPersianDateObject()

      const _15DayBefore = now.subtract(30, "day").toUnix()
      const _15DayAfter = now.add(60, "day").toUnix()

      /* CHART DATE */
      const data = await prisma.day.findMany({
        select: {
          day: true,
          month: true,
          year: true,
          desc: true,
          _count: {
            select: {
              Order: true
            }
          }
        },
        where: {
          timestamp: {
            lt: _15DayAfter,
            gt: _15DayBefore
          }
        },
        orderBy: {
          timestamp: "asc"
        }
      })

      /* ORDERS FOR TOADY AND ORDERS IN TODAY */
      const today = nowPersianDateObject()
      const {
        year,
        month: { number: monthNumber },
        day
      } = today

      const ordersForToday = await prisma.day.findMany({
        where: {
          day,
          month: monthNumber,
          year
        },
        select: {
          _count: {
            select: {
              Order: true
            }
          }
        }
      })

      const todayStart = getPerDataObject({ day, month: monthNumber, year })
      const startTodayTimestamp = todayStart.toUnix()
      const startTomorrowTimestamp = todayStart.add(1, "day").toUnix()

      const ordersInToday = await prisma.order.count({
        where: {
          AND: [
            { timeRegistered: { lt: startTomorrowTimestamp } },
            { timeRegistered: { gt: startTodayTimestamp } }
          ]
        }
      })

      return {
        props: {
          chart: {
            label: data.map(
              ({ year, month, day, desc }) =>
                `${year}/${month}/${day}${desc == "" ? desc : "-" + desc}`
            ),
            data: data.map((i) => Number(i._count.Order))
          },
          ordersForToday:
            ordersForToday.length == 0
              ? 0
              : ordersForToday.reduce((sum, i) => sum + i._count.Order, 0),
          ordersInToday
        } satisfies DashboardPageProps
      }
    }
  })
}
