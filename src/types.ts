interface Service {
  id: number,
  name: string,
  price: number,
  priceVip: number,
  desc: string
}

interface ChooseAbleService extends Service {
  chosen: boolean
}

type Section = {
  name: string,
  icon: string,
  order: number
}

type GroupLeaderData = {
  groupName: string
  groupLeaderName: string
  // birthDay: string
  nationalCode: string
}

type DayService = {
  day: Day,
  services: Service[],
  packages: OurPackage[],
  groupTypes: {
    id: number;
    name: string;
    iconPath: string;
  }[]
}

type Day = {
  id: number,
  month: number,
  day: number,
  year: number,
  weekName: string,
  capacity: number,
  isVip: boolean,
  desc: string
}

type OurPackage = {
  id: number
  name: string
  desc: string
  price: number,
  priceVip: number
}

type VolumeItem = {
  id: number;
  volume: number;
  discountPercent: number;
}

type ChosenBundle = {
  day: Day,
  services: Service[],
  pac: OurPackage | null,
  groupType: string,
  volume: VolumeItem,
  calculatePrice: number,
  prepayAmount: number
}

type PayBundle = ChosenBundle & GroupLeaderData & {
  phoneNum: string,
  reservedDate: string,
  reserveTimeTimestamp: number,
}

type TicketInfo = {
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

type PaginatorState = {
  page: number,
  pageCount: number,
  totalCount: number,
}
