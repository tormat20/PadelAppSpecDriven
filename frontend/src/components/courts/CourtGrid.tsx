import type { MatchView } from "../../lib/types"

type CourtGridProps = {
  matches: MatchView[]
}

export function CourtGrid({ matches }: CourtGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {matches.map((match) => (
        <article key={match.matchId} className="rounded-xl border p-4">
          <h3 className="mb-2 font-semibold">Court {match.courtNumber}</h3>
          <p className="text-sm">{match.teamA.players.map((p) => p.displayName).join(" + ")}</p>
          <p className="my-1 text-xs uppercase text-slate-500">vs</p>
          <p className="text-sm">{match.teamB.players.map((p) => p.displayName).join(" + ")}</p>
        </article>
      ))}
    </div>
  )
}
