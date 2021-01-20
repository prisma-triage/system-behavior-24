# Introduction

Trying out the following: https://github.com/prisma/system-behavior/issues/24

To reproduce:

1. `docker-compose up -d`
2. Run this SQL:

```sql
CREATE ROLE prisma WITH LOGIN SUPERUSER PASSWORD 'password';
CREATE ROLE root2 WITH LOGIN SUPERUSER PASSWORD 'password';

CREATE TABLE "public"."User" (
    "id" text NOT NULL,
    "name" text NOT NULL,
    PRIMARY KEY ("id")
);
```

3. `yarn`
4. `node index.js`

What `index.js` does:

1. Runs query via Prisma, so `prisma` postgres user creates a connection
2. Lists all connection pids from postgres user `prisma`
3. Terminates those connections
4. Runs another query via Prisma, it fails with

```
Invalid `prisma.user.findMany()` invocation:


  Error in PostgreSQL connection: Error { kind: Db, cause: Some(DbError { severity: "FATAL", parsed_severity: Some(Fatal), code: SqlState("57P01"), message: "terminating connection due to administrator command", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("postgres.c"), line: Some(3078), routine: Some("ProcessInterrupts") }) }

This is a non-recoverable error which probably happens when the Prisma Query Engine has a panic.
```

5. Runs another query via Prisma after 15s. It works.