import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  BrowserRouter,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import InstructorLoginPage from "./pages/InstructorLoginPage";

import SinglePlayerStartPage from "./components/StartScreen/SinglePlayerStartScreen";
import GamePlayRouter from "./components/StartScreen/GamePlayRouter";

import TeamLobbyPage from "./pages/TeamLobbyPage";

import { supabase } from "./lib/supabase";
import { AppNavBar } from "./components/AppNavBar";
import {
  isSingleMode,
  isSinglePlayerGameId,
  isTeamGameId,
  isTeamMode,
} from "./data/appConfig";

function BlankPage({ title }: { title: string }) {
  return (
    <div className="page">
      <div className="hero compact">
        <div className="brand">AOSX School Game</div>
        <h1 className="title">{title}</h1>
      </div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const rrNavigate = useNavigate();
  const navigate = (to: string) => rrNavigate(to);

  const [authed, setAuthed] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Supabase auth session (persists automatically)
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const pageVariants = useMemo(
    () => ({
      initial: { opacity: 0, y: 10, filter: "blur(6px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: { opacity: 0, y: -10, filter: "blur(6px)" },
    }),
    []
  );

  // Hard gate: nothing except /login is accessible when not authed
  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (!authReady) return null;
    if (!authed) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return <>{children}</>;
  };

  const hideNav = location.pathname === "/login" || !authed;

  /**
   * Dispatcher for `/:mode/:gameId/start`
   * Only single-player games have a start/instructions screen.
   */
  function StartDispatcher() {
    const { mode, gameId } = useParams<{ mode: string; gameId: string }>();
    if (!mode || !gameId) return <Navigate to="/home" replace />;

    if (!isSingleMode(mode) || !isSinglePlayerGameId(gameId)) return <Navigate to="/home" replace />;
    return <SinglePlayerStartPage navigate={navigate} />;
  }

  /**
   * Dispatcher for `/:mode/:gameId/lobby`
   * Only team games have a lobby.
   */
  function LobbyDispatcher() {
    const { mode, gameId } = useParams<{ mode: string; gameId: string }>();
    if (!mode || !gameId) return <Navigate to="/home" replace />;
    if (!isTeamMode(mode) || !isTeamGameId(gameId)) return <Navigate to="/home" replace />;

    return (
      <TeamLobbyPage
        onStart={(topicCode, teams) => {
          rrNavigate(`/${mode}/${gameId}/play`, { state: { topicCode, teams } });
        }}
      />
    );
  }

  /**
   * Shared play route for both team + single-player:
   * - Team games come from lobby -> /:mode/:gameId/play
   * - Single-player start screen -> /:mode/:gameId/play
   */
  function PlayDispatcher() {
    const { mode, gameId } = useParams<{ mode: string; gameId: string }>();
    if (!mode || !gameId) return <Navigate to="/home" replace />;

    const ok =
      (isTeamMode(mode) && isTeamGameId(gameId)) ||
      (isSingleMode(mode) && isSinglePlayerGameId(gameId));

    if (!ok) return <Navigate to="/home" replace />;
    return <GamePlayRouter navigate={navigate} />;
  }

  return (
    <AnimatePresence mode="wait">
      <div className="appBg">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {!hideNav && (
            <AppNavBar
              isLoggedIn={authed}
              onLogoutClick={() => {
                supabase.auth.signOut();
                navigate("/login");
              }}
            />
          )}

          <Routes location={location} key={location.pathname}>
            {/* Default entry: login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public */}
            <Route
              path="/login"
              element={<InstructorLoginPage navigate={navigate} onLogin={() => navigate("/home")} />}
            />

            {/* Protected */}
            <Route
              path="/home"
              element={
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              }
            />

            {/* Single-player start */}
            <Route
              path="/:mode/:gameId/start"
              element={
                <RequireAuth>
                  <StartDispatcher />
                </RequireAuth>
              }
            />

            {/* Team lobby */}
            <Route
              path="/:mode/:gameId/lobby"
              element={
                <RequireAuth>
                  <LobbyDispatcher />
                </RequireAuth>
              }
            />

            {/* Shared play */}
            <Route
              path="/:mode/:gameId/play"
              element={
                <RequireAuth>
                  <PlayDispatcher />
                </RequireAuth>
              }
            />

            {/* Blank placeholders referenced by nav */}
            <Route
              path="/aosx/blank"
              element={
                <RequireAuth>
                  <BlankPage title="AOSX — Blank" />
                </RequireAuth>
              }
            />
            <Route
              path="/wfe/wfe2"
              element={
                <RequireAuth>
                  <BlankPage title="WFE 2" />
                </RequireAuth>
              }
            />

            {/* Unknown route */}
            <Route
              path="*"
              element={authReady && authed ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/aosx-game">
      <AppRoutes />
    </BrowserRouter>
  );
}
