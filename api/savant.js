export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { type, season = "2025" } = req.query;

  // Baseball Savant Statcast leaderboard URLs
  const urls = {
    batter: `https://baseballsavant.mlb.com/leaderboard/custom?year=${season}&type=batter&filter=&sort=xwoba&sortDir=desc&min=25&selections=xba,xslg,xwoba,xwobacon,exit_velocity_avg,launch_angle_avg,barrel_batted_rate,hard_hit_percent,k_percent,bb_percent&csv=true`,
    pitcher: `https://baseballsavant.mlb.com/leaderboard/custom?year=${season}&type=pitcher&filter=&sort=xera&sortDir=asc&min=20&selections=xba,xslg,xwoba,xera,exit_velocity_avg,barrel_batted_rate,hard_hit_percent,k_percent,bb_percent,whiff_percent,csw_rate&csv=true`,
  };

  const url = urls[type];
  if (!url) return res.status(400).json({ error: "Invalid type — use 'batter' or 'pitcher'" });

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) return res.status(response.status).json({ error: "Baseball Savant request failed" });

    const csv = await response.text();

    // Parse CSV into array of objects
    const lines = csv.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]]));
    });

    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Request failed", details: err.message });
  }
}
