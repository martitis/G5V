import type { Match } from "@/api/types";
import { displayScore, isCancelled, isLive } from "@/utils/format";

export interface MatchStatus {
  label: string;
  color: string;
}

type Translate = (key: string, values?: Record<string, unknown>) => string;

/** The match result or state as a short label (shared by the match list and the match page). */
export function matchStatus(match: Match, t: Translate): MatchStatus {
  if (isCancelled(match)) return { label: t("Matches.StatusCancelled"), color: "grey" };
  if (isLive(match)) return { label: t("Matches.StatusLive"), color: "error" };
  if (match.end_time == null && match.forfeit != 1) {
    return { label: t("Matches.StatusUpcoming"), color: "info" };
  }
  const winner =
    match.winner == null
      ? null
      : match.winner === match.team1_id
        ? match.team1_string
        : match.winner === match.team2_id
          ? match.team2_string
          : null;
  if (match.forfeit == 1 && winner)
    return { label: t("Matches.StatusForfeit", { team: winner }), color: "warning" };
  if (winner) return { label: t("Matches.StatusWon", { team: winner }), color: "success" };
  const [a, b] = displayScore(match);
  return a === b
    ? { label: t("Matches.StatusTie"), color: "secondary" }
    : { label: t("Matches.StatusFinished"), color: "secondary" };
}
