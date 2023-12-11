import { PrismaClient } from "@prisma/client"

let prismaAdminApi = new PrismaClient()
let prismaAdminPage = new PrismaClient()

let prismaMainApi = new PrismaClient()
let prismaMainPage = new PrismaClient()

export function getPrisma4AdminApi() {
  return prismaAdminApi
}

export function getPrisma4AdminPages() {
  return prismaAdminPage
}

export function getPrisma4MainApi() {
  return prismaMainApi
}

export function getPrisma4MainPages() {
  return prismaMainPage
}
