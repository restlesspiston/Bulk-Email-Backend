const express = require('express');
const Email = require('../models/Email');
const Template = require('../models/Template');

const router = express.Router();

// Store the email template
router.post('/templates', async (req, res) => {
    const { subject, content } = req.body;

    if (!subject || !content) return res.status(400).json({ message: 'Fields cannot be empty!' });

    try {
        // Check if a template already exists
        const existingTemplate = await Template.findOne();
        if (existingTemplate) {
            // If a template exists, update it
            existingTemplate.subject = subject;
            existingTemplate.content = content;
            await existingTemplate.save();
            return res.status(200).json({ message: 'Template saved successfully' });
        }

        // If no template exists, create a new one
        const template = new Template({ subject, content });
        await template.save();
        res.status(201).json({ message: 'Template saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save template' });
    }
});

// Store emails with template reference
router.post('/store', async (req, res) => {
    const { recipientEmails } = req.body;

    try {
        const emails = recipientEmails.map(email => ({
            recipientEmail: email
        }));

        await Email.insertMany(emails);
        res.status(201).json({ message: 'Emails stored successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to store emails' });
    }
});

// Checker route to inform the frontend
router.get('/status', async (req, res) => {
    try {
        const unsentCount = await Email.countDocuments({ sent: false });
        const emailsPerDay = 400;

        let daysRequired = Math.ceil(unsentCount / emailsPerDay);
        let nextSendDate = new Date();
        nextSendDate.setDate(nextSendDate.getDate() + daysRequired);

        // Determine if sending should be allowed or blocked
        const block = unsentCount > 0 ? true : false;
        const message = !block 
            ? 'All emails have been sent'
            : `${nextSendDate.toLocaleDateString()}`;

        res.json({
            message,
            block,
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to check status' });
    }
});

// Delete all emails and template data
router.post('/delete', async (req, res) => {
    try {
        // Delete all emails
        await Email.deleteMany();

        // Delete the single template
        await Template.deleteMany();

        res.status(200).json({ message: 'All emails and templates have been deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete emails and templates.' });
    }
});

module.exports = router;
