type Props = {
  mode: "Americano" | "Mexicano" | "BeatTheBox"
  onPayload: (payload: any) => void
}

export function ModeInputs({ mode, onPayload }: Props) {
  if (mode === "Mexicano") {
    return (
      <div>
        <button onClick={() => onPayload({ mode: "Mexicano", team1Score: 12, team2Score: 12 })}>
          12 - 12
        </button>
        <button onClick={() => onPayload({ mode: "Mexicano", team1Score: 17, team2Score: 7 })}>
          17 - 7
        </button>
      </div>
    )
  }
  if (mode === "BeatTheBox") {
    return (
      <div>
        <button onClick={() => onPayload({ mode: "BeatTheBox", outcome: "Team1Win" })}>Team 1 Win</button>
        <button onClick={() => onPayload({ mode: "BeatTheBox", outcome: "Team2Win" })}>Team 2 Win</button>
        <button onClick={() => onPayload({ mode: "BeatTheBox", outcome: "Draw" })}>Draw</button>
      </div>
    )
  }
  return (
    <div>
      <button onClick={() => onPayload({ mode: "Americano", winningTeam: 1 })}>Team 1 Win</button>
      <button onClick={() => onPayload({ mode: "Americano", winningTeam: 2 })}>Team 2 Win</button>
    </div>
  )
}
