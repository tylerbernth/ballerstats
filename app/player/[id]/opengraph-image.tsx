import { ImageResponse } from "next/og";
import { assetDataUri, getPlayer, getSeasons, getStats, getTeam } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { agg, groupBy, per } from "@/lib/stats";
import { LEAGUE, SITE_URL } from "@/lib/site";

export const alt = "Player stats card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The preview shown when a player's page is shared in a group chat or on social media.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const player = await getPlayer((await params).id);
  if (!player) return new Response("Not found", { status: 404 });

  const [seasons, rows] = await Promise.all([getSeasons(), getStats({ player: player.id })]);
  const bySeason = groupBy(rows, (r) => String(r.season));
  const season = seasons.find((s) => bySeason.has(String(s.id)));
  const seasonRows = season ? bySeason.get(String(season.id)) ?? [] : [];
  const a = agg(seasonRows);
  const team = seasonRows[0] ? await getTeam(seasonRows[0].team) : null;
  const photo = player.headshot ? await assetDataUri(player.headshot, 480) : null;
  const name = displayName(player);
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const stats = a.gp
    ? [
        { label: "PPG", value: per(a.pts, a.gp) },
        { label: "RPG", value: per(a.reb, a.gp) },
        { label: "APG", value: per(a.ast, a.gp) },
        { label: "GP", value: String(a.gp) },
      ]
    : [];
  const subtitle = [season?.season_name, team && same(team.season, season?.id) ? team.name : null].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1e3a8a", color: "#ffffff", padding: 64, borderBottom: "14px solid #dc2626" }}>
        <div style={{ display: "flex", alignItems: "center", marginRight: 56 }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={380} height={380} style={{ borderRadius: 190, objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ width: 380, height: 380, borderRadius: 190, background: "#bfdbfe", color: "#1e3a8a", fontSize: 150, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {initials}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 28, letterSpacing: 3, color: "#bfdbfe" }}>{LEAGUE.toUpperCase()}</div>
            <div style={{ display: "flex", fontSize: name.length > 18 ? 68 : 84, fontWeight: 800, lineHeight: 1.05, marginTop: 18 }}>{name}</div>
            {subtitle && <div style={{ display: "flex", fontSize: 34, color: "#bfdbfe", marginTop: 14 }}>{subtitle}</div>}
          </div>
          <div style={{ display: "flex" }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", marginRight: 52 }}>
                <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                <div style={{ display: "flex", fontSize: 28, color: "#bfdbfe", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#93c5fd" }}>{new URL(SITE_URL).host}</div>
        </div>
      </div>
    ),
    size,
  );
}
