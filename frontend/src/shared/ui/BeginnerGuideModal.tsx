import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  RotateCw,
  X,
} from "lucide-react";
import { cn } from "@shared/lib/utils";

interface BeginnerGuideModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "basics" | "steps" | "algorithms";
type Pattern = "cross" | "middle" | "full" | "sideMatch" | "corners";

interface GuideStep {
  title: string;
  goal: string;
  text: string;
  example: string;
  formula: string;
  hold: string;
  pattern: Pattern;
  color: string;
}

const STEPS: GuideStep[] = [
  {
    title: "Правильный белый крест",
    goal: "Четыре белых ребра стоят вокруг белого центра, а их боковые цвета совпадают с соседними центрами.",
    text: "Найдите бело-красное ребро, совместите красную наклейку с красным центром и доведите белую наклейку к белому центру. Повторите для бело-синего, бело-оранжевого и бело-зелёного рёбер. Уже готовые рёбра временно отводите поворотом белой грани.",
    example:
      "Если белая наклейка ребра смотрит вниз, поворот нужной боковой грани на 180° поднимет её к белому центру.",
    formula: "Собирается по положению; часто нужны F, R, L и повороты на 180°",
    hold: "Во время поиска держите белый центр сверху; закончив крест, переверните куб белой стороной вниз.",
    pattern: "cross",
    color: "#f8fafc",
  },
  {
    title: "Белые углы и первый слой",
    goal: "Белая сторона собрана полностью, нижние ряды четырёх боковых граней совпадают с центрами.",
    text: "Найдите угол с белой наклейкой и определите его место по двум другим цветам. Например, бело-красно-зелёный угол должен оказаться между красным и зелёным центрами. Поставьте его над нужным пазом и повторяйте правый пиф-паф, пока угол не встанет.",
    example:
      "Если нужный угол уже внизу, но развёрнут неверно, один раз выполните формулу, чтобы поднять его, затем установите заново.",
    formula: "R U R' U'",
    hold: "Белая сторона снизу, нужный паз — спереди справа.",
    pattern: "full",
    color: "#f8fafc",
  },
  {
    title: "Рёбра среднего слоя",
    goal: "Два нижних слоя полностью собраны.",
    text: "На верхнем слое найдите ребро без жёлтого цвета. Совместите его переднюю наклейку с центром. Второй цвет покажет, куда должно уйти ребро — вправо или влево. Выполните соответствующую формулу и повторите для остальных рёбер.",
    example:
      "Красно-зелёное ребро: совместите красный цвет с красным центром. Если зелёный центр справа, используйте формулу вставки вправо.",
    formula: "Вправо: U R U' R' U' F' U F · Влево: U' L' U L U F U' F'",
    hold: "Белая сторона снизу, совпавший с центром цвет смотрит на вас.",
    pattern: "middle",
    color: "#2979ff",
  },
  {
    title: "Жёлтый крест",
    goal: "На верхней грани появился жёлтый крест; углы пока не важны.",
    text: "Смотрите только на четыре ребра вокруг жёлтого центра. Возможны точка, угол в форме «Г», линия или готовый крест. Выполните формулу, снова оцените рисунок и при необходимости повторите.",
    example:
      "Линию держите горизонтально. «Г» поверните так, чтобы его жёлтые лучи смотрели вверх и влево на виде сверху.",
    formula: "F R U R' U' F'",
    hold: "Жёлтая сторона сверху. Между повторами можно поворачивать только U.",
    pattern: "cross",
    color: "#ffea00",
  },
  {
    title: "Ориентация жёлтых углов",
    goal: "Все девять жёлтых наклеек смотрят вверх. Последний слой ещё не собран: боковые цвета деталей могут не совпадать с центрами.",
    text: "Найдите сверху неразвёрнутый угол и поставьте его спереди справа. Выполните формулу «рыбка», затем поверните только верхний слой, чтобы подвести следующий неверный угол. Повторяйте, не меняя положение всего куба.",
    example:
      "После формулы куб может выглядеть менее собранным — это нормально. Не вращайте весь куб и не останавливайтесь посреди формулы.",
    formula: "R U R' U R U2 R'",
    hold: "Жёлтая сторона сверху, обрабатываемый угол — спереди справа.",
    pattern: "full",
    color: "#ffea00",
  },
  {
    title: "Совмещение боковых цветов рёбер",
    goal: "Жёлтая плоскость остаётся сверху, а боковой цвет каждого верхнего ребра совпадает с центром своей стороны.",
    text: "После этапа 5 все жёлтые наклейки уже смотрят вверх, но сами рёбра могут быть переставлены местами. Поверните U и найдите два правильно стоящих ребра. Если они соседние, расположите их слева и сзади и выполните формулу. Если правильные рёбра напротив друг друга, сделайте формулу из любого положения, затем получите соседний случай.",
    example:
      "Жёлто-красное ребро сверху выглядит правильно из-за жёлтой наклейки, но собрано лишь тогда, когда его красная боковая наклейка находится над красным центром.",
    formula: "R U R' F' R U R' U' R' F R2 U' R' U'",
    hold: "Жёлтая сторона сверху; два верных соседних ребра — слева и сзади.",
    pattern: "sideMatch",
    color: "#ff5b65",
  },
  {
    title: "Последние углы",
    goal: "Каждый угол находится между центрами своих трёх цветов — куб собран.",
    text: "Найдите угол, который уже стоит между правильными центрами, даже если повёрнут. Расположите его сзади слева, поверните куб жёлтой стороной влево и выполните формулу. Если верного угла нет, сделайте формулу один раз из любого положения и проверьте снова.",
    example:
      "После алгоритма может понадобиться повтор и финальный поворот одной из граней, чтобы все центры совместились.",
    formula: "U2 R U2 R' F2 U2 L' U2 L F2",
    hold: "Перед формулой жёлтая сторона смотрит влево, правильный угол находится сзади.",
    pattern: "corners",
    color: "#ffea00",
  },
];

