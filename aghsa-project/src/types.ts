import { NextRouter } from "next/router"

export interface Service {
  id: number,
  name: string,
  price: number,
  priceVip: number,
  desc: string
}

export interface ChooseAbleService extends Service {
  chosen: boolean
}

export type GroupTypes = 'family' | 'men-group' | 'women-group'

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

export type DayService = {
  day: Day,
  services: Service[],
  packages: OurPackage[]
}

export type Day = {
  month: number,
  day: number,
  year: number,
  weekName: string,
  capacity: number,
  isVip: boolean
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
  day: Day,
  pac: Service[] | OurPackage,
  groupType: GroupTypes,
  volume: VolumeItem,
  calculatePrice: number,
  prepayAmount: number
}

export type PayBundle = ChosenBundle & GroupLeaderData & {
  phoneNum: string,
  reservedDate: string,
  reserveTimeTimestamp: number,
}

export type TicketInfo = {
  groupName: string,
  groupLeaderName: string,
  reserveDateTimestamp: number,
  volume: number,
  services: {
    id: number;
    name: string;
    desc: string | null;
    type: string;
    priceNormal: number;
    priceVip: number | null;
  }[]
}