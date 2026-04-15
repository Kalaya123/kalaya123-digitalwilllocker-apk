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

  try {
    // Get audio data from request
    const { audioBase64, language } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Missing audio data" });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Create form data for Groq Whisper
    const FormData = (await import("node:form-data")).default;
    const form = new FormData();
    form.append("file", audioBuffer, {
      filename: "audio.wav",
      contentType: "audio/wav"
    });
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", language || "en");
    form.append("response_format", "text");

    // Call Groq Whisper API
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    const result = await response.text();

    if (response.ok) {
      return res.status(200).json({ text: result.trim() });
    } else {
      return res.status(500).json({ error: result });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
