import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: String,
    description: String,
    date: Date,
});

const eventModel = mongoose.model('Event', eventSchema);

export default eventModel;
