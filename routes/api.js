const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Email = require('../models/Email');
const Template = require('../models/Template');

const router = express.Router();

// Create a new transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    }
});

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

// Function to send emails
const sendEmails = async (batch) => {
    const template = await Template.findOne();
    for (const emailData of batch) {
        try {
            if (!template) {
                throw new Error('Template not found');
            }

            await transporter.sendMail({
                from: process.env.GMAIL_FROM,
                to: emailData.recipientEmail,
                subject: template.subject,
                html: template.content,
            });

            emailData.sent = true;
            await emailData.save();
        } catch (error) {
            console.error(`Failed to send email to ${emailData.recipientEmail}:`, error);
        }
    }
};

// Start the cron job for scheduling email sending
cron.schedule('42 23 * * *', async () => {
    try {
        const unsentEmails = await Email.find({ sent: false }).limit(400);

        if (unsentEmails.length > 0) {
            await sendEmails(unsentEmails);
        }
    } catch (error) {
        console.error('Error in cron job:', error);
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

cron.schedule('0 0 * * *', async () => {
    try {
        const unsentCount = await Email.countDocuments({ sent: false });

        if (unsentCount === 0) {
            // Delete all sent emails
            await Email.deleteMany({ sent: true });

            // Delete the single template
            await Template.deleteMany();

            console.log('All sent emails and the template have been deleted.');
        } else {
            console.log('There are still unsent emails. No deletion performed.');
        }
    } catch (error) {
        console.error('Failed to run cleanup job:', error);
    }
});

module.exports = router;
