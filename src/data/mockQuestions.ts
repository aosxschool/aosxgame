import type { GameCode, Question } from '../types'

const mk = (i: number, game: GameCode, question: string,  answer: string, points: number, timeLimitSec:number, ): Question => ({
  id: `${game}-q${i}`,
  game,
  question,
  answer,
  points,
  timeLimitSec
})


export const QUESTIONS: Question[] = [
  // 2a
  mk(1, '2a', "LIST THE AIRPORTS/AIRFIELDS IN KL SECT 2", "test", 150, 30),
  mk(2, '2a', "NAME THE NATO ALPHABETIC CODE", "Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet, Kilo, Lima, Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu", 100, 30),

  mk(3, '2a', "LIST 3 CHARACTERISTICS OF RBS70", "", 300, 30),
  mk(4, '2a', "WHAT ARE THE 2 TYPES OF AIR DEFENCE", "", 250, 30),

  mk(5, '2a', "LIST OUT ALL THE RADARS USED IN RSAF", "", 200, 30),
  mk(6, '2a', "LIST THE RSAF 4 AIRBASES CODES", "", 300, 30),
  mk(7, '2a', "LIST THE ALERT CODES FOR THE CORRESPINDING MESSAGES 7500, 7600, 7703, 7705", "", 300, 30),
  mk(8, '2a', "LIST 3 ADVANTAGES OF USING IFF", "", 300, 30),
  mk(9, '2a', "WHAT ARE THE IFF MODES?", "", 300, 30),
  mk(10, '2a', "WHAT INFORMATION DOES 3D RADAR PROVIDE?", "", 300, 30),
  mk(11, '2a', "WHAT DOES AOCC STANDS FOR?", "", 300, 30),
  mk(12, '2a', "WHAT DOES MSTF STAND FOR?", "", 300, 30),
  mk(13, '2a', "WHAT ARE THE 4 AIR DEFENCE PRINCIPLES?", "", 300, 30),
  mk(14, '2a', "LIST THE RSAF TRADITIONAL TRAINING AREAS (WSD) IN SCSTA.", "", 300, 30),
  mk(15, '2a', "WHAT ARE THE AIRPIC TEAM POSITIONS FOUND IN 200 SQN?", "", 300, 30),
  mk(16, '2a', "test", "", 300, 30),

  

  // 2b
  mk(1, '2b', "test", "test", 100, 30),
  mk(2, '2b', "test", "test", 150, 30),
  mk(3, '2b', "test", "test", 200, 30),
  mk(4, '2b', "test", "test", 250, 30),
  mk(5, '2b', "test", "test", 300, 30),
  mk(6, '2b', "test", "test", 300, 30),
  mk(7, '2b', "test", "test", 300, 30),
  mk(8, '2b', "test", "test", 300, 30),
  mk(9, '2b', "test", "test", 300, 30),
  mk(10, '2b', "test", "test", 300, 30),
  mk(11, '2b', "test", "test", 300, 30),
  mk(12, '2b', "test", "test", 300, 30),
  mk(13, '2b', "test", "test", 300, 30),
  mk(14, '2b', "test", "test", 300, 30),
  mk(15, '2b', "test", "test", 300, 30),
  mk(16, '2b', "test", "test", 300, 30),

]
