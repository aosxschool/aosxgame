import type { FillBoxesPuzzle, FillCell } from "../types";

/* ===============================
   AUTO BUILD HELPERS (string cells)
   =============================== */

function buildFixedRow(rowIndex: number, values: string[]): FillCell[] {
  return values.map((value, c) => ({
    r: rowIndex,
    c,
    value,
    locked: true,
  }));
}

function buildFixedCol(colIndex: number, values: string[]): FillCell[] {
  return values.map((value, r) => ({
    r,
    c: colIndex,
    value,
    locked: true,
  }));
}

/* ===============================
   YOUR FIXED HEADER VALUES
   =============================== */

// MUST be exactly 14 entries (cols)
const FIRST_ROW: string[] = [
  "MO", "CALLSIGN", "TAIL NO.", "TYPE", "MISSION", "TARGET AO", "POB",
  "IFF3", "ETD", "ATD", "ETA", "ATA", "PILOT", "CO PILOT",
];

// MUST be exactly 11 entries (rows)
const FIRST_COL: string[] = [
  "MO", "1400001", "1400001", "1400001", "1400001", "1400001", "1400001", 
  "1400001", "1400001", "1400001", "1400001"
];

function assertSize(name: string, arr: any[], expected: number) {
  if (arr.length !== expected) {
    throw new Error(`${name} must have exactly ${expected} cells, got ${arr.length}`);
  }
}

assertSize("FIRST_ROW", FIRST_ROW, 14);
assertSize("FIRST_COL", FIRST_COL, 11);

/* ===============================
   PUZZLE
   =============================== */

