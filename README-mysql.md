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
4. Runs a query every second via Prisma, it fails with the following error 14 times but works on 15th attempt i.e. 15th second

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
