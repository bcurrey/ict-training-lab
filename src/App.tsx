import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  Home,
  HelpCircle,
  ImagePlus,
  Layers3,
  LineChart,
  Lock,
  MousePointer2,
  Play,
  RotateCcw,
  Save,
  ScanSearch,
  Sparkles,
  Target,
  Trophy,
  Upload,
  XCircle,
  Zap
} from "lucide-react";
import { certificationModules, certificationQuizFor, chartQuestions, chartScenarios, getModel, learningPaths, modelLabels, modelOrder, quizQuestions } from "./data";
import { loadAnnotations, loadBookmarks, loadCertificationProgress, loadQuizProgress, loadResults, loadTrainingSession, nextReviewDate, saveAnnotations, saveBookmarks, saveCertificationProgress, saveQuizProgress, saveResults, saveTrainingSession } from "./storage";
import type {
  AnnotationMarker,
  AnnotationTool,
  BookmarkItem,
  Candle,
  CertificationModule,
  CertificationProgress,
  CertificationQuizQuestion,
  ChartQuestion,
  ChartAnnotation,
  ChartCallout,
  ChartScenario,
  Confidence,
  Difficulty,
  ModelKey,
  QuizQuestion,
  QuizResult
} from "./types";

type Page = "start" | "orientation" | "today" | "learn" | "chartLab" | "replay" | "review" | "progress" | "upload" | "more" | "flaw" | "mtf" | "narrative" | "library" | "quiz" | "paths" | "about" | "phone";

const nav = [
  { page: "orientation" as const, label: "Orientation", icon: HelpCircle },
  { page: "start" as const, label: "Start Here", icon: Home },
  { page: "today" as const, label: "Training Session", icon: Target },
  { page: "learn" as const, label: "Learn", icon: BookOpen },
  { page: "chartLab" as const, label: "Chart Drills", icon: ScanSearch },
  { page: "replay" as const, label: "Replay", icon: Play },
  { page: "review" as const, label: "Review", icon: RotateCcw },
  { page: "progress" as const, label: "Progress", icon: BarChart3 },
  { page: "upload" as const, label: "Upload", icon: ImagePlus }
];

const mobileNav = [
  { page: "start" as const, label: "Home", icon: Home },
  { page: "today" as const, label: "Train", icon: Target },
  { page: "chartLab" as const, label: "Drills", icon: ScanSearch },
  { page: "replay" as const, label: "Replay", icon: Play },
  { page: "more" as const, label: "More", icon: Layers3 }
];

const pageTitles: Record<Page, string> = {
  start: "Start Here",
  orientation: "Orientation",
  today: "Training Session",
  learn: "Learn",
  chartLab: "Chart Drills",
  replay: "Replay",
  review: "Review",
  progress: "Progress",
  upload: "Upload",
  more: "More",
  flaw: "Spot the Flaw",
  mtf: "Multi-Timeframe",
  narrative: "Trade Narrative",
  library: "Model Library",
  quiz: "Concept Quiz",
  paths: "Learning Paths",
  about: "About",
  phone: "Use on Phone"
};

const markerLabels = ["liquidity", "MSS", "BOS", "FVG", "IFVG", "BPR", "Breaker", "entry", "stop loss", "target", "invalidation", "note"];
const modeHelp: Record<string, string> = {
  chartLab: "Use this to practice identifying ICT models on chart images. Mark the chart, submit your answer, then compare against the trainer markup.",
  replay: "Use this to train real-time recognition. Future candles are hidden so you are not learning from hindsight.",
  flaw: "Use this to learn why setups are invalid. This helps avoid accepting weak or incomplete models.",
  mtf: "Use this to practice 1H bias, 5m setup, and 1m execution alignment.",
  narrative: "Use this to walk through an entire trade idea from liquidity to target.",
  review: "Use this to repeat missed questions and reinforce weak models with spaced review.",
  upload: "Use this to upload your own chart screenshots, self-grade, and save notes.",
  learn: "Use this as your organized study map. Start with Foundation, then move into Imbalance and Execution.",
  today: "Use this guided workflow when you are ready to train."
};

const liquidityModuleId = "liquidity";
const foundationModuleIds = ["liquidity", "displacement", "mss", "bos", "fvg"];
const liquidityDrills = chartScenarios.filter((scenario) => scenario.mode === "recognition" && scenario.model === "Liquidity");

function getCertificationModule(id: string) {
  return certificationModules.find((module) => module.id === id) ?? certificationModules[0];
}

function nextRequiredVideo(module: CertificationModule, progress: CertificationProgress) {
  return module.videos.find((video) => !progress.watchedVideos[video.id]) ?? module.videos[0];
}

