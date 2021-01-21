# Introduction

Trying out the following: https://github.com/prisma/system-behavior/issues/24

To reproduce:

1. Uncomment the `pg` datasource block in `schema.prisma`, comment `mysql` and generate client
1. `docker-compose up -d`
1. Run this SQL:

```sql
CREATE ROLE prisma WITH LOGIN SUPERUSER PASSWORD 'prisma';
CREATE ROLE root2 WITH LOGIN SUPERUSER PASSWORD 'prisma';

CREATE TABLE "public"."User" (
    "id" text NOT NULL,
    "name" text NOT NULL,
    PRIMARY KEY ("id")
);
```

3. `yarn`
4. `node pg/index.js`

What `pg/index.js` does:

1. Runs query via Prisma, so `prisma` postgres user creates a connection
2. Lists all connection pids from postgres user `prisma`
3. Terminates those connections
4. Runs a query every second via Prisma, it fails with the following error 14 times but works on 15th attempt i.e. 15th second

```
Invalid `prisma.user.findMany()` invocation:


  Error in PostgreSQL connection: Error { kind: Db, cause: Some(DbError { severity: "FATAL", parsed_severity: Some(Fatal), code: SqlState("57P01"), message: "terminating connection due to administrator command", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("postgres.c"), line: Some(3078), routine: Some("ProcessInterrupts") }) }

This is a non-recoverable error which probably happens when the Prisma Query Engine has a panic.
```

5. Native without pool:

```
(base) divyendusingh [system-behavior-24]$ node pg/native.js                                             130 ↵
{ data1: [] }
{ pids: [ 9685 ] }
{ res: [ { pg_terminate_backend: true } ] }
First attempt after killing connection
error: terminating connection due to administrator command
    at Parser.parseErrorMessage (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/parser.js:278:15)
    at Parser.handlePacket (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/parser.js:126:29)
    at Parser.parse (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/parser.js:39:38)
    at Socket.<anonymous> (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/index.js:10:42)
    at Socket.emit (events.js:315:20)
    at addChunk (_stream_readable.js:295:12)
    at readableAddChunk (_stream_readable.js:271:9)
    at Socket.Readable.push (_stream_readable.js:212:10)
    at TCP.onStreamRead (internal/stream_base_commons.js:186:23) {
  length: 116,
  severity: 'FATAL',
  code: '57P01',
  detail: undefined,
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'postgres.c',
  line: '3078',
  routine: 'ProcessInterrupts'
}
Catching process exits Error: Connection terminated unexpectedly
    at Connection.<anonymous> (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg/lib/client.js:132:73)
    at Object.onceWrapper (events.js:421:28)
    at Connection.emit (events.js:315:20)
    at Socket.<anonymous> (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg/lib/connection.js:108:12)
    at Socket.emit (events.js:327:22)
    at endReadableNT (_stream_readable.js:1221:12)
    at processTicksAndRejections (internal/process/task_queues.js:84:21)
Trying again, attempt number 1
Error: Client has encountered a connection error and is not queryable
    at /Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg/lib/client.js:563:27
    at processTicksAndRejections (internal/process/task_queues.js:79:11)
Trying again, attempt number 2
Error: Client has encountered a connection error and is not queryable
```

5. Native with pool

```
(base) divyendusingh [system-behavior-24]$ node pg/pool.js                                               130 ↵
{ data1: [] }
{ pids: [ 9688 ] }
Catching process exits error: terminating connection due to administrator command
    at Parser.parseErrorMessage (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/parser.js:278:15)
    at Parser.handlePacket (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/parser.js:126:29)
    at Parser.parse (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/parser.js:39:38)
    at Socket.<anonymous> (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg-protocol/dist/index.js:10:42)
    at Socket.emit (events.js:315:20)
    at addChunk (_stream_readable.js:295:12)
    at readableAddChunk (_stream_readable.js:271:9)
    at Socket.Readable.push (_stream_readable.js:212:10)
    at TCP.onStreamRead (internal/stream_base_commons.js:186:23) {
  length: 116,
  severity: 'FATAL',
  code: '57P01',
  detail: undefined,
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'postgres.c',
  line: '3078',
  routine: 'ProcessInterrupts'
}
{ res: [ { pg_terminate_backend: true } ] }
First attempt after killing connection
Error: Client has encountered a connection error and is not queryable
    at /Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg/lib/client.js:563:27
    at processTicksAndRejections (internal/process/task_queues.js:79:11)
Catching process exits Error: Connection terminated unexpectedly
    at Connection.<anonymous> (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg/lib/client.js:132:73)
    at Object.onceWrapper (events.js:421:28)
    at Connection.emit (events.js:315:20)
    at Socket.<anonymous> (/Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg/lib/connection.js:108:12)
    at Socket.emit (events.js:327:22)
    at endReadableNT (_stream_readable.js:1221:12)
    at processTicksAndRejections (internal/process/task_queues.js:84:21)
Trying again, attempt number 1
Error: Client has encountered a connection error and is not queryable
    at /Users/divyendusingh/Documents/prisma/triage/system-behavior-24/node_modules/pg/lib/client.js:563:27
    at processTicksAndRejections (internal/process/task_queues.js:79:11)
```
