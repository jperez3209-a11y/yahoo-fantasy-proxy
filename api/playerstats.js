export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { playerId, days = 14 } = req.query;
  if (!playerId) return res.status(400).json({ error: "playerId required" });

  try {
    const url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=lastXDays&lastXDays=${days}&group=hitting,pitching&sportId=1`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return res.status(response.status).json({ error: "MLB Stats API failed" });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Request failed", details: err.message });
  }
}
