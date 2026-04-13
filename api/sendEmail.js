export default async function handler(req, res) {

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Security check — only your app can call this
  const secret = req.headers["x-app-secret"];
  if (secret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { toEmail, toName, subject, htmlContent } = req.body;

  // Validate required fields
  if (!toEmail || !subject || !htmlContent) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Digital Will Locker",
          email: "digitalwilllocker@digitalwilllocker.com"
        },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    const result = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, result });
    } else {
      return res.status(500).json({ success: false, result });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
