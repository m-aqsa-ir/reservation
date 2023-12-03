import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import {
  enDigit2Per, getPerDataObject, nowPersianDateObject,
  orderStatusEnum, time2Str, timestampScnds2PerDate
} from "@/lib/lib";
import { Chart } from "chart.js/auto";
import { range } from "lodash";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Badge, Button, Card, Col, Row } from "react-bootstrap";


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
        <p className="fs-6">
          <span className="fw-bold">
            سفارشات ثبت شده در امروز:
          </span> {enDigit2Per(ordersInToday)}
        </p>
      </Col>
      <Col md="6">
        <p className="fs-6">
          <span className="fw-bold">
            سفارشات ثبت شده برای امروز:
          </span>
          {enDigit2Per(ordersForToday)}
        </p>
      </Col>
    </Row>

    <h1 className="fs-3 mt-3">
      سفارشات &nbsp;
      {P.page.pageNumber == 1 ? 'این هفته' :
        P.page.pageNumber == 2 ? 'هفته بعد' :
          `${enDigit2Per(P.page.pageNumber)} هفته بعد`}
    </h1>

    <div className="d-flex flex-wrap align-items-stretch">
      {week.map(i =>
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
                {i.Order.map(j =>
                  <li key={j.id}>
                    <Link href={'/admin/order/' + j.id} target="_blank"
                      className="text-decoration-none">
                      {j.Customer.name}: {j.groupName} - {enDigit2Per(j.volume)} نفر
                    </Link>
                  </li>
                )}
              </ul>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
    <div className="d-flex w-100 justify-content-center mt-1">
      {P.page.pageNumber != 1 && <Link href={'/admin/dashboard?page=' + (P.page.pageNumber - 1)}>
        <Button className="ms-2" variant="danger">
          <i className="bi bi-chevron-right"></i>
          هفته قبل

        </Button>
      </Link>}
      {P.page.hasNextWeek && <Link href={'/admin/dashboard?page=' + (P.page.pageNumber + 1)}>
        <Button variant="success">
          هفته بعد
          <i className="bi bi-chevron-left"></i>
        </Button>
      </Link>}
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
    maxVolume: number;

    reserved: number;
    weekName: string;

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

  page: {
    pageNumber: number;
    hasNextWeek: boolean;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({
    context, async callbackSuccess(prisma) {

      let now = nowPersianDateObject()


      const _15DayBefore = now.subtract(30, 'day').toUnix()
      const _15DayAfter = now.add(60, 'day').toUnix()


      /* CHART DATE */
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

      /* ORDERS FOR TOADY AND ORDERS IN TODAY */
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


      /* DAY-ORDERS PART */

      //: return it to its place
      now = nowPersianDateObject()

      //: PAGE <<<
      const page = context.query['page'] == undefined ?
        1 :
        Number(context.query['page'])
      //: >>>

      const nowWeekDayNum = now.weekDay.index
      //:get first day of week
      now.subtract(nowWeekDayNum, 'day')

      //: find start bound
      now.add((page - 1) * 7, 'day')
      const startBound = now.toUnix()
      now.add(7, 'day')
      const endBound = now.toUnix()

      const week = await prisma.day.findMany({
        where: {
          timestamp: { lte: endBound, gte: startBound }
        },

        select: {
          id: true,
          isVip: true,
          timestamp: true,
          desc: true,
          maxVolume: true,

          Order: {
            where: {
              orderStatus: orderStatusEnum.reserved,
            },
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

      //: find has next week
      now.add(7, 'day')
      const nextWeekEndBound = now.toUnix()

      const hasNextWeek = (await prisma.day.count({
        where: {
          timestamp: {
            gte: endBound,
            lte: nextWeekEndBound
          }
        }
      })) != 0



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
          week: week.map(i => {
            const reserved = i.Order.reduce((sum, j) => sum + j.volume, 0)
            const weekName = timestampScnds2PerDate(i.timestamp).weekDay.name

            return { ...i, reserved, weekName }
          }),

          page: {
            pageNumber: page,
            hasNextWeek,
          }
        } satisfies DashboardApiRes
      }
    }
  })
}