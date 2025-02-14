require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 10000;

// MongoDB Connection
console.log("mongoDB URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));



// Updated User Schema with isAdmin field
const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
    verified: { type: Boolean, default: false },
    role: { type: String, default: "user" }, // 
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);


// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "onoskelvin100@gmail.com",
        pass: "utxi obvq juff gtnl" // Use App Password, NOT real password
    }
});

// Registration Route
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username: name, email, password: hashedPassword });
        await newUser.save();

        // Send welcome email
        const mailOptions = {
            from: "onoskelvin100@gmail.com",
            to: email,
            subject: "Welcome to FERDRO Energy!",
            text: `Hi ${name},\n\nThank you for registering at FERDRO Energy. Your account has been successfully created. Please navigate to the dashboard and select the service you would like us to offer you, An admin will be readily available to attend to you\n\n You can also state your request via this mail trail, an admin is also ready to attend to you via mail     .\n\nBest regards,\nFERDRO Energy Team`
        };
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.error("Email error:", err);
            else console.log("Email sent:", info.response);
        });

        res.status(201).json({ message: "Registration successful! Check your email." });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Something went wrong, try again!" });
    }
});

// Login Route

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect password" });
        console.log("User role:", user.role);//Debugging user role
       // ✅ Return user role instead of isAdmin
        return res.status(200).json({
            message: "Login successful",
            username: user.username,
            role: user.role, // ✅ Send role ("admin" or "user")
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get All Users (For Admin Page)
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find({}, "email username createdAt _id");
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete User Route (FIXED)
app.delete("/users/:id", async (req, res) => {
    try {
        const userId = req.params.id.trim();

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error("Invalid user ID format:", userId);
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        await User.findByIdAndDelete(userId);
        console.log(`User ${userId} deleted successfully`);
        res.json({ message: "User deleted successfully" });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


app.get("/api/active-users", async (req, res) => {
    try {
        const activeUsers = await User.find({ isActive: true }); // Adjust condition as needed
        res.json(activeUsers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching active users" });
    }
});

app.get('/get-payments', async (req, res) => {
    try {
        const payments = await Payment.find().sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Error fetching payments." });
    }
});


app.post('/save-payment', async (req, res) => {
    try {
        const { name, service, amount, reference } = req.body;

        const newPayment = new Payment({
            name,
            service,
            amount,
            reference,
            date: new Date()
        });

        await newPayment.save();
        res.status(200).json({ message: "Payment saved successfully!" });
    } catch (error) {
        console.error("Error saving payment:", error);
        res.status(500).json({ error: "Error saving payment." });
    }
});

app.get('/api/payments', async (req, res) => {
    try {
        const payments = await Payment.find();  // Fetch all payments from MongoDB
        res.json(payments);  // Send JSON response
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

const Payment = require('./models/payment');  // ✅ Correct import for payment.js in model folder

app.post('/paystack/webhook', async (req, res) => {
    const event = req.body;

    console.log('Received webhook:', event); // Debugging log

    if (event.event === "charge.success") {
        const paymentData = {
            name: event.data.customer.first_name + " " + event.data.customer.last_name,
            service: event.data.metadata.service,
            amount: event.data.amount / 100, // Convert kobo to naira
            reference: event.data.reference,
            date: new Date()
        };

        try {
            const newPayment = new Payment(paymentData);
            await newPayment.save();
            console.log('Payment saved:', newPayment);
        } catch (error) {
            console.error('Error saving payment:', error);
        }
    }

    res.sendStatus(200);
});

const axios = require('axios');

app.get('/fetch-payments', async (req, res) => {
    try {
        const response = await axios.get('https://api.paystack.co/transaction', {
            headers: {
                Authorization: `sk_live_a59f2dc94b0d63f225a9276149cae44880ae3266` // Replace with your Paystack secret key
            }
        });

        const payments = response.data.data; // Get transactions
        for (let payment of payments) {
            const existingPayment = await Payment.findOne({ reference: payment.reference });

            if (!existingPayment && payment.status === "success") {
                await Payment.create({
                    email: payment.customer.email,
                    amount: payment.amount / 100, // Convert from kobo to naira
                    reference: payment.reference,
                    date: new Date(payment.paid_at)
                });
            }
        }

        res.json({ message: "Payments fetched and stored successfully." });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Failed to fetch payments." });
    }
});
