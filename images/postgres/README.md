# _PostgreSQL_ Service

## Setup

## rule setup
```
CREATE TABLE rules (
  rid VARCHAR(20),
  log VARCHAR(100),
  repitition INT,
  timespan INT,
  reward_id INT,
  date_add: INT,
  enabled BOOL,
  applied BOOL
)
```

## rewards setup
``` 
CREATE TABLE rewards (
  rid VARCHAR(20),
  label VARCHAR(200),
  excerpt VARCHAR(300),
  img VARCHAR(300),
  type VARCHAR(20),
  val INT,
  enabled BOOL,
  date_add INT
)
```

## logs setup 

```
CREATE TABLE log_events (
  channel VARCHAR(200),
  type VARCHAR(20),
  eventid VARCHAR(50),
  reportid VARCHAR(50),
  platform VARCHAR(20),
  client VARCHAR(20),
  userid VARCHAR(20),
  timestamp VARCHAR(50),
  message VARCHAR(200)
)
```
The SQL in `initdb.d/init.sql` is executed when the database is created.
This adds the necessary tables.

When you update the `init.sql` you need to remove the existing database by deleting `_volumes/fogg-postgres/data` and remove the postgres container by running `./remove.fogg-postgres.sh` in the scripts directory.
