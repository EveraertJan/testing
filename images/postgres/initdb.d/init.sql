

CREATE TABLE log_events (
  idx SERIAL,
  channel VARCHAR(200),
  client VARCHAR(20),
  event_id VARCHAR(50),
  platform VARCHAR(20),
  report_id VARCHAR(50),
  timestamp VARCHAR(50),
  type VARCHAR(20),
  user_id VARCHAR(20),
  data VARCHAR(1000)
);

CREATE TABLE users (
  idx SERIAL,
  username VARCHAR(200),
  email VARCHAR(200),
  age INT,
  date_add VARCHAR(50),
  gender VARCHAR(10)

);

CREATE TABLE answers (
  idx SERIAL,
  questionId VARCHAR(20),
  answer VARCHAR(20),
  userId VARCHAR(20)
);

CREATE TABLE questions (
  idx SERIAL,
  label VARCHAR(20),
  type VARCHAR(20),
  question VARCHAR(100),
  explanation VARCHAR(140)
);