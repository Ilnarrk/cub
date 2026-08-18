import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eraser,
  Loader2,
  MousePointer2,
  Rotate3D,
  ShieldCheck,
  Shuffle,
} from "lucide-react";
import type { FaceName } from "@shared/types/api";
import { COLOR_LABELS, FACE_COLORS, FACE_NAMES } from "@shared/constants/cube";
import {
  normalizeFaceletsByCentres,
  validateCubeLocally,
} from "@shared/lib/cubeValidation";
import { apiClient } from "@shared/api/client";
import { Button } from "@shared/ui/Button";
import { Cube3D } from "@widgets/Cube3D";
import { loadCubeSession, saveCubeSession } from "@shared/lib/cubeSession";

const EMPTY_CUBE = "X".repeat(54);

function Palette({
  counts,
  selectedColor,
  onSelect,
}: {
  counts: Record<FaceName, number>;
  selectedColor: FaceName;
  onSelect: (color: FaceName) => void;
}) {
  return (
    <div className="w-[292px]">
      <p className="mb-3 text-sm font-bold text-white">Палитра стикеров</p>
      <div className="grid grid-cols-2 gap-2">
        {FACE_NAMES.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${selectedColor === color ? "border-white/30 bg-white/15 shadow-lg" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
            aria-pressed={selectedColor === color}
          >
            <span
              className="h-8 w-8 shrink-0 rounded-[9px] border border-white/25 shadow-inner"
              style={{ backgroundColor: FACE_COLORS[color] }}
            />
            <span>
              <span className="block text-xs font-semibold text-white">
                {COLOR_LABELS[color]}
              </span>
              <span
                className={
                  counts[color] === 9
                    ? "text-[10px] text-emerald-300"
                    : "text-[10px] text-white/45"
                }
              >
                {counts[color]} из 9
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewColorsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [facelets, setFacelets] = useState(
    () =>
      (location.state as { facelets?: string } | null)?.facelets ??
      loadCubeSession().visualFacelets ??
      EMPTY_CUBE,
  );
  const [selectedColor, setSelectedColor] = useState<FaceName>("U");
  const [loading, setLoading] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [error, setError] = useState("");
  const [physicalCheck, setPhysicalCheck] = useState<{
    checking: boolean;
    valid: boolean;
    detail: string;
  }>({ checking: false, valid: false, detail: "" });

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FACE_NAMES.map((color) => [
          color,
          facelets.split("").filter((item) => item === color).length,
        ]),
      ) as Record<FaceName, number>,
    [facelets],
  );
  const normalizedFacelets = useMemo(
    () => normalizeFaceletsByCentres(facelets),
    [facelets],
  );
  const localIssues = useMemo(() => {
    if (facelets.includes("X")) return validateCubeLocally(facelets);
    if (!normalizedFacelets)
      return [
        {
          code: "centres",
          message: "Шесть центральных стикеров должны быть разного цвета.",
          indices: [],
        },
      ];
    return validateCubeLocally(normalizedFacelets);
  }, [facelets, normalizedFacelets]);
  const issueMessages = useMemo(
    () => [...new Set(localIssues.map((issue) => issue.message))],
    [localIssues],
  );

  useEffect(() => {
    if (localIssues.length > 0) {
      setPhysicalCheck({ checking: false, valid: false, detail: "" });
      return;
    }
    let cancelled = false;
    setPhysicalCheck({ checking: true, valid: false, detail: "" });
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient.validateCube({
          facelets: normalizedFacelets ?? facelets,
        });
        if (!cancelled)
          setPhysicalCheck({
            checking: false,
            valid: response.valid,
            detail: response.detail ?? "",
          });
      } catch {
        if (!cancelled)
          setPhysicalCheck({
            checking: false,
            valid: false,
            detail: "Не удалось проверить состояние куба.",
          });
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [facelets, localIssues.length, normalizedFacelets]);

  const updateIndex = (index: number, color: FaceName) => {
    if (facelets[index] === color) return;
    if (counts[color] >= 9) {
      setError(`Все 9 стикеров цвета «${COLOR_LABELS[color]}» уже отмечены.`);
      return;
    }
    const next = facelets.slice(0, index) + color + facelets.slice(index + 1);
    setFacelets(next);
    saveCubeSession({ visualFacelets: next, solverFacelets: "" });
    setError("");
  };
  const setCube = (next: string) => {
    setFacelets(next);
    saveCubeSession({ visualFacelets: next, solverFacelets: "" });
  };
  const solve = async () => {
    setLoading(true);
    setError("");
    try {
      const solverFacelets = normalizedFacelets ?? facelets;
      saveCubeSession({ visualFacelets: facelets, solverFacelets });
      navigate("/solve", {
        state: {
          response: await apiClient.solveCube({ facelets: solverFacelets }),
          facelets: solverFacelets,
          visualFacelets: facelets,
        },
      });
    } catch (reason) {
      const detail = axios.isAxiosError(reason)
        ? reason.response?.data?.detail
        : undefined;
      setError(
        typeof detail === "string"
          ? detail
          : "Куб не удалось решить. Проверьте цвета и ориентацию граней.",
      );
    } finally {
      setLoading(false);
    }
  };
  const randomize = async () => {
    setRandomizing(true);
    setError("");
    try {
      setCube((await apiClient.randomCube()).facelets);
    } catch {
      setError("Не удалось создать случайную конфигурацию.");
    } finally {
      setRandomizing(false);
    }
  };
  const ready = localIssues.length === 0 && physicalCheck.valid;

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <h2 className="text-balance text-4xl font-bold tracking-[-.045em] text-white sm:text-5xl">
            Кубик 3x3
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent"></span>
          </h2>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_390px]">
        <div className="card overflow-hidden p-2 sm:p-3">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/55">
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_#a78bfa]" />
              3D‑редактор
            </div>
            <div className="hidden items-center gap-4 text-[11px] text-white/35 sm:flex">
              <span className="flex items-center gap-1.5">
                <MousePointer2 size={13} /> Нажмите, чтобы раскрасить
              </span>
              <span className="flex items-center gap-1.5">
                <Rotate3D size={14} /> Тяните, чтобы вращать
              </span>
            </div>
          </div>
          <Cube3D
            facelets={facelets}
            selectedColor={selectedColor}
            onStickerChange={updateIndex}
            fullscreenOverlay={
              <Palette
                counts={counts}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
              />
            }
          />
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.15em] text-white/35">
                  Инструмент
                </p>
                <h3 className="mt-1 text-lg font-bold">Палитра стикеров</h3>
              </div>
              <span className="rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] text-white/40">
                6 цветов
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {FACE_NAMES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-[14px] border p-3 text-left transition-all ${selectedColor === color ? "border-white/30 bg-white/[.1] shadow-[0_10px_30px_rgba(0,0,0,.22)]" : "border-white/[.07] bg-black/15 hover:border-white/15 hover:bg-white/[.055]"}`}
                  aria-pressed={selectedColor === color}
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-[10px] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,.35),0_5px_14px_rgba(0,0,0,.28)]"
                    style={{ backgroundColor: FACE_COLORS[color] }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">
                      {COLOR_LABELS[color]}
                    </span>
                    <span
                      className={
                        counts[color] === 9
                          ? "text-[10px] text-emerald-300"
                          : "text-[10px] text-white/35"
                      }
                    >
                      {counts[color]} / 9
                    </span>
                  </span>
                  {selectedColor === color && (
                    <Check
                      className="absolute right-2 top-2 text-white/65"
                      size={13}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`rounded-[20px] border p-4 ${ready ? "border-emerald-400/20 bg-emerald-400/[.07]" : "border-amber-300/15 bg-amber-300/[.055]"}`}
          >
            {physicalCheck.checking ? (
              <div className="flex items-center gap-3 text-sm text-white/75">
                <Loader2 className="animate-spin text-violet-300" size={18} />
                Проверяем конфигурацию…
              </div>
            ) : ready ? (
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <CheckCircle2 size={19} />
                </span>
                <div>
                  <p className="text-sm font-bold text-emerald-200">
                    Куб готов к решению
                  </p>
                  <p className="text-[11px] text-emerald-100/50">
                    Все элементы совместимы
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-100">
                  <AlertTriangle size={17} /> Продолжите раскрашивать
                </div>
                {issueMessages.slice(0, 2).map((message) => (
                  <p
                    className="pl-6 text-[11px] leading-4 text-amber-50/55"
                    key={message}
                  >
                    {message}
                  </p>
                ))}
                {localIssues.length === 0 && physicalCheck.detail && (
                  <p className="pl-6 text-[11px] text-amber-50/55">
                    {physicalCheck.detail}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              icon={<Eraser size={16} />}
              onClick={() => setCube(EMPTY_CUBE)}
            >
              Сбросить
            </Button>
            <Button
              variant="secondary"
              loading={randomizing}
              icon={<Shuffle size={16} />}
              onClick={randomize}
            >
              Пример
            </Button>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200"
            >
              {error}
            </p>
          )}
          <Button
            className="mt-auto w-full"
            size="lg"
            loading={loading}
            disabled={!ready}
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            onClick={solve}
          >
            Найти решение
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-white/25">
            <ShieldCheck size={12} /> Состояние проверяется перед расчётом
          </p>
        </aside>
      </div>
    </section>
  );
}
