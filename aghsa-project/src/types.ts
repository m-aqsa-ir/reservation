interface Package {
  name: string,
  products: string[],
  price: number
}

interface Service {
  name: string,
  price: number,
  chosen: boolean,
  desc: string
}

interface ChooseService extends Service {
  chosen: boolean
}

interface DayCap {
  month: string,
  day: string,
  weekName: string,
  capacity: number
}

type GroupTypes = 'family' | 'men-group' | 'women-group'

type ChosenServiceState = {
  group: GroupTypes,
  pac: Package | Service[] | null
  day: DayCap | null,
  peopleCount: number
}

type ChosenServiceAction = {
  type: 'set'
  payload: ChosenServiceState
} | { type: 'clear' }

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