function todayIso() {
  return new Date().toISOString();
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function cls(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resultStats(results: QuizResult[]) {
  const correct = results.filter((result) => result.result === "correct").length;
  const accuracy = results.length ? Math.round((correct / results.length) * 100) : 0;
  const xp = results.reduce((sum, result) => sum + (result.result === "correct" ? 20 + result.difficulty * 5 : 6), 0);
  const avgSpeed = results.filter((result) => result.elapsedMs).length
    ? Math.round(results.filter((result) => result.elapsedMs).reduce((sum, result) => sum + (result.elapsedMs ?? 0), 0) / results.filter((result) => result.elapsedMs).length / 1000)
    : 0;
  const overconfident = results.filter((result) => result.confidence === "high" && result.result === "incorrect").length;
  return { correct, accuracy, xp, avgSpeed, overconfident };
}

function calculateStreak(results: QuizResult[]) {
  const days = new Set(results.map((result) => new Date(result.dateCompleted).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function weakAreas(results: QuizResult[]) {
  return modelOrder
    .map((model) => {
      const byModel = results.filter((result) => result.model === model);
      const incorrect = byModel.filter((result) => result.result === "incorrect").length;
      const accuracy = byModel.length ? Math.round(((byModel.length - incorrect) / byModel.length) * 100) : 0;
      return { model, total: byModel.length, incorrect, accuracy };
    })
    .sort((a, b) => b.incorrect - a.incorrect || a.accuracy - b.accuracy);
}

function masteryFor(results: QuizResult[], model: ModelKey, required = 20) {
  const byModel = results.filter((result) => result.model === model);
  const correct = byModel.filter((result) => result.result === "correct").length;
  const accuracy = byModel.length ? Math.round((correct / byModel.length) * 100) : 0;
  return {
    attempts: byModel.length,
    accuracy,
    passed: byModel.length >= required && accuracy >= 80
  };
}

function phaseStatus(results: QuizResult[]) {
  const liquidity = masteryFor(results, "Liquidity");
  const mss = masteryFor(results, "MSS");
  const bos = masteryFor(results, "BOS");
  const fvg = masteryFor(results, "FVG");
  const foundationPassed = liquidity.passed && mss.passed && bos.passed && fvg.passed;
  const imbalancePassed = foundationPassed && ["IFVG", "BPR", "OrderBlock", "Breaker"].every((model) => masteryFor(results, model as ModelKey).passed);
  return { liquidity, mss, bos, fvg, foundationPassed, imbalancePassed };
}

function moduleStats(module: CertificationModule, progress: CertificationProgress) {
  const watched = module.videos.filter((video) => progress.watchedVideos[video.id]).length;
  const quizPassed = module.videos.filter((video) => (progress.quizScores[video.id] ?? 0) >= 80).length;
  const drills = progress.chartDrills[module.id] ?? 0;
  const replays = progress.replayExercises[module.id] ?? 0;
  const exam = progress.examScores[module.id] ?? 0;
  const videosDone = module.videos.length ? watched / module.videos.length : 1;
  const quizzesDone = module.videos.length ? quizPassed / module.videos.length : 1;
  const drillsDone = Math.min(1, drills / module.chartDrillsRequired);
  const replaysDone = Math.min(1, replays / module.replayRequired);
  const examDone = exam >= module.passingScore ? 1 : 0;
  const completion = Math.round(((videosDone + quizzesDone + drillsDone + replaysDone + examDone) / 5) * 100);
  const certified = completion === 100;
  return { watched, quizPassed, drills, replays, exam, completion, certified };
}

function moduleUnlocked(module: CertificationModule, progress: CertificationProgress) {
  return (module.unlockAfter ?? []).every((id) => {
    const dependency = certificationModules.find((item) => item.id === id);
    return dependency ? moduleStats(dependency, progress).certified : true;
  });
}

function certificationOverview(progress: CertificationProgress) {
  const certified = certificationModules.filter((module) => moduleStats(module, progress).certified);
  const next = certificationModules.find((module) => moduleUnlocked(module, progress) && !moduleStats(module, progress).certified) ?? certificationModules[certificationModules.length - 1];
  const overall = Math.round(certificationModules.reduce((sum, module) => sum + moduleStats(module, progress).completion, 0) / certificationModules.length);
  const level = certified.some((module) => module.level === "Advanced" || module.level === "Master")
    ? "Advanced"
    : certified.some((module) => module.level === "Intermediate")
      ? "Intermediate"
      : "Foundation";
  return { certified, next, overall, level };
}

function calibrationStats(results: QuizResult[]) {
  return {
    highCorrect: results.filter((result) => result.confidence === "high" && result.result === "correct").length,
    lowCorrect: results.filter((result) => result.confidence === "low" && result.result === "correct").length,
    highWrong: results.filter((result) => result.confidence === "high" && result.result === "incorrect").length,
    lowWrong: results.filter((result) => result.confidence === "low" && result.result === "incorrect").length
  };
}

function coachMessages(results: QuizResult[], progress: CertificationProgress) {
  const weak = weakAreas(results).filter((area) => area.total >= 3).slice(0, 2);
  const cal = calibrationStats(results);
  const overview = certificationOverview(progress);
  const messages = [
    `Next certification focus: ${overview.next.title}. Watching videos alone will not certify you.`,
    cal.highWrong > 0 ? `Highest priority: ${cal.highWrong} wrong answers were high-confidence. These are dangerous misunderstandings.` : "Confidence is not showing dangerous overconfidence yet.",
    weak[0] ? `${modelLabels[weak[0].model]} accuracy is ${weak[0].accuracy}%. Focus drills here next.` : "You need more reps before weak concepts are statistically meaningful.",
    "Replay and narrative work matter more than rewatching videos once quizzes are passed."
  ];
  return messages;
}

function adaptivePlan(results: QuizResult[]) {
  const weak = weakAreas(results);
  const target = weak.find((area) => area.total === 0 || area.accuracy < 80)?.model ?? "Liquidity";
  return [
    `10 chart drills: ${modelLabels[target]}`,
    "3 Spot the Trap examples",
    "1 replay with hidden future candles",
    "Review all high-confidence misses",
    "Stop studying concepts above 90% accuracy unless certification requires it"
  ];
}

function DifficultyBadge({ level }: { level: Difficulty }) {
  const labels = {
    1: "L1 Textbook",
    2: "L2 Real Chart",
    3: "L3 Borderline",
    4: "L4 Speed",
    5: "L5 Narrative"
  };
  return <span className={`difficulty difficulty-${level}`}>{labels[level]}</span>;
}

function ConceptDifficultyBadge({ level }: { level: Difficulty }) {
  const labels = {
    1: "L1 Definition",
    2: "L2 Understanding",
    3: "L3 Application",
    4: "L4 Decision Logic",
    5: "L4 Decision Logic"
  };
  return <span className={`difficulty difficulty-${level}`}>{labels[level]}</span>;
}

function ModeHelp({ id }: { id: keyof typeof modeHelp }) {
  return <section className="mode-help"><strong>{pageTitles[id as Page]}</strong><p>{modeHelp[id]}</p></section>;
}

function MiniChart({ candles, revealCount, callouts = [], compact = false, showCallouts = false }: { candles: Candle[]; revealCount?: number; callouts?: ChartCallout[]; compact?: boolean; showCallouts?: boolean }) {
  const visible = candles.slice(0, revealCount ?? candles.length);
  const highs = visible.map((candle) => candle.high);
  const lows = visible.map((candle) => candle.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = Math.max(1, max - min);
  const width = 100;
  const height = compact ? 42 : 62;
  const candleWidth = Math.max(0.9, width / Math.max(visible.length, 1) * 0.58);
  const y = (price: number) => ((max - price) / range) * (height - 8) + 4;

  return (
    <div className={cls("chart-canvas", compact && "compact-chart")}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Candlestick training chart">
        <defs>
          <pattern id={`grid-${compact ? "mini" : "full"}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.25" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#grid-${compact ? "mini" : "full"})`} />
        <path d={`M 0 ${height * 0.5} H 100`} stroke="rgba(246,189,96,0.25)" strokeDasharray="1.5 1.5" strokeWidth="0.45" />
        {visible.map((candle, index) => {
          const x = (index + 0.5) * (width / visible.length);
          const bullish = candle.close >= candle.open;
          const bodyTop = y(Math.max(candle.open, candle.close));
          const bodyBottom = y(Math.min(candle.open, candle.close));
          return (
            <g key={`${candle.open}-${index}`}>
              <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke={bullish ? "#43f0a4" : "#ff5c7a"} strokeWidth="0.45" />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(0.65, bodyBottom - bodyTop)} rx="0.35" fill={bullish ? "#43f0a4" : "#ff5c7a"} />
            </g>
          );
        })}
        {showCallouts && callouts.map((callout) => <ChartOverlay key={callout.id} callout={callout} />)}
      </svg>
    </div>
  );
}

function ChartOverlay({ callout }: { callout: ChartCallout | AnnotationMarker }) {
  if (callout.type === "rectangle") {
    return <rect x={callout.x} y={callout.y} width={callout.width ?? 10} height={callout.height ?? 10} fill="rgba(68,214,255,0.14)" stroke="#44d6ff" strokeWidth="0.7" rx="1" />;
  }
  if (callout.type === "arrow") {
    return (
      <g>
        <line x1={callout.x} y1={callout.y} x2={callout.x2 ?? callout.x + 8} y2={callout.y2 ?? callout.y - 8} stroke="#f6bd60" strokeWidth="0.8" />
        <circle cx={callout.x2 ?? callout.x + 8} cy={callout.y2 ?? callout.y - 8} r="1.4" fill="#f6bd60" />
      </g>
    );
  }
  return <circle cx={callout.x} cy={callout.y} r="1.8" fill="#0b1118" stroke="#43f0a4" strokeWidth="0.9" />;
}

function ChartPreview({ scenario, compact = false, revealCount, showCallouts = false }: { scenario: ChartScenario; compact?: boolean; revealCount?: number; showCallouts?: boolean }) {
  if (!scenario.imageSrc) {
    return <MiniChart candles={scenario.candles} revealCount={revealCount} callouts={scenario.callouts} compact={compact} showCallouts={showCallouts} />;
  }
  return (
    <div className={cls("chart-canvas image-chart", compact && "compact-chart")}>
      <img src={scenario.imageSrc} alt={`${scenario.market ?? "Chart"} ${scenario.timeframe} example`} />
      {showCallouts && scenario.callouts.map((callout) => (
        <span
          className={cls("trainer-callout", callout.type === "rectangle" && "trainer-box", callout.type === "arrow" && "trainer-arrow")}
          key={callout.id}
          style={{
            left: `${callout.x}%`,
            top: `${callout.y}%`,
            width: callout.type === "rectangle" ? `${callout.width ?? 12}%` : undefined,
            height: callout.type === "rectangle" ? `${callout.height ?? 8}%` : undefined
          }}
        >
          {callout.label}
        </span>
      ))}
    </div>
  );
}

function markupComparison(markers: AnnotationMarker[], scenario: ChartScenario) {
  const userLabels = markers.map((marker) => marker.label.toLowerCase());
  const expected = scenario.callouts.map((callout) => callout.label.toLowerCase());
  const got = expected.filter((label) => userLabels.some((user) => label.includes(user) || user.includes(label)));
  const missed = expected.filter((label) => !got.includes(label));
  return {
    got: got.length ? got.join(", ") : "No trainer labels matched yet",
    missed: missed.length ? missed.join(", ") : "Nothing major missed"
  };
}

function chartScenarioHasFeatures(scenario: ChartScenario, features: string[] = []) {
  if (!features.length) return true;
  const available = [
    ...(scenario.tags ?? []),
    ...(scenario.requiredVisibleFeatures ?? []),
    ...scenario.callouts.map((callout) => callout.label),
    scenario.prompt,
    scenario.answer,
    scenario.explanation
  ].join(" ").toLowerCase();
  return features.every((feature) => available.includes(feature.toLowerCase()));
}

function validatedChartForQuestion(question: QuizQuestion) {
  if (!question.requiresChart || !question.chartScenarioId) return null;
  const scenario = chartScenarios.find((item) => item.id === question.chartScenarioId);
  if (!scenario) return null;
  return chartScenarioHasFeatures(scenario, question.requiredVisibleFeatures) ? scenario : null;
}

function validatedChartForChartQuestion(question: ChartQuestion) {
  const scenario = chartScenarios.find((item) => item.id === question.chartScenarioId);
  if (!scenario || !question.trainerMarkup.length) return null;
  return chartScenarioHasFeatures(scenario, question.requiredVisibleFeatures) ? scenario : null;
}

function InteractiveChart({
  scenario,
  revealCount,
  annotations,
  setAnnotations,
  showAnswer
}: {
  scenario: ChartScenario;
  revealCount?: number;
  annotations: AnnotationMarker[];
  setAnnotations: (markers: AnnotationMarker[]) => void;
  showAnswer?: boolean;
}) {
  const [tool, setTool] = useState<AnnotationTool>("marker");
  const [label, setLabel] = useState("liquidity");
  const [draft, setDraft] = useState<AnnotationMarker | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<AnnotationMarker[][]>([]);
  const [future, setFuture] = useState<AnnotationMarker[][]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const push = (next: AnnotationMarker[]) => {
    setHistory([...history, annotations]);
    setFuture([]);
    setAnnotations(next);
  };
  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture([annotations, ...future]);
    setHistory(history.slice(0, -1));
    setAnnotations(previous);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory([...history, annotations]);
    setFuture(future.slice(1));
    setAnnotations(next);
  };

  const point = (event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement | HTMLSpanElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 62
    };
  };

  const onStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const p = point(event);
    if (tool === "rectangle" || tool === "arrow") {
      if (!draft) {
        setDraft({ id: "draft", label, x: p.x, y: p.y, type: tool });
        return;
      }
      const marker: AnnotationMarker = tool === "rectangle"
        ? { ...draft, id: crypto.randomUUID(), width: p.x - draft.x, height: p.y - draft.y }
        : { ...draft, id: crypto.randomUUID(), x2: p.x, y2: p.y };
      push([...annotations, { ...marker, zIndex: annotations.length + 1, visible: true }]);
      setDraft(null);
      return;
    }
    const text = tool === "text" ? window.prompt("Note text", label) || label : label;
    push([...annotations, { id: crypto.randomUUID(), label, x: p.x, y: p.y, type: tool, text, zIndex: annotations.length + 1, visible: true }]);
  };

  const dragMarker = (id: string, event: React.DragEvent<HTMLSpanElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 62;
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    setAnnotations(annotations.map((marker) => marker.id === id ? { ...marker, x, y } : marker));
  };

  const moveMarker = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!movingId || !ref.current) return;
    const p = point(event);
    setAnnotations(annotations.map((marker) => marker.id === movingId ? { ...marker, x: p.x, y: p.y } : marker));
  };
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if (event.ctrlKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  const selected = annotations.find((marker) => marker.id === selectedId);
  const updateSelected = (patch: Partial<AnnotationMarker>) => selectedId && push(annotations.map((marker) => marker.id === selectedId ? { ...marker, ...patch } : marker));

  return (
    <div className="chart-workbench">
      <div className="chart-toolbar">
        <button onClick={undo}>Undo Last Annotation</button>
        <button onClick={redo}>Redo</button>
        <button onClick={() => push([])}>Clear All</button>
        {(["marker", "rectangle", "arrow", "text"] as AnnotationTool[]).map((item) => <button className={cls(tool === item && "active")} key={item} onClick={() => setTool(item)}>{item}</button>)}
        <select value={label} onChange={(event) => setLabel(event.target.value)}>
          {markerLabels.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="interactive-chart" ref={ref} onClick={onStageClick} onPointerMove={moveMarker} onPointerUp={() => setMovingId(null)} onPointerCancel={() => setMovingId(null)}>
        <ChartPreview scenario={scenario} revealCount={revealCount} showCallouts={showAnswer} />
        {annotations.filter((marker) => marker.visible !== false).map((marker) => (
          <span
            className={cls("chart-label", marker.type === "rectangle" && "box-label", marker.type === "arrow" && "arrow-label", selectedId === marker.id && "selected")}
            draggable
            key={marker.id}
            onPointerDown={(event) => {
              event.stopPropagation();
              setMovingId(marker.id);
              setSelectedId(marker.id);
            }}
            onDragEnd={(event) => dragMarker(marker.id, event)}
            style={{
              left: `${marker.x}%`,
              top: `${(marker.y / 62) * 100}%`,
              width: marker.type === "rectangle" ? `${marker.width ?? 12}%` : undefined,
              height: marker.type === "rectangle" ? `${((marker.height ?? 10) / 62) * 100}%` : undefined
              , zIndex: marker.zIndex ?? 2,
              background: marker.color
            }}
          >
            {marker.text ?? marker.label}
          </span>
        ))}
      </div>
      <aside className="annotation-sidebar">
        <strong>Annotations</strong>
        {annotations.map((marker) => (
          <div className={cls("annotation-object", selectedId === marker.id && "active")} key={marker.id}>
            <button onClick={() => setSelectedId(marker.id)}>{marker.label}</button>
            <button onClick={() => push(annotations.map((item) => item.id === marker.id ? { ...item, visible: item.visible === false } : item))}>{marker.visible === false ? "Show" : "Hide"}</button>
            <button onClick={() => push(annotations.filter((item) => item.id !== marker.id))}>Delete</button>
          </div>
        ))}
        {selected && <div className="object-editor"><input value={selected.label} onChange={(event) => updateSelected({ label: event.target.value })} /><input type="color" value={selected.color ?? "#43f0a4"} onChange={(event) => updateSelected({ color: event.target.value })} /><button onClick={() => push([...annotations, { ...selected, id: crypto.randomUUID(), x: selected.x + 2, y: selected.y + 2, zIndex: annotations.length + 1 }])}>Duplicate</button><button onClick={() => updateSelected({ zIndex: 99 })}>Front</button><button onClick={() => updateSelected({ zIndex: 1 })}>Back</button></div>}
      </aside>
    </div>
  );
}

function ProgressSummary({ results }: { results: QuizResult[] }) {
  const stats = resultStats(results);
  const due = results.filter((result) => new Date(result.nextReviewDate) <= new Date()).length;
  const mastered = modelOrder.filter((model) => {
    const byModel = results.filter((result) => result.model === model);
    return byModel.length >= 5 && byModel.filter((result) => result.result === "correct").length / byModel.length >= 0.8;
  }).length;
  const cards = [
    { label: "Training reps", value: results.length, icon: Gauge },
    { label: "Accuracy", value: `${stats.accuracy}%`, icon: Target },
    { label: "Streak", value: calculateStreak(results), icon: Flame },
    { label: "Mastered", value: mastered, icon: Trophy },
    { label: "XP", value: stats.xp, icon: Zap },
    { label: "Review due", value: due, icon: RotateCcw }
  ];
  return (
    <div className="metric-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return <section className="metric-card" key={card.label}><Icon size={20} /><p>{card.label}</p><strong>{card.value}</strong></section>;
      })}
    </div>
  );
}

