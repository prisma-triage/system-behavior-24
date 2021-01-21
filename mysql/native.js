//@ts-check
const { createConnection } = require('mysql2/promise')

async function main() {
  const mysqlClientConnection = await createConnection(
    'mysql://root2:prisma@localhost:3306/system-behavior-24',
  )

  const mysqlClientQuery = await createConnection(
    'mysql://prisma:prisma@localhost:3306/system-behavior-24',
  )
  await mysqlClientConnection.connect()
  await mysqlClientQuery.connect()

  const data1 = await mysqlClientQuery.query(`SELECT * FROM User;`)
  console.log({ data1: data1[0] })

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

  const r = await mysqlClientConnection.query(query)
  //@ts-ignore
  const pids = r[0].map((r) => r.id)
  console.log({ pids })

  const terminate = pids.map((pid) => `kill ${pid};`).join('\n')
  console.log({ terminate })
  const t = await mysqlClientConnection.query(terminate)
  const res = t[0]
  console.log({ res })

  try {
    const data2 = await mysqlClientQuery.query(`SELECT * FROM User;`)
    console.log({ data2: data2[0] })
  } catch (e) {
    console.log(`First attempt after killing connection`)
    console.log(e)
  }

  let tryCount = 1

  const interval = setInterval(async () => {
    console.log(`Trying again, attempt number ${tryCount}`)
    tryCount += 1
    try {
      const data = await mysqlClientQuery.query(`SELECT * FROM User;`)
      console.log({ data: data[0] })
      console.log(`Interval query worked, terminating interval`)
      clearInterval(interval)
    } catch (e) {
      console.log(e)
    }
  }, 1000)
}

main().finally(() => {
  //   prisma.$disconnect()
})
