// gemini.js
export async function askGemini(conversation) {
  try {
    const systemPrompt = `
You are a helpful virtual assistant that ONLY talks about fitness, workouts, nutrition, and health-related advice.
If the user asks something unrelated (politics, relationships, tech, etc.), politely decline and redirect back to fitness topics.
Keep responses clear and practical. Limit to about 300 words max.
`;

    // Only keep last 15 messages for performance
    const safeMessages = conversation.slice(-15);

    // Convert conversation to text
    const chatHistory = safeMessages
      .map((msg) => `${msg.isBot ? "Assistant" : "User"}: ${msg.text}`)
      .join("\n");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${chatHistory}` }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // ✅ Check if API returned an error
    if (data.error) {
      if (data.error.code === 429) {
        return "⚠️ I've reached my daily usage limit. Please try again tomorrow!";
      }
      return `⚠️ Error: ${data.error.message || "Something went wrong."}`;
    }

    // ✅ Normal successful response
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t process that."
    );
  } catch (err) {
    console.error("Gemini error:", err);
    return "⚠️ Oops, something went wrong while talking to Gemini.";
  }
}
