export type MascotId = 'eagle' | 'lion' | 'shark' | 'wolf'

export type Team = {
  id: string
  name: string
  color: string
  score: number
  mascotId: MascotId
}

export type BingoQuestion = {
  id: string
  game: string
  question: string
  answer: string
  points: number
  timeLimitSec: number
  category: string
}

export type CategoryQuestion = {
  id: number
  gameCode: string
  category: string

  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: "A" | "B" | "C" | "D"

  points: number
  timeLimitSec: number
}

export type Tile = {
  id: string
  question: BingoQuestion
  claimedByTeamId?: string
}

export type OptionItem = {
  id: string;
  label: string;
};

export type Zone = {
  id: string;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};


export type Screen = 'lobby' | 'game' | 'end' | 'leaderboard'


// FOR CROSSWORD

export type Dir = "across" | "down";

export type Cell = {
  r: number;
  c: number;
  isBlock: boolean;
  solution?: string; 
  entry: string;     
  number?: number;  
};

export type Clue = {
  number: number;
  dir: Dir;
  text: string;
};

export type CrosswordPuzzle = {
  size: number;
  ans: string[][];   
  clues: Clue[];
};

export type MixMatchOption = {
  id: string;
  label: string;
};

export type MixMatchTile = {
  id: string;
  title: string; 
  requiredOptionIds: string[]; 
};

export type MixMatchPuzzle = {
  id: string;
  size: 5; 
  tiles: MixMatchTile[]; 
  options: MixMatchOption[];
};

export type PlacementMap = Record<string, string[]>; 

export type MixMatchEval = {
  allCorrect: boolean;

  tileOptionStatus: Record<string, Record<string, "correct" | "wrong">>;
  tileSummary: Record<
    string,
    { correctCount: number; wrongCount: number; requiredCount: number }
  >;

  correctOptionIds: string[];
  wrongOptionIds: string[];
};


// Fill in Boxes Game
export type CellStatus = "neutral" | "correct" | "wrong";

export type FillCell = {
  r: number;         
  c: number;          
  value: string;     
  locked?: boolean;   
};

export type FillAnswerKey = Record<string, string>; 

export type FillBoxesPuzzle = {
  id: string;
  rows: number;  
  cols: number;  
  passageTitle: string;
  passageText: string;

  presetCells: FillCell[];

  answerKey: FillAnswerKey;

  caseInsensitive?: boolean;
  trim?: boolean;
};
