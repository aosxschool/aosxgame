import { Navigate, useParams } from "react-router-dom";
import GameStartScreen from "../StartScreen/GameStartScreen";
import {
  singlePlayerGames,
  spPlayPath,
  type SinglePlayerGameId,
  type SingleMode,
} from "../../data/appConfig";

export default function SinglePlayerStartPage(props: { navigate: (to: string) => void }) {
  const { mode, gameId } = useParams();

  const m = mode as SingleMode | undefined;
  const id = gameId as SinglePlayerGameId | undefined;

  const game = id ? singlePlayerGames[id] : undefined;

  // invalid route -> go to home (or login if you prefer)
  if (!m || !id || !game) {
    return <Navigate to="/home" replace />;
  }

  // optional: enforce correct mode for the game (prevents /summary/beaconpoints/start)
  if (game.mode !== m) {
    return <Navigate to={`/${game.mode}/${game.id}/start`} replace />;
  }

  return (
    <GameStartScreen
      title={game.title}
      subtitle={game.subtitle ?? "Instructions"}
      bullets={game.bullets}
      tip={game.tip}
      startLabel={game.startLabel ?? "Start"}
      onStart={() => props.navigate(spPlayPath(game.mode, game.id))}
    />
  );
}
