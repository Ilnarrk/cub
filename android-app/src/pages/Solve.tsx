import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import type { SolvedResponse } from "@shared/types/api";
import { MOVE_HINTS } from "@shared/constants/cube";
import { applyMove, Cube3D } from "@widgets/Cube3D";
import {
  clearSession,
  loadSession,
  saveSession,
  type Session,
} from "@/storage";

type RouteState = {
  solution?: SolvedResponse;
  visualFacelets?: string;
  solverFacelets?: string;
};

export function SolvePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as RouteState | null;
  const [session, setSession] = useState<Session | null>(
    state?.solution && state.visualFacelets
      ? {
          version: 1,
          solution: state.solution,
          visualFacelets: state.visualFacelets,
          solverFacelets: state.solverFacelets ?? "",
          step: 0,
        }
      : null,
  );
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    if (!session)
      void loadSession().then((stored) => {
        if (!stored.solution) navigate("/", { replace: true });
        else {
          setSession(stored);
          setStep(
            Math.min(
              stored.step,
              Math.max(0, stored.solution.moves.length - 1),
            ),
          );
        }
      });
  }, [navigate, session]);
  useEffect(() => {
    if (session) void saveSession({ ...session, step });
  }, [session, step]);
  useEffect(() => {
    if (!playing || !session?.solution) return;
    const id = window.setInterval(
      () =>
        setStep((value) => {
          if (value >= session.solution!.moves.length - 1) {
            setPlaying(false);
            return value;
          }
          return value + 1;
        }),
      1500,
    );
    return () => window.clearInterval(id);
  }, [playing, session]);

  const solution = session?.solution;
  const displayed = useMemo(
    () =>
      solution && session
        ? solution.moves
            .slice(0, step)
            .reduce(
              (cube, move) => applyMove(cube, move.notation),
              session.visualFacelets,
            )
        : "",
    [session, solution, step],
  );
  if (!session || !solution)
    return (
      <section className="py-24 text-center text-white/50">
        Восстанавливаем решение…
      </section>
    );
  const move = solution.moves[step];
  const completed = solution.move_count === 0 || !move;
  const progress = completed
    ? 100
    : Math.round(((step + 1) / solution.move_count) * 100);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-3xl font-black">Собирайте по шагам</h2>
        <p className="mt-1 text-sm text-white/45">
          Сделайте показанный ход на физическом кубике.
        </p>
      </div>
      <div className="grid gap-4 landscape:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="card overflow-hidden p-2">
          <div className="flex justify-between px-3 py-2 text-xs text-white/45">
            <span>Модель куба</span>
            <span>{progress}%</span>
          </div>
          <Cube3D
            facelets={displayed || session.visualFacelets}
            activeMove={move?.notation}
            animationKey={step}
            replayToken={replay}
          />
        </div>
        <aside className="card flex flex-col justify-between p-4">
          <div>
            <div className="flex justify-between text-xs text-white/40">
              <span>Текущий ход</span>
              <span>
                {completed ? solution.move_count : step + 1} /{" "}
                {solution.move_count}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="py-8 text-center">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-[30px] border border-violet-300/20 bg-violet-500/15 text-5xl font-black">
                {move?.notation ?? "✓"}
              </div>
              <p className="mx-auto mt-5 max-w-xs text-sm text-white/70">
                {move ? MOVE_HINTS[move.notation] : "Куб собран!"}
              </p>
              <p className="mt-3 text-[10px] text-amber-100/50">
                Быстрое корректное решение без гарантии минимального числа
                ходов.
              </p>
            </div>
          </div>
          <div className="safe-bottom space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <Control
                label="Назад"
                disabled={step === 0}
                onClick={() => setStep((value) => value - 1)}
              >
                <SkipBack />
              </Control>
              <Control
                label="Повтор"
                disabled={!move}
                onClick={() => setReplay((value) => value + 1)}
              >
                <RotateCcw />
              </Control>
              <Control
                label={playing ? "Пауза" : "Играть"}
                disabled={completed}
                onClick={() => setPlaying((value) => !value)}
              >
                {playing ? <Pause /> : <Play />}
              </Control>
              <Control
                label="Вперёд"
                disabled={completed || step >= solution.moves.length - 1}
                onClick={() => setStep((value) => value + 1)}
              >
                <SkipForward />
              </Control>
            </div>
            <button
              className="action action-secondary w-full"
              onClick={() => {
                void clearSession();
                navigate("/");
              }}
            >
              Новый куб
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Control({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="action action-secondary grid place-items-center px-2 [&_svg]:h-5 [&_svg]:w-5"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
