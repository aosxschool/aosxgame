import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  isSingleMode,
  isSinglePlayerGameId,
  isTeamGameId,
  isTeamMode,
  type SinglePlayerGameId,
  type TeamGameId,
} from "../../data/appConfig";

// single-player pages
import CrosswordPage from "../../pages/WFE/CrosswordPage";
import BeaconPointsPage from "../../pages/BeaconPoints/BeaconPointsPage";
import MixMatchPlayPage from "../../pages/MixMatch/MixMatchPlayPage";

// team-game pages
import BingoPlayPage from "../../pages/Team/BingoPlayPage";
import CategoryPlayPage from "../../pages/Team/Category/CategoryPlayPage";

export default function GamePlayRouter(props: { navigate: (to: string) => void }) {
  const { mode, gameId } = useParams<{ mode: string; gameId: string }>();
  const location = useLocation();

  if (!mode || !gameId) return <Navigate to="/home" replace />;

  // TEAM games: /aos|aosx/:gameId/play
  if (isTeamMode(mode) && isTeamGameId(gameId)) {
    const state = location.state as undefined | { topicCode?: string; teams?: any };
    const topicCode = state?.topicCode;
    const teams = state?.teams;

    // If user refreshed / entered directly, bounce them back to lobby.
    if (!topicCode || !teams) {
      return <Navigate to={`/${mode}/${gameId}/lobby`} replace />;
    }

    const g = gameId as TeamGameId;
    switch (g) {
      case "bingo":
        return (
          <BingoPlayPage game={String(topicCode)} teams={teams} navigate={props.navigate} gameId="bingo"/>
        );
      case "category":
        return <CategoryPlayPage navigate={props.navigate} gameId="category"/>;
      case "mixmatch":
        return <MixMatchPlayPage navigate={props.navigate} gameId="mixmatch" />;
      default:
        return <Navigate to="/home" replace />;
    }
  }

  // SINGLE games: /aosx|wfe/:gameId/play
  if (isSingleMode(mode) && isSinglePlayerGameId(gameId)) {
    const g = gameId as SinglePlayerGameId;
    switch (g) {
      case "crossword":
        return <CrosswordPage navigate={props.navigate} gameId="crossword" />;
      case "beaconpoints":
        return <BeaconPointsPage navigate={props.navigate} gameId="beaconpoints" />;
      default:

        return <Navigate to="/home" replace />;
    }
  }

  return <Navigate to="/home" replace />;
}
