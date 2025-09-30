import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load .env

const stripe = new Stripe(process.env.EXPO_SECRET_STRIPE_API_KEY);


const app = express();
app.use(cors());
app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  const { plan } = req.body;

  const prices = {
    Monthly: 999,
    "3 Months": 2499,
    Annual: 7999,
    Lifetime: 14999,
  };

  try {
    // 1️⃣ Create customer
    const customer = await stripe.customers.create();

    // 2️⃣ Create ephemeral key for that customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" }
    );

    // 3️⃣ Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: prices[plan],
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    // 4️⃣ Send all three to client
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