function CertificationTracker({ progress, setPage }: { progress: CertificationProgress; setPage: (page: Page) => void }) {
  const overview = certificationOverview(progress);
  const liquidity = moduleStats(getCertificationModule(liquidityModuleId), progress);
  return (
    <section className="panel certification-tracker">
      <div className="section-title">
        <div><span>Certification Tracker</span><h2>{overview.level} Level</h2></div>
      </div>
      <div className="mvp-focus-card">
        <div>
          <span>Current MVP focus</span>
          <strong>Earn Liquidity Certification first</strong>
          <p>Everything starts here: identify buy-side and sell-side liquidity, separate raids from breakouts, then use review to correct misses.</p>
        </div>
        <b>{liquidity.completion}%</b>
      </div>
      <div className="cert-summary">
        <div><strong>{overview.overall}%</strong><span>overall completion</span></div>
        <div><strong>{overview.next.title}</strong><span>next required module</span></div>
      </div>
      <div className="cert-list">
        {certificationModules.slice(0, 9).map((module) => {
          const stats = moduleStats(module, progress);
          const unlocked = moduleUnlocked(module, progress);
          return <div className={cls("cert-row", stats.certified && "certified", !unlocked && "locked")} key={module.id}><span>{stats.certified ? "Done" : unlocked ? "Open" : "Lock"}</span><strong>{stats.certified ? module.certification : module.title}</strong><b>{stats.completion}%</b></div>;
        })}
      </div>
    </section>
  );
}

function CertificationMiniProgress({ progress }: { progress: CertificationProgress }) {
  const module = getCertificationModule(liquidityModuleId);
  const stats = moduleStats(module, progress);
  const steps: Array<[string, boolean]> = [
    ["Watch Video", stats.watched > 0],
    ["Concept Quiz", stats.quizPassed > 0],
    ["Chart Quiz", false],
    ["Drill", stats.drills > 0],
    ["Replay", stats.replays > 0],
    ["Review", true],
    ["Final Exam", stats.exam >= module.passingScore]
  ];
  return (
    <section className="panel mini-progress">
      <div><strong>Liquidity Certification</strong><span>{stats.completion}% complete</span></div>
      <div className="session-progress">{steps.map(([label, done]) => <span className={cls(done && "done")} key={String(label)}>{done ? "Done" : "Open"} {label}</span>)}</div>
    </section>
  );
}

function OrientationPage({ setPage }: { setPage: (page: Page) => void }) {
  const loop = ["Lesson", "Quiz", "Drill", "Replay", "Review", "Certification"];
  return (
    <div className="page-grid">
      <section className="panel start-panel">
        <div>
          <span>Orientation</span>
          <h2>Learn ICT concepts by practicing them.</h2>
          <p>ICT Training Lab is a deliberate-practice trainer for pattern recognition. It is not a signal service, strategy service, trade recommendation engine, or financial advice.</p>
          <button className="primary-button solo-action" onClick={() => setPage("start")}>Start Lesson</button>
        </div>
        <div className="loop-visual">{loop.map((item, index) => <div className="flow-node" key={item}><span>{index + 1}</span><strong>{item}</strong>{index < loop.length - 1 && <ChevronRight />}</div>)}</div>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>What each tab does</span><h2>Simple map</h2></div></div>
        <div className="tab-guide">
          {[
            ["Start Here", "Shows current certification progress and the next required action."],
            ["Training Session", "Runs the complete loop: lesson, quiz, drill, replay, review, summary."],
            ["Learn", "Reference library with concepts, videos, notes, examples, and checklists."],
            ["Chart Drills", "Static chart recognition. Mark liquidity, MSS, BOS, FVG, entry, and invalidation, then compare against trainer markup."],
            ["Replay", "Hidden-future candle training so you practice before future candles are revealed."],
            ["Review", "Spaced repetition for missed questions and weak concepts."],
            ["Progress", "Certification requirements, locked concepts, accuracy, and mastery."],
            ["Upload", "Personal chart screenshots for self-grading and notes."]
          ].map(([title, body]) => <article key={title}><strong>{title}</strong><p>{body}</p></article>)}
        </div>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>Boundaries</span><h2>What this app is not</h2></div></div>
        <div className="onboarding-grid">{["Not a signal service", "Not a trade copier", "Not an alert service", "Not financial advice", "Not a prediction engine"].map((item) => <article key={item}><strong>{item}</strong><p>It teaches context and recognition; it does not tell you what to trade.</p></article>)}</div>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>Certifications</span><h2>How unlocking works</h2></div></div>
        <div className="mode-list">
          <p><strong>Complete in under 3 minutes:</strong> read this page, then start Liquidity.</p>
          <p><strong>Certification means performance:</strong> watch required videos, pass quizzes, complete drills, complete replay, and pass the final exam.</p>
          <p><strong>Locked concepts stay locked:</strong> Displacement unlocks only after Liquidity Certification is complete.</p>
          <p><strong>Chart drills:</strong> mark the chart first, then compare against trainer markup. The goal is recognition, not prediction.</p>
          <p><strong>Replay:</strong> future candles are hidden so you practice reading the setup before hindsight.</p>
        </div>
      </section>
    </div>
  );
}

