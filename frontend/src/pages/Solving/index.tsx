import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";
import type {
  PendingResponse,
  SolveResponse,
  SolvedResponse,
} from "@shared/types/api";
import { apiClient } from "@shared/api/client";
import { MOVE_HINTS } from "@shared/constants/cube";
import { applyMove, Cube3D } from "@widgets/Cube3D";
import { Button } from "@shared/ui/Button";
import { clearCubeSession, loadCubeSession } from "@shared/lib/cubeSession";

export function SolvingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state?.response as SolveResponse | undefined;
  const visualFacelets =
    (location.state?.visualFacelets as string | undefined) ??
    loadCubeSession().visualFacelets;
  const [response, setResponse] = useState<SolveResponse | undefined>(initial);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (!response || response.status !== "pending") return;
    const id = window.setInterval(async () => {
      const next = await apiClient.getSolveJob(
        (response as PendingResponse).job_id,
      );
      setResponse(next);
    }, 1000);
    return () => window.clearInterval(id);
  }, [response]);
  useEffect(() => {
    if (!playing || response?.status !== "solved") return;
    const id = window.setInterval(
      () =>
        setStep((old) => {
          if (old >= response.moves.length - 1) {
            setPlaying(false);
            return old;
          }
          return old + 1;
        }),
      1500,
    );
    return () => window.clearInterval(id);
  }, [playing, response]);
  if (!response) {
    navigate("/");
    return null;
  }
  if (response.status === "pending")
    return (
      <section className="mx-auto max-w-xl space-y-6 py-28 text-center">
        <div className="relative mx-auto grid h-20 w-20 place-items-center">
          <div className="absolute inset-0 animate-spin rounded-[24px] border border-violet-400/50" />
          <Sparkles className="text-violet-300" size={28} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-violet-300">
            Подбираем ходы
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Решаем куб</h2>
          <p className="mt-3 text-sm text-white/40">
            Обычно это занимает несколько секунд. Не закрывайте страницу.
          </p>
        </div>
      </section>
    );
  if (response.status === "failed")
    return (
      <section className="card mx-auto max-w-xl space-y-4 p-8 text-center">
        <h2 className="text-2xl font-bold">Не удалось решить куб</h2>
        <p className="text-sm text-white/45">{response.detail}</p>
        <Button
          onClick={() =>
            navigate("/", { state: { facelets: location.state?.facelets } })
          }
        >
          Исправить цвета
        </Button>
      </section>
    );
  const solved = response as SolvedResponse;
  const move = solved.moves[step];
  const displayedFacelets = solved.moves
    .slice(0, step)
    .reduce(
      (state, previousMove) => applyMove(state, previousMove.notation),
      visualFacelets,
    );
  const progress = Math.round(
    ((step + 1) / Math.max(solved.move_count, 1)) * 100,
  );
  return (
    <section className="space-y-7">
      <div>
        <h2 className="text-4xl font-bold tracking-[-.04em] sm:text-5xl">
          Собирайте по шагам
        </h2>
        <p className="mt-3 text-sm text-white/40">
          Сделайте этот ход на своём кубе, затем переходите к следующему.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <div className="card overflow-hidden p-2 sm:p-3">
          <div className="flex items-center justify-between px-3 py-2.5 text-xs text-white/40">
            <span>Модель куба</span>
            <span>{progress}% выполнено</span>
          </div>
          <Cube3D
            facelets={displayedFacelets}
            activeMove={move?.notation}
            animationKey={step}
            replayToken={replay}
          />
        </div>
        <div className="card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[.12em] text-white/30">
              <span>Текущий ход</span>
              <span>
                {step + 1} / {solved.move_count}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="py-10 text-center">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-[34px] border border-violet-300/15 bg-gradient-to-br from-violet-500/20 to-cyan-400/5 text-6xl font-black tracking-[-.06em] text-white shadow-[0_25px_70px_rgba(124,92,255,.18)]">
              {move?.notation ?? "✓"}
            </div>
            <p className="mx-auto mt-6 max-w-xs text-base font-medium leading-6 text-white/70">
              {move ? MOVE_HINTS[move.notation] : "Куб собран!"}
            </p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="secondary"
                className="px-2"
                aria-label="Предыдущий ход"
                icon={<SkipBack size={17} />}
                disabled={step === 0}
                onClick={() => setStep((value) => value - 1)}
              />
              <Button
                variant="secondary"
                className="px-2"
                aria-label="Повторить ход"
                icon={<RotateCcw size={17} />}
                disabled={!move}
                onClick={() => setReplay((value) => value + 1)}
              />
              <Button
                variant="secondary"
                className="px-2"
                aria-label={playing ? "Пауза" : "Автовоспроизведение"}
                icon={playing ? <Pause size={17} /> : <Play size={17} />}
                onClick={() => setPlaying((value) => !value)}
              />
              <Button
                className="px-2"
                aria-label="Следующий ход"
                icon={<SkipForward size={17} />}
                disabled={step >= solved.moves.length - 1}
                onClick={() => setStep((value) => value + 1)}
              />
            </div>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => {
                clearCubeSession();
                navigate("/");
              }}
            >
              Начать с новым кубом
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
