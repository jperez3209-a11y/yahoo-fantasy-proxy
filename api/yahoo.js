export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No authorization token provided" });

  const { endpoint } = req.query;
  if (!endpoint) return res.status(400).json({ error: "No endpoint specified" });

  const yahooBase = "https://fantasysports.yahooapis.com/fantasy/v2";
  const url = `${yahooBase}/${endpoint}&format=json`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: authHeader }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: "Yahoo API error", details: text });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Request failed", details: err.message });
  }
}