const ALGORITHMS = [
  {
    name: "Правый пиф-паф",
    formula: "R U R' U'",
    note: "Основное движение для установки углов.",
    side: "right",
  },
  {
    name: "Левый пиф-паф",
    formula: "L' U' L U",
    note: "Зеркальная версия с левой гранью.",
    side: "left",
  },
  {
    name: "Среднее ребро вправо",
    formula: "U R U' R' U' F' U F",
    note: "Переносит верхнее ребро в правый паз.",
    side: "right",
  },
  {
    name: "Среднее ребро влево",
    formula: "U' L' U L U F U' F'",
    note: "Переносит верхнее ребро в левый паз.",
    side: "left",
  },
  {
    name: "Жёлтый крест",
    formula: "F R U R' U' F'",
    note: "Превращает точку, «Г» или линию в крест.",
    side: "top",
  },
  {
    name: "Ориентация жёлтых углов",
    formula: "R U R' U R U2 R'",
    note: "Поворачивает жёлтые наклейки углов вверх; места деталей проверяются позже.",
    side: "top",
  },
  {
    name: "Совмещение верхних рёбер",
    formula: "R U R' F' R U R' U' R' F R2 U' R' U'",
    note: "Переставляет рёбра, сохраняя жёлтые наклейки сверху.",
    side: "top",
  },
  {
    name: "Последние углы",
    formula: "U2 R U2 R' F2 U2 L' U2 L F2",
    note: "Переставляет углы последнего слоя.",
    side: "top",
  },
];

const activeCells: Record<Pattern, number[]> = {
  cross: [1, 3, 4, 5, 7],
  middle: [3, 4, 5],
  full: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  sideMatch: [1, 4],
  corners: [0, 2, 6, 8],
};

function MiniFace({ pattern, color }: { pattern: Pattern; color: string }) {
  return (
    <div className="grid h-20 w-20 shrink-0 grid-cols-3 gap-1 rounded-[18px] border border-white/10 bg-black/35 p-2 shadow-inner">
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className="rounded-[3px] border border-white/[.06]"
          style={{
            backgroundColor: activeCells[pattern].includes(index)
              ? color
              : "rgba(255,255,255,.07)",
            boxShadow: activeCells[pattern].includes(index)
              ? `0 0 12px ${color}35`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

function MoveDiagram({ side }: { side: string }) {
  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-[18px] border border-white/[.07] bg-black/25">
      <div className="grid h-12 w-12 grid-cols-3 gap-0.5 rotate-[-8deg] rounded-lg bg-white/10 p-1">
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={index}
            className={cn(
              "rounded-[2px]",
              side === "right" && index % 3 === 2
                ? "bg-red-400"
                : side === "left" && index % 3 === 0
                  ? "bg-orange-400"
                  : side === "top" && index < 3
                    ? "bg-yellow-300"
                    : "bg-white/20",
            )}
          />
        ))}
      </div>
      <RotateCw
        className="absolute -right-1 -top-1 rounded-full bg-violet-500 p-1.5 text-white shadow-lg"
        size={25}
      />
    </div>
  );
}