function QuestionResult({ result }: { result: QuizResult }) {
  return (
    <article className={cls("result-row", result.result === "correct" ? "correct" : "incorrect")}>
      {result.result === "correct" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <div>
        <strong>{modelLabels[result.model]}</strong>
        <p>{result.question}</p>
        <span>Answer: {result.correctAnswer} - Confidence: {result.confidence ?? "n/a"} - Review {shortDate(result.nextReviewDate)}</span>
      </div>
    </article>
  );
}

function ReviewQueue({ results, onPractice }: { results: QuizResult[]; onPractice: (model?: ModelKey) => void }) {
  const due = results.filter((result) => new Date(result.nextReviewDate) <= new Date() || result.result === "incorrect");
  return (
    <section className="panel">
      <div className="section-title"><div><span>Spaced Review</span><h2>{due.length} items ready</h2></div><button className="primary-button" onClick={() => onPractice(due[0]?.model)}>Practice due model</button></div>
      <div className="stack">{due.length ? due.slice(0, 10).map((result) => <QuestionResult key={result.id} result={result} />) : <p className="empty">No reviews due. Missed questions will appear here later.</p>}</div>
    </section>
  );
}

function WeakAreasPanel({ results }: { results: QuizResult[] }) {
  return (
    <section className="panel">
      <div className="section-title"><div><span>Adaptive Focus</span><h2>Weak areas by model</h2></div></div>
      <div className="stack">
        {weakAreas(results).slice(0, 5).map((area) => (
          <div className="weak-row" key={area.model}>
            <div><strong>{modelLabels[area.model]}</strong><span>{area.total ? `${area.incorrect} misses` : "No attempts yet"}</span></div>
            <div className="bar"><i style={{ width: `${area.accuracy}%` }} /></div>
            <b>{area.total ? `${area.accuracy}%` : "New"}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScenarioPicker({ scenarios, selected, setSelected }: { scenarios: ChartScenario[]; selected: ChartScenario; setSelected: (scenario: ChartScenario) => void }) {
  return (
    <div className="scenario-strip">
      {scenarios.map((scenario) => (
        <button className={cls(selected.id === scenario.id && "active")} key={scenario.id} onClick={() => setSelected(scenario)}>
          <ChartPreview scenario={scenario} compact />
          <strong>{scenario.title}</strong>
          <span>{modelLabels[scenario.model]} - {scenario.timeframe}</span>
        </button>
      ))}
    </div>
  );
}

function ConfidencePicker({ value, onChange }: { value: Confidence; onChange: (value: Confidence) => void }) {
  return <div className="segmented confidence">{(["low", "medium", "high"] as Confidence[]).map((item) => <button className={cls(value === item && "active")} key={item} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

function ChartTrainingMode({ scenarios, results, setResults, saveAnnotation, bookmarks = [], setBookmarks }: { scenarios: ChartScenario[]; results: QuizResult[]; setResults: (results: QuizResult[]) => void; saveAnnotation?: (scenario: ChartScenario, markers: AnnotationMarker[]) => void; bookmarks?: BookmarkItem[]; setBookmarks?: (bookmarks: BookmarkItem[]) => void }) {
  const [selected, setSelected] = useState(scenarios[0]);
  const [markers, setMarkers] = useState<AnnotationMarker[]>([]);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [assist, setAssist] = useState(true);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    setMarkers([]);
    setAnswer("");
    setConfidence("medium");
    setShowAnswer(false);
    setStartedAt(Date.now());
  }, [selected.id]);

  const submit = (choice = answer) => {
    const correct = choice === selected.answer || Boolean(selected.flaw && choice === selected.flaw);
    const result: QuizResult = {
      id: crypto.randomUUID(),
      model: selected.model,
      mode: selected.mode === "invalid" ? "spotFlaw" : selected.mode === "mtf" ? "mtf" : selected.mode === "narrative" ? "narrative" : "chart",
      question: selected.prompt,
      myAnswer: choice || `${markers.length} annotation(s)`,
      correctAnswer: selected.answer,
      explanation: selected.explanation,
      result: correct ? "correct" : "incorrect",
      difficulty: selected.difficulty,
      dateCompleted: todayIso(),
      nextReviewDate: nextReviewDate(correct, selected.difficulty),
      confidence,
      elapsedMs: Date.now() - startedAt
    };
    const next = [result, ...results];
    setResults(next);
    saveResults(next);
    setShowAnswer(true);
  };
  const comparison = markupComparison(markers, selected);
  const has = (term: string) => markers.some((marker) => marker.label.toLowerCase().includes(term));
  const addBookmark = () => {
    if (!setBookmarks) return;
    const next = [{ id: crypto.randomUUID(), type: selected.mode === "replay" ? "replay" as const : "chart" as const, title: selected.title, refId: selected.id, model: selected.model, createdAt: todayIso(), note: selected.prompt }, ...bookmarks];
    setBookmarks(next);
    saveBookmarks(next);
  };

  return (
    <div className="sim-layout">
      <ScenarioPicker scenarios={scenarios} selected={selected} setSelected={setSelected} />
      <section className="panel sim-panel">
        <div className="section-title">
          <div><span>{selected.timeframe} - {modelLabels[selected.model]}</span><h2>{selected.prompt}</h2></div>
          <div className="action-row"><button className="ghost-button" onClick={() => setShowHelp(true)}><HelpCircle size={17} />Help</button><button className="ghost-button" onClick={addBookmark}><Bookmark size={17} />Bookmark</button><DifficultyBadge level={selected.difficulty} /></div>
        </div>
        <section className="mode-help drill-instructions">
          <strong>How to complete a chart drill</strong>
          <p>First drill walkthrough: spend 60 seconds reading this box. Then read the question, choose the tool, mark the chart, submit your answer, and compare against trainer markup.</p>
          <div className="tool-guide">
            <span><strong>Marker:</strong> exact points.</span>
            <span><strong>Arrow:</strong> candle or reaction.</span>
            <span><strong>Rectangle:</strong> liquidity pools, FVGs, BPRs, order blocks.</span>
            <span><strong>Text:</strong> reasoning.</span>
          </div>
        </section>
        {assist && !showAnswer && <div className="mode-help"><strong>Beginner assist</strong><p>Hint: liquidity often sits near recent swings. Look for displacement after a sweep, then check whether an imbalance or structure break supports the read.</p><button className="ghost-button" onClick={() => setAssist(false)}>Hide hints</button></div>}
        <InteractiveChart scenario={selected} annotations={markers} setAnnotations={setMarkers} showAnswer={showAnswer} />
        <div className="precheck">
          <span className={cls(has("liquidity") && "done")}>Liquidity marked</span>
          <span className={cls((has("mss") || has("bos")) && "done")}>MSS/BOS marked</span>
          <span className={cls(has("fvg") && "done")}>FVG marked</span>
          <span className="done">Confidence selected</span>
        </div>
        <div className="decision-row">
          <div>
            <label>Confidence</label>
            <ConfidencePicker value={confidence} onChange={setConfidence} />
          </div>
          <div>
            <label>Decision</label>
            <div className="choice-grid compact-choices">
              {selected.choices.map((choice) => <button key={choice} onClick={() => { setAnswer(choice); submit(choice); }}>{choice}</button>)}
            </div>
          </div>
        </div>
        <div className="action-row">
          <button className="ghost-button" onClick={() => saveAnnotation?.(selected, markers)}><Save size={17} />Save annotations</button>
          <button className="primary-button" onClick={() => submit()}><MousePointer2 size={17} />Submit markup</button>
          <button className="ghost-button" onClick={() => setShowAnswer(true)}>Reveal answer</button>
        </div>
        {showAnswer && (
          <div className="answer-panel">
            <strong>What am I learning?</strong>
            <p><strong>Correct answer:</strong> {selected.answer}</p>
            <p><strong>Why it is correct:</strong> {selected.explanation}</p>
            <p><strong>What you got right:</strong> {comparison.got}</p>
            <p><strong>What you missed:</strong> {comparison.missed}</p>
            <p><strong>Why the other answers are wrong:</strong> the alternatives either skip context, treat a model as a guaranteed signal, or ignore the stated invalidation.</p>
            <p><strong>Concept trained:</strong> {modelLabels[selected.model]} recognition with context filtering.</p>
            <p><strong>Mistake prevented:</strong> {selected.mistakeTrained ?? "taking a pattern label without liquidity, displacement, timeframe alignment, and risk definition."}</p>
            <p><strong>Example type:</strong> {selected.exampleType ?? "realistic"}</p>
            <div className="score-grid">
              {["Liquidity", "MSS", "BOS", "FVG", "Narrative"].map((item) => <span key={item}><strong>{item} Score</strong><b>{markers.some((marker) => marker.label.toLowerCase().includes(item.toLowerCase().split(" ")[0])) ? "80%" : "40%"}</b></span>)}
              <span><strong>Overall Score</strong><b>{comparison.missed === "Nothing major missed" ? "90%" : "62%"}</b></span>
            </div>
            <div className="trainer-compare"><div><strong>Your Markup</strong><ChartPreview scenario={selected} showCallouts={false} /></div><div><strong>Trainer Markup</strong><ChartPreview scenario={selected} showCallouts /></div></div>
          </div>
        )}
        {showHelp && <div className="help-modal"><section className="panel"><div className="section-title"><div><span>Chart Drill Help</span><h2>How chart drills work</h2></div><button className="ghost-button" onClick={() => setShowHelp(false)}>Close</button></div><p>The goal is not to predict price. The goal is to identify concepts before seeing trainer markup.</p><div className="mode-list"><p><strong>Marker:</strong> liquidity, swing highs/lows, important candles.</p><p><strong>Arrow:</strong> displacement, MSS, BOS, narrative direction.</p><p><strong>Rectangle:</strong> FVG, IFVG, BPR, order block, breaker, premium/discount.</p><p><strong>Text:</strong> narrative, notes, reasoning, context.</p></div><div className="answer-panel"><strong>Example answer preview</strong><p>A complete answer usually marks liquidity, MSS/BOS, FVG, entry area, invalidation, and target. Compare your markup to trainer markup after submitting.</p></div></section></div>}
      </section>
    </div>
  );
}

function ReplayMode({ results, setResults }: { results: QuizResult[]; setResults: (results: QuizResult[]) => void }) {
  const replayScenarios = chartScenarios.filter((scenario) => scenario.mode === "replay");
  const scenario = replayScenarios[0] ?? chartScenarios[0];
  const [reveal, setReveal] = useState(scenario.revealIndex);
  const [markers, setMarkers] = useState<AnnotationMarker[]>([]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setReveal((value) => Math.min(value + 1, scenario.candles.length)), 850);
    return () => window.clearInterval(timer);
  }, [playing, scenario.candles.length]);

  const submitReplay = () => {
    const enough = markers.length >= 3;
    const result: QuizResult = {
      id: crypto.randomUUID(),
      model: scenario.model,
      mode: "chart",
      question: "Replay identification drill",
      myAnswer: `${markers.length} markers`,
      correctAnswer: scenario.answer,
      explanation: scenario.explanation,
      result: enough ? "correct" : "incorrect",
      difficulty: scenario.difficulty,
      dateCompleted: todayIso(),
      nextReviewDate: nextReviewDate(enough, scenario.difficulty),
      confidence: "medium"
    };
    const next = [result, ...results];
    setResults(next);
    saveResults(next);
    setReveal(scenario.candles.length);
  };

  return (
    <section className="panel sim-panel">
      <div className="section-title">
        <div><span>Replay Simulator</span><h2>{scenario.title}</h2></div>
        <div className="replay-clock"><Clock3 size={17} /> Candle {reveal} / {scenario.candles.length}</div>
      </div>
      <InteractiveChart scenario={scenario} revealCount={reveal} annotations={markers} setAnnotations={setMarkers} showAnswer={reveal === scenario.candles.length} />
      <div className="replay-controls">
        <button className="ghost-button" onClick={() => setReveal((value) => Math.min(value + 1, scenario.candles.length))}>Next candle</button>
        <button className="ghost-button" onClick={() => setReveal((value) => Math.min(value + 5, scenario.candles.length))}>Next 5</button>
        <button className="primary-button" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play slowly"}</button>
        <button className="ghost-button" onClick={() => setReveal(scenario.candles.length)}>Reveal future</button>
        <button className="primary-button" onClick={submitReplay}>Score replay</button>
      </div>
      <div className="answer-panel"><strong>Mission</strong><p>Before revealing future candles, mark liquidity, MSS, BOS, FVG, IFVG, breaker, entry, and invalidation when they appear.</p></div>
      <section className="mission-panel">
        {["Find liquidity sweep", "Find MSS", "Find first valid FVG", "Identify invalidation", "Identify draw on liquidity"].map((item) => <span key={item}>{item}</span>)}
      </section>
    </section>
  );
}

function MtfMode({ results, setResults }: { results: QuizResult[]; setResults: (results: QuizResult[]) => void }) {
  return <ChartTrainingMode scenarios={chartScenarios.filter((scenario) => scenario.mode === "mtf")} results={results} setResults={setResults} />;
}

function NarrativeMode({ results, setResults }: { results: QuizResult[]; setResults: (results: QuizResult[]) => void }) {
  const scenario = chartScenarios.find((item) => item.mode === "narrative") ?? chartScenarios[0];
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [markers, setMarkers] = useState<AnnotationMarker[]>([]);
  const steps = scenario.narrativeSteps ?? [];
  const complete = step >= steps.length - 1;
  const submit = () => {
    const result: QuizResult = {
      id: crypto.randomUUID(),
      model: scenario.model,
      mode: "narrative",
      question: scenario.prompt,
      myAnswer: Object.values(notes).join(" | ") || "Narrative completed",
      correctAnswer: scenario.answer,
      explanation: scenario.explanation,
      result: "correct",
      difficulty: scenario.difficulty,
      dateCompleted: todayIso(),
      nextReviewDate: nextReviewDate(true, scenario.difficulty),
      confidence: "medium"
    };
    const next = [result, ...results];
    setResults(next);
    saveResults(next);
  };
  return (
    <div className="narrative-grid">
      <section className="panel">
        <div className="section-title"><div><span>Trade Narrative Mode</span><h2>{scenario.title}</h2></div><DifficultyBadge level={5} /></div>
        <InteractiveChart scenario={scenario} annotations={markers} setAnnotations={setMarkers} showAnswer={complete} />
      </section>
      <section className="panel decision-panel">
        <span className="step-count">Step {step + 1} / {steps.length}</span>
        <h2>{steps[step]}</h2>
        <textarea value={notes[step] ?? ""} onChange={(event) => setNotes({ ...notes, [step]: event.target.value })} placeholder="Write the decision logic, not a prediction." />
        <div className="action-row">
          <button className="ghost-button" onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
          <button className="primary-button" onClick={() => complete ? submit() : setStep(step + 1)}>{complete ? "Complete narrative" : "Next decision"}</button>
        </div>
        {complete && <div className="answer-panel"><strong>Trainer notes</strong><p>{scenario.explanation}</p><p>{scenario.answer}</p></div>}
      </section>
    </div>
  );
}

function MtfPanels() {
  const scenario = chartScenarios.find((item) => item.mode === "mtf");
  if (!scenario?.panels) return null;
  return (
    <section className="panel">
      <div className="section-title"><div><span>Side-by-side context</span><h2>HTF bias, setup, execution</h2></div></div>
      <div className="mtf-grid">
        {scenario.panels.map((panel) => <article className="mtf-card" key={panel.label}><strong>{panel.label} - {panel.timeframe}</strong><MiniChart candles={panel.candles} compact /><p>{panel.note}</p></article>)}
      </div>
    </section>
  );
}

function LearningPaths({ results }: { results: QuizResult[] }) {
  const stats = resultStats(results);
  return (
    <div className="path-grid">
      {learningPaths.map((path) => {
        const locked = stats.accuracy < path.unlockAccuracy;
        const pathResults = results.filter((result) => path.models.includes(result.model));
        const done = Math.min(100, pathResults.length * 10);
        return (
          <article className={cls("path-card", locked && "locked")} key={path.id}>
            <div className="section-title"><div><span>{path.level}</span><h2>{path.title}</h2></div>{locked ? <Lock /> : <CheckCircle2 />}</div>
            <div className="bar"><i style={{ width: `${done}%` }} /></div>
            <div className="chip-row">{path.models.map((model) => <span className="chip" key={model}>{modelLabels[model]}</span>)}</div>
            <ul className="checklist">{path.lessons.map((lesson) => <li key={lesson}><CheckCircle2 size={16} />{lesson}</li>)}</ul>
            <p>{locked ? `Unlock at ${path.unlockAccuracy}% total accuracy.` : "Unlocked. Continue building clean reps."}</p>
          </article>
        );
      })}
    </div>
  );
}

function RelationshipMap() {
  const flow = ["Liquidity Sweep", "Displacement", "MSS", "FVG Creation", "Mitigation", "Continuation"];
  return (
    <section className="panel">
      <div className="section-title"><div><span>Sequence Logic</span><h2>Model relationship map</h2></div></div>
      <div className="flow-map">{flow.map((item, index) => <div className="flow-node" key={item}><span>{index + 1}</span><strong>{item}</strong>{index < flow.length - 1 && <ChevronRight />}</div>)}</div>
    </section>
  );
}

function DailyDrills({ onStart }: { onStart: (minutes: number) => void }) {
  return (
    <section className="panel">
      <div className="section-title"><div><span>Daily Drills</span><h2>Fast recognition sessions</h2></div></div>
      <div className="drill-grid">
        {[5, 10].map((minutes) => <button className="drill-card" key={minutes} onClick={() => onStart(minutes)}><Clock3 /><strong>{minutes}-minute drill</strong><span>Accuracy, speed, streak, confidence</span></button>)}
        <button className="drill-card" onClick={() => onStart(3)}><Zap /><strong>Rapid fire</strong><span>Chart-first recognition reps</span></button>
      </div>
    </section>
  );
}

function CoachPanel({ results, progress }: { results: QuizResult[]; progress: CertificationProgress }) {
  return (
    <section className="panel">
      <div className="section-title"><div><span>Coach Mode</span><h2>Study redirection</h2></div></div>
      <div className="coach-list">{coachMessages(results, progress).map((message) => <p key={message}>{message}</p>)}</div>
    </section>
  );
}

function AdaptivePlan({ results }: { results: QuizResult[] }) {
  return (
    <section className="panel">
      <div className="section-title"><div><span>Adaptive Engine</span><h2>Custom training plan</h2></div></div>
      <div className="today-list">{adaptivePlan(results).map((item, index) => <article key={item}><b>{index + 1}</b><div><strong>{item}</strong><p>Generated from weak concepts, overconfidence, and missed patterns.</p></div></article>)}</div>
    </section>
  );
}

function ProgressEnhancements({ results, progress, setProgress, bookmarks }: { results: QuizResult[]; progress: CertificationProgress; setProgress: (progress: CertificationProgress) => void; bookmarks: BookmarkItem[] }) {
  const stats = resultStats(results);
  const cal = calibrationStats(results);
  const drillResults = results.filter((result) => result.mode === "chart" || result.mode === "spotFlaw");
  const replayResults = results.filter((result) => result.question.toLowerCase().includes("replay"));
  const certified = certificationModules.filter((module) => moduleStats(module, progress).certified).length;
  const liquidityCertified = moduleStats(getCertificationModule(liquidityModuleId), progress).certified;
  if (!liquidityCertified) {
    return (
      <div className="page-grid">
        <section className="panel">
          <div className="section-title"><div><span>Progress</span><h2>Finish Liquidity Certification first</h2></div></div>
          <p className="definition">Advanced dashboards stay hidden until the foundation is complete. For now, focus only on the requirements below.</p>
        </section>
        <CertificationPath progress={progress} setProgress={setProgress} />
      </div>
    );
  }
  return (
    <div className="page-grid">
      <CertificationPath progress={progress} setProgress={setProgress} />
      <ProgressSummary results={results} />
      <section className="panel">
        <div className="section-title"><div><span>Performance Dashboard</span><h2>Mastery metrics</h2></div></div>
        <div className="metric-grid">
          <section className="metric-card"><Gauge /><p>Learning Velocity</p><strong>{results.length ? `${Math.min(100, results.length * 2)}%` : "0%"}</strong></section>
          <section className="metric-card"><RotateCcw /><p>Concept Retention</p><strong>{stats.accuracy}%</strong></section>
          <section className="metric-card"><Trophy /><p>Certifications</p><strong>{certified}</strong></section>
          <section className="metric-card"><Clock3 /><p>Time Studied</p><strong>{Math.round(results.length * 1.5)}m</strong></section>
          <section className="metric-card"><ScanSearch /><p>Drill Accuracy</p><strong>{drillResults.length ? Math.round((drillResults.filter((r) => r.result === "correct").length / drillResults.length) * 100) : 0}%</strong></section>
          <section className="metric-card"><Play /><p>Replay Accuracy</p><strong>{replayResults.length ? Math.round((replayResults.filter((r) => r.result === "correct").length / replayResults.length) * 100) : 0}%</strong></section>
        </div>
      </section>
      <section className="panel"><div className="section-title"><div><span>Confidence Calibration</span><h2>Dangerous misunderstandings</h2></div></div><div className="score-grid"><span><strong>Correct + High</strong><b>{cal.highCorrect}</b></span><span><strong>Correct + Low</strong><b>{cal.lowCorrect}</b></span><span><strong>Wrong + High</strong><b>{cal.highWrong}</b></span><span><strong>Wrong + Low</strong><b>{cal.lowWrong}</b></span></div></section>
      <CoachPanel results={results} progress={progress} />
      <AdaptivePlan results={results} />
      <section className="panel"><div className="section-title"><div><span>Bookmarks</span><h2>Review later</h2></div></div><div className="cert-list">{bookmarks.length ? bookmarks.map((item) => <div className="cert-row" key={item.id}><Bookmark size={16} /><strong>{item.title}</strong><b>{item.type}</b></div>) : <p className="empty">No bookmarks yet.</p>}</div></section>
      <section className="panel"><div className="section-title"><div><span>Mastery Heatmap</span><h2>Strongest and weakest models</h2></div></div><div className="stack">{weakAreas(results).map((area) => <div className="weak-row" key={area.model}><div><strong>{modelLabels[area.model]}</strong><span>{area.total} attempts</span></div><div className="bar"><i style={{ width: `${area.accuracy}%` }} /></div><b>{area.accuracy}%</b></div>)}</div></section>
    </div>
  );
}

function ModelLibrary({ startQuiz }: { startQuiz: (model?: ModelKey) => void }) {
  const [selectedModel, setSelectedModel] = useState<ModelKey>("MSS");
  const model = getModel(selectedModel);
  return (
    <div className="library-layout">
      <div className="model-grid">
        {modelOrder.map((key) => {
          const item = getModel(key);
          return (
            <article className="model-card" key={key}>
              <ChartPreview scenario={chartScenarios.find((scenario) => scenario.model === key) ?? chartScenarios[0]} compact />
              <h3>{item.title}</h3>
              <p>{item.definition}</p>
              <div className="card-actions"><button className="ghost-button" onClick={() => setSelectedModel(key)}>Study</button><button className="primary-button" onClick={() => startQuiz(key)}>Quiz</button></div>
            </article>
          );
        })}
      </div>
      <section className="panel model-detail">
        <div className="section-title"><div><span>{model.shortName}</span><h2>{model.title}</h2></div><button className="primary-button" onClick={() => startQuiz(model.key)}>Quiz me</button></div>
        <p className="definition">{model.definition}</p>
        <h3>Mechanical checklist</h3><ul className="checklist">{model.checklist.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul>
        <div className="two-col"><div><h3>Validates</h3><ul className="checklist">{model.validates.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></div><div><h3>Invalidates</h3><ul className="checklist">{model.invalidates.map((item) => <li key={item}><XCircle size={16} />{item}</li>)}</ul></div></div>
      </section>
    </div>
  );
}

function TextQuiz({ results, setResults, initialModel }: { results: QuizResult[]; setResults: (results: QuizResult[]) => void; initialModel: ModelKey | "all" }) {
  const [quizFilter, setQuizFilter] = useState<ModelKey | "all">(initialModel);
  const [mode, setMode] = useState<QuizQuestion["mode"] | "mastery">(initialModel === "Liquidity" ? "mastery" : "multiple");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const quizProgressKey = `${quizFilter}-${mode}-${difficulty}`;
  const [index, setIndex] = useState(() => loadQuizProgress()[quizProgressKey] ?? 0);
  const [feedback, setFeedback] = useState<{ result: QuizResult; question: QuizQuestion } | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const filtered = useMemo(() => {
    const renderable = quizQuestions.filter((question) => !question.requiresChart);
    const pool = renderable.filter((question) => (quizFilter === "all" || question.model === quizFilter) && (mode === "mastery" || question.mode === mode) && (difficulty === "all" || question.difficulty === difficulty));
    return pool.length ? pool : renderable.filter((question) => mode === "mastery" || question.mode === mode);
  }, [quizFilter, mode, difficulty]);
  const question = filtered[index % filtered.length];
  const liquidityResults = results.filter((result) => result.model === "Liquidity");
  const liquidityAccuracy = liquidityResults.length ? Math.round((liquidityResults.filter((result) => result.result === "correct").length / liquidityResults.length) * 100) : 0;
  useEffect(() => {
    setIndex(loadQuizProgress()[quizProgressKey] ?? 0);
    setFeedback(null);
    setStartedAt(Date.now());
  }, [quizProgressKey]);

  const answer = (choice: string) => {
    const correct = choice === question.answer;
    const result: QuizResult = { id: crypto.randomUUID(), model: question.model, mode: question.mode, question: question.prompt, myAnswer: choice, correctAnswer: question.answer, explanation: question.explanation, result: correct ? "correct" : "incorrect", difficulty: question.difficulty, dateCompleted: todayIso(), nextReviewDate: nextReviewDate(correct, question.difficulty), elapsedMs: Date.now() - startedAt };
    const next = [result, ...results];
    setResults(next);
    saveResults(next);
    setFeedback({ result, question });
  };
  const nextQuestion = () => {
    const nextIndex = index + 1;
    const progress = loadQuizProgress();
    saveQuizProgress({ ...progress, [quizProgressKey]: nextIndex });
    setFeedback(null);
    setStartedAt(Date.now());
    setIndex(nextIndex);
  };
  return (
    <div className="quiz-layout">
      {quizFilter === "Liquidity" && (
        <section className="panel quiz-mission">
          <div><span>Personal mastery mode</span><h2>Liquidity must become automatic.</h2><p>This mixed quiz tests definitions, validation, invalidation, sequence, and trap recognition. The goal is not to finish questions. The goal is to stop missing the same kind of liquidity read.</p></div>
          <div className="score-grid"><span><strong>Liquidity reps</strong><b>{liquidityResults.length}</b></span><span><strong>Accuracy</strong><b>{liquidityAccuracy}%</b></span><span><strong>Target</strong><b>85%</b></span></div>
        </section>
      )}
      <section className="panel quiz-controls">
        <select value={quizFilter} onChange={(event) => setQuizFilter(event.target.value as ModelKey | "all")}><option value="all">All models</option>{modelOrder.map((key) => <option key={key} value={key}>{modelLabels[key]}</option>)}</select>
        <select value={mode} onChange={(event) => setMode(event.target.value as QuizQuestion["mode"] | "mastery")}><option value="mastery">Mixed mastery</option><option value="multiple">Multiple choice</option><option value="valid">Valid / Invalid</option><option value="sequence">Sequence</option><option value="whyNot">Why Not</option></select>
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value === "all" ? "all" : Number(event.target.value) as Difficulty)}><option value="all">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option><option value="5">Level 5</option></select>
      </section>
      {feedback ? <section className={cls("feedback-card", feedback.result.result)}><h2>{feedback.result.result === "correct" ? "Correct. Lock in the reasoning." : "Review this one carefully."}</h2><p><strong>Your answer:</strong> {feedback.result.myAnswer}</p><p><strong>Correct answer:</strong> {feedback.result.correctAnswer}</p><p><strong>Why this answer is correct:</strong> {feedback.result.explanation}</p>{feedback.result.result === "incorrect" && <p><strong>Why your answer is wrong:</strong> {feedback.question.wrongAnswers?.[feedback.result.myAnswer] ?? "That answer skips a required condition, confuses a related model, or treats the label as a trade signal."}</p>}<p><strong>Why the other answers are wrong:</strong> {(feedback.question.choices ?? []).filter((choice) => choice !== feedback.question.answer).map((choice) => `${choice}: ${feedback.question.wrongAnswers?.[choice] ?? "not the best read for this concept"}`).join(" ")}</p><p><strong>Concept trained:</strong> {feedback.question.concept ?? `${modelLabels[feedback.question.model]} recognition`}</p><p><strong>Mistake this prevents:</strong> {feedback.question.mistakePrevented ?? "over-labeling weak structure without context."}</p><button className="primary-button" onClick={nextQuestion}>Next question</button></section> : (
        <section className="quiz-card">
          <div className="quiz-meta"><span>{modelLabels[question.model]} - Concept Quiz</span><ConceptDifficultyBadge level={question.difficulty} /></div>
          <h2>{question.prompt}</h2>
          <div className="choice-grid">{(question.choices ?? question.sequence ?? []).map((choice) => <button key={choice} onClick={() => answer(choice)}>{choice}</button>)}</div>
          <p className="empty">Concept Quiz is text-only. Answer from terminology, validation logic, sequencing, and decision rules.</p>
        </section>
      )}
    </div>
  );
}

function ChartQuiz({ results, setResults, initialModel = "Liquidity" }: { results: QuizResult[]; setResults: (results: QuizResult[]) => void; initialModel?: ModelKey | "all" }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ question: ChartQuestion; scenario: ChartScenario; choice: string; correct: boolean } | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const pool = chartQuestions
    .map((question) => ({ question, scenario: validatedChartForChartQuestion(question) }))
    .filter((item): item is { question: ChartQuestion; scenario: ChartScenario } => Boolean(item.scenario))
    .filter((item) => initialModel === "all" || item.question.concept === initialModel);
  const active = pool[index % Math.max(pool.length, 1)];
  const answer = (choice: string) => {
    if (!active) return;
    const correct = choice === active.question.correctAnswer;
    const result: QuizResult = {
      id: crypto.randomUUID(),
      model: active.question.concept,
      mode: "chart",
      question: active.question.prompt,
      myAnswer: choice,
      correctAnswer: active.question.correctAnswer,
      explanation: active.question.explanation,
      result: correct ? "correct" : "incorrect",
      difficulty: active.question.difficulty,
      dateCompleted: todayIso(),
      nextReviewDate: nextReviewDate(correct, active.question.difficulty),
      elapsedMs: Date.now() - startedAt
    };
    const next = [result, ...results];
    setResults(next);
    saveResults(next);
    setFeedback({ ...active, choice, correct });
  };
  const next = () => {
    setFeedback(null);
    setStartedAt(Date.now());
    setIndex(index + 1);
  };
  if (!active) {
    return <section className="panel"><div className="section-title"><div><span>Chart Quiz</span><h2>No validated chart questions available.</h2></div></div><p className="definition">Chart questions only appear when a chart has matching trainer markup and required visible features. Use Concept Quiz or Chart Drills for now.</p></section>;
  }
  return (
    <div className="quiz-layout">
      {feedback ? (
        <section className={cls("feedback-card", feedback.correct ? "correct" : "incorrect")}>
          <h2>{feedback.correct ? "Correct. Match the chart evidence." : "Review the chart evidence."}</h2>
          <div className="quiz-chart-example"><ChartPreview scenario={feedback.scenario} showCallouts /></div>
          <p><strong>Your answer:</strong> {feedback.choice}</p>
          <p><strong>Correct answer:</strong> {feedback.question.correctAnswer}</p>
          <p><strong>Why:</strong> {feedback.question.explanation}</p>
          {!feedback.correct && <p><strong>Why your answer is wrong:</strong> {feedback.question.whyWrong[feedback.choice] ?? "The chart markup does not support that answer."}</p>}
          <p><strong>Why other answers are wrong:</strong> {feedback.question.answerChoices.filter((choice) => choice !== feedback.question.correctAnswer).map((choice) => `${choice}: ${feedback.question.whyWrong[choice] ?? "not supported by the visible chart features"}`).join(" ")}</p>
          <p><strong>Visible features checked:</strong> {feedback.question.requiredVisibleFeatures.join(", ")}</p>
          <button className="primary-button" onClick={next}>Next chart question</button>
        </section>
      ) : (
        <section className="quiz-card">
          <div className="quiz-meta"><span>{modelLabels[active.question.concept]} - Chart Quiz</span><DifficultyBadge level={active.question.difficulty} /></div>
          <h2>{active.question.prompt}</h2>
          <div className="quiz-chart-example"><ChartPreview scenario={active.scenario} showCallouts={false} /></div>
          <div className="choice-grid">{active.question.answerChoices.map((choice) => <button key={choice} onClick={() => answer(choice)}>{choice}</button>)}</div>
          <p className="empty">The chart is required for this question. Answer only from visible chart evidence.</p>
        </section>
      )}
    </div>
  );
}

function ImageAnnotationTool({ annotations, setAnnotations }: { annotations: ChartAnnotation[]; setAnnotations: (value: ChartAnnotation[]) => void }) {
  const [imageData, setImageData] = useState("");
  const [model, setModel] = useState<ModelKey>("MSS");
  const [notes, setNotes] = useState("");
  const [grade, setGrade] = useState<ChartAnnotation["grade"]>("ungraded");
  const [markers, setMarkers] = useState<AnnotationMarker[]>([]);
  const scenario: ChartScenario = { ...chartScenarios[0], model, candles: chartScenarios[0].candles, callouts: [], prompt: "Manual upload annotation", title: "Uploaded chart" };
  const upload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result));
    reader.readAsDataURL(file);
  };
  const save = () => {
    if (!imageData) return;
    const next = [{ id: crypto.randomUUID(), model, imageData, markers, notes, grade, createdAt: todayIso() }, ...annotations];
    setAnnotations(next);
    saveAnnotations(next);
  };
  return (
    <div className="upload-grid">
      <section className="panel control-panel">
        <label>Practice model</label><select value={model} onChange={(event) => setModel(event.target.value as ModelKey)}>{modelOrder.map((key) => <option key={key} value={key}>{modelLabels[key]}</option>)}</select>
        <label>Upload real chart screenshot</label><label className="upload-drop"><Upload size={22} /><span>Select image</span><input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} /></label>
        <label>Notes</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Context, confirmation, invalidation, and what you missed." />
        <div className="segmented">{(["right", "wrong", "ungraded"] as const).map((item) => <button className={cls(grade === item && "active")} key={item} onClick={() => setGrade(item)}>{item}</button>)}</div>
        <button className="primary-button wide" onClick={save}><Save size={17} />Save annotation</button>
      </section>
      <section className="uploaded-stage">
        {imageData ? <img src={imageData} alt="Uploaded chart" /> : <InteractiveChart scenario={scenario} annotations={markers} setAnnotations={setMarkers} />}
        {imageData && <div className="upload-overlay-note">Uploaded screenshots are saved with notes and grading. Built-in synthetic chart drills support markers, boxes, arrows, and draggable labels.</div>}
      </section>
    </div>
  );
}

