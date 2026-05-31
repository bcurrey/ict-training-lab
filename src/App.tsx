import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  Home,
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
import { chartScenarios, getModel, learningPaths, modelLabels, modelOrder, quizQuestions } from "./data";
import { loadAnnotations, loadResults, nextReviewDate, saveAnnotations, saveResults } from "./storage";
import type {
  AnnotationMarker,
  AnnotationTool,
  Candle,
  ChartAnnotation,
  ChartCallout,
  ChartScenario,
  Confidence,
  Difficulty,
  ModelKey,
  QuizQuestion,
  QuizResult
} from "./types";

type Page = "start" | "today" | "learn" | "chartLab" | "replay" | "review" | "progress" | "upload" | "flaw" | "mtf" | "narrative" | "library" | "quiz" | "paths" | "about" | "phone";

const nav = [
  { page: "start" as const, label: "Start Here", icon: Home },
  { page: "today" as const, label: "Today", icon: Target },
  { page: "learn" as const, label: "Learn", icon: BookOpen },
  { page: "chartLab" as const, label: "Chart Drills", icon: ScanSearch },
  { page: "replay" as const, label: "Replay", icon: Play },
  { page: "review" as const, label: "Review", icon: RotateCcw },
  { page: "progress" as const, label: "Progress", icon: BarChart3 },
  { page: "upload" as const, label: "Upload", icon: ImagePlus }
];

