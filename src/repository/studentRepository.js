
import Student from "../model/student.js";

const students = new Map();

export const createStudent = ({id, name, password}) => {
    id = +id;
    if (!Number.isFinite(id) || students.has(id)) {
        return false;
    }
    const student = new Student(id, name, password);
    student.scores ??= {};
    students.set(id, student);
    return true;
}

export const findStudentById = id => {
    return students.get(id);
}

export const deleteStudent = id => {
    const student = students.get(id);
    if (!student) {
        return null;
    }
    students.delete(id);
    return student;
}

export const updateStudent = (id, {name, password}) => {
    const student = students.get(id);
    if (!student) {
        return null;
    }
    if (name !== undefined) {
        student.name = name;
    }
    if (password !== undefined) {
        student.password = password;
    }
    return student;
}

export const addScore = (id, exam, score) => {
    const student = students.get(id);
    if (!student) {
        return false;
    }
    student.scores = {...student.scores, [exam]: score};
    return true;
}

export const findStudentsByName = name => {
    return [...students.values()].filter(student =>
        student.name.toLowerCase() === name.toLowerCase());
}

export const countStudentsByNames = names => {
    const normalizedNames = names.map(name => name.toLowerCase());
    return [...students.values()].filter(student =>
        normalizedNames.includes(student.name.toLowerCase())).length;
}

export const findStudentsByMinScore = (exam, minScore) => {
    return [...students.values()].filter(student =>
        Object.hasOwn(student.scores, exam) && student.scores[exam] >= minScore);
}