const recommendedPath = [
  { phase: "Phase 1 - Foundation", items: ["Liquidity Sweeps", "Market Structure Shift / MSS", "Break of Structure / BOS", "Displacement"], why: "These teach where price is drawing, when structure changes, and when movement is strong enough to matter.", mode: "Model Library, Text Quiz, Chart Drills", score: "80%+ accuracy on 20 questions before moving on." },
  { phase: "Phase 2 - Imbalance", items: ["Fair Value Gap / FVG", "Inverted Fair Value Gap / IFVG", "Balanced Price Range / BPR"], why: "These teach how displacement leaves inefficiency and how failed imbalances can invert.", mode: "Chart Drills and Spot the Flaw", score: "80%+ on 20 chart drills plus 10 invalid examples." },
  { phase: "Phase 3 - Execution", items: ["Order Blocks", "Breaker Blocks", "Multi-timeframe alignment", "Full trade narrative"], why: "These connect model recognition into execution logic without turning it into a signal service.", mode: "Replay, MTF, Narrative, Upload", score: "80%+ on 20 mixed questions plus one saved self-graded chart." }
];

function StartHere({ setPage, certificationProgress }: { setPage: (page: Page) => void; certificationProgress: CertificationProgress }) {
  const liquidityModule = getCertificationModule(liquidityModuleId);
  const liquidity = moduleStats(liquidityModule, certificationProgress);
  const nextVideo = nextRequiredVideo(liquidityModule, certificationProgress);
  const session = loadTrainingSession();
  const hasSession = Boolean(session.updatedAt) && (session.step > 0 || session.started);
  const stepLabel = hasSession ? `Step ${session.step + 1} of 6` : "Step 1 of 6";
  return (
    <div className="page-grid">
      <section className="panel start-panel simple-start">
        <div>
          <span>Your next action</span>
          <h2>Liquidity Certification</h2>
          <p>You are currently learning Liquidity. Your job is to learn where resting orders are likely to sit, identify buy-side and sell-side liquidity, distinguish a sweep from a breakout, and explain why liquidity alone is not a full trade setup.</p>
          <div className="start-mission">
            <div><strong>{stepLabel}</strong><span>{liquidity.completion}% complete</span></div>
            <p><strong>Watch Liquidity Video #{Math.min(liquidity.watched + 1, liquidityModule.videos.length)}</strong><br />Estimated time: {nextVideo.runtime}</p>
          </div>
          <div className="next-video-card">
            <span>Lesson</span>
            <strong>{nextVideo.creator} - {nextVideo.title}</strong>
            <p>{nextVideo.whyRequired}</p>
            <small>Learn: {(nextVideo.concepts ?? []).join(", ")}</small>
          </div>
          <button className="primary-button solo-action" onClick={() => setPage("today")}>{hasSession ? "Resume Lesson" : "Start Lesson"}</button>
        </div>
        <ChartPreview scenario={chartScenarios[0]} showCallouts />
      </section>
      <section className="panel">
        <div className="section-title"><div><span>What happens next?</span><h2>The app will guide you through this sequence</h2></div></div>
        <div className="onboarding-grid">
          {[
            ["1. Learn", "Watch the required Liquidity lesson and save completion."],
            ["2. Concept Quiz", "Answer text-only questions about terminology, logic, and validation."],
            ["3. Chart Quiz", "Answer chart-recognition questions where each chart is tied to its own prompt."],
            ["4. Drill + Replay", "Mark charts manually, then practice without future candles."],
            ["5. Review", "Repeat missed items and check what remains for certification."]
          ].map(([title, copy]) => <article key={title}><strong>{title}</strong><p>{copy}</p></article>)}
        </div>
      </section>
    </div>
  );
}

