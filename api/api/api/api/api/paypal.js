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

  const { action, amount, description, orderId } = req.body;

  if (!action) {
    return res.status(400).json({ error: "Missing action" });
  }

  const PAYPAL_API_BASE = "https://api-m.paypal.com";
  const credentials = `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  try {

    // ── Step 1 — Get Access Token ──
    const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${encodedCredentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(500).json({ error: "Failed to get PayPal access token" });
    }

    // ── Step 2 — Create Order ──
    if (action === "create_order") {
      const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2)
            },
            description: description
          }],
          application_context: {
            return_url: "digitalwilllocker://paypal/success",
            cancel_url: "digitalwilllocker://paypal/cancel",
            brand_name: "Digital Will Locker",
            user_action: "PAY_NOW"
          }
        })
      });

      const orderData = await orderResponse.json();
      return res.status(orderResponse.ok ? 200 : 500).json(orderData);
    }

    // ── Step 3 — Capture Order ──
    if (action === "capture_order") {
      const captureResponse = await fetch(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: "{}"
        }
      );

      const captureData = await captureResponse.json();
      return res.status(captureResponse.ok ? 200 : 500).json(captureData);
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
