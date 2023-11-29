import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import {
  enDigit2Per, getPerDataObject, nowPersianDateObject,
  orderStatusEnum, paymentStatusEnum, time2Str
} from "@/lib/lib";
import { Chart } from "chart.js/auto";
import { range } from "lodash";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useRef } from "react";
import { Card, Col, Row } from "react-bootstrap";


export default function Dashboard(P: DashboardApiRes) {

  const { chart, ordersForToday, ordersInToday, week } = P


  const chartRef = useRef<HTMLCanvasElement | null>(null)

  //: render chart
  useEffect(() => {
    if (chartRef == null) return

    //: remove previous charts
    const a = Chart.getChart(chartRef.current!)
    if (a) a.destroy()

    const c = new Chart(chartRef.current!, {
      type: 'line',
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
        datasets: [{
          label: 'سفارشات',
          data: chart.data,
        }],
        yLabels: range(0, Math.max(...chart.data) + 5, 1).map(i => String(i))
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef])

  return <AdminPagesContainer currentPage="dashboard">
    <Head>
      <title>ادمین - داشبورد</title>
    </Head>
    <h1 className="fs-3">نمودار سفارشات دو ماه اخیر</h1>
    <canvas ref={chartRef}></canvas>

    <h1 className="fs-3 mt-3">آمار وضعیت</h1>

    <Row className="mt-4">
      <Col md="6">
        <p className="fs-6"><span className="fw-bold">سفارشات ثبت شده در امروز:</span> {enDigit2Per(ordersInToday)}</p>
      </Col>
      <Col md="6">
        <p className="fs-6"><span className="fw-bold">سفارشات ثبت شده برای امروز: </span>{enDigit2Per(ordersForToday)}</p>
      </Col>
    </Row>

    <h1 className="fs-3 mt-3">سفارشات هفت روز آینده</h1>

    <div className="d-flex flex-wrap align-items-stretch">
      {week.map(i =>
        <div key={i.id} className="tw-w-full md:tw-w-1/2 lg:tw-w-1/3 p-2">
          <Card key={i.id} className="h-100">
            <Card.Header>
              {time2Str(i.timestamp, i.desc)}
            </Card.Header>
            <Card.Body>
              <ul>
                {i.Order.map(j =>
                  <li key={j.id}>{j.Customer.name}: {j.groupName} - {enDigit2Per(j.volume)} نفر</li>
                )}
              </ul>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  </AdminPagesContainer>
}

export type DashboardApiRes = {
  chart: {
    label: string[];
    data: number[];
  };
  ordersForToday: number;
  ordersInToday: number;
  week: {
    id: number;
    timestamp: number;
    desc: string;
    isVip: boolean;
    Order: {
      id: number;
      volume: number;
      groupType: string;
      groupName: string;
      Customer: {
        id: number;
        name: string;
        phone: string;
        nationalCode: string;
        desc: string | null;
      };
    }[];
  }[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess(prisma) {
      let now = nowPersianDateObject()
      const _15DayBefore = now.subtract(30, 'day').toUnix()
      const _15DayAfter = now.add(60, 'day').toUnix()


      const data = await prisma.day.findMany({
        select: {
          day: true, month: true, year: true, desc: true,
          _count: {
            select: {
              Order: true
            }
          }
        },
        where: {
          timestamp: {
            lt: _15DayAfter,
            gt: _15DayBefore,
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      })

      const today = nowPersianDateObject()
      const { year, month: { number: monthNumber }, day } = today

      const ordersForToday = await prisma.day.findMany({
        where: {
          day, month: monthNumber, year
        },
        select: {
          _count: {
            select: {
              Order: true
            }
          },
        }
      })

      const todayStart = getPerDataObject({ day, month: monthNumber, year })
      const startTodayTimestamp = todayStart.toUnix()
      const startTomorrowTimestamp = todayStart.add(1, 'day').toUnix()

      const ordersInToday = await prisma.order.count({
        where: {
          AND: [
            { timeRegistered: { lt: startTomorrowTimestamp } },
            { timeRegistered: { gt: startTodayTimestamp } }
          ]
        }
      })

      //: return it to its place
      now = nowPersianDateObject()
      const nextWeekTimestamp = now.add(7, 'day').toUnix()

      const week = await prisma.day.findMany({
        where: {
          timestamp: { lte: nextWeekTimestamp }
        },

        select: {
          id: true,
          isVip: true,
          timestamp: true,
          desc: true,

          Order: {
            where: { orderStatus: { not: orderStatusEnum.canceled }, status: { not: paymentStatusEnum.awaitPayment } },
            select: {
              groupName: true,
              groupType: true,
              volume: true,
              id: true,

              Customer: true,
            },
          },
        },

        orderBy: {
          timestamp: 'asc'
        }
      })

      return {
        props: {
          chart: {
            label: data.map(({ year, month, day, desc }) => `${year}/${month}/${day}${desc == '' ? desc : '-' + desc}`),
            data: data.map(i => Number(i._count.Order))
          },
          ordersForToday: ordersForToday.length == 0 ?
            0 :
            ordersForToday.reduce((sum, i) => sum + i._count.Order, 0),
          ordersInToday,
          week
        } satisfies DashboardApiRes
      }
    }
  })
}