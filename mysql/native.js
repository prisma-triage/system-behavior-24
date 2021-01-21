//@ts-check
const { PrismaClient } = require('@prisma/client')
const { Client: PgClient } = require('pg')

const pgClientConnection = new PgClient(
  'postgresql://root2:prisma@localhost:5432/system-behavior-24?schema=public',
)

const pgClientQuery = new PgClient(
  'postgresql://prisma:prisma@localhost:5432/system-behavior-24?schema=public',
)

const prisma = new PrismaClient()
async function main() {
  const data1 = await prisma.user.findMany()
  console.log({ data1 })

  pgClientConnection.connect()
  const query = `
select pid as process_id, 
  usename as username, 
  datname as database_name, 
  client_addr as client_address, 
  application_name,
  backend_start,
  state,
  state_change
from pg_stat_activity
where usename='prisma';`

  const r = await pgClientConnection.query(query)
  const pids = r.rows.map((r) => r['process_id'])
  console.log({ pids })

  const terminate = `
SELECT 
    ${pids.map((pid) => `pg_terminate_backend(${pid})`).join(',')}
FROM 
    pg_stat_activity 
WHERE 
    -- don't kill my own connection!
    pid <> pg_backend_pid()
    -- don't kill the connections to other databases
    AND datname = 'system-behavior-24'
;
  `
  const t = await pgClientConnection.query(terminate)
  const res = t.rows
  console.log({ res })

  try {
    console.log(`First attempt after killing connection`)
    const data2 = await pgClientQuery.query(`SELECT * FROM "public"."User";`)
    console.log(`First attempt after killing connection success`)
    console.log({ data2: data2.rows })
  } catch (e) {
    console.log(`First attempt after killing connection`)
    console.log(e)
  }

  // let tryCount = 1

  // const interval = setInterval(async () => {
  //   console.log(`Trying again, attempt number ${tryCount}`)
  //   tryCount += 1
  //   try {
  //     const data = await pgClientQuery.query(`SELECT * FROM "public"."User";`)
  //     console.log({ data: data.rows })
  //     console.log(`Interval query worked, terminating interval`)
  //     clearInterval(interval)
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }, 1000)
}

main().finally(() => {
  //   prisma.$disconnect()
})
