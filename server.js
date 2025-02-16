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
    reference: String,
    email: String,
    details: Object,
    date: { type: Date, default: Date.now }
}));

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "onoskelvin100@gmail.com",
        pass: "utxi obvq juff gtnl"
    }
});

// *Registration Route*
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
            text: `Hi ${name},\n\nThank you for registering. An admin is available to attend to you.\n\nBest regards,\nFERDRO Energy Team`
        });

        res.status(201).json({ message: "Registration successful! Check your email." });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Something went wrong!" });
    }
});

// *Login Route*
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

// *Get All Users (Admin Page)*
app.get("/api/users", async (req, res) => {
    try {
        res.json(await User.find({}, "email username createdAt _id"));
    } catch (error) {
        console.error("User Fetch Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// *Delete User Route*
app.delete("/users/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("User Delete Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// *Paystack Webhook (Dashboard Service)*
app.post('/paystack/webhook', async (req, res) => {
    const event = req.body;
    console.log('Webhook Event:', event);

    if (event.event === "charge.success") {
        const paymentData = {
            name: `${event.data.customer.first_name} ${event.data.customer.last_name}`,
            email: event.data.customer.email,
            service: event.data.metadata.serviceType,
            amount: event.data.amount / 100, // Convert kobo to naira
            reference: event.data.reference,
            details: event.data.metadata,
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
                text: `Dear ${paymentData.name},\n\nYour payment of ₦${paymentData.amount} for ${paymentData.service} was successful.\n\nBest regards,\nFERDRO Energy Team`
            });

            // Send Payment Details to Admin
            transporter.sendMail({
                from: "onoskelvin100@gmail.com",
                to: "onoskelvin100@gmail.com",
                subject: "New Payment Received",
                text: `New payment received:\n\nName: ${paymentData.name}\nEmail: ${paymentData.email}\nService: ${paymentData.service}\nAmount: ₦${paymentData.amount}\nReference: ${paymentData.reference}\nDetails: ${JSON.stringify(paymentData.details, null, 2)}`
            });

        } catch (error) {
            console.error("Error Saving Payment:", error);
        }
    }
    res.sendStatus(200);
});

// *Fetch Payments*
app.get('/api/payments', async (req, res) => {
    try {
        res.json(await Payment.find());
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

// *Fetch Paystack Transactions*
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

// *Start Server*
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
