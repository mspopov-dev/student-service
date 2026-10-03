import * as repo from "../repository/studentRepository.js";

export const addStudent = async student => repo.createStudent(student);

export const findStudent = async id => {
    const student = await repo.findStudentById(+id);
    return renameId(student);
};

export const deleteStudent = async id => {
    const student = await repo.deleteStudent(+id);
    return renameId(student);
};

export const updateStudent = async (id, data) => {
    const student = await repo.updateStudent(+id, data);
    return renameId(student);
};

export const addScore = async (id, exam, score) => {
    const student = await repo.updateStudent(+id, {[`scores.${exam}`]: score});
    return renameId(student);
};

export const findStudentsByName = async name => {
    const students = await repo.findStudentsByName(name);
    return students.map(renameId);
};

export const countStudentsByNames = async names => {
    names = Array.isArray(names) ? names : [names];
    return await repo.countStudentsByNames(names);
};

export const findStudentsByMinScore = async (exam, minScore) => {
    const students = await repo.findStudentsByMinScore(exam, +minScore);
    return students.map(renameId);
};

function renameId(student) {
    // HW2: возвращаем студента с полем id вместо _id.
    if (student == null) {
        return student;
    }

    const {_id, ...rest} = student;
    return {...rest, id: _id};
}