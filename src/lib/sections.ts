import { Section } from "@/types"
import {
  mdiAccountCashOutline,
  mdiAccountDetails,
  mdiCashCheck,
  mdiCheckbook
} from "@mdi/js"

export const sections: Section[] = [
  { name: "انتخاب مبلغ چک", icon: mdiCheckbook, order: 1 },
  { name: "ورود مشخصات", icon: mdiAccountDetails, order: 2 },
  { name: "تایید اطلاعات", icon: mdiAccountCashOutline, order: 3 },
  { name: "اتمام درخواست", icon: mdiCashCheck, order: 4 }
]
