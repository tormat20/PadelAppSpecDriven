import { ResultEntry } from "../../components/matches/ResultEntry"
import {
  getMexicanoSideScoreOptions,
  getSideRelativeSelectionKey,
  toWinnersCourtPayload,
  toRankedBoxPayload,
  toMexicanoPayload,
  type TeamSide,
  type WinnerPayload,
} from "./resultEntry"

type Props = {
  mode: "WinnersCourt" | "Mexicano" | "RankedBox"
  selectedSide: TeamSide
  selectedPayload?: WinnerPayload
  onPayload: (payload: WinnerPayload) => void
}

export function ModeInputs({ mode, selectedSide, selectedPayload, onPayload }: Props) {
  const selectedValue = selectedPayload ? getSideRelativeSelectionKey(selectedPayload, selectedSide) : undefined

  if (mode === "Mexicano") {
    return (
      <ResultEntry
        label=""
        options={getMexicanoSideScoreOptions().map(String)}
        selectedValue={selectedValue}
        layout="grid24"
        onSelect={(selected) => {
          onPayload(toMexicanoPayload(selectedSide, Number(selected)))
        }}
      />
    )
  }

  if (mode === "RankedBox") {
    return (
      <ResultEntry
        label=""
        options={["Win", "Loss", "Draw"]}
        selectedValue={selectedValue}
        layout="triple"
        onSelect={(selected) => onPayload(toRankedBoxPayload(selectedSide, selected as "Win" | "Loss" | "Draw"))}
      />
    )
  }

  return (
    <ResultEntry
      label=""
      options={["Win", "Loss"]}
      selectedValue={selectedValue}
      layout="dual"
      onSelect={(selected) => onPayload(toWinnersCourtPayload(selectedSide, selected as "Win" | "Loss"))}
    />
  )
}
