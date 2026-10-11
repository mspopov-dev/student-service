/*
Integration tests for the student HTTP layer (routes + controller + validator).
The service layer is mocked, so no database connection is required.
Requests are sent through a real Express app with supertest.
 */

import {jest, beforeEach, describe, it, expect} from '@jest/globals';
import express from 'express';
import request from 'supertest';

const mockService = {
    addStudent: jest.fn(),
    findStudent: jest.fn(),
    deleteStudent: jest.fn(),
    updateStudent: jest.fn(),
    addScore: jest.fn(),
    findStudentsByName: jest.fn(),
    countStudentsByNames: jest.fn(),
    findStudentsByMinScore: jest.fn()
}

jest.unstable_mockModule('../service/studentService.js', () => mockService);

// Routes must be imported after the mock is registered
const {default: studentRoutes} = await import('../routes/studentRoutes.js');

// Build the app the same way as server.js, but without connecting to MongoDB
const app = express();
app.use(express.json());
app.use(studentRoutes);
app.use((req, res) => res.status(404).type('text/plain; charset=utf-8').send('Not found'));

const student = {_id: 1, name: 'John', password: 'secret', scores: {Math: 90}};

// Checks the shape of the custom 404 body produced by the controller
const expectNotFoundBody = (res, id, path) => {
    expect(res.body).toMatchObject({
        status: 404,
        error: 'Not Found',
        message: `Student with id ${id} not found`,
        path
    });
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('POST /student', () => {
    it('returns 204 when student is created', async () => {
        // Arrange
        mockService.addStudent.mockResolvedValue(true);
        const body = {id: 1, name: 'John', password: 'secret'};
        // Act
        const res = await request(app).post('/student').send(body);
        // Assert
        expect(res.status).toBe(204);
        expect(res.text).toBe('');
        expect(mockService.addStudent).toHaveBeenCalledWith(body);
    })
    it('returns 409 when student already exists', async () => {
        mockService.addStudent.mockResolvedValue(false);
        const res = await request(app).post('/student').send({id: 1, name: 'John', password: 'secret'});
        expect(res.status).toBe(409);
        expect(mockService.addStudent).toHaveBeenCalledTimes(1);
    })
    it.each([
        ['id is missing', {name: 'John', password: 'secret'}, '"id" is required'],
        ['name is missing', {id: 1, password: 'secret'}, '"name" is required'],
        ['password is missing', {id: 1, name: 'John'}, '"password" is required'],
        ['id is negative', {id: -1, name: 'John', password: 'secret'}, '"id" must be a positive number'],
        ['id is not an integer', {id: 1.5, name: 'John', password: 'secret'}, '"id" must be an integer'],
        ['id is not a number', {id: 'abc', name: 'John', password: 'secret'}, '"id" must be a number'],
        ['name is not a string', {id: 1, name: 123, password: 'secret'}, '"name" must be a string'],
        ['unknown field is sent', {id: 1, name: 'John', password: 'secret', age: 20}, '"age" is not allowed'],
    ])('returns 400 when %s', async (_, body, message) => {
        const res = await request(app).post('/student').send(body);
        expect(res.status).toBe(400);
        expect(res.text).toBe(message);
        // Validation must stop the request before it reaches the service
        expect(mockService.addStudent).not.toHaveBeenCalled();
    })
    it('returns 500 when service throws', async () => {
        mockService.addStudent.mockRejectedValue(new Error('DB is down'));
        const res = await request(app).post('/student').send({id: 1, name: 'John', password: 'secret'});
        expect(res.status).toBe(500);
    })
})

describe('Requests without body', () => {
    it.each([
        ['POST', '/student', 'addStudent'],
        ['PATCH', '/student/1', 'updateStudent'],
        ['PATCH', '/score/student/1', 'addScore'],
    ])('%s %s returns 400 when body is missing', async (method, url, serviceFn) => {
        const res = await request(app)[method.toLowerCase()](url);
        expect(res.status).toBe(400);
        expect(res.text).toBe('"value" is required');
        expect(mockService[serviceFn]).not.toHaveBeenCalled();
    })
})

describe('GET /student/:id', () => {
    it('returns 200 and student when found', async () => {
        mockService.findStudent.mockResolvedValue(student);
        const res = await request(app).get('/student/1');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(student);
        // Route params arrive as strings; conversion is the service's responsibility
        expect(mockService.findStudent).toHaveBeenCalledWith('1');
    })
    it('returns 404 when student not found', async () => {
        mockService.findStudent.mockResolvedValue(null);
        const res = await request(app).get('/student/42');
        expect(res.status).toBe(404);
        expectNotFoundBody(res, 42, '/student/42');
    })
})

describe('DELETE /student/:id', () => {
    it('returns 200 and deleted student', async () => {
        mockService.deleteStudent.mockResolvedValue(student);
        const res = await request(app).delete('/student/1');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(student);
        expect(mockService.deleteStudent).toHaveBeenCalledWith('1');
    })
    it('returns 404 when student not found', async () => {
        mockService.deleteStudent.mockResolvedValue(null);
        const res = await request(app).delete('/student/42');
        expect(res.status).toBe(404);
        expectNotFoundBody(res, 42, '/student/42');
    })
})

describe('PATCH /student/:id', () => {
    it('returns 200 and updated student', async () => {
        const updated = {...student, name: 'Peter'};
        mockService.updateStudent.mockResolvedValue(updated);
        const res = await request(app).patch('/student/1').send({name: 'Peter'});
        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
        expect(mockService.updateStudent).toHaveBeenCalledWith('1', {name: 'Peter'});
    })
    it('accepts empty body (all fields are optional)', async () => {
        mockService.updateStudent.mockResolvedValue(student);
        const res = await request(app).patch('/student/1').send({});
        expect(res.status).toBe(200);
        expect(mockService.updateStudent).toHaveBeenCalledWith('1', {});
    })
    it('returns 404 when student not found', async () => {
        mockService.updateStudent.mockResolvedValue(null);
        const res = await request(app).patch('/student/42').send({password: 'new'});
        expect(res.status).toBe(404);
        expectNotFoundBody(res, 42, '/student/42');
    })
    it.each([
        ['name is not a string', {name: 123}, '"name" must be a string'],
        ['password is not a string', {password: true}, '"password" must be a string'],
        ['id is sent', {id: 2}, '"id" is not allowed'],
        ['unknown field is sent', {scores: {Math: 100}}, '"scores" is not allowed'],
    ])('returns 400 when %s', async (_, body, message) => {
        const res = await request(app).patch('/student/1').send(body);
        expect(res.status).toBe(400);
        expect(res.text).toBe(message);
        expect(mockService.updateStudent).not.toHaveBeenCalled();
    })
})

describe('PATCH /score/student/:id', () => {
    it('returns 204 when score is added', async () => {
        mockService.addScore.mockResolvedValue(student);
        const res = await request(app).patch('/score/student/1').send({examName: 'Math', score: 95});
        expect(res.status).toBe(204);
        expect(mockService.addScore).toHaveBeenCalledWith('1', 'Math', 95);
    })
    it.each([0, 100])('accepts boundary score %i', async (score) => {
        mockService.addScore.mockResolvedValue(student);
        const res = await request(app).patch('/score/student/1').send({examName: 'Math', score});
        expect(res.status).toBe(204);
        expect(mockService.addScore).toHaveBeenCalledWith('1', 'Math', score);
    })
    it('returns 404 when student not found', async () => {
        mockService.addScore.mockResolvedValue(null);
        const res = await request(app).patch('/score/student/42').send({examName: 'Math', score: 95});
        expect(res.status).toBe(404);
        expectNotFoundBody(res, 42, '/score/student/42');
    })
    it.each([
        ['examName is missing', {score: 95}, '"examName" is required'],
        ['score is missing', {examName: 'Math'}, '"score" is required'],
        ['score is below 0', {examName: 'Math', score: -1}, '"score" must be greater than or equal to 0'],
        ['score is above 100', {examName: 'Math', score: 101}, '"score" must be less than or equal to 100'],
        ['score is not an integer', {examName: 'Math', score: 90.5}, '"score" must be an integer'],
        ['score is not a number', {examName: 'Math', score: 'high'}, '"score" must be a number'],
    ])('returns 400 when %s', async (_, body, message) => {
        const res = await request(app).patch('/score/student/1').send(body);
        expect(res.status).toBe(400);
        expect(res.text).toBe(message);
        expect(mockService.addScore).not.toHaveBeenCalled();
    })
})

describe('GET /students/name/:name', () => {
    it('returns 200 and list of students', async () => {
        const list = [{_id: 1, name: 'Eva'}, {_id: 2, name: 'Eva'}];
        mockService.findStudentsByName.mockResolvedValue(list);
        const res = await request(app).get('/students/name/Eva');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(list);
        expect(mockService.findStudentsByName).toHaveBeenCalledWith('Eva');
    })
    it('returns 200 and empty list when nobody found', async () => {
        mockService.findStudentsByName.mockResolvedValue([]);
        const res = await request(app).get('/students/name/Nobody');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    })
})

describe('GET /quantity/students', () => {
    it('passes single name from query', async () => {
        mockService.countStudentsByNames.mockResolvedValue(1);
        const res = await request(app).get('/quantity/students?names=Eva');
        expect(res.status).toBe(200);
        expect(res.body).toBe(1);
        expect(mockService.countStudentsByNames).toHaveBeenCalledWith('Eva');
    })
    it('passes multiple names from query as array', async () => {
        mockService.countStudentsByNames.mockResolvedValue(3);
        const res = await request(app).get('/quantity/students?names=Eva&names=John');
        expect(res.status).toBe(200);
        expect(res.body).toBe(3);
        expect(mockService.countStudentsByNames).toHaveBeenCalledWith(['Eva', 'John']);
    })
})

describe('GET /students/exam/:exam/minscore/:minScore', () => {
    it('returns 200 and list of students', async () => {
        const list = [{_id: 1, scores: {Math: 90}}];
        mockService.findStudentsByMinScore.mockResolvedValue(list);
        const res = await request(app).get('/students/exam/Math/minscore/80');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(list);
        expect(mockService.findStudentsByMinScore).toHaveBeenCalledWith('Math', '80');
    })
})

describe('Unknown routes', () => {
    it('returns 404 for unknown path', async () => {
        const res = await request(app).get('/unknown');
        expect(res.status).toBe(404);
        expect(res.text).toBe('Not found');
        expect(res.headers['content-type']).toMatch(/text\/plain/);
    })
})
