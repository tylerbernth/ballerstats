import Link from "next/link";
import { getTeamGames, type TeamGame } from "@/lib/teamgames";
import type { Team } from "@/lib/types";
import { H2, TeamLink } from "./ui";

const shortDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

// A team's finished games for its season, each linking to the box score.
export default async function TeamGameLog({ team }: { team: Team }) {
  let games: TeamGame[] = [];
  try {
    games = await getTeamGames(team);
  } catch {
    return null; // leave the section out if Directus cannot be reached
  }
  if (!games.length) return null;
  const anyVideo = games.some((g) => g.videoId);

  return (
    <>
      <H2>Game log</H2>
      <div className="scroll">
        <table className="tbl sticky-first">
          <thead>
            <tr>
              <th>Game</th>
              <th className="l">Opponent</th>
              <th>Result</th>
              {anyVideo && <th>Video</th>}
              <th aria-label="Box score" />
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => {
              const win = g.mine > g.theirs;
              const loss = g.mine < g.theirs;
              return (
                <tr key={g.gameId}>
                  <td>{g.iso ? shortDate(g.iso) : `Game ${i + 1}`}</td>
                  <td className="l">{g.opponent ? <TeamLink team={g.opponent} /> : g.opponentName}</td>
                  <td>
                    <span className={`font-bold ${win ? "text-green-700" : loss ? "text-red-700" : "text-slate-600"}`}>{win ? "W" : loss ? "L" : "T"}</span>{" "}
                    <span className="tabular-nums">{g.mine}-{g.theirs}</span>
                  </td>
                  {anyVideo && (
                    <td>
                      {g.videoId && (
                        <a href={`https://www.youtube.com/watch?v=${g.videoId}`} target="_blank" rel="noopener noreferrer">
                          Watch
                        </a>
                      )}
                    </td>
                  )}
                  <td>
                    <Link href={`/game/${g.gameId}`}>Box score</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
