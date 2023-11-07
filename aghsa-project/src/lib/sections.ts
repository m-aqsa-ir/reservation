import {
  mdiAccountDetails,
  mdiCardAccountDetailsStar,
  mdiCashFast,
  mdiCheckCircleOutline,
  mdiTicket
} from "@mdi/js"

export const sections: Section[] = [
  { name: "انتخاب بسته", icon: mdiCheckCircleOutline, order: 1 },
  { name: "مشخصات", icon: mdiAccountDetails, order: 2 },
  { name: "تایید اطلاعات", icon: mdiCardAccountDetailsStar, order: 3 },
  { name: "پرداخت", icon: mdiCashFast, order: 4 },
  { name: "دریافت بلیط", icon: mdiTicket, order: 5 },
]