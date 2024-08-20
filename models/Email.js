const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    recipientEmail: { type: String, required: true },
    sent: { type: Boolean, default: false }
});

module.exports = mongoose.model('Email', emailSchema);