export const DEMO_FILLBOXES: FillBoxesPuzzle = {
  id: "fill-14x11",
  rows: 11,
  cols: 14,

  passageTitle: "Reference Passage:",
  passageText:
    "// Start of Transmission // \n\n0700H: From LTA Chia, information for you, there will be a total of 10 flights today. The flights will consist of both fighters and choppers. There will be a total of 6 fighters and 4 choppers in operation from 0800H to 1400H. Get back to you with more information. \n\n0710H: From LTA Chia, information for you, TIGER flight or 2x F15s will be conducting a TI mission from 0800H to 1000H with 2 POB each. Leading the flight will be MAJ Kong L T and MAJ Lee T W. Their co-pilot will be CPT Tan J Q and CPT Foo F T respectively. VIPER flight of 2 will follow up join with TIGER flight of 2 at 0900H but will be doing their own General Handling at D4 with 2x F16s. \n\n0725H: From LTA Chia, information for you, from SBAB, 1x CH47 will be conducting troop lift at SBZ at 10000FT with 10 POB. All fighters transiting to exercise caution. They will be adopting callsign STALLION 01. Dy CO 127 SQN, MAJ Lee M S will be leading the flight. Also before that, 1x NH, RABBIT 01 will be conducting an ASW mission at South China Sea with 5 POB at 2000FT and below. Fighters are to remain visual despite the low altitude mission. \n\n0730H: From LTA Chia, information for you, the last mission will be conducted by PYTHON flight of 2x F15s with 2 POB. They will be doing a TI mission at D14/15 from 1100H to 1400H. Supporting the PYTHON flight of two will be 1x MRTT, callsign RAINBOW, will take off from CAB to D14/15 to support air to air refuelling. POB is 10 and ETD is 1100H. AAR is estimated to commence at 1200H. They will RTB together with PYTHON. \n\n0735H: From LTA Chia, information for you, take note 1x AH, callsign REDHAWK 01 will be conducting FCF at AB at 0930H. Leading the flight will be MAJ Tan R T and MAJ Pay V J. Their co-pilot will be CPT Chan R Q and CPT Koh N D respectively. However, they have reported to have taken off early at 0927H but still expected to return at 1000H with no change. The flight will be managed by CPT Chan P L and LTA Toh B C. All pilots to exercise situation. \n\n// End of Transmission //",

  presetCells: [
    ...buildFixedRow(0, FIRST_ROW),

    ...buildFixedCol(0, FIRST_COL),

    { r: 1, c: 2, value: "34", locked: true },
    { r: 1, c: 3, value: "F15", locked: true },
    { r: 1, c: 5, value: "D14/15", locked: true },
    { r: 1, c: 7, value: "4200", locked: true },
    { r: 1, c: 8, value: "0800H", locked: true },
    { r: 1, c: 9, value: "0800H", locked: true },
    { r: 1, c: 10, value: "1000H", locked: true },
    { r: 1, c: 11, value: "1005H", locked: true },
    { r: 1, c: 13, value: "TAN J Q", locked: true },

    { r: 2, c: 2, value: "35", locked: true },
    { r: 2, c: 3, value: "F15", locked: true },
    { r: 2, c: 5, value: "D14/15", locked: true },
    { r: 2, c: 7, value: "4201", locked: true },
    { r: 2, c: 8, value: "0800H", locked: true },
    { r: 2, c: 9, value: "0805H", locked: true },
    { r: 2, c: 10, value: "1000H", locked: true },
    { r: 2, c: 11, value: "1005H", locked: true },
    { r: 2, c: 12, value: "LEE T W", locked: true },

    { r: 3, c: 1, value: "VIPER01", locked: true },
    { r: 3, c: 2, value: "45", locked: true },
    { r: 3, c: 4, value: "GH", locked: true },
    { r: 3, c: 6, value: "1", locked: true },
    { r: 3, c: 7, value: "4202", locked: true },
    { r: 3, c: 8, value: "0900H", locked: true },
    { r: 3, c: 9, value: "0910H", locked: true },
    { r: 3, c: 10, value: "1000H", locked: true },
    { r: 3, c: 11, value: "1020H", locked: true },
    { r: 3, c: 12, value: "TEE U T", locked: true },
    { r: 3, c: 13, value: "-", locked: true },
    
    { r: 4, c: 1, value: "VIPER02", locked: true },
    { r: 4, c: 2, value: "46", locked: true },
    { r: 4, c: 4, value: "GH", locked: true },
    { r: 4, c: 6, value: "1", locked: true },
    { r: 4, c: 7, value: "4203", locked: true },
    { r: 4, c: 8, value: "0900H", locked: true },
    { r: 4, c: 9, value: "0912H", locked: true },
    { r: 4, c: 10, value: "1000H", locked: true },
    { r: 4, c: 11, value: "1030H", locked: true },
    { r: 4, c: 12, value: "TAN K L", locked: true },
    { r: 4, c: 13, value: "-", locked: true },


    { r: 5, c: 2, value: "60", locked: true },
    { r: 5, c: 3, value: "AH", locked: true },
    { r: 5, c: 4, value: "FCF", locked: true },
    { r: 5, c: 5, value: "AB", locked: true },
    { r: 5, c: 6, value: "2", locked: true },
    { r: 5, c: 7, value: "4204", locked: true },
    { r: 5, c: 8, value: "0930H", locked: true },
    { r: 5, c: 11, value: "1005H", locked: true },

    { r: 6, c: 1, value: "RABBIT01", locked: true },
    { r: 6, c: 2, value: "54", locked: true },
    { r: 6, c: 3, value: "AH", locked: true },
    { r: 6, c: 4, value: "ASW", locked: true },
    { r: 6, c: 5, value: "AB", locked: true },
    { r: 6, c: 6, value: "2", locked: true },
    { r: 6, c: 7, value: "4204", locked: true },
    { r: 6, c: 8, value: "1000H", locked: true },
    { r: 6, c: 9, value: "1002H", locked: true },
    { r: 6, c: 10, value: "1100H", locked: true },
    { r: 6, c: 11, value: "1100H", locked: true },
    { r: 6, c: 12, value: "LEE L X", locked: true },
    { r: 6, c: 13, value: "KONG W M", locked: true },

    { r: 7, c: 2, value: "78", locked: true },
    { r: 7, c: 3, value: "VH", locked: true },
    { r: 7, c: 5, value: "SBZ", locked: true },
    { r: 7, c: 7, value: "4206", locked: true },
    { r: 7, c: 8, value: "1030H", locked: true },
    { r: 7, c: 9, value: "1030H", locked: true },
    { r: 7, c: 10, value: "1300H", locked: true },
    { r: 7, c: 11, value: "1305H", locked: true },
    { r: 7, c: 13, value: "KO F T", locked: true },


    { r: 8, c: 2, value: "89", locked: true },
    { r: 8, c: 3, value: "MRTT", locked: true },
    { r: 8, c: 5, value: "D14/15", locked: true },
    { r: 8, c: 6, value: "10", locked: true },
    { r: 8, c: 7, value: "4207", locked: true },
    { r: 8, c: 9, value: "1100H", locked: true },
    { r: 8, c: 11, value: "1310H", locked: true },
    { r: 8, c: 12, value: "CHAN C W", locked: true },
    { r: 8, c: 13, value: "LIM W J", locked: true },

    { r: 9, c: 1, value: "PYTHON01", locked: true },
    { r: 9, c: 2, value: "20", locked: true },
    { r: 9, c: 4, value: "TI", locked: true },
    { r: 9, c: 6, value: "2", locked: true },
    { r: 9, c: 7, value: "4208", locked: true },
    { r: 9, c: 9, value: "1100H", locked: true },
    { r: 9, c: 11, value: "1300H", locked: true },
    { r: 9, c: 12, value: "TAN R T", locked: true },

    { r: 10, c: 1, value: "PYTHON02", locked: true },
    { r: 10, c: 2, value: "21", locked: true },
    { r: 10, c: 4, value: "TI", locked: true },
    { r: 10, c: 6, value: "2", locked: true },
    { r: 10, c: 7, value: "4209", locked: true },
    { r: 10, c: 9, value: "1100H", locked: true },
    { r: 10, c: 11, value: "1302H", locked: true },
    { r: 10, c: 12, value: "PAY V J", locked: true },



  ],

  // ONLY cells users must fill
  answerKey: {
    "1,1": "TIGER01",
    "1,4": "TI",
    "1,6": "2",
    "1,12": "KONG L T",

    "2,1": "TIGER02",
    "2,4": "TI",
    "2,6": "2",
    "2,13": "FOO F T",

    "3,3": "F16",
    "3,5": "D4",

    "4,3": "F16",
    "4,5": "D4",

    "5,1": "REDHAWK01",
    "5,9": "0927H",
    "5,10": "1000H",
    "5,12": "CHAN P L",
    "5,13": "TOH B C",

    "7,1": "STALLION01",
    "7,4": "TROOPLIFT",
    "7,6": "10",
    "7,12": "LEE M S",

    "8,1": "RAINBOW",
    "8,4": "AAR",
    "8,8": "1100H",
    "8,10": "1400H",

    "9,3": "F15",
    "9,5": "D14/15",
    "9,8": "1100H",
    "9,10": "1400H",
    "9,13": "CHAN R Q",

    "10,3": "F15",
    "10,5": "D14/15",
    "10,8": "1100H",
    "10,10": "1400H",
    "10,13": "KOH N D",


    
  },

  caseInsensitive: true,
  trim: true,
};
