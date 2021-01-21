# Introduction

Trying out the following: https://github.com/prisma/system-behavior/issues/24

To reproduce:

1. Uncomment the `mysql` datasource block in `schema.prisma`, comment `pg` and generate client
1. `docker-compose up -d`
1. Run this SQL:

```sql
CREATE USER 'prisma'@'%' IDENTIFIED BY 'prisma';
CREATE USER 'root2'@'%' IDENTIFIED BY 'prisma';
GRANT ALL PRIVILEGES ON *.* TO 'prisma'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root2'@'%' WITH GRANT OPTION;

CREATE TABLE `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

3. `yarn`
4. `node mysql/index.js`

What `mysql/index.js` does:

1. Runs query via Prisma, so `prisma` postgres user creates a connection
2. Lists all connection pids from postgres user `prisma`
3. Terminates those connections
4. With Prisma: Runs a query every second via Prisma, it fails with the following error 14 times but works on 15th attempt i.e. 15th second

```
Trying again, attempt number 15
PrismaClientKnownRequestError2 [PrismaClientKnownRequestError]:
Invalid `prisma.user.findMany()` invocation:


  Can't reach database server at `localhost`:`3306`

Please make sure your database server is running at `localhost`:`3306`.
    at PrismaClientFetcher.request (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/@prisma/client/runtime/index.js:78455:15)
    at processTicksAndRejections (internal/process/task_queues.js:97:5) {
  code: 'P1001',
  clientVersion: '2.15.0-dev.89',
  meta: { database_host: 'localhost', database_port: 3306 }
}
Trying again, attempt number 16
{ data: [] }
```

5. With Native and no pool

```
(base) divyendusingh [system-behavior-24]$ node mysql/native.js                                          130 ↵
{ data1: [] }
{ pids: [ 71 ] }
{ terminate: 'kill 71;' }
{
  res: ResultSetHeader {
    fieldCount: 0,
    affectedRows: 0,
    insertId: 0,
    info: '',
    serverStatus: 2,
    warningStatus: 0
  }
}
First attempt after killing connection
Error: Connection lost: The server closed the connection.
    at PromiseConnection.query (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/mysql2/promise.js:92:22)
    at main (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/mysql/native.js:43:42)
    at processTicksAndRejections (internal/process/task_queues.js:97:5) {
  code: 'PROTOCOL_CONNECTION_LOST',
  errno: undefined,
  sqlState: undefined,
  sqlMessage: undefined
}
Trying again, attempt number 1
Error: This socket has been ended by the other party
    at PromiseConnection.query (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/mysql2/promise.js:92:22)
    at Timeout._onTimeout (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/mysql/native.js:56:43)
    at listOnTimeout (internal/timers.js:549:17)
    at processTimers (internal/timers.js:492:7) {
  code: 'EPIPE',
  errno: undefined,
  sqlState: undefined,
  sqlMessage: undefined
}
Trying again, attempt number 2
Error: Can't add new command when connection is in closed state
```

6. Native with pool:

```
(base) divyendusingh [system-behavior-24]$ node mysql/pool.js                                            130 ↵
{ data1: [] }
{ pids: [ 73 ] }
{ terminate: 'kill 73;' }
{
  res: ResultSetHeader {
    fieldCount: 0,
    affectedRows: 0,
    insertId: 0,
    info: '',
    serverStatus: 2,
    warningStatus: 0
  }
}
First attempt after killing connection
Error: Connection lost: The server closed the connection.
    at PromisePool.query (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/mysql2/promise.js:340:22)
    at main (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/mysql/pool.js:49:42)
    at processTicksAndRejections (internal/process/task_queues.js:97:5) {
  code: 'PROTOCOL_CONNECTION_LOST',
  errno: undefined,
  sqlState: undefined,
  sqlMessage: undefined
}
Trying again, attempt number 1
{ data: [] }
Interval query worked, terminating interval
```
