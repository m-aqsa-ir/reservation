import { PageContainer } from "@/components/PageContainer"
import { SectionIndicators } from "@/components/SectionIndicator"
import { enDigit2Per } from "@/lib/lib"
import { LocalStorageItems } from "@/lib/localManager"
import { sections } from "@/lib/sections"
import { useRouter } from "next/router"
import { useState } from "react"
import { Button } from "react-bootstrap"
import { Range, getTrackBackground } from "react-range"

export default function Page() {
  const [value, setValues] = useState(3)

  const router = useRouter()

  return (
    <PageContainer>
      <SectionIndicators sections={sections} order={1} />

      <hr />

      <p className="my-4">مبلغ چک را انتخاب کنید.</p>
      <div className="my-5 tw-flex tw-justify-center tw-items-baseline">
        <h1 className="tw-text-6xl">{enDigit2Per(value)}</h1> میلیون
      </div>

      <Ranger
        values={[value]}
        onChange={(v) => setValues(v[0])}
        MIN={3}
        MAX={8}
      />

      <Button
        className="w-100 fs-5 py-2 my-5"
        onClick={() => {
          LocalStorageItems.order.save({ value })

          router.push("_main")
        }}
      >
        ثبت و رفتن به مرحله بعد
      </Button>
    </PageContainer>
  )
}

function Ranger({
  values,
  onChange,
  MIN,
  MAX
}: {
  values: number[]
  onChange: (k: number[]) => void
  MIN: number
  MAX: number
}) {
  return (
    <div className="d-flex justify-content-center flex-wrap p-3">
      <Range
        step={1}
        min={MIN}
        max={MAX}
        values={values}
        rtl={true}
        onChange={onChange}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: "36px",
              display: "flex",
              width: "100%"
            }}
          >
            <div
              ref={props.ref}
              style={{
                height: "5px",
                width: "100%",
                borderRadius: "4px",
                background: getTrackBackground({
                  values,
                  colors: ["#548BF4", "#ccc"],
                  min: MIN,
                  max: MAX,
                  rtl: true
                }),
                alignSelf: "center"
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props, isDragged }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "42px",
              width: "42px",
              borderRadius: "4px",
              backgroundColor: "#FFF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0px 2px 6px #AAA"
            }}
          >
            <div
              style={{
                height: "15px",
                width: "15px",
                backgroundColor: isDragged ? "#548BF4" : "#CCC",
                borderRadius: "5px"
              }}
            />
          </div>
        )}
      />
    </div>
  )
}
