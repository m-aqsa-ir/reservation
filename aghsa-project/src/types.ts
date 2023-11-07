import { NextRouter } from "next/router"
import { DateObject } from "react-multi-date-picker"


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