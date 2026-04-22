export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { code, code_verifier, client_id, client_secret, redirect_uri } = req.body;

  if (!code || !code_verifier || !client_id || !client_secret) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect_uri || "https://localhost",
    code_verifier,
    client_id,
    client_secret,
  });

  try {
    const yahooRes = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await yahooRes.json();

    if (!yahooRes.ok) {
      return res.status(yahooRes.status).json({ error: data.error_description || "Yahoo token exchange failed", details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy request failed", details: err.message });
  }
}
