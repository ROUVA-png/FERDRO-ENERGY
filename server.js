require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// MongoDB Connection
console.log("MongoDB URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors({ origin: 'https://ferdro-energy.onrender.com/' }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Models
const User = mongoose.model("User", new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    verified: { type: Boolean, default: false },
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now }
}));

const Payment = mongoose.model("Payment", new mongoose.Schema({
    name: String,
    service: String,
    amount: Number,
    paidAmount: Number,
    balanceAmount: Number,
    reference: String,
    email: String,
    solarPanelType: String,
    solarPanelQuantity: Number,
    batteryType: String,
    batteryQuantity: Number,
    batteryKVA: String,
    details: Object,
    date: { type: Date, default: Date.now }
}));

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Registration Route
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: "Email already registered" });
        }
        const newUser = new User({ username: name, email, password: await bcrypt.hash(password, 10) });
        await newUser.save();

        // Send Welcome Email
        transporter.sendMail({
            from: "onoskelvin100@gmail.com",
            to: email,
            subject: "Welcome to FERDRO Energy!",
            text: `Hi ${name},\n\nThank you for registering at FERDRO Energy. Your account has been successfully created. \n\ Please navigate to the dashboard and select the service you would like us to offer you, An admin will be readily available to attend to you\n\n You can also state your request via this mail trail, an admin is also ready to attend to you via mail \n\nBest regards,\nFERDRO Energy Team`
        });

        res.status(201).json({ message: "Registration successful! Check your email." });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Something went wrong!" });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        res.status(200).json({ message: "Login successful", username: user.username, role: user.role });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Paystack Webhook (Dashboard Service)
app.post('/paystack/webhook', async (req, res) => {
    const event = req.body;
    console.log('Webhook Event:', event);

    if (event.event === "charge.success") {
        const details = event.data.metadata;
        const totalAmount = details.totalAmount;
        const paidAmount = event.data.amount / 100; // Convert from kobo to naira
        const balanceAmount = totalAmount - paidAmount;

        const paymentData = {
            name: `${event.data.customer.first_name} ${event.data.customer.last_name}`,
            email: event.data.customer.email,
            service: details.serviceType,
            amount: totalAmount,
            paidAmount: paidAmount,
            balanceAmount: balanceAmount,
            reference: event.data.reference,
            solarPanelType: details.solarPanelType,
            solarPanelQuantity: details.solarPanelQuantity,
            batteryType: details.batteryType,
            batteryQuantity: details.batteryQuantity,
            batteryKVA: details.batteryKVA,
            details: details,
            date: new Date()
        };

        try {
            const newPayment = new Payment(paymentData);
            await newPayment.save();
            console.log('Payment Saved:', newPayment);

            // Send Payment Confirmation to User
            transporter.sendMail({
                from: "onoskelvin100@gmail.com",
                to: paymentData.email,
                subject: "Payment Confirmation - FERDRO Energy",
                text: `Dear ${paymentData.name},\n\nYour payment of ₦${paymentData.paidAmount} for ${paymentData.service} was successful.\n\nService Details:\n- Solar Panel: ${paymentData.solarPanelType} (Qty: ${paymentData.solarPanelQuantity})\n- Battery: ${paymentData.batteryType} (Qty: ${paymentData.batteryQuantity}, KVA: ${paymentData.batteryKVA})\n- Total Service Cost: ₦${paymentData.amount}\n- Amount Paid: ₦${paymentData.paidAmount}\n- Balance Due: ₦${paymentData.balanceAmount}\n\nBest regards,\nFERDRO Energy Team`
            });

            // Send Payment Details to Admin
            transporter.sendMail({
                from: "onoskelvin100@gmail.com",
                to: "onoskelvin100@gmail.com",
                subject: "New Payment Received",
                text: `New payment received:\n\nName: ${paymentData.name}\nEmail: ${paymentData.email}\nService: ${paymentData.service}\nTotal Amount: ₦${paymentData.amount}\nAmount Paid: ₦${paymentData.paidAmount}\nBalance Due: ₦${paymentData.balanceAmount}\nSolar Panel: ${paymentData.solarPanelType} (Qty: ${paymentData.solarPanelQuantity})\nBattery: ${paymentData.batteryType} (Qty: ${paymentData.batteryQuantity}, KVA: ${paymentData.batteryKVA})\nReference: ${paymentData.reference}`
            });

        } catch (error) {
            console.error("Error Saving Payment:", error);
        }
    }
    res.sendStatus(200);
});

// Fetch Payments
app.get('/api/payments', async (req, res) => {
    try {
        res.json(await Payment.find());
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

// Fetch Paystack Transactions
app.get('/fetch-payments', async (req, res) => {
    try {
        const response = await axios.get('https://api.paystack.co/transaction', {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        });

        for (let payment of response.data.data) {
            if (!await Payment.findOne({ reference: payment.reference }) && payment.status === "success") {
                await Payment.create({
                    email: payment.customer.email,
                    amount: payment.amount / 100,
                    reference: payment.reference,
                    date: new Date(payment.paid_at)
                });
            }
        }
        res.json({ message: "Payments fetched and stored successfully." });
    } catch (error) {
        console.error("Fetch Payments Error:", error);
        res.status(500).json({ error: "Failed to fetch payments." });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
