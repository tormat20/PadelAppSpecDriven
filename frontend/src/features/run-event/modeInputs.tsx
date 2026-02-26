import { ResultEntry } from "../../components/matches/ResultEntry"
import {
  getMexicanoSideScoreOptions,
  getSideRelativeSelectionKey,
  toAmericanoPayload,
  toBeatTheBoxPayload,
  toMexicanoPayload,
  type TeamSide,
  type WinnerPayload,
} from "./resultEntry"

type Props = {
  mode: "Americano" | "Mexicano" | "BeatTheBox"
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

  if (mode === "BeatTheBox") {
    return (
      <ResultEntry
        label=""
        options={["Win", "Loss", "Draw"]}
        selectedValue={selectedValue}
        layout="triple"
        onSelect={(selected) => onPayload(toBeatTheBoxPayload(selectedSide, selected as "Win" | "Loss" | "Draw"))}
      />
    )
  }

  return (
    <ResultEntry
      label=""
      options={["Win", "Loss"]}
      selectedValue={selectedValue}
      layout="dual"
      onSelect={(selected) => onPayload(toAmericanoPayload(selectedSide, selected as "Win" | "Loss"))}
    />
  )
}
