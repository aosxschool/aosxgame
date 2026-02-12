export type CategoryOptionKey = "A" | "B" | "C" | "D";

export type CategoryQuestionRow = {
  id: number;
  game_code: string;
  category: string;
  points: number;
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: CategoryOptionKey;
  active?: boolean;
};

export type CategoryTile = {
  id: number;
  category: string;
  points: number;
  used: boolean;
  claimedByTeamId?: string;
  question: CategoryQuestionRow;

  solvedByTeamId?: string;
};

export type CategoryPhase = "board" | "question" | "steal" | "reveal";
