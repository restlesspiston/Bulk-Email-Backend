const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    subject: { type: String, required: true }, // Subject line for the email
    content: { type: String, required: true }, // HTML content of the email
});

module.exports = mongoose.model('Template', templateSchema);
