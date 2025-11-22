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
  const { slug, price, userId, userName } = req.body;

  // Validate inputs
  if (!slug || price === undefined || !userId) {
    return res.status(400).json({ error: "Missing required fields: slug, price, userId" });
  }

  // Convert price to cents (Stripe uses smallest currency unit)
  const amountInCents = Math.round(price * 100);

  // Skip payment for free trial
  if (slug === "free-trial" || amountInCents === 0) {
    return res.json({
      paymentIntent: null,
      ephemeralKey: null,
      customer: null,
      isFree: true
    });
  }

  try {
    // 1️⃣ Create or retrieve customer with metadata
    const customer = await stripe.customers.create({
      metadata: {
        userId: userId,
        userName: userName || "Unknown User",
        subscriptionSlug: slug
      }
    });

    // 2️⃣ Create ephemeral key for that customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" }
    );

    // 3️⃣ Create payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId,
        subscriptionSlug: slug,
        userName: userName || "Unknown User"
      },
      description: `Subscription: ${slug}`,
    });

    // 4️⃣ Send all three to client
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
    });
  } catch (err) {
    console.error("Stripe payment intent error:", err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
