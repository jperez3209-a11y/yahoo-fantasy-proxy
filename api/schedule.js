export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { date } = req.query;
  const gameDate = date || new Date().toISOString().split("T")[0];

  try {
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${gameDate}&hydrate=probablePitcher(note),lineups`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) return res.status(response.status).json({ error: "MLB API request failed" });

    const data = await response.json();
    const games = [];

    for (const date of data.dates || []) {
      for (const game of date.games || []) {
        const away = game.teams?.away;
        const home = game.teams?.home;
        games.push({
          gameId: game.gamePk,
          status: game.status?.detailedState,
          away: {
            team: away?.team?.abbreviation,
            teamName: away?.team?.name,
            probablePitcher: away?.probablePitcher ? {
              name: away.probablePitcher.fullName,
              id: away.probablePitcher.id,
              throws: away.probablePitcher.pitchHand?.code || null
            } : null
          },
          home: {
            team: home?.team?.abbreviation,
            teamName: home?.team?.name,
            probablePitcher: home?.probablePitcher ? {
              name: home.probablePitcher.fullName,
              id: home.probablePitcher.id,
              throws: home.probablePitcher.pitchHand?.code || null
            } : null
          }
        });
      }
    }

    return res.status(200).json({ date: gameDate, games });
  } catch (err) {
    return res.status(500).json({ error: "Request failed", details: err.message });
  }
}
