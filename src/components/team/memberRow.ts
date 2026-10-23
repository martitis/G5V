/** One player row of the team editor (MemberEditor / TeamEditorDialog). */
export interface MemberRow {
  key: number;
  /** What was typed or pasted. */
  input: string;
  steamId: string | null;
  steamName: string | null;
  image: string | null;
  nickname: string;
  captain: boolean;
  coach: boolean;
  state: "resolving" | "ok" | "invalid";
}
