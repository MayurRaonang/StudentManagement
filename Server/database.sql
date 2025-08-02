CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL -- store hashed password!
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  course VARCHAR(100),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(100),
  chapter VARCHAR(100),
  total_marks INTEGER,
  test_date DATE,
  user_id INTEGER REFERENCES users(id)
);


CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  test_id INTEGER REFERENCES tests(id),
  marks_obtained INTEGER
);
