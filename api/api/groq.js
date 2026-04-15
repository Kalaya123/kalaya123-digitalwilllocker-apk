export default async function handler(req, res) {

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Security check
  const secret = req.headers["x-app-secret"];
  if (secret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { messages, model, max_tokens, temperature } = req.body;

  if (!messages) {
    return res.status(400).json({ error: "Missing messages" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: max_tokens || 1024,
        temperature: temperature || 0.7
      })
    });

    const result = await response.json();

    if (response.ok) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
