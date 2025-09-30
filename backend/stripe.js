import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to create PaymentIntent and ephemeral key
app.post("/create-payment-intent", async (req, res) => {
  const { plan } = req.body;

  // Map plan → price in cents
  const prices = {
    Monthly: 999,
    "3 Months": 2499,
    Annual: 7999,
    Lifetime: 14999,
  };

  try {
    // 1️⃣ Create a new customer
    const customer = await stripe.customers.create();

    // 2️⃣ Create ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" }
    );

    // 3️⃣ Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: prices[plan],
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    // 4️⃣ Return client_secret, ephemeral key, and customer ID
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