const pageTitles: Record<Page, string> = {
  start: "Start Here",
  today: "Today's Training",
  learn: "Learn",
  chartLab: "Chart Drills",
  replay: "Replay",
  review: "Review",
  progress: "Progress",
  upload: "Upload",
  flaw: "Spot the Flaw",
  mtf: "Multi-Timeframe",
  narrative: "Trade Narrative",
  library: "Model Library",
  quiz: "Text Quiz",
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
  today: "Use this when you want the app to tell you exactly what to do next."
};

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
  const ref = useRef<HTMLDivElement>(null);

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
      setAnnotations([...annotations, marker]);
      setDraft(null);
      return;
    }
    const text = tool === "text" ? window.prompt("Note text", label) || label : label;
    setAnnotations([...annotations, { id: crypto.randomUUID(), label, x: p.x, y: p.y, type: tool, text }]);
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

  return (
    <div className="chart-workbench">
      <div className="chart-toolbar">
        {(["marker", "rectangle", "arrow", "text"] as AnnotationTool[]).map((item) => <button className={cls(tool === item && "active")} key={item} onClick={() => setTool(item)}>{item}</button>)}
        <select value={label} onChange={(event) => setLabel(event.target.value)}>
          {markerLabels.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="ghost-button" onClick={() => setAnnotations([])}>Clear</button>
      </div>
      <div className="interactive-chart" ref={ref} onClick={onStageClick} onPointerMove={moveMarker} onPointerUp={() => setMovingId(null)} onPointerCancel={() => setMovingId(null)}>
        <ChartPreview scenario={scenario} revealCount={revealCount} showCallouts={showAnswer} />
        {annotations.map((marker) => (
          <span
            className={cls("chart-label", marker.type === "rectangle" && "box-label", marker.type === "arrow" && "arrow-label")}
            draggable
            key={marker.id}
            onPointerDown={(event) => {
              event.stopPropagation();
              setMovingId(marker.id);
            }}
            onDragEnd={(event) => dragMarker(marker.id, event)}
            style={{
              left: `${marker.x}%`,
              top: `${(marker.y / 62) * 100}%`,
              width: marker.type === "rectangle" ? `${marker.width ?? 12}%` : undefined,
              height: marker.type === "rectangle" ? `${((marker.height ?? 10) / 62) * 100}%` : undefined
            }}
          >
            {marker.text ?? marker.label}
          </span>
        ))}
      </div>
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

function ChartTrainingMode({ scenarios, results, setResults, saveAnnotation }: { scenarios: ChartScenario[]; results: QuizResult[]; setResults: (results: QuizResult[]) => void; saveAnnotation?: (scenario: ChartScenario, markers: AnnotationMarker[]) => void }) {
  const [selected, setSelected] = useState(scenarios[0]);
  const [markers, setMarkers] = useState<AnnotationMarker[]>([]);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [showAnswer, setShowAnswer] = useState(false);
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

  return (
    <div className="sim-layout">
      <ScenarioPicker scenarios={scenarios} selected={selected} setSelected={setSelected} />
      <section className="panel sim-panel">
        <div className="section-title">
          <div><span>{selected.timeframe} - {modelLabels[selected.model]}</span><h2>{selected.prompt}</h2></div>
          <DifficultyBadge level={selected.difficulty} />
        </div>
        <InteractiveChart scenario={selected} annotations={markers} setAnnotations={setMarkers} showAnswer={showAnswer} />
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
          </div>
        )}
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
  const [mode, setMode] = useState<QuizQuestion["mode"]>("multiple");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<QuizResult | null>(null);
  const filtered = useMemo(() => {
    const pool = quizQuestions.filter((question) => (quizFilter === "all" || question.model === quizFilter) && question.mode === mode && (difficulty === "all" || question.difficulty === difficulty));
    return pool.length ? pool : quizQuestions.filter((question) => question.mode === mode);
  }, [quizFilter, mode, difficulty]);
  const question = filtered[index % filtered.length];
  const answer = (choice: string) => {
    const correct = choice === question.answer;
    const result: QuizResult = { id: crypto.randomUUID(), model: question.model, mode: question.mode, question: question.prompt, myAnswer: choice, correctAnswer: question.answer, explanation: question.explanation, result: correct ? "correct" : "incorrect", difficulty: question.difficulty, dateCompleted: todayIso(), nextReviewDate: nextReviewDate(correct, question.difficulty), confidence: "medium" };
    const next = [result, ...results];
    setResults(next);
    saveResults(next);
    setFeedback(result);
  };
  return (
    <div className="quiz-layout">
      <section className="panel quiz-controls">
        <select value={quizFilter} onChange={(event) => setQuizFilter(event.target.value as ModelKey | "all")}><option value="all">All models</option>{modelOrder.map((key) => <option key={key} value={key}>{modelLabels[key]}</option>)}</select>
        <select value={mode} onChange={(event) => setMode(event.target.value as QuizQuestion["mode"])}><option value="multiple">Multiple choice</option><option value="valid">Valid / Invalid</option><option value="sequence">Sequence</option><option value="whyNot">Why Not</option></select>
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value === "all" ? "all" : Number(event.target.value) as Difficulty)}><option value="all">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option><option value="5">Level 5</option></select>
      </section>
      {feedback ? <section className={cls("feedback-card", feedback.result)}><h2>{feedback.result === "correct" ? "Correct" : "Review this one"}</h2><p><strong>Correct answer:</strong> {feedback.correctAnswer}</p><p><strong>Why it is correct:</strong> {feedback.explanation}</p><p><strong>Why the other answers are wrong:</strong> they either describe a related idea, skip confirmation, or imply a model is a signal by itself.</p><p><strong>Concept trained:</strong> {question.concept ?? `${modelLabels[question.model]} recognition`}</p><p><strong>Mistake prevented:</strong> {question.mistakePrevented ?? "over-labeling weak structure without context."}</p><button className="primary-button" onClick={() => { setFeedback(null); setIndex(index + 1); }}>Next question</button></section> : (
        <section className="quiz-card"><div className="quiz-meta"><span>{modelLabels[question.model]}</span><DifficultyBadge level={question.difficulty} /></div><h2>{question.prompt}</h2><div className="choice-grid">{(question.choices ?? question.sequence ?? []).map((choice) => <button key={choice} onClick={() => answer(question.mode === "sequence" ? (question.sequence ?? []).join(" > ") : choice)}>{choice}</button>)}</div></section>
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

function StartHere({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <div className="page-grid">
      <section className="panel start-panel">
        <div>
          <span>First session</span>
          <h2>Use this app as a deliberate-practice trainer, not a signal tool.</h2>
          <p>Start with liquidity and structure, do a short chart drill, then review anything missed. The goal is to recognize valid and invalid ICT models faster, with less hindsight bias.</p>
          <div className="action-row"><button className="primary-button" onClick={() => setPage("today")}>Start Today's Training</button><button className="ghost-button" onClick={() => setPage("about")}>About this system</button><button className="ghost-button" onClick={() => setPage("phone")}>Use on Phone</button></div>
        </div>
        <ChartPreview scenario={chartScenarios[0]} showCallouts />
      </section>
      <section className="panel">
        <div className="section-title"><div><span>How to use it</span><h2>One simple loop</h2></div></div>
        <div className="onboarding-grid">
          {[
            ["1. Learn", "Read the model checklist and know what validates or invalidates the concept."],
            ["2. Drill", "Use chart drills to mark the setup before seeing trainer markup."],
            ["3. Replay", "Step forward candle by candle so you train recognition without future information."],
            ["4. Review", "Repeat missed questions and track weak models."]
          ].map(([title, copy]) => <article key={title}><strong>{title}</strong><p>{copy}</p></article>)}
        </div>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>Tabs explained</span><h2>What each section is for</h2></div></div>
        <div className="mode-list">
          <p><strong>Today:</strong> the exact next routine to run.</p>
          <p><strong>Learn:</strong> model library, learning path, MTF, Narrative, and Spot the Flaw.</p>
          <p><strong>Chart Drills:</strong> chart-based recognition reps with annotation tools.</p>
          <p><strong>Replay:</strong> hidden future candles for real-time recognition practice.</p>
          <p><strong>Review:</strong> missed questions and spaced repetition.</p>
          <p><strong>Progress:</strong> accuracy, XP, confidence patterns, weak models, and saved work.</p>
          <p><strong>Upload:</strong> your own screenshots, notes, and self-grading.</p>
        </div>
      </section>
    </div>
  );
}

function TodayTraining({ setPage, results, setResults, startQuiz }: { setPage: (page: Page) => void; results: QuizResult[]; setResults: (results: QuizResult[]) => void; startQuiz: (model?: ModelKey) => void }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const steps = ["Study", "Chart drills", "Replay", "Review", "Summary"];
  if (active) {
    return (
      <div className="page-grid guided-session">
        <section className="panel">
          <div className="section-title"><div><span>Guided session</span><h2>{steps[step]}</h2></div><button className="ghost-button" onClick={() => setActive(false)}>Exit session</button></div>
          <div className="session-progress">{steps.map((item, index) => <span className={cls(index <= step && "active")} key={item}>{index + 1}. {item}</span>)}</div>
        </section>
        {step === 0 && <section className="panel model-detail"><div className="section-title"><div><span>Foundation concept</span><h2>Liquidity Sweeps</h2></div></div><p className="definition">{getModel("Liquidity").definition}</p><ul className="checklist">{getModel("Liquidity").checklist.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul><div className="answer-panel"><strong>Focus</strong><p>Do not call every wick a sweep. Look for an obvious liquidity pool, raid, rejection, displacement, and structure confirmation.</p></div></section>}
        {step === 1 && <ChartTrainingMode scenarios={chartScenarios.filter((scenario) => scenario.mode === "recognition" && ["Liquidity", "MSS", "BOS", "FVG"].includes(scenario.model)).slice(0, 10)} results={results} setResults={setResults} />}
        {step === 2 && <ReplayMode results={results} setResults={setResults} />}
        {step === 3 && <ReviewQueue results={results} onPractice={startQuiz} />}
        {step === 4 && <section className="panel"><div className="section-title"><div><span>Session summary</span><h2>Training complete</h2></div></div><ProgressSummary results={results} /><div className="answer-panel"><strong>Next best rep</strong><p>Repeat any missed Liquidity, MSS, BOS, or FVG examples before moving into IFVG, BPR, order blocks, or breakers.</p></div></section>}
        <div className="action-row"><button className="ghost-button" onClick={() => setStep(Math.max(0, step - 1))}>Back</button><button className="primary-button" onClick={() => step >= steps.length - 1 ? setActive(false) : setStep(step + 1)}>{step >= steps.length - 1 ? "Finish" : "Next step"}</button></div>
      </div>
    );
  }
  return (
    <div className="page-grid">
      <ModeHelp id="today" />
      <section className="panel">
        <div className="section-title"><div><span>Today's Training</span><h2>Recommended sequence</h2></div><button className="primary-button" onClick={() => { setActive(true); setStep(0); }}>Start Today's Training</button></div>
        <div className="today-list">
          <article><b>1</b><div><strong>Study: Liquidity Sweeps - 5 minutes</strong><p>Review what creates a meaningful liquidity pool and what confirms the sweep.</p></div></article>
          <article><b>2</b><div><strong>Drill: 10 chart examples</strong><p>Mark liquidity, MSS/BOS, FVG, entry, and invalidation where applicable.</p></div></article>
          <article><b>3</b><div><strong>Replay: 1 sequence</strong><p>Step forward before revealing future candles.</p></div></article>
          <article><b>4</b><div><strong>Review: missed questions</strong><p>Repeat anything due or incorrect.</p></div></article>
        </div>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>Daily routine templates</span><h2>Pick your time box</h2></div></div>
        <div className="drill-grid">
          <button className="drill-card" onClick={() => setPage("chartLab")}><Clock3 /><strong>15-Minute Mode</strong><span>5 chart questions, 3 text questions, 1 replay, missed review.</span></button>
          <button className="drill-card" onClick={() => setPage("flaw")}><Clock3 /><strong>30-Minute Mode</strong><span>10 chart questions, 5 flaw drills, 2 replays, 1 narrative.</span></button>
          <button className="drill-card" onClick={() => setPage("upload")}><Sparkles /><strong>Deep Practice</strong><span>Model-specific study, upload chart, self-grade, save notes.</span></button>
        </div>
      </section>
    </div>
  );
}

function LearnHub({ results, setPage, startQuiz, beginnerMode, setBeginnerMode }: { results: QuizResult[]; setPage: (page: Page) => void; startQuiz: (model?: ModelKey) => void; beginnerMode: boolean; setBeginnerMode: (value: boolean) => void }) {
  const gates = phaseStatus(results);
  return (
    <div className="page-grid">
      <ModeHelp id="learn" />
      <section className="panel beginner-card">
        <div>
          <span>Beginner mode</span>
          <h2>{beginnerMode ? "Foundation-first training is on" : "All modes visible"}</h2>
          <p>Beginner mode keeps the app focused on Liquidity Sweeps, MSS, BOS, Displacement, and FVG until the foundation gate is passed.</p>
        </div>
        <button className={cls("primary-button", !beginnerMode && "ghost-button")} onClick={() => setBeginnerMode(!beginnerMode)}>{beginnerMode ? "Show advanced modes" : "Return to beginner mode"}</button>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>Recommended path</span><h2>Move in this order</h2></div></div>
        <div className="path-stack">
          {recommendedPath.map((phase, index) => {
            const locked = (index === 1 && !gates.foundationPassed) || (index === 2 && !gates.imbalancePassed);
            return <article className={cls("phase-card", locked && "locked")} key={phase.phase}><h3>{locked ? "Locked - " : ""}{phase.phase}</h3><ol>{phase.items.map((item) => <li key={item}>{item}</li>)}</ol><p><strong>Why it matters:</strong> {phase.why}</p><p><strong>Use:</strong> {phase.mode}</p><p><strong>Unlock rule:</strong> {phase.score}</p></article>;
          })}
        </div>
      </section>
      <section className="panel">
        <div className="section-title"><div><span>Mastery gates</span><h2>Unlock rules</h2></div></div>
        <div className="gate-grid">
          {(["Liquidity", "MSS", "BOS", "FVG"] as ModelKey[]).map((model) => {
            const gate = masteryFor(results, model);
            return <article className={cls("gate-card", gate.passed && "passed")} key={model}><strong>{modelLabels[model]}</strong><span>{gate.attempts}/20 attempts</span><div className="bar"><i style={{ width: `${gate.accuracy}%` }} /></div><b>{gate.accuracy}%</b><p>{gate.passed ? "Unlocked" : "Need 80%+ accuracy across 20 reps"}</p></article>;
          })}
        </div>
      </section>
      <LearningPaths results={results} />
      <section className={cls("panel", beginnerMode && !gates.foundationPassed && "advanced-muted")}>
        <div className="section-title"><div><span>Advanced modes</span><h2>Open when ready</h2></div></div>
        <div className="drill-grid">
          <button className="drill-card" onClick={() => setPage("library")}><BookOpen /><strong>Model Library</strong><span>Plain-English definitions and checklists.</span></button>
          <button className="drill-card" onClick={() => setPage("quiz")}><Gauge /><strong>Text Quiz</strong><span>Fast validation and terminology checks.</span></button>
          <button className="drill-card" onClick={() => setPage("flaw")}><XCircle /><strong>Spot the Flaw</strong><span>Invalid examples and failure logic.</span></button>
          <button className="drill-card" onClick={() => setPage("mtf")}><Layers3 /><strong>MTF</strong><span>1H bias, 5m setup, 1m entry alignment.</span></button>
          <button className="drill-card" onClick={() => setPage("narrative")}><Brain /><strong>Narrative</strong><span>Full trade idea decision process.</span></button>
          <button className="drill-card" onClick={() => startQuiz("Liquidity")}><Target /><strong>Start Foundation Quiz</strong><span>Begin with liquidity recognition.</span></button>
        </div>
      </section>
      <RelationshipMap />
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

export function App() {
  const [page, setPage] = useState<Page>("start");
  const [results, setResults] = useState<QuizResult[]>(loadResults);
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>(loadAnnotations);
  const [quizModel, setQuizModel] = useState<ModelKey | "all">("all");
  const [beginnerMode, setBeginnerMode] = useState(true);
  const stats = resultStats(results);

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
          <button className="primary-button" onClick={() => setPage("today")}>Start Today <ChevronRight size={18} /></button>
        </header>

        {page === "start" && <StartHere setPage={setPage} />}

        {page === "about" && <AboutSystem setPage={setPage} />}
        {page === "phone" && <PhoneHelp setPage={setPage} />}

        {page === "today" && <TodayTraining setPage={setPage} results={results} setResults={setResults} startQuiz={startQuiz} />}

        {page === "learn" && <LearnHub results={results} setPage={setPage} startQuiz={startQuiz} beginnerMode={beginnerMode} setBeginnerMode={setBeginnerMode} />}

        {page === "progress" && (
          <div className="page-grid">
            <ProgressSummary results={results} />
            <section className="hero-sim panel">
              <div><span>Priority Training</span><h2>Chart-first recognition reps</h2><p>Work from unmarked candlestick charts, place your own labels, then reveal the trainer markup.</p><button className="primary-button" onClick={() => setPage("chartLab")}>Open Chart Lab</button></div>
              <ChartPreview scenario={chartScenarios[0]} showCallouts />
            </section>
            <DailyDrills onStart={() => setPage("chartLab")} />
            <WeakAreasPanel results={results} />
            <MtfPanels />
            <RelationshipMap />
            <ReviewQueue results={results} onPractice={startQuiz} />
            <section className="panel"><div className="section-title"><div><span>Confidence Analytics</span><h2>Confidence vs correctness</h2></div></div><div className="confidence-readout"><strong>{stats.overconfident}</strong><span>high-confidence misses</span><strong>{stats.avgSpeed || "--"}s</strong><span>average answered speed</span></div></section>
          </div>
        )}

        {page === "chartLab" && <><ModeHelp id="chartLab" /><ChartTrainingMode scenarios={chartScenarios.filter((scenario) => scenario.mode === "recognition" && (!beginnerMode || phaseStatus(results).foundationPassed || ["Liquidity", "MSS", "BOS", "FVG"].includes(scenario.model)))} results={results} setResults={setResults} saveAnnotation={saveScenarioAnnotation} /></>}
        {page === "replay" && <><ModeHelp id="replay" /><ReplayMode results={results} setResults={setResults} /></>}
        {page === "flaw" && <><ModeHelp id="flaw" /><ChartTrainingMode scenarios={chartScenarios.filter((scenario) => scenario.mode === "invalid")} results={results} setResults={setResults} saveAnnotation={saveScenarioAnnotation} /></>}
        {page === "mtf" && <div className="page-grid"><ModeHelp id="mtf" /><MtfPanels /><MtfMode results={results} setResults={setResults} /></div>}
        {page === "narrative" && <><ModeHelp id="narrative" /><NarrativeMode results={results} setResults={setResults} /></>}
        {page === "paths" && <div className="page-grid"><LearningPaths results={results} /><RelationshipMap /></div>}
        {page === "library" && <ModelLibrary startQuiz={startQuiz} />}
        {page === "quiz" && <TextQuiz results={results} setResults={setResults} initialModel={quizModel} />}
        {page === "upload" && <><ModeHelp id="upload" /><ImageAnnotationTool annotations={annotations} setAnnotations={setAnnotations} /></>}
        {page === "review" && <><ModeHelp id="review" /><ReviewQueue results={results} onPractice={startQuiz} /></>}
      </main>
      <nav className="mobile-nav">{nav.map((item) => { const Icon = item.icon; return <button className={cls(page === item.page && "active")} key={item.page} onClick={() => setPage(item.page)}><Icon size={18} /><span>{item.label}</span></button>; })}</nav>
    </div>
  );
}
