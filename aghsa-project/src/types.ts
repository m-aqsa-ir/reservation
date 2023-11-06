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