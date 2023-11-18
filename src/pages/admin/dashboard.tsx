import { AdminPagesContainer } from "@/components/AdminPagesContainer";
import { pageVerifyToken } from "@/lib/adminPagesVerifyToken";
import { resHandleNotAuth } from "@/lib/apiHandle";
import { fetchPost } from "@/lib/lib";
import { Chart } from "chart.js/auto";
import { max, range } from "lodash";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useDispatch } from "react-redux";

export default function Dashboard() {

  const [statistics, setStatistics] = useState({
    ordersForToday: 0,
    ordersInToday: 0
  })


  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const router = useRouter()
  const dispatch = useDispatch()

  useEffect(() => {
    if (chartRef == null || !router.isReady) return

    (async function () {
      const res = await fetchPost('/api/admin/dashboard', {})

      if (res.ok) {
        const { chart, ordersForToday, ordersInToday }: {
          chart: {
            label: string[];
            data: number[];
          };
          ordersForToday: number;
          ordersInToday: number;
        } = await res.json()

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

        setStatistics({ ordersForToday, ordersInToday })

      }

      resHandleNotAuth(res, dispatch, router)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef, router])

  return <AdminPagesContainer currentPage="dashboard">
    <h1 className="fs-3">نمودار سفارشات برای روز ها</h1>
    <canvas ref={chartRef}></canvas>

    <h1 className="fs-3 mt-3">آمار وضعیت</h1>
    <Row>
      <Col md="6">
        <p>سفارشات ثبت شده در امروز: {statistics.ordersInToday}</p>
      </Col>
      <Col md="6">
        <p>سفارشات ثبت شده برای امروز: {statistics.ordersForToday}</p>
      </Col>
    </Row>
  </AdminPagesContainer>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return pageVerifyToken({ context })
}