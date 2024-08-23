require('dotenv').config();
const express = require('express');
const apiRoutes = require('./routes/api');
const mongoose = require('mongoose');
const os = require('os');

const app = express();

const cors = require('cors');

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use(apiRoutes);

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
        await mongoose.connect("mongodb+srv://smartworld69gurugram:q8Vsfe4tJxjbOYe0@restlesspiston.lvm3y.mongodb.net/?retryWrites=true&w=majority&appName=restlesspiston");
        console.log('MongoDB connected');
        const PORT = 8000;
        app.listen(PORT, "0.0.0.0", () => {
            const serverIp = getServerIpAddress();
            console.log(`Server is running on http://${serverIp}:${8000}`);
        });
    } catch (error) {
        console.error(error);
    }
};

connectDB();
