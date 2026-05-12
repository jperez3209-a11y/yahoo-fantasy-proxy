export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { date } = req.query;
  const gameDate = date || new Date().toISOString().split("T")[0];

  try {
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${gameDate}&hydrate=probablePitcher,team`;
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return res.status(response.status).json({ error: "MLB API request failed" });

    const data = await response.json();
    const games = [];

    for (const d of data.dates || []) {
      for (const game of d.games || []) {
        const away = game.teams?.away;
        const home = game.teams?.home;

        const awayAbb = away?.team?.abbreviation || null;
        const homeAbb = home?.team?.abbreviation || null;
        const awayName = away?.team?.name || null;
        const homeName = home?.team?.name || null;

        // Fetch pitcher handedness separately if we have pitcher IDs
        const awayPitcher = away?.probablePitcher || null;
        const homePitcher = home?.probablePitcher || null;

        games.push({
          gameId: game.gamePk,
          status: game.status?.detailedState,
          away: {
            team: awayAbb,
            teamName: awayName,
            probablePitcher: awayPitcher ? {
              name: awayPitcher.fullName,
              id: awayPitcher.id,
              throws: awayPitcher.pitchHand?.code || null
            } : null
          },
          home: {
            team: homeAbb,
            teamName: homeName,
            probablePitcher: homePitcher ? {
              name: homePitcher.fullName,
              id: homePitcher.id,
              throws: homePitcher.pitchHand?.code || null
            } : null
          }
        });
      }
    }

    // Fetch pitcher handedness for any pitchers missing it
    const pitcherIds = games
      .flatMap(g => [g.away.probablePitcher?.id, g.home.probablePitcher?.id])
      .filter(Boolean);

    if (pitcherIds.length) {
      await Promise.allSettled(pitcherIds.map(async id => {
        try {
          const r = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}?fields=people,pitchHand,code`);
          const d = await r.json();
          const hand = d.people?.[0]?.pitchHand?.code || null;
          if (hand) {
            games.forEach(g => {
              if (g.away.probablePitcher?.id === id) g.away.probablePitcher.throws = hand;
              if (g.home.probablePitcher?.id === id) g.home.probablePitcher.throws = hand;
            });
          }
        } catch(e) {}
      }));
    }

    return res.status(200).json({ date: gameDate, games });
  } catch (err) {
    return res.status(500).json({ error: "Request failed", details: err.message });
  }
}