function TodayTraining({ setPage, results, setResults, startQuiz, certificationProgress, setCertificationProgress }: { setPage: (page: Page) => void; results: QuizResult[]; setResults: (results: QuizResult[]) => void; startQuiz: (model?: ModelKey) => void; certificationProgress: CertificationProgress; setCertificationProgress: (progress: CertificationProgress) => void }) {
  const savedSession = loadTrainingSession();
  const [step, setStep] = useState(savedSession.step);
  const [started, setStarted] = useState(savedSession.started);
  const liquidityModule = getCertificationModule(liquidityModuleId);
  const liquidity = moduleStats(liquidityModule, certificationProgress);
  const nextVideo = nextRequiredVideo(liquidityModule, certificationProgress);
  const hasCompletedVideo = liquidityModule.videos.some((video) => certificationProgress.watchedVideos[video.id]);
  const liquidityResults = results.filter((result) => result.model === "Liquidity");
  const liquidityAccuracy = liquidityResults.length ? Math.round((liquidityResults.filter((result) => result.result === "correct").length / liquidityResults.length) * 100) : 0;
  const steps = ["Learn", "Concept Quiz", "Chart Quiz", "Chart Drill", "Replay", "Review Mistakes", "Session Summary"];
  const current = steps[step];
  const requirements = [
    `Watch ${liquidityModule.videos.length} videos`,
    "Pass video quizzes at 80%",
    "Complete 10 drills",
    "Complete 3 replays",
    "Pass final exam at 85%"
  ];
  const updateSession = (nextStep: number, nextStarted: boolean) => {
    setStep(nextStep);
    setStarted(nextStarted);
    saveTrainingSession({ step: nextStep, started: nextStarted, updatedAt: todayIso() });
  };
  const stepBlocked = step === 1 && !hasCompletedVideo;
  const beginStep = () => {
    if (stepBlocked) return;
    updateSession(step, true);
  };
  const completeStep = () => {
    updateSession(Math.min(step + 1, steps.length - 1), false);
  };
  const completeVideoStep = () => {
    const videoId = nextVideo.id;
    const next = {
      ...certificationProgress,
      watchedVideos: { ...certificationProgress.watchedVideos, [videoId]: true },
      videoStatus: { ...(certificationProgress.videoStatus ?? {}), [videoId]: "completed" as const },
      videoCompletedAt: { ...(certificationProgress.videoCompletedAt ?? {}), [videoId]: todayIso() }
    };
    setCertificationProgress(next);
    saveCertificationProgress(next);
    updateSession(1, false);
  };
  const completeDrillStep = () => {
    const next = {
      ...certificationProgress,
      chartDrills: { ...certificationProgress.chartDrills, [liquidityModule.id]: Math.min(liquidityModule.chartDrillsRequired, (certificationProgress.chartDrills[liquidityModule.id] ?? 0) + 1) }
    };
    setCertificationProgress(next);
    saveCertificationProgress(next);
    completeStep();
  };
  const completeReplayStep = () => {
    const next = {
      ...certificationProgress,
      replayExercises: { ...certificationProgress.replayExercises, [liquidityModule.id]: Math.min(liquidityModule.replayRequired, (certificationProgress.replayExercises[liquidityModule.id] ?? 0) + 1) }
    };
    setCertificationProgress(next);
    saveCertificationProgress(next);
    completeStep();
  };
  return (
    <div className="page-grid guided-session">
      <section className="panel">
        <div className="section-title"><div><span>Liquidity Certification</span><h2>Step {step + 1} of {steps.length}: {current}</h2></div></div>
        <div className="session-progress">{steps.map((item, index) => <span className={cls(index === step && "active", index < step && "done")} key={item}>{index < step ? "Done" : "Open"} {item}</span>)}</div>
        {!started && (
          <div className="step-ready">
            <strong>{current}</strong>
            <p>{step === 0 ? `Watch this exact video next: ${nextVideo.creator} - ${nextVideo.title}.` : step === 1 ? "Answer text-only concept questions. No chart is shown here." : step === 2 ? "Answer chart recognition questions where each chart is paired with its own question." : step === 3 ? "Mark liquidity on chart examples before trainer reveal." : step === 4 ? "Step through candles without future information." : step === 5 ? "Review missed answers." : "Check what remains before the Liquidity final exam unlocks."}</p>
            {stepBlocked && <div className="mode-help"><strong>Prerequisite</strong><p>Complete the video step first. The quiz unlocks automatically after the lesson is saved.</p></div>}
            <button className="primary-button solo-action" disabled={stepBlocked} onClick={beginStep}>{step === 0 ? "Start Lesson" : step === 1 ? "Start Concept Quiz" : step === 2 ? "Start Chart Quiz" : step === 3 ? "Start Drill" : step === 4 ? "Start Replay" : step === 5 ? "Start Review" : "View Certification Progress"}</button>
          </div>
        )}
      </section>
      {started && step === 0 && <section className="panel model-detail"><div className="section-title"><div><span>Lesson</span><h2>{nextVideo.creator} - {nextVideo.title}</h2></div>{nextVideo.url && <a className="ghost-button" href={nextVideo.url} target="_blank" rel="noreferrer">Open Video</a>}</div><div className="next-video-card in-panel"><span>Why this lesson is required</span><p>{nextVideo.whyRequired}</p><small>Learn: {(nextVideo.concepts ?? []).join(", ")}</small></div><p className="definition">{getModel("Liquidity").definition}</p><ul className="checklist">{getModel("Liquidity").checklist.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul><div className="answer-panel"><strong>Focus</strong><p>Do not call every wick a sweep. First locate obvious buy-side or sell-side liquidity, then ask whether price raided it, rejected it, and displaced away. An ICT model alone is not a complete trade setup.</p></div><button className="primary-button solo-action sticky-next" onClick={completeVideoStep}><CheckCircle2 size={17} />Complete Video</button></section>}
      {started && step === 1 && <><TextQuiz results={results} setResults={setResults} initialModel="Liquidity" /><button className="primary-button solo-action sticky-next" onClick={completeStep}>Complete Concept Quiz</button></>}
      {started && step === 2 && <><ChartQuiz results={results} setResults={setResults} initialModel="Liquidity" /><button className="primary-button solo-action sticky-next" onClick={completeStep}>Complete Chart Quiz</button></>}
      {started && step === 3 && <><ChartTrainingMode scenarios={liquidityDrills.slice(0, 10)} results={results} setResults={setResults} /><button className="primary-button solo-action sticky-next" onClick={completeDrillStep}>Complete Drill</button></>}
      {started && step === 4 && <><ReplayMode results={results} setResults={setResults} /><button className="primary-button solo-action sticky-next" onClick={completeReplayStep}>Complete Replay</button></>}
      {started && step === 5 && <><ReviewQueue results={results} onPractice={startQuiz} /><button className="primary-button solo-action sticky-next" onClick={completeStep}>Complete Review</button></>}
      {started && step === 6 && (
        <section className="panel">
          <div className="section-title"><div><span>Final Exam</span><h2>Liquidity certification progress</h2></div></div>
          <ProgressSummary results={results} />
          <div className="score-grid"><span><strong>Liquidity attempts</strong><b>{liquidityResults.length}</b></span><span><strong>Liquidity accuracy</strong><b>{liquidityAccuracy}%</b></span><span><strong>Certification progress</strong><b>{liquidity.completion}%</b></span></div>
          <div className="mode-list">{requirements.map((item) => <p key={item}><strong>{item}</strong></p>)}</div>
          <div className="answer-panel"><strong>{liquidity.certified ? "Certified" : "Final exam locked"}</strong><p>{liquidity.certified ? "Liquidity is certified. Displacement is now the next concept." : "The final exam unlocks after all videos, quizzes, 10 drills, and 3 replays are complete. Your next action is the first incomplete requirement above."}</p></div>
        </section>
      )}
    </div>
  );
}

function ModuleCard({ module, progress, setProgress }: { module: CertificationModule; progress: CertificationProgress; setProgress: (progress: CertificationProgress) => void }) {
  const [open, setOpen] = useState(module.id === liquidityModuleId);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const stats = moduleStats(module, progress);
  const unlocked = moduleUnlocked(module, progress);
  const quizVideo = module.videos.find((video) => video.id === activeQuiz);
  const quiz = quizVideo ? certificationQuizFor(quizVideo, module) : [];
  const current = quiz[quizIndex];
  const update = (next: CertificationProgress) => {
    setProgress(next);
    saveCertificationProgress(next);
  };
  const setVideoStatus = (videoId: string, status: "not-started" | "in-progress" | "completed") => {
    update({
      ...progress,
      watchedVideos: { ...progress.watchedVideos, [videoId]: status === "completed" },
      videoStatus: { ...(progress.videoStatus ?? {}), [videoId]: status },
      videoCompletedAt: { ...(progress.videoCompletedAt ?? {}), [videoId]: status === "completed" ? todayIso() : (progress.videoCompletedAt ?? {})[videoId] ?? "" }
    });
  };
  const answerQuiz = (question: CertificationQuizQuestion, answer: string) => {
    const nextCorrect = quizCorrect + (answer === question.answer ? 1 : 0);
    if (quizIndex >= quiz.length - 1 && quizVideo) {
      const score = Math.round((nextCorrect / quiz.length) * 100);
      update({ ...progress, quizScores: { ...progress.quizScores, [quizVideo.id]: score } });
      setActiveQuiz(null);
      setQuizIndex(0);
      setQuizCorrect(0);
      return;
    }
    setQuizCorrect(nextCorrect);
    setQuizIndex(quizIndex + 1);
  };
  const simulateExam = () => {
    const ready = stats.watched === module.videos.length && stats.quizPassed === module.videos.length && stats.drills >= module.chartDrillsRequired && stats.replays >= module.replayRequired;
    const score = ready ? module.passingScore : Math.max(40, module.passingScore - 12);
    update({ ...progress, examScores: { ...progress.examScores, [module.id]: score } });
  };
  return (
    <article className={cls("lms-module", !unlocked && "locked", stats.certified && "certified")}>
      <button className="module-head" onClick={() => unlocked && setOpen(!open)}>
        <div><span>{module.level}</span><h3>{module.title}</h3><p>{module.description}</p></div>
        <div className="module-score"><strong>{stats.completion}%</strong><small>{stats.certified ? module.certification : unlocked ? "In progress" : "Locked"}</small></div>
      </button>
      <div className="bar"><i style={{ width: `${stats.completion}%` }} /></div>
      {!unlocked && (
        <div className="locked-requirements">
          <strong>Locked until prior certification is complete.</strong>
          <p>Unlock requirement: complete {module.unlockAfter?.map((id) => certificationModules.find((item) => item.id === id)?.title ?? id).join(", ")} Certification first.</p>
        </div>
      )}
      {open && unlocked && (
        <div className="module-body">
          <div className="requirement-grid">
            <span>Videos: {stats.watched}/{module.videos.length}</span>
            <span>Quizzes: {stats.quizPassed}/{module.videos.length}</span>
            <span>Chart drills: {stats.drills}/{module.chartDrillsRequired}</span>
            <span>Replay: {stats.replays}/{module.replayRequired}</span>
            <span>Exam: {stats.exam || 0}% / {module.passingScore}%</span>
          </div>
          <div className="video-list">
            {module.videos.map((video) => (
              <section className="video-card" key={video.id}>
                <div className="video-card-head">
                  <div><span>Video {module.videos.indexOf(video) + 1}</span><strong>{video.creator} - {video.title}</strong></div>
                  {video.url && <a className="ghost-button" href={video.url} target="_blank" rel="noreferrer">Watch Video</a>}
                </div>
                <span>{video.runtime}</span>
                <p><strong>Why required:</strong> {video.whyRequired ?? "This curated lesson prepares you for recognition drills and certification questions."}</p>
                <p><strong>Learn:</strong> {(video.concepts ?? module.examTopics).join(", ")}</p>
                <p><strong>Required Quiz:</strong> {video.requiredQuiz ?? `${module.title} Video Quiz`}</p>
                <div className="segmented">
                  {(["not-started", "in-progress", "completed"] as const).map((status) => <button key={status} className={cls(((progress.videoStatus ?? {})[video.id] ?? (progress.watchedVideos[video.id] ? "completed" : "not-started")) === status && "active")} onClick={() => setVideoStatus(video.id, status)}>{status === "not-started" ? "Not Started" : status === "in-progress" ? "In Progress" : "Completed"}</button>)}
                </div>
                {(progress.videoCompletedAt ?? {})[video.id] && <span>Completed {shortDate((progress.videoCompletedAt ?? {})[video.id])} - Quiz score {progress.quizScores[video.id] ?? 0}%</span>}
                <textarea value={progress.videoNotes[video.id] ?? ""} onChange={(event) => update({ ...progress, videoNotes: { ...progress.videoNotes, [video.id]: event.target.value } })} placeholder="Notes: what recognition rule, invalidation, or chart behavior matters?" />
                <button className="ghost-button" disabled={!progress.watchedVideos[video.id]} onClick={() => setActiveQuiz(video.id)}>Take {video.requiredQuiz ?? "video quiz"} {progress.quizScores[video.id] ? `(${progress.quizScores[video.id]}%)` : ""}</button>
              </section>
            ))}
          </div>
          {activeQuiz && current && (
            <section className="quiz-card inline-quiz">
              <div className="quiz-meta"><span>{quizVideo?.title}</span><span>{quizIndex + 1}/10</span></div>
              <h2>{current.prompt}</h2>
              <div className="choice-grid">{current.choices.map((choice) => <button key={choice} onClick={() => answerQuiz(current, choice)}>{choice}</button>)}</div>
              <p className="empty">{current.explanation}</p>
            </section>
          )}
          <div className="action-row">
            <button className="ghost-button" onClick={() => update({ ...progress, chartDrills: { ...progress.chartDrills, [module.id]: stats.drills + 1 } })}>Log chart drill</button>
            <button className="ghost-button" onClick={() => update({ ...progress, replayExercises: { ...progress.replayExercises, [module.id]: stats.replays + 1 } })}>Log replay exercise</button>
            <button className="primary-button" onClick={simulateExam}>Take Certification Exam</button>
          </div>
          <div className="answer-panel"><strong>Final Exam</strong><p>{module.examCharts} charts. Passing score: {module.passingScore}%. Topics: {module.examTopics.join(", ")}.</p></div>
        </div>
      )}
    </article>
  );
}

function CertificationPath({ progress, setProgress }: { progress: CertificationProgress; setProgress: (progress: CertificationProgress) => void }) {
  const overview = certificationOverview(progress);
  const liquidity = getCertificationModule(liquidityModuleId);
  const foundation = certificationModules.filter((module) => foundationModuleIds.includes(module.id) && module.id !== liquidityModuleId);
  const later = certificationModules.filter((module) => !foundationModuleIds.includes(module.id));
  return (
    <div className="page-grid">
      <CertificationTracker progress={progress} setPage={() => undefined} />
      <section className="panel">
        <div className="section-title"><div><span>Focused MVP</span><h2>Liquidity is the first certification gate</h2></div></div>
        <div className="mode-list">
          <p><strong>1. Watch:</strong> mark Liquidity videos watched and write timestamp notes.</p>
          <p><strong>2. Check:</strong> pass each video quiz at 80%+ before counting it complete.</p>
          <p><strong>3. Drill:</strong> complete 10 chart reps focused only on liquidity recognition.</p>
          <p><strong>4. Replay:</strong> complete 3 hidden-future liquidity sequences.</p>
          <p><strong>5. Certify:</strong> pass the Liquidity final at 85% before moving to Displacement.</p>
          <p><strong>Current next step:</strong> {overview.next.title}</p>
        </div>
      </section>
      <div className="lms-stack">
        <ModuleCard key={liquidity.id} module={liquidity} progress={progress} setProgress={setProgress} />
        <section className="panel roadmap-panel">
          <div className="section-title"><div><span>Next foundation modules</span><h2>Locked until Liquidity is certified</h2></div></div>
          <div className="roadmap-list">
            {foundation.map((module) => {
              const stats = moduleStats(module, progress);
              const unlocked = moduleUnlocked(module, progress);
              return <article className={cls(unlocked && "ready")} key={module.id}><div><strong>{module.title}</strong><p>{module.description}</p></div><span>{stats.certified ? module.certification : unlocked ? "Ready after current gate" : "Locked"}</span></article>;
            })}
          </div>
        </section>
        <section className="panel roadmap-panel muted-roadmap">
          <div className="section-title"><div><span>Later roadmap</span><h2>Kept out of the week-1 workflow</h2></div></div>
          <div className="roadmap-list compact-roadmap">
            {later.map((module) => <article key={module.id}><div><strong>{module.title}</strong><p>{module.level}</p></div><span>{module.certification}</span></article>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function LearnHub({ results, setPage, startQuiz, beginnerMode, setBeginnerMode, certificationProgress, setCertificationProgress }: { results: QuizResult[]; setPage: (page: Page) => void; startQuiz: (model?: ModelKey) => void; beginnerMode: boolean; setBeginnerMode: (value: boolean) => void; certificationProgress: CertificationProgress; setCertificationProgress: (progress: CertificationProgress) => void }) {
  const liquidity = moduleStats(getCertificationModule(liquidityModuleId), certificationProgress);
  const module = getCertificationModule(liquidityModuleId);
  const model = getModel("Liquidity");
  const nextVideo = nextRequiredVideo(module, certificationProgress);
  return (
    <div className="page-grid">
      <ModeHelp id="learn" />
      <section className="panel learn-focus">
        <div>
          <span>Current Module</span>
          <h2>Liquidity</h2>
          <p>Learn where resting orders are likely to sit, how sweeps differ from breakouts, and why liquidity is context, not an entry signal.</p>
        </div>
        <div className="learn-focus-meter">
          <strong>{liquidity.completion}%</strong>
          <span>Liquidity complete</span>
        </div>
      </section>
      <section className="panel next-video-panel">
        <div className="section-title">
          <div><span>Watch this exact video next</span><h2>{nextVideo.creator} - {nextVideo.title}</h2></div>
          {nextVideo.url && <a className="primary-button" href={nextVideo.url} target="_blank" rel="noreferrer">Open Video</a>}
        </div>
        <p><strong>Why this video is required:</strong> {nextVideo.whyRequired}</p>
        <p><strong>Concepts to learn:</strong> {(nextVideo.concepts ?? []).join(", ")}</p>
        <p><strong>After watching:</strong> mark it Completed below, add notes, then take its video quiz.</p>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>Before drilling</span><h2>What you need to understand</h2></div></div>
        <p className="definition">{model.definition}</p>
        <div className="two-col">
          <div><h3>Checklist</h3><ul className="checklist">{model.checklist.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></div>
          <div><h3>Examples</h3><div className="mode-list"><p><strong>Bullish:</strong> {model.bullish}</p><p><strong>Bearish:</strong> {model.bearish}</p></div></div>
        </div>
      </section>
      <ModuleCard module={module} progress={certificationProgress} setProgress={setCertificationProgress} />
      <section className="panel">
        <div className="section-title"><div><span>Certification requirements</span><h2>What earns Liquidity Certified</h2></div></div>
        <div className="requirement-grid">
          <span>Videos: {liquidity.watched}/{module.videos.length}</span>
          <span>Quizzes: {liquidity.quizPassed}/{module.videos.length}</span>
          <span>Chart drills: {liquidity.drills}/{module.chartDrillsRequired}</span>
          <span>Replay: {liquidity.replays}/{module.replayRequired}</span>
          <span>Exam: {liquidity.exam || 0}% / {module.passingScore}%</span>
        </div>
      </section>
      <section className="panel">
        <details>
          <summary><strong>Future Modules</strong></summary>
          <div className="roadmap-list compact-roadmap">
            {certificationModules.filter((item) => item.id !== liquidityModuleId).map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.level}</p></div><span>Locked until prior certification</span></article>)}
          </div>
        </details>
      </section>
    </div>
  );
}

function AboutSystem({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-title"><div><span>About this system</span><h2>What this app is and is not</h2></div><button className="ghost-button" onClick={() => setPage("start")}>Back to Start</button></div>
        <div className="two-col">
          <div><h3>This app teaches</h3><ul className="checklist">{["ICT pattern recognition", "liquidity recognition", "structure shifts", "imbalance recognition", "valid vs invalid setup filtering", "multi-timeframe context", "trade narrative thinking"].map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></div>
          <div><h3>This app does NOT</h3><ul className="checklist">{["generate trade signals", "predict price", "guarantee profitable trades", "replace risk management"].map((item) => <li key={item}><XCircle size={16} />{item}</li>)}</ul></div>
        </div>
      </section>
    </div>
  );
}

function PhoneHelp({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-title"><div><span>Use on phone</span><h2>Run locally and open on the same Wi-Fi</h2></div><button className="ghost-button" onClick={() => setPage("start")}>Back</button></div>
        <div className="mode-list">
          <p><strong>1. Start Vite with host enabled:</strong><br /><code>npm run dev:host -- --port 5174</code></p>
          <p><strong>2. Open on your phone:</strong><br /><code>http://192.168.1.124:5174</code></p>
          <p><strong>3. Same Wi-Fi:</strong><br />Your phone and computer must be on the same local network.</p>
          <p><strong>4. Firewall:</strong><br />If it will not load, allow Node.js/Vite through Windows Firewall on private networks.</p>
          <p><strong>iPhone install:</strong><br />Open in Safari, tap Share, then Add to Home Screen.</p>
          <p><strong>Android install:</strong><br />Open in Chrome, tap the menu, then Install app or Add to Home screen.</p>
        </div>
      </section>
    </div>
  );
}

function MorePage({ setPage, liquidityCertified }: { setPage: (page: Page) => void; liquidityCertified: boolean }) {
  const items: Array<[Page, string, string]> = [
    ["orientation", "Orientation", "What the app is, what it is not, and how to use each tab."],
    ["learn", "Learn", "Liquidity reference, required videos, notes, and checklists."],
    ["review", "Review", "Repeat missed questions and weak concepts."],
    ["progress", "Progress", liquidityCertified ? "Analytics, certifications, weak areas, and mastery." : "Liquidity certification requirements and locked concepts."],
    ["upload", "Upload", "Upload personal chart screenshots for self-grading."],
    ["phone", "Use on Phone", "Install and access instructions."]
  ];
  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-title"><div><span>More</span><h2>Secondary tools</h2></div></div>
        <div className="tab-guide">
          {items.map(([pageId, title, body]) => (
            <button className="more-item" key={pageId} onClick={() => setPage(pageId)}>
              <strong>{title}</strong>
              <span>{body}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function App() {
  const [page, setPage] = useState<Page>("orientation");
  const [results, setResults] = useState<QuizResult[]>(loadResults);
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>(loadAnnotations);
  const [certificationProgress, setCertificationProgress] = useState<CertificationProgress>(loadCertificationProgress);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(loadBookmarks);
  const [quizModel, setQuizModel] = useState<ModelKey | "all">("all");
  const [beginnerMode, setBeginnerMode] = useState(true);
  const stats = resultStats(results);
  const liquidityCertified = moduleStats(getCertificationModule(liquidityModuleId), certificationProgress).certified;

  const startQuiz = (model?: ModelKey) => {
    setQuizModel(model ?? "all");
    setPage("quiz");
  };

  const saveScenarioAnnotation = (scenario: ChartScenario, markers: AnnotationMarker[]) => {
    const next = [{
      id: crypto.randomUUID(),
      model: scenario.model,
      imageData: `scenario:${scenario.id}`,
      markers,
      notes: scenario.prompt,
      grade: "ungraded" as const,
      createdAt: todayIso(),
      sourceScenarioId: scenario.id
    }, ...annotations];
    setAnnotations(next);
    saveAnnotations(next);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><LineChart /><div><strong>ICT Training Lab</strong><span>Chart-first cognitive trainer</span></div></div>
        <nav>{nav.map((item) => { const Icon = item.icon; return <button className={cls(page === item.page && "active")} key={item.page} onClick={() => setPage(item.page)}><Icon size={18} />{item.label}</button>; })}</nav>
        <div className="risk-note">Pattern-recognition training only. An ICT model alone is not a complete trade setup.</div>
      </aside>
      <main>
        <header className="topbar">
          <div><p>Context, liquidity, displacement, timeframe alignment, and risk management matter.</p><h1>{pageTitles[page]}</h1></div>
        </header>

        {page === "start" && <StartHere setPage={setPage} certificationProgress={certificationProgress} />}
        {page === "orientation" && <OrientationPage setPage={setPage} />}

        {page === "about" && <AboutSystem setPage={setPage} />}
        {page === "phone" && <PhoneHelp setPage={setPage} />}
        {page === "more" && <MorePage setPage={setPage} liquidityCertified={liquidityCertified} />}

        {page === "today" && <TodayTraining setPage={setPage} results={results} setResults={setResults} startQuiz={startQuiz} certificationProgress={certificationProgress} setCertificationProgress={setCertificationProgress} />}

        {page === "learn" && <LearnHub results={results} setPage={setPage} startQuiz={startQuiz} beginnerMode={beginnerMode} setBeginnerMode={setBeginnerMode} certificationProgress={certificationProgress} setCertificationProgress={setCertificationProgress} />}

        {page === "progress" && <ProgressEnhancements results={results} progress={certificationProgress} setProgress={setCertificationProgress} bookmarks={bookmarks} />}

        {page === "chartLab" && <><CertificationMiniProgress progress={certificationProgress} /><ModeHelp id="chartLab" /><ChartTrainingMode scenarios={chartScenarios.filter((scenario) => scenario.mode === "recognition" && (!beginnerMode || phaseStatus(results).foundationPassed || scenario.model === "Liquidity"))} results={results} setResults={setResults} saveAnnotation={saveScenarioAnnotation} bookmarks={bookmarks} setBookmarks={setBookmarks} /></>}
        {page === "replay" && <><CertificationMiniProgress progress={certificationProgress} /><ModeHelp id="replay" /><ReplayMode results={results} setResults={setResults} /></>}
        {page === "flaw" && <><ModeHelp id="flaw" /><ChartTrainingMode scenarios={chartScenarios.filter((scenario) => scenario.mode === "invalid")} results={results} setResults={setResults} saveAnnotation={saveScenarioAnnotation} bookmarks={bookmarks} setBookmarks={setBookmarks} /></>}
        {page === "mtf" && <div className="page-grid"><ModeHelp id="mtf" /><MtfPanels /><MtfMode results={results} setResults={setResults} /></div>}
        {page === "narrative" && <><ModeHelp id="narrative" /><NarrativeMode results={results} setResults={setResults} /></>}
        {page === "paths" && <div className="page-grid"><LearningPaths results={results} /><RelationshipMap /></div>}
        {page === "library" && <ModelLibrary startQuiz={startQuiz} />}
        {page === "quiz" && <><CertificationMiniProgress progress={certificationProgress} /><TextQuiz results={results} setResults={setResults} initialModel={quizModel} /></>}
        {page === "upload" && <><ModeHelp id="upload" /><ImageAnnotationTool annotations={annotations} setAnnotations={setAnnotations} /></>}
        {page === "review" && <><ModeHelp id="review" /><ReviewQueue results={results} onPractice={startQuiz} /></>}
      </main>
      <nav className="mobile-nav">{mobileNav.map((item) => { const Icon = item.icon; return <button className={cls((page === item.page || (item.page === "more" && !mobileNav.some((navItem) => navItem.page === page))) && "active")} key={item.page} onClick={() => setPage(item.page)}><Icon size={18} /><span>{item.label}</span></button>; })}</nav>
    </div>
  );
}