function Basics() {
  const notation = [
    ["R", "правая"],
    ["L", "левая"],
    ["U", "верхняя"],
    ["D", "нижняя"],
    ["F", "передняя"],
    ["B", "задняя"],
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-[20px] border border-white/[.07] bg-white/[.035] p-5">
          <Boxes className="text-violet-300" size={22} />
          <h3 className="mt-3 font-bold">Центры</h3>
          <p className="mt-2 text-xs leading-5 text-white/45">
            Шесть центральных деталей задают цвет каждой стороны и не меняются
            местами. Противоположные пары: белый—жёлтый, красный—оранжевый,
            синий—зелёный.
          </p>
        </article>
        <article className="rounded-[20px] border border-white/[.07] bg-white/[.035] p-5">
          <div className="flex gap-1">
            <span className="h-5 w-5 rounded bg-red-400" />
            <span className="h-5 w-5 rounded bg-blue-400" />
          </div>
          <h3 className="mt-3 font-bold">Рёбра</h3>
          <p className="mt-2 text-xs leading-5 text-white/45">
            У ребра две наклейки. Красно-синее ребро всегда должно находиться
            между красным и синим центрами.
          </p>
        </article>
        <article className="rounded-[20px] border border-white/[.07] bg-white/[.035] p-5">
          <div className="flex gap-1">
            <span className="h-5 w-5 rounded bg-white" />
            <span className="h-5 w-5 rounded bg-red-400" />
            <span className="h-5 w-5 rounded bg-blue-400" />
          </div>
          <h3 className="mt-3 font-bold">Углы</h3>
          <p className="mt-2 text-xs leading-5 text-white/45">
            У угла три наклейки. Бело-красно-синий угол ищите только на
            пересечении центров этих трёх цветов.
          </p>
        </article>
      </div>
      <article className="rounded-[20px] border border-violet-400/15 bg-violet-400/[.06] p-5 sm:p-6">
        <h3 className="font-bold">Как читать формулы</h3>
        <p className="mt-2 text-xs leading-5 text-white/50">
          Каждый поворот оценивается так, будто вы смотрите прямо на вращаемую
          грань. Обычная буква — 90° по часовой стрелке, штрих{" "}
          <code className="text-violet-200">'</code> — 90° против часовой, цифра{" "}
          <code className="text-violet-200">2</code> — половина оборота в любую
          сторону.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {notation.map(([letter, face]) => (
            <div
              key={letter}
              className="rounded-xl bg-black/20 px-3 py-2 text-center"
            >
              <code className="text-base font-black text-violet-200">
                {letter}
              </code>
              <p className="mt-1 text-[10px] text-white/35">{face}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-white/[.07] bg-black/20 p-3 text-xs leading-5 text-white/50">
          <strong className="text-white/80">Пример: </strong>
          <code className="text-violet-200">R U R' U'</code> — правая по
          часовой, верхняя по часовой, правая обратно, верхняя обратно. Между
          движениями не перехватывайте куб.
        </div>
      </article>
    </div>
  );
}

export function BeginnerGuideModal({ open, onClose }: BeginnerGuideModalProps) {
  const [tab, setTab] = useState<Tab>("basics");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "basics", label: "Перед началом" },
    { id: "steps", label: "7 этапов" },
    { id: "algorithms", label: "Формулы" },
  ];
  const nextTab: Record<Tab, Tab> = {
    basics: "steps",
    steps: "algorithms",
    algorithms: "basics",
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#101116] shadow-[0_40px_120px_rgba(0,0,0,.7)]"
      >
        <header className="flex items-start justify-between border-b border-white/[.07] px-5 py-5 sm:px-7">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-400/10 text-violet-300">
              <BookOpen size={21} />
            </span>
            <div>
              <h2 id="guide-title" className="text-xl font-bold tracking-tight">
                Как собрать кубик 3×3
              </h2>
              <p className="mt-1 text-xs text-white/40">
                Подробный метод для первого самостоятельного решения
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[.07] bg-white/[.04] p-2.5 text-white/45 transition hover:bg-white/[.09] hover:text-white"
            aria-label="Закрыть справочник"
          >
            <X size={18} />
          </button>
        </header>
        <nav
          className="border-b border-white/[.07] px-3 pt-2 sm:px-7"
          role="tablist"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "border-b-2 px-3 py-3 text-xs font-semibold transition sm:px-4 sm:text-sm",
                tab === item.id
                  ? "border-violet-400 text-white"
                  : "border-transparent text-white/35 hover:text-white/65",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="overflow-y-auto p-5 sm:p-7">
          {tab === "basics" && <Basics />}
          {tab === "steps" && (
            <p className="mb-4 rounded-[18px] border border-cyan-300/15 bg-cyan-300/[.05] p-4 text-xs leading-5 text-cyan-50/60">
              <strong className="text-cyan-50/85">Важно:</strong> «жёлтая
              сторона» и «собранный верхний слой» — не одно и то же. Сначала мы
              поворачиваем все жёлтые наклейки вверх (ориентация), затем
              переставляем рёбра и углы к центрам их боковых цветов
              (расстановка).
            </p>
          )}
          {tab === "steps" && (
            <ol className="space-y-4">
              {STEPS.map((item, index) => (
                <li
                  key={item.title}
                  className="rounded-[22px] border border-white/[.07] bg-white/[.035] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className="flex items-center gap-3 sm:block">
                      <MiniFace pattern={item.pattern} color={item.color} />
                      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-violet-300 sm:mt-3 sm:block sm:text-center">
                        Этап {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold">{item.title}</h3>
                      <p className="mt-1.5 flex gap-2 text-xs leading-5 text-emerald-200/70">
                        <CheckCircle2 className="mt-0.5 shrink-0" size={14} />
                        <span>
                          <strong>Результат:</strong> {item.goal}
                        </span>
                      </p>
                      <p className="mt-3 text-xs leading-5 text-white/50">
                        {item.text}
                      </p>
                      <div className="mt-3 grid gap-2 lg:grid-cols-2">
                        <p className="rounded-xl bg-black/20 p-3 text-[11px] leading-4 text-white/45">
                          <strong className="text-white/70">
                            Как держать:
                          </strong>{" "}
                          {item.hold}
                        </p>
                        <p className="rounded-xl bg-black/20 p-3 text-[11px] leading-4 text-white/45">
                          <strong className="text-white/70">Пример:</strong>{" "}
                          {item.example}
                        </p>
                      </div>
                      <code className="mt-3 block overflow-x-auto whitespace-nowrap rounded-xl border border-violet-400/10 bg-violet-400/[.07] px-3 py-2.5 text-xs font-semibold text-violet-200">
                        {item.formula}
                      </code>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {tab === "algorithms" && (
            <div>
              <p className="mb-4 max-w-3xl text-xs leading-5 text-white/45">
                Сначала выставьте куб так, как указано на нужном этапе, и только
                затем выполняйте формулу слева направо. Закончив всю
                последовательность, проверьте результат; не пытайтесь исправлять
                куб в середине алгоритма.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {ALGORITHMS.map((item) => (
                  <article
                    key={item.name}
                    className="flex items-center gap-4 rounded-[20px] border border-white/[.07] bg-white/[.035] p-4"
                  >
                    <MoveDiagram side={item.side} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold">{item.name}</h3>
                      <p className="mt-1 text-[11px] leading-4 text-white/35">
                        {item.note}
                      </p>
                      <code className="mt-3 block overflow-x-auto whitespace-nowrap rounded-lg bg-violet-400/10 px-2.5 py-2 text-[11px] font-semibold text-violet-200">
                        {item.formula}
                      </code>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-4 rounded-[20px] border border-amber-300/15 bg-amber-300/[.05] p-4 text-xs leading-5 text-amber-100/60">
                <strong className="text-amber-100/85">
                  Если что-то не сходится:
                </strong>{" "}
                проверьте, не смотрели ли вы на противоположную грань при
                определении направления, не пропустили ли штрих и не повернули
                ли весь куб вместо одной грани. Один отдельно перевёрнутый угол
                или одно отдельно перевёрнутое ребро невозможно получить
                обычными ходами — такой куб был разобран и собран механически
                неверно.
              </div>
            </div>
          )}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-white/[.07] px-5 py-4 text-[11px] text-white/30 sm:px-7">
          <span>Сверяйте детали с цветами центров после каждого этапа</span>
          <button
            type="button"
            onClick={() => setTab(nextTab[tab])}
            className="flex shrink-0 items-center gap-1.5 font-semibold text-violet-300 hover:text-violet-200"
          >
            {tab === "basics"
              ? "К этапам"
              : tab === "steps"
                ? "К формулам"
                : "В начало"}
            <ArrowRight size={13} />
          </button>
        </footer>
      </section>
    </div>
  );
}
