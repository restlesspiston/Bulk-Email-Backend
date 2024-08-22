require('dotenv').config();
const express = require('express');
const apiRoutes = require('./routes/api');
const mongoose = require('mongoose');
const os = require('os');
const { cron1, cron2 } = require('./routes/cron');

const app = express();

const cors = require('cors');

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use(apiRoutes);
app.use('/cron1', cron1);
app.use('/cron2', cron2);

// Function to get the server's IP address
const getServerIpAddress = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            // Check for IPv4 and not loopback address
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'IP address not found';
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, "0.0.0.0", () => {
            const serverIp = getServerIpAddress();
            console.log(`Server is running on http://${serverIp}:${PORT}`);
        });
    } catch (error) {
        console.error(error);
    }
};

connectDB();
