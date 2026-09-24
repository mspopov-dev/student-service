import Student from "../model/student.js";

const students = new Map();
let collection;
export const init = db => collection = db.collection('college')

export const createStudent = async ({id, name, password}) => {
    const existingStudent = await collection.findOne({_id: id});
    if (existingStudent) {
        return false;
    }
    await collection.insertOne({_id: id, name, password, scores: {}});
    return true;
}

export const findStudentById = async id => await collection.findOne({_id: id}, {projection: {password: 0}});

export const deleteStudent = async id => await collection.findOneAndDelete({_id: id}, {projection: {password: 0}});

export const updateStudent = async (id, data) => await collection.findOneAndUpdate({_id: id}, {$set: data}, {projection: {scores: 0}, returnDocument: 'after'});


export const findStudentsByName = async name => await collection.find({name: {$regex: `^${name}$`, $options: 'i'}}, {projection: {password: 0}}).toArray();

export const countStudentsByNames = async names => {
    // TODO HW1 implements ignore case functionality
    return await collection.countDocuments({name: {$in: names}});
}

export const findStudentsByMinScore = async (exam, minScore) => await collection.find({[`scores.${exam}`]: {$gte: minScore}}, {projection: {password: 0}}).toArray();