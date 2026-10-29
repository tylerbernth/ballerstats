import { getPlayoffGames, getSeeds, getStats, getTeams, type PlayoffRound } from "./directus";
import { groupBy } from "./stats";
import type { Season, Team } from "./types";

export type Slot = { team?: Team; seed?: number; label?: string; pts?: number; won?: boolean; lost?: boolean };
export type Matchup = { a: Slot; b: Slot; gameId?: string; winner?: Team; loser?: Team };
// first is listed so that first[0] feeds semis[0] and first[1] feeds semis[1] once both first-round games are
// decided (linked is true then). Until then the order is just 4 v 5, then 3 v 6.
export type BracketData = { first: Matchup[]; semis: Matchup[]; final: Matchup; losers: Matchup; champion?: Team; linked: boolean };

// The six-team playoff: seeds 1 and 2 get a bye, 4 plays 5 and 3 plays 6, then seed 1 plays the lowest-seeded
// first-round winner and seed 2 plays the other, and the semifinal winners meet in the final. The two
// first-round losers play each other in losers round 1.
//
// Nothing here uses the schedule. Seeds come from the "seed" field on each team, and a game counts as a
// playoff game when its "playoff_round" field is set. Scores come from the stat rows. Returns null until all
// six seeds are filled in for the season.
export async function getBracket(season: Season): Promise<BracketData | null> {
  try {
    const [teams, seeds, tagged, stats] = await Promise.all([
      getTeams(season.id),
      getSeeds(season.id),
      getPlayoffGames(),
      getStats({ season: season.id }),
    ]);

    const seedById = new Map(seeds.map((s) => [String(s.id), Number(s.seed)]));
    const bySeed = new Map<number, Team>();
    const seedOf = new Map<string, number>();
    for (const t of teams) {
      const s = seedById.get(String(t.id));
      if (s) {
        bySeed.set(s, t);
        seedOf.set(String(t.id), s);
      }
    }
    for (let s = 1; s <= 6; s++) if (!bySeed.has(s)) return null;

    const roundOf = new Map(tagged.map((g) => [String(g.id), g.playoff_round]));
    const played: { round: PlayoffRound; id: string; pts: Map<string, number> }[] = [];
    for (const [gid, rows] of groupBy(stats.filter((r) => r.game != null), (r) => String(r.game))) {
      const round = roundOf.get(gid);
      if (!round) continue;
      const pts = new Map<string, number>();
      for (const r of rows) pts.set(String(r.team), (pts.get(String(r.team)) ?? 0) + (Number(r.points) || 0));
      if (pts.size === 2) played.push({ round, id: gid, pts });
    }

    const slot = (team?: Team, label?: string): Slot => ({ team, label, seed: team ? seedOf.get(String(team.id)) : undefined });

    const play = (round: PlayoffRound, a: Slot, b: Slot): Matchup => {
      const g =
        a.team && b.team
          ? played
              .filter((p) => p.round === round && p.pts.has(String(a.team!.id)) && p.pts.has(String(b.team!.id)))
              .sort((x, y) => Number(y.id) - Number(x.id))[0]
          : undefined;
      if (!g) return { a, b };
      const ap = g.pts.get(String(a.team!.id)) ?? 0;
      const bp = g.pts.get(String(b.team!.id)) ?? 0;
      const decided = ap !== bp;
      const A: Slot = { ...a, pts: ap, won: decided && ap > bp, lost: decided && ap < bp };
      const B: Slot = { ...b, pts: bp, won: decided && bp > ap, lost: decided && bp < ap };
      return {
        a: A,
        b: B,
        gameId: g.id,
        winner: A.won ? a.team : B.won ? b.team : undefined,
        loser: A.lost ? a.team : B.lost ? b.team : undefined,
      };
    };

    const r1a = play("first_round", slot(bySeed.get(4)), slot(bySeed.get(5)));
    const r1b = play("first_round", slot(bySeed.get(3)), slot(bySeed.get(6)));

    // Once both first-round games are done, seed 1 gets the lower-seeded winner (the bigger seed number).
    let low: Team | undefined;
    let high: Team | undefined;
    if (r1a.winner && r1b.winner) {
      const sa = seedOf.get(String(r1a.winner.id)) ?? 0;
      const sb = seedOf.get(String(r1b.winner.id)) ?? 0;
      low = sa > sb ? r1a.winner : r1b.winner;
      high = sa > sb ? r1b.winner : r1a.winner;
    }

    const s1 = play("semifinal", slot(bySeed.get(1)), slot(low, "Lowest-seeded winner"));
    const s2 = play("semifinal", slot(bySeed.get(2)), slot(high, "Other first-round winner"));
    const final = play("final", slot(s1.winner, "Winner of semifinal 1"), slot(s2.winner, "Winner of semifinal 2"));
    const losers = play("losers_round_1", slot(r1a.loser, "Loser of 4 v 5"), slot(r1b.loser, "Loser of 3 v 6"));

    const linked = !!(r1a.winner && r1b.winner);
    const first = linked && low === r1b.winner ? [r1b, r1a] : [r1a, r1b];

    return { first, semis: [s1, s2], final, losers, champion: final.winner, linked };
  } catch {
    return null; // the home page simply leaves the bracket out
  }
}
