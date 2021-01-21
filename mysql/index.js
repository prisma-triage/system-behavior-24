//@ts-check
const { PrismaClient } = require('@prisma/client')
const { createConnection } = require('mysql2/promise')

const prisma = new PrismaClient()
async function main() {
  const mysqlClient = await createConnection(
    'mysql://root2:prisma@localhost:3306/system-behavior-24',
  )
  const data1 = await prisma.user.findMany()
  console.log({ data1 })

  await mysqlClient.connect()
  const query = `
  select id,
    user,
    host,
    db,
    command,
    time,
    state,
    info
  from information_schema.processlist
  where user='prisma';
    `

  const r = await mysqlClient.query(query)
  //@ts-ignore
  const pids = r[0].map((r) => r.id)
  console.log({ pids })

  const terminate = pids.map((pid) => `kill ${pid};`).join('\n')
  console.log({ terminate })
  const t = await mysqlClient.query(terminate)
  const res = t[0]
  console.log({ res })

  try {
    const data2 = await prisma.user.findMany()
    console.log({ data2 })
  } catch (e) {
    console.log(`First attempt after killing connection`)
    console.log(e)
  }

  let tryCount = 1

  const interval = setInterval(async () => {
    console.log(`Trying again, attempt number ${tryCount}`)
    tryCount += 1
    try {
      const data = await prisma.user.findMany()
      console.log({ data })
      clearInterval(interval)
    } catch (e) {
      console.log(e)
    }
  }, 1000)
}

main().finally(() => {
  //   prisma.$disconnect()
})
