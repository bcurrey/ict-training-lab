export type ModelKey =
  | "MSS"
  | "BOS"
  | "FVG"
  | "IFVG"
  | "BPR"
  | "Breaker"
  | "Liquidity"
  | "OrderBlock"
  | "PremiumDiscount"
  | "Sessions";

export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type QuizMode = "multiple" | "valid" | "sequence" | "whyNot" | "chart" | "spotFlaw" | "mtf" | "narrative";
export type AnnotationTool = "marker" | "rectangle" | "arrow" | "text";
export type Confidence = "low" | "medium" | "high";

export interface ICTModel {
  key: ModelKey;
  title: string;
  shortName: string;
  definition: string;
  checklist: string[];
  bullish: string;
  bearish: string;
  validates: string[];
  invalidates: string[];
  mistakes: string[];
  related: ModelKey[];
}

export interface QuizQuestion {
  id: string;
  mode: QuizMode;
  model: ModelKey;
  difficulty: Difficulty;
  prompt: string;
  choices?: string[];
  answer: string;
  explanation: string;
  concept?: string;
  mistakePrevented?: string;
  wrongAnswers?: Record<string, string>;
  sequence?: string[];
  requiresChart?: boolean;
  chartScenarioId?: string;
  requiredVisibleFeatures?: string[];
}

export interface QuizResult {
  id: string;
  model: ModelKey;
  mode: QuizMode;
  question: string;
  myAnswer: string;
  correctAnswer: string;
  explanation: string;
  result: "correct" | "incorrect";
  difficulty: Difficulty;
  dateCompleted: string;
  nextReviewDate: string;
  confidence?: Confidence;
  elapsedMs?: number;
}

export interface AnnotationMarker {
  id: string;
  label: string;
  x: number;
  y: number;
  type?: AnnotationTool;
  color?: string;
  visible?: boolean;
  zIndex?: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
}

export interface ChartAnnotation {
  id: string;
  model: ModelKey;
  imageData: string;
  markers: AnnotationMarker[];
  notes: string;
  grade: "right" | "wrong" | "ungraded";
  createdAt: string;
  sourceScenarioId?: string;
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartCallout {
  id: string;
  label: string;
  x: number;
  y: number;
  type: AnnotationTool;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
}

export interface ChartScenario {
  id: string;
  title: string;
  model: ModelKey;
  market?: "NQ" | "MNQ" | "ES" | "Custom";
  imageSrc?: string;
  mode: "recognition" | "invalid" | "replay" | "mtf" | "narrative";
  difficulty: Difficulty;
  exampleType?: "textbook" | "realistic" | "borderline" | "invalid";
  isValid?: boolean;
  prompt: string;
  timeframe: string;
  htfBias: string;
  setupFrame: string;
  executionFrame: string;
  candles: Candle[];
  revealIndex: number;
  answer: string;
  choices: string[];
  flaw?: string;
  explanation: string;
  mistakeTrained?: string;
  tags?: string[];
  requiredVisibleFeatures?: string[];
  callouts: ChartCallout[];
  narrativeSteps?: string[];
  panels?: Array<{
    label: string;
    timeframe: string;
    candles: Candle[];
    note: string;
  }>;
}

export interface ChartQuestion {
  id: string;
  concept: ModelKey;
  difficulty: Difficulty;
  chartImage?: string;
  chartScenarioId: string;
  prompt: string;
  answerChoices: string[];
  correctAnswer: string;
  explanation: string;
  whyWrong: Record<string, string>;
  trainerMarkup: ChartCallout[];
  requiredVisibleFeatures: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  models: ModelKey[];
  unlockAccuracy: number;
  lessons: string[];
}

export type CertificationLevel = "Foundation" | "Intermediate" | "Advanced" | "Master";

export interface VideoLesson {
  id: string;
  title: string;
  creator: string;
  runtime: string;
  url?: string;
  concepts?: string[];
  whyRequired?: string;
  requiredQuiz?: string;
}

export interface CertificationQuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
}

export interface CertificationModule {
  id: string;
  title: string;
  level: CertificationLevel;
  model?: ModelKey;
  certification: string;
  videos: VideoLesson[];
  chartDrillsRequired: number;
  replayRequired: number;
  examCharts: number;
  passingScore: number;
  examTopics: string[];
  description: string;
  unlockAfter?: string[];
}

export interface CertificationProgress {
  watchedVideos: Record<string, boolean>;
  videoStatus: Record<string, "not-started" | "in-progress" | "completed">;
  videoCompletedAt: Record<string, string>;
  videoNotes: Record<string, string>;
  quizScores: Record<string, number>;
  chartDrills: Record<string, number>;
  replayExercises: Record<string, number>;
  examScores: Record<string, number>;
}

export interface BookmarkItem {
  id: string;
  type: "chart" | "question" | "video" | "replay" | "drill";
  title: string;
  refId: string;
  model?: ModelKey;
  createdAt: string;
  note?: string;
}
