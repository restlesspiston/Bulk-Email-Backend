const Email = require('../models/Email');
const Template = require('../models/Template');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Create a new transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
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

const cron1 = async () => {
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

// Start the cron job for scheduling email sending
const cron2 = async () => {
    try {
        const unsentEmails = await Email.find({ sent: false }).limit(400);

        if (unsentEmails.length > 0) {
            await sendEmails(unsentEmails);
        }
    } catch (error) {
        console.error('Error in cron job:', error);
    }
});

module.exports = { cron1, cron2 };
