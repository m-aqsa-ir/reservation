import { NextRouter } from "next/router"

export interface Package {
  name: string,
  products: string[],
  price: number
}

export interface Service {
  name: string,
  price: number,
  chosen: boolean,
  desc: string
}

export interface ChooseService extends Service {
  chosen: boolean
}

export interface DayCap {
  month: string,
  day: string,
  weekName: string,
  capacity: number
}

export type GroupTypes = 'family' | 'men-group' | 'women-group'

export type ChosenServiceState = {
  group: GroupTypes,
  pac: Package | Service[] | null
  day: DayCap | null,
  peopleCount: number,
  reserveDate: string
}

export type ChosenServiceAction = {
  type: 'set'
  payload: ChosenServiceState
} | { type: 'clear' }

export type Section = {
  name: string,
  icon: string,
  order: number,
  onClick?: (router: NextRouter) => void
}

export type GroupLeaderData = {
  groupName: string
  groupLeaderName: string
  // birthDay: string
  nationalCode: string
}
/// ---------------------------------------------
export type DayService = {
  day: Day,
  services: Service[],
  packages: OurPackage[]
}

export type Day = {
  month: number,
  day: number,
  weekName: string,
  capacity: number,
  isVip: boolean
}

export type OurPackage = {
  name: string
  desc: string
  price: number
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
}

export type ReservedBundle = ChosenBundle & {
  reservedDate: string,
  reserveTimeTimestamp: number,
}