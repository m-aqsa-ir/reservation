import { Customer, Day, Order, OrderService, Service } from "@prisma/client"

export type DayWeekName = Day & {
  weekName: string
}

export type Section = {
  name: string,
  icon: string,
  order: number
}

export type GroupLeaderData = {
  groupName: string
  groupLeaderName: string
  // birthDay: string
  nationalCode: string
}

export type OurPackage = {
  id: number
  name: string
  desc: string
  price: number,
  priceVip: number
}

export type VolumeItem = {
  id: number;
  volume: number;
  discountPercent: number;
}

export type ChosenBundle = {
  day: DayWeekName,
  package: Service | null,
  services: Service[],
  groupType: string,
  volume: VolumeItem,
  calculatePrice: number
}

export type PayBundle = ChosenBundle & GroupLeaderData & {
  prepayAmount: number,
  phoneNum: string,
  reservedDate: string,
  reserveTimeTimestamp: number,
}

export type TicketInfo = {
  groupName: string,
  groupLeaderName: string,
  reserveDate: string,
  chosenDay: string,
  volume: number,
  prepaidValue: number,
  remainedValue: number,
  groupType: string,
  services: {
    id: number;
    name: string;
    desc: string | null;
    type: string;
    priceNormal: number;
    priceVip: number | null;
  }[]
}

export type PaginatorState = {
  page: number,
  pageCount: number,
  totalCount: number,
}

export type TablePageBaseProps = {
  columnNames: string[] | {
    name: string,
    width: string
  }[]
}


export type OrderTableRow = Order & {
  Day: Day,
  OrderService: (OrderService & {
    Service: Service
  })[],
  Customer: Customer,

  discountSum: number,
  discountsStr: string,
  paidAmount: number,
  orderVip: boolean
}