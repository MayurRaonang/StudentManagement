CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  insName VARCHAR(100),
  password TEXT NOT NULL -- store hashed password!
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  course VARCHAR(100),
  std INTEGER NOT NULL,
  PASSWORD TEXT NOT NULL, -- store hashed password!
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  std INTEGER NOT NULL,
  subject VARCHAR(100),
  chapter VARCHAR(100),
  total_marks INTEGER,
  test_date DATE,
  user_id INTEGER REFERENCES users(id)
);


CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  marks_obtained INTEGER,
  CONSTRAINT unique_student_test UNIQUE (student_id, test_id)
);