Student Service

REST API for managing students and their exam scores. Built with Node.js and Express 5 as a backend assignment in the Tel-Ran Full Stack Developer program.

Data is stored in memory (a Map), so it is reset when the server restarts.

Tech stack
Node.js (ES modules)
Express 5
Project structure
src/
├── server.js                         # app setup, JSON parsing, 404 handler
├── routes/studentRoutes.js           # URL → controller mapping
├── controller/studentController.js   # HTTP layer: reads request, sets status codes
├── service/studentService.js         # business logic, input checks, hides passwords
├── repository/studentRepository.js   # data access (in-memory Map)
└── model/student.js                  # Student class

Each layer only calls the layer below it: routes → controller → service → repository.

Getting started

Requires Node.js 20.6 or newer (for --env-file and --watch).

bash
git clone https://github.com/mspopov-dev/student-service.git
cd student-service
npm install
touch .env          # the dev script expects this file; it can be empty
npm run dev

The server starts on port 3000. Set PORT in .env to change it.

API
Method	Endpoint	Description	Success	Error
POST	/student	Create a student	204	409 if the id already exists
GET	/student/:id	Get a student by id	200	404
PATCH	/student/:id	Update name and/or password	200	404
DELETE	/student/:id	Delete a student, returns the deleted record	200	404
PATCH	/score/student/:id	Add or update an exam score	204	404
GET	/students/name/:name	Find students by name (case-insensitive)	200	—
GET	/quantity/students?names=a&names=b	Count students with any of the given names	200	—
GET	/students/exam/:exam/minscore/:minScore	Students with a score ≥ minScore in the exam	200	—

Passwords are not included in GET, DELETE and search responses.

Examples

Create a student:

bash
curl -X POST http://localhost:3000/student \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "name": "Anna", "password": "1234"}'

Add an exam score:

bash
curl -X PATCH http://localhost:3000/score/student/1 \
  -H "Content-Type: application/json" \
  -d '{"examName": "math", "score": 90}'

Get the student:

bash
curl http://localhost:3000/student/1
json
{ "id": 1, "name": "Anna", "scores": { "math": 90 } }

Find students with at least 80 in math:

bash
curl http://localhost:3000/students/exam/math/minscore/80

Error response format (404):

json
{
  "timestamp": "2026-10-11T19:41:15.096Z",
  "status": 404,
  "error": "Not Found",
  "message": "Student with id 1 not found",
  "path": { "id": "1" }
}
