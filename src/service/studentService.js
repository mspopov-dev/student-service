import * as repo from '../repository/studentRepository.js';

const withoutPassword = student => {
    if (student) {
        student = {...student, scores: {...student.scores}};
        student.password = undefined;
    }
    return student;
}

export const addStudent = async student => repo.createStudent(student);

export const findStudent = async id => {
    return withoutPassword(repo.findStudentById(+id));
}

export const deleteStudent = async id => {
    return withoutPassword(repo.deleteStudent(+id));
}

export const updateStudent = async (id, data) => {
    const student = repo.updateStudent(+id, data);
    if (!student) {
        return null;
    }
    // Response format from the Postman collection: id, name, password.
    return {id: student.id, name: student.name, password: student.password};
}

export const addScore = async (id, exam, score) => {
    // The existing controller passes req.body as the second argument.
    if (exam !== null && typeof exam === 'object') {
        score = exam.score;
        exam = exam.examName;
    }
    if (typeof exam !== 'string' || !exam.trim() ||
        typeof score !== 'number' || !Number.isFinite(score)) {
        return false;
    }
    return repo.addScore(+id, exam, score);
}

export const findStudentsByName = async name => {
    return repo.findStudentsByName(name).map(withoutPassword);
}

export const countStudentsByNames = async names => {
    if (names === undefined) {
        return 0;
    }
    if (!Array.isArray(names)) {
        names = [names];
    }
    return repo.countStudentsByNames(names);
}

export const findStudentsByMinScore = async (exam, minScore) => {
    return repo.findStudentsByMinScore(exam, +minScore).map(withoutPassword);
}