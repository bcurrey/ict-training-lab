import type { Candle, ChartScenario, Difficulty, ICTModel, LearningPath, ModelKey, QuizQuestion } from "./types";

export const modelOrder: ModelKey[] = [
  "MSS",
  "BOS",
  "FVG",
  "IFVG",
  "BPR",
  "Breaker",
  "Liquidity",
  "OrderBlock",
  "PremiumDiscount",
  "Sessions"
];

export const modelLabels: Record<ModelKey, string> = {
  MSS: "Market Structure Shift",
  BOS: "Break of Structure",
  FVG: "Fair Value Gap",
  IFVG: "Inverted Fair Value Gap",
  BPR: "Balanced Price Range",
  Breaker: "Breaker Block",
  Liquidity: "Liquidity Sweep",
  OrderBlock: "Order Block",
  PremiumDiscount: "Premium / Discount",
  Sessions: "Session Highs & Lows"
};

export const models: ICTModel[] = [
  {
    key: "MSS",
    title: "Market Structure Shift / MSS",
    shortName: "MSS",
    definition: "A meaningful break in the prior dealing range that suggests control has shifted from one side of the market to the other after liquidity has been engaged.",
    checklist: ["Identify the active swing structure.", "Note a likely liquidity pool.", "Wait for the sweep or raid.", "Require displacement through the correct swing.", "Mark the displacement leg and any FVG created."],
    bullish: "After sell-side liquidity is swept, price displaces above the lower-timeframe swing high that created the final sell leg.",
    bearish: "After buy-side liquidity is swept, price displaces below the lower-timeframe swing low that created the final buy leg.",
    validates: ["Close through the correct swing", "Clear displacement", "Liquidity taken first", "Follow-through into a retracement or continuation"],
    invalidates: ["Only a wick through structure", "No displacement", "Wrong swing broken", "Higher-timeframe draw already completed"],
    mistakes: ["Calling every break an MSS", "Ignoring the liquidity event", "Using a random minor swing", "Entering before confirmation"],
    related: ["Liquidity", "FVG", "BOS", "PremiumDiscount"]
  },
  {
    key: "BOS",
    title: "Break of Structure / BOS",
    shortName: "BOS",
    definition: "A continuation break where price takes out a structural swing in the direction of the existing trend.",
    checklist: ["Define trend direction.", "Mark the swing high or low that maintains structure.", "Look for decisive candle close beyond it.", "Confirm continuation context.", "Avoid confusing continuation with reversal."],
    bullish: "In an uptrend, price closes above a prior swing high and continues the bullish delivery.",
    bearish: "In a downtrend, price closes below a prior swing low and continues bearish delivery.",
    validates: ["Trend context remains intact", "Candle body closes beyond structure", "Displacement supports the break", "Retest respects the broken level"],
    invalidates: ["Break occurs against trend after a sweep", "Immediate failure back into range", "Wick-only breach", "No clear swing"],
    mistakes: ["Labeling MSS as BOS", "Ignoring close quality", "Using internal noise as structure", "Forgetting timeframe context"],
    related: ["MSS", "FVG", "OrderBlock", "Sessions"]
  },
  {
    key: "FVG",
    title: "Fair Value Gap / FVG",
    shortName: "FVG",
    definition: "A three-candle imbalance where price delivered so quickly that the first and third candle leave an inefficient gap in the middle candle's displacement.",
    checklist: ["Find a displacement candle.", "Compare candle one high/low with candle three low/high.", "Mark the untraded imbalance.", "Check context and draw on liquidity.", "Watch mitigation behavior."],
    bullish: "In a bullish displacement, candle three's low remains above candle one's high, leaving a buy-side imbalance.",
    bearish: "In bearish displacement, candle three's high remains below candle one's low, leaving a sell-side imbalance.",
    validates: ["Strong displacement", "Clean three-candle gap", "Relevant to structure shift or continuation", "Mitigation reacts before full invalidation"],
    invalidates: ["Gap already fully filled", "No displacement", "Tiny gap in chop", "Context is exhausted"],
    mistakes: ["Trading every tiny gap", "Ignoring whether liquidity was taken", "Mislabeling normal candle overlap", "Entering after full fill without reaction"],
    related: ["MSS", "BOS", "IFVG", "BPR"]
  },
  {
    key: "IFVG",
    title: "Inverted Fair Value Gap / IFVG",
    shortName: "IFVG",
    definition: "A failed FVG that price violates and then respects from the opposite side, turning prior imbalance into opposing delivery.",
    checklist: ["Start with a valid FVG.", "Observe full violation through it.", "Watch price retest from the opposite side.", "Require rejection or displacement away.", "Confirm it fits the new directional bias."],
    bullish: "A bearish FVG is broken upward and later holds as support during a bullish shift.",
    bearish: "A bullish FVG is broken downward and later holds as resistance during a bearish shift.",
    validates: ["Original FVG is real", "Decisive inversion through the zone", "Retest respects opposite side", "Follow-through after retest"],
    invalidates: ["Original FVG was not valid", "No clean inversion", "Price chops through repeatedly", "Retest happens after draw is met"],
    mistakes: ["Calling any retest an IFVG", "Skipping the original FVG validation", "Ignoring displacement through the zone", "Using IFVG without directional context"],
    related: ["FVG", "MSS", "BPR", "Breaker"]
  },
  {
    key: "BPR",
    title: "Balanced Price Range / BPR",
    shortName: "BPR",
    definition: "An overlap between opposing imbalances where buy-side and sell-side inefficiencies partially rebalance, often becoming a precise reaction zone.",
    checklist: ["Find opposing FVGs.", "Mark their overlap.", "Confirm displacement on both sides.", "Use the overlap as the BPR zone.", "Check whether price respects or violates it."],
    bullish: "A bearish imbalance is overlapped by a bullish imbalance, and the overlap later supports price.",
    bearish: "A bullish imbalance is overlapped by a bearish imbalance, and the overlap later resists price.",
    validates: ["Two genuine opposing imbalances", "Clear overlap", "Context supports the reaction", "Price respects the range edge"],
    invalidates: ["No actual overlap", "One side lacks displacement", "Zone fully violated without reaction", "Used in the middle of noisy consolidation"],
    mistakes: ["Marking the entire gap instead of overlap", "Forcing BPR where no opposing FVG exists", "Ignoring session context", "Treating BPR as a signal by itself"],
    related: ["FVG", "IFVG", "MSS", "PremiumDiscount"]
  },
  {
    key: "Breaker",
    title: "Breaker Blocks",
    shortName: "Breaker",
    definition: "A failed order-block area where price breaks through the prior protected swing and later retests the failed block from the opposite side.",
    checklist: ["Identify the prior order block.", "Confirm it fails by breaking protected structure.", "Wait for price to return.", "Look for rejection from the failed block.", "Confirm alignment with liquidity and displacement."],
    bullish: "A bearish order block fails, structure breaks upward, and the failed block later supports price.",
    bearish: "A bullish order block fails, structure breaks downward, and the failed block later resists price.",
    validates: ["The original block caused a swing", "Protected structure fails", "Retest occurs after displacement", "Retest rejects in new direction"],
    invalidates: ["No protected swing was broken", "Block never caused displacement", "Price slices through the retest", "The zone is too broad to be actionable"],
    mistakes: ["Confusing breaker with ordinary support/resistance", "Ignoring the failed-block story", "Marking random candles", "Entering before retest behavior"],
    related: ["OrderBlock", "MSS", "IFVG", "Liquidity"]
  },
  {
    key: "Liquidity",
    title: "Liquidity Sweeps",
    shortName: "Liquidity",
    definition: "A move through obvious resting liquidity, such as equal highs/lows or session extremes, followed by rejection or displacement.",
    checklist: ["Mark obvious highs/lows.", "Identify equal highs/lows or session extremes.", "Wait for raid beyond the level.", "Check rejection and displacement.", "Connect the sweep to a draw on liquidity."],
    bullish: "Price raids sell-side liquidity below lows, rejects, and displaces upward.",
    bearish: "Price raids buy-side liquidity above highs, rejects, and displaces downward.",
    validates: ["Obvious liquidity pool", "Clean run beyond the level", "Rejection or displacement after run", "Subsequent structure confirms intent"],
    invalidates: ["Level was not meaningful", "Sweep continues without rejection", "No displacement after raid", "HTF context opposes the idea"],
    mistakes: ["Calling every wick a sweep", "Ignoring time of day", "Forgetting session highs/lows", "Entering solely because liquidity was touched"],
    related: ["MSS", "Sessions", "PremiumDiscount", "FVG"]
  },
  {
    key: "OrderBlock",
    title: "Order Blocks",
    shortName: "Order Block",
    definition: "The final opposing candle or candle cluster before displacement that breaks structure or creates meaningful delivery.",
    checklist: ["Find displacement first.", "Trace back to the final opposing candle.", "Confirm it caused structure break or imbalance.", "Refine to body/wick based on context.", "Observe mitigation response."],
    bullish: "The last down candle before bullish displacement and structural break later supports price.",
    bearish: "The last up candle before bearish displacement and structural break later resists price.",
    validates: ["Caused displacement", "Linked to MSS or BOS", "Unmitigated or partially mitigated", "Reaction respects the zone"],
    invalidates: ["Random candle in chop", "No structural consequence", "Zone already fully traded through", "No reaction on return"],
    mistakes: ["Marking too many candles", "Choosing blocks before confirmation", "Ignoring FVG or liquidity context", "Using oversized zones"],
    related: ["Breaker", "MSS", "BOS", "FVG"]
  },
  {
    key: "PremiumDiscount",
    title: "Premium / Discount",
    shortName: "PD Array",
    definition: "A dealing-range framework that separates price into discount below equilibrium, premium above equilibrium, and fair value around the midpoint.",
    checklist: ["Define the dealing range.", "Mark high, low, and 50% equilibrium.", "Seek longs in discount.", "Seek shorts in premium.", "Align entries with liquidity and displacement."],
    bullish: "A long idea is higher quality when it forms in discount after sell-side liquidity is taken.",
    bearish: "A short idea is higher quality when it forms in premium after buy-side liquidity is taken.",
    validates: ["Correct dealing range", "Setup forms on favorable side of equilibrium", "Liquidity and displacement align", "Target sits logically in opposing liquidity"],
    invalidates: ["Wrong range selected", "Longs in premium without context", "Shorts in discount without context", "Draw on liquidity already satisfied"],
    mistakes: ["Redrawing ranges to fit a bias", "Ignoring HTF range", "Treating 50% as magic", "Using PD without a model"],
    related: ["Liquidity", "MSS", "OrderBlock", "Sessions"]
  },
  {
    key: "Sessions",
    title: "Session Highs and Lows",
    shortName: "Sessions",
    definition: "Important intraday reference points from Asia, London, New York, previous day, and killzone windows where liquidity often rests.",
    checklist: ["Mark previous day high/low.", "Mark Asia range.", "Mark London and New York highs/lows.", "Watch raids around active sessions.", "Connect sweeps to displacement and structure."],
    bullish: "A raid below Asia or previous low during a key window can precede bullish displacement if context supports it.",
    bearish: "A raid above Asia or previous high during a key window can precede bearish displacement if context supports it.",
    validates: ["Correct session boundaries", "High or low is obvious", "Raid occurs during meaningful time", "Follow-up displacement confirms intent"],
    invalidates: ["Incorrect session marking", "No sweep or reaction", "Level is insignificant", "Move happens after the draw is already complete"],
    mistakes: ["Using local chart time incorrectly", "Treating every session high as a reversal point", "Ignoring economic calendar risk", "Skipping structure confirmation"],
    related: ["Liquidity", "MSS", "BOS", "PremiumDiscount"]
  }
];

const whyNotReasons = [
  "no liquidity sweep",
  "no displacement",
  "wrong swing broken",
  "FVG already filled",
  "no 1m confirmation",
  "HTF draw already reached",
  "weak candle close",
  "only a wick through structure"
];

const difficultyCopy: Record<Difficulty, string> = {
  1: "clean textbook example",
  2: "normal real chart example",
  3: "borderline example",
  4: "fast recognition drill",
  5: "full trade narrative"
};

function multipleChoiceForModel(model: ICTModel, index: number): QuizQuestion {
  const prompts = [
    `A setup raids liquidity, displaces through the swing that created the last opposing leg, and leaves an imbalance. Which model is most central?`,
    `Which item best confirms ${model.shortName} in a ${difficultyCopy[((index % 5) + 1) as Difficulty]}?`,
    `What would most clearly invalidate this ${model.shortName} read?`,
    `A trader sees ${model.shortName} forming but ignores context. What is the safest interpretation?`,
    `Which related concept should usually be checked before acting on ${model.shortName}?`
  ];
  const difficulty = ((index % 5) + 1) as Difficulty;
  const choices = [model.title, "Nothing valid yet", "A guaranteed trade signal", modelLabels[model.related[index % model.related.length]]];
  return {
    id: `${model.key}-mc-${index}`,
    mode: "multiple",
    model: model.key,
    difficulty,
    prompt: prompts[index % prompts.length],
    choices,
    answer: index % 5 === 3 ? "Nothing valid yet" : model.title,
    explanation: `${model.shortName} requires context and confirmation. It is for pattern-recognition training only, not a complete trade signal.`,
    concept: `${model.shortName} recognition and context filtering`,
    mistakePrevented: `Treating ${model.shortName} as a standalone signal without liquidity, displacement, timeframe, and risk context.`,
    wrongAnswers: {
      "Nothing valid yet": "This is correct only when the prompt lacks confirmation or context.",
      "A guaranteed trade signal": "No ICT model is a guaranteed trade signal. It still needs context and risk management.",
      [modelLabels[model.related[index % model.related.length]]]: "This related model may support the read, but it is not the central model described in the prompt."
    }
  };
}

function validInvalidForModel(model: ICTModel, index: number): QuizQuestion {
  const valid = index % 2 === 0;
  const invalidator = model.invalidates[index % model.invalidates.length];
  return {
    id: `${model.key}-vi-${index}`,
    mode: "valid",
    model: model.key,
    difficulty: ((index % 5) + 1) as Difficulty,
    prompt: valid
      ? `${model.shortName}: ${model.validates[index % model.validates.length]} appears after a clear contextual setup. Does it qualify?`
      : `${model.shortName}: the chart has ${invalidator.toLowerCase()} and no follow-through. Does it qualify?`,
    choices: ["Valid", "Invalid"],
    answer: valid ? "Valid" : "Invalid",
    explanation: valid
      ? `This qualifies because the core validation condition is present: ${model.validates[index % model.validates.length]}.`
      : `This is invalid because ${invalidator.toLowerCase()} undermines the model.`,
    concept: `${model.shortName} validation rules`,
    mistakePrevented: `Accepting a weak ${model.shortName} without the mechanical validation checklist.`,
    wrongAnswers: valid
      ? { Invalid: "Invalid would be correct only if a core condition was missing or violated." }
      : { Valid: `Valid is wrong because ${invalidator.toLowerCase()} is a direct invalidation condition.` }
  };
}

export const quizQuestions: QuizQuestion[] = [
  ...models.flatMap((model) => [
    ...Array.from({ length: 20 }, (_, index) => multipleChoiceForModel(model, index)),
    ...Array.from({ length: 20 }, (_, index) => validInvalidForModel(model, index))
  ]),
  {
    id: "seq-1",
    mode: "sequence",
    model: "MSS",
    difficulty: 2,
    prompt: "Put the classic bullish reversal training sequence in order.",
    sequence: ["liquidity sweep", "displacement", "MSS", "FVG creation", "mitigation", "continuation"],
    answer: "liquidity sweep > displacement > MSS > FVG creation > mitigation > continuation",
    explanation: "Liquidity is raided first, displacement changes delivery, structure confirms, imbalance forms, mitigation offers study context, then continuation may occur."
  },
  {
    id: "seq-2",
    mode: "sequence",
    model: "BOS",
    difficulty: 2,
    prompt: "Order a continuation BOS study flow.",
    sequence: ["trend defined", "protected swing marked", "displacement toward trend", "body close beyond structure", "retest", "continuation"],
    answer: "trend defined > protected swing marked > displacement toward trend > body close beyond structure > retest > continuation",
    explanation: "A BOS is a continuation read, so trend and protected structure come before the break."
  },
  {
    id: "seq-3",
    mode: "sequence",
    model: "IFVG",
    difficulty: 3,
    prompt: "Order the IFVG recognition flow.",
    sequence: ["valid FVG forms", "price violates the FVG", "opposite-side retest", "rejection", "follow-through"],
    answer: "valid FVG forms > price violates the FVG > opposite-side retest > rejection > follow-through",
    explanation: "An IFVG starts as a real FVG that fails and later behaves from the opposite side."
  },
  {
    id: "seq-4",
    mode: "sequence",
    model: "Breaker",
    difficulty: 4,
    prompt: "Order the breaker-block narrative.",
    sequence: ["original order block forms", "protected swing fails", "displacement confirms failure", "return to failed block", "rejection in new direction"],
    answer: "original order block forms > protected swing fails > displacement confirms failure > return to failed block > rejection in new direction",
    explanation: "The breaker story depends on a failed block and a later retest."
  },
  {
    id: "seq-5",
    mode: "sequence",
    model: "BPR",
    difficulty: 3,
    prompt: "Order the BPR construction steps.",
    sequence: ["first FVG forms", "opposing FVG forms", "overlap is marked", "price returns to overlap", "reaction is evaluated"],
    answer: "first FVG forms > opposing FVG forms > overlap is marked > price returns to overlap > reaction is evaluated",
    explanation: "The balanced range is the overlap of two opposing imbalances."
  },
  ...whyNotReasons.slice(0, 5).map((reason, index) => ({
    id: `why-${index + 1}`,
    mode: "whyNot" as const,
    model: modelOrder[index],
    difficulty: ((index % 5) + 1) as Difficulty,
    prompt: `A trader labels this as ${modelLabels[modelOrder[index]]}, but the setup has ${reason}. Why is it not valid?`,
    choices: whyNotReasons,
    answer: reason,
    explanation: `The model is borderline or failed because there is ${reason}. This should go into review rather than being treated as a signal.`
  }))
];

export function getModel(key: ModelKey) {
  return models.find((model) => model.key === key)!;
}

function makeCandles(seed: number, count = 42, bias: "up" | "down" | "range" = "up"): Candle[] {
  let price = 100 + seed * 2;
  return Array.from({ length: count }, (_, index) => {
    const trend = bias === "up" ? 0.42 : bias === "down" ? -0.38 : Math.sin(index / 2) * 0.08;
    const impulse = index === 18 ? (bias === "down" ? -4.8 : 4.8) : index === 25 ? (bias === "down" ? 2.5 : -2.2) : 0;
    const open = price;
    const close = price + trend + Math.sin((index + seed) * 1.4) * 0.9 + impulse;
    const high = Math.max(open, close) + 0.7 + Math.abs(Math.sin(index + seed)) * 0.8;
    const low = Math.min(open, close) - 0.7 - Math.abs(Math.cos(index + seed)) * 0.8;
    price = close;
    return {
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2))
    };
  });
}

const baseChartScenarios: ChartScenario[] = [
  {
    id: "chart-mss-raid",
    title: "Sell-side raid into bullish MSS",
    model: "MSS",
    market: "NQ",
    imageSrc: "/charts/nq-placeholder-bullish.svg",
    mode: "recognition",
    difficulty: 2,
    exampleType: "realistic",
    isValid: true,
    prompt: "Mark the MSS after the sell-side liquidity sweep.",
    timeframe: "5m",
    htfBias: "1H draw remains above price after sell-side liquidity is raided.",
    setupFrame: "5m",
    executionFrame: "1m",
    candles: makeCandles(1, 44, "up"),
    revealIndex: 27,
    answer: "MSS",
    choices: ["MSS", "BOS", "FVG", "Nothing valid yet"],
    explanation: "The key learning point is sequence: liquidity is taken first, then displacement breaks the correct swing. This trains recognition, not signal-taking.",
    mistakeTrained: "Entering on a sweep before displacement and structure confirmation.",
    tags: ["liquidity sweep", "MSS", "FVG", "entry", "invalidation"],
    callouts: [
      { id: "mss-liq", label: "sell-side liquidity", x: 24, y: 75, type: "marker" },
      { id: "mss-break", label: "MSS", x: 48, y: 36, type: "arrow", x2: 56, y2: 27 },
      { id: "mss-fvg", label: "FVG", x: 54, y: 39, type: "rectangle", width: 13, height: 11 }
    ]
  },
  {
    id: "chart-fvg-clean",
    title: "Clean displacement FVG",
    model: "FVG",
    market: "NQ",
    imageSrc: "/charts/nq-placeholder-bullish.svg",
    mode: "recognition",
    difficulty: 1,
    exampleType: "textbook",
    isValid: true,
    prompt: "Where is the FVG created by displacement?",
    timeframe: "1m",
    htfBias: "Bullish 15m delivery after a low raid.",
    setupFrame: "5m",
    executionFrame: "1m",
    candles: makeCandles(2, 40, "up"),
    revealIndex: 22,
    answer: "FVG",
    choices: ["FVG", "IFVG", "Breaker", "No imbalance"],
    explanation: "A valid FVG needs an actual three-candle inefficiency around displacement. Tiny gaps in chop should not be trained as high-quality examples.",
    mistakeTrained: "Calling tiny candle overlap in chop a tradeable FVG.",
    tags: ["FVG", "displacement", "entry", "target"],
    callouts: [
      { id: "fvg-zone", label: "FVG", x: 49, y: 39, type: "rectangle", width: 12, height: 13 },
      { id: "fvg-displacement", label: "displacement", x: 44, y: 58, type: "arrow", x2: 50, y2: 31 }
    ]
  },
  {
    id: "chart-breaker-invalid",
    title: "Invalid breaker after weak failure",
    model: "Breaker",
    market: "MNQ",
    imageSrc: "/charts/nq-placeholder-invalid.svg",
    mode: "invalid",
    difficulty: 3,
    exampleType: "invalid",
    isValid: false,
    prompt: "Is this a valid breaker, or what invalidates it?",
    timeframe: "5m",
    htfBias: "HTF draw was already reached before the retest.",
    setupFrame: "5m",
    executionFrame: "1m",
    candles: makeCandles(3, 44, "range"),
    revealIndex: 30,
    answer: "HTF draw already completed",
    choices: ["Valid breaker", "HTF draw already completed", "Clean MSS", "Tradeable FVG"],
    flaw: "HTF draw already completed",
    explanation: "The retest alone is not enough. The setup weakens because the higher-timeframe objective was already met and displacement is poor.",
    mistakeTrained: "Treating a retest as a breaker without protected-structure failure and active draw.",
    tags: ["breaker", "invalid setup", "weak displacement", "HTF draw reached"],
    callouts: [
      { id: "breaker-old", label: "old OB", x: 35, y: 42, type: "rectangle", width: 14, height: 16 },
      { id: "breaker-fail", label: "weak close", x: 58, y: 43, type: "marker" }
    ]
  },
  {
    id: "chart-wick-mss-fake",
    title: "Fake MSS wick through structure",
    model: "MSS",
    market: "MNQ",
    imageSrc: "/charts/nq-placeholder-invalid.svg",
    mode: "invalid",
    difficulty: 3,
    exampleType: "borderline",
    isValid: false,
    prompt: "Why is this NOT a valid MSS?",
    timeframe: "1m",
    htfBias: "Bearish 15m delivery remains intact.",
    setupFrame: "5m",
    executionFrame: "1m",
    candles: makeCandles(4, 40, "down"),
    revealIndex: 24,
    answer: "only wick through structure",
    choices: ["only wick through structure", "valid MSS", "clean displacement", "fresh BPR"],
    flaw: "only wick through structure",
    explanation: "A wick through the level without body displacement is a common false read. The platform intentionally trains these failed examples.",
    mistakeTrained: "Accepting a wick through structure as a confirmed MSS.",
    tags: ["fake MSS", "wick through structure", "invalid setup"],
    callouts: [
      { id: "fake-level", label: "structure not closed through", x: 48, y: 47, type: "arrow", x2: 55, y2: 46 }
    ]
  },
  {
    id: "chart-mtf-alignment",
    title: "1H bias, 5m setup, 1m execution",
    model: "PremiumDiscount",
    market: "NQ",
    imageSrc: "/charts/nq-placeholder-bullish.svg",
    mode: "mtf",
    difficulty: 4,
    exampleType: "realistic",
    isValid: true,
    prompt: "Would you execute the 1m long given the 1H draw and 5m structure?",
    timeframe: "MTF",
    htfBias: "1H is drawing toward buy-side liquidity above equilibrium.",
    setupFrame: "5m bullish MSS from discount.",
    executionFrame: "1m FVG mitigation after displacement.",
    candles: makeCandles(5, 38, "up"),
    revealIndex: 25,
    answer: "Aligned but still needs risk-defined execution",
    choices: ["Aligned but still needs risk-defined execution", "Counter-trend", "Invalid because no HTF draw", "Guaranteed trade"],
    explanation: "HTF draw, setup timeframe structure, and execution timeframe entry are aligned, but this still is not a guaranteed signal.",
    mistakeTrained: "Ignoring HTF draw or calling alignment a guaranteed entry.",
    tags: ["MTF", "premium discount", "MSS", "FVG", "entry"],
    callouts: [
      { id: "mtf-discount", label: "discount", x: 27, y: 72, type: "rectangle", width: 22, height: 19 },
      { id: "mtf-entry", label: "1m entry model", x: 62, y: 42, type: "marker" }
    ],
    panels: [
      { label: "HTF Bias", timeframe: "1H", candles: makeCandles(6, 24, "up"), note: "Draw above price, bullish delivery." },
      { label: "Setup", timeframe: "5m", candles: makeCandles(7, 30, "up"), note: "MSS from discount after sell-side raid." },
      { label: "Execution", timeframe: "1m", candles: makeCandles(8, 34, "up"), note: "FVG mitigation is the execution study area." }
    ]
  },
  {
    id: "chart-replay-london",
    title: "London sweep replay",
    model: "Liquidity",
    market: "NQ",
    imageSrc: "/charts/nq-placeholder-bullish.svg",
    mode: "replay",
    difficulty: 4,
    exampleType: "realistic",
    isValid: true,
    prompt: "Step forward and identify liquidity, MSS, FVG, entry, and invalidation before the reveal.",
    timeframe: "1m",
    htfBias: "Previous day low is the initial draw; later delivery seeks opposing intraday liquidity.",
    setupFrame: "5m",
    executionFrame: "1m",
    candles: makeCandles(9, 56, "up"),
    revealIndex: 18,
    answer: "liquidity sweep > displacement > MSS > FVG creation > mitigation > continuation",
    choices: ["Take every sweep", "Wait for displacement and structure", "Ignore HTF draw", "Guaranteed continuation"],
    explanation: "Replay mode hides future candles so you train decision timing rather than hindsight labeling.",
    mistakeTrained: "Recognizing the setup only after seeing the full move.",
    tags: ["liquidity sweep", "replay", "MSS", "FVG", "invalidation"],
    callouts: [
      { id: "replay-liq", label: "liquidity", x: 22, y: 74, type: "marker" },
      { id: "replay-mss", label: "MSS", x: 43, y: 39, type: "arrow", x2: 51, y2: 31 },
      { id: "replay-inv", label: "invalidation", x: 58, y: 77, type: "marker" }
    ]
  },
  {
    id: "chart-narrative-full",
    title: "Full trade narrative training",
    model: "FVG",
    market: "NQ",
    imageSrc: "/charts/nq-placeholder-bullish.svg",
    mode: "narrative",
    difficulty: 5,
    exampleType: "realistic",
    isValid: true,
    prompt: "Walk through the full decision process before deciding whether this is tradeable.",
    timeframe: "5m / 1m",
    htfBias: "Bullish HTF draw remains open, but session high liquidity is nearby.",
    setupFrame: "5m",
    executionFrame: "1m",
    candles: makeCandles(10, 48, "up"),
    revealIndex: 28,
    answer: "Take only if entry, invalidation, and target produce acceptable risk after confirmation",
    choices: ["Take only if entry, invalidation, and target produce acceptable risk after confirmation", "Take immediately", "Invalid because all FVGs fail", "Guaranteed continuation"],
    explanation: "Narrative mode forces the whole chain: liquidity, MSS, displacement, FVG quality, entry, invalidation, target, and final decision.",
    mistakeTrained: "Skipping from model recognition to trade entry without a full decision narrative.",
    tags: ["narrative", "liquidity", "FVG", "entry", "target", "invalidation"],
    callouts: [
      { id: "nar-liq", label: "target liquidity", x: 79, y: 22, type: "marker" },
      { id: "nar-fvg", label: "tradeable FVG?", x: 55, y: 40, type: "rectangle", width: 13, height: 12 },
      { id: "nar-stop", label: "invalidation", x: 51, y: 72, type: "marker" }
    ],
    narrativeSteps: [
      "What liquidity is being targeted?",
      "Was the MSS valid?",
      "Was there displacement?",
      "Is the FVG tradeable?",
      "Where is entry?",
      "Where is invalidation?",
      "Where is target?",
      "Would you take this trade?",
      "Why or why not?"
    ]
  }
];

const conceptPrompts: Record<ModelKey, string[]> = {
  Liquidity: ["Where is the liquidity pool?", "Did price raid buy-side or sell-side liquidity?", "What would confirm the sweep was meaningful?", "Would you wait for displacement after this raid?"],
  MSS: ["Mark the MSS.", "Which swing must break for this MSS to be valid?", "Is this a real structure shift or only a liquidity run?", "Where does displacement confirm the shift?"],
  BOS: ["Mark the BOS.", "Is this continuation or reversal structure?", "Which swing confirms continuation?", "Is this break strong enough to count?"],
  FVG: ["Where is the FVG?", "Is the imbalance clean or too small?", "Was the FVG created by displacement?", "Has this imbalance already been mitigated?"],
  IFVG: ["Where did the FVG invert?", "Did price retest the imbalance from the opposite side?", "Is this a valid IFVG or chop?", "What confirms the inversion?"],
  BPR: ["Where is the BPR overlap?", "Do the opposing imbalances actually overlap?", "Is this BPR respected or violated?", "What makes this BPR usable?"],
  Breaker: ["Is this a valid breaker?", "Where did the original block fail?", "Was protected structure broken?", "What invalidates this breaker?"],
  OrderBlock: ["Where is the order block?", "Did this block cause displacement?", "Is the zone too broad?", "Was the block already mitigated?"],
  PremiumDiscount: ["Is price in premium or discount?", "Is the setup on the favorable side of equilibrium?", "Which dealing range is being used?", "Does this support or weaken the idea?"],
  Sessions: ["Where are the session highs and lows?", "Did the active session raid liquidity?", "Is this time window meaningful?", "Which session level matters most?"]
};

function scenarioFor(model: ICTModel, index: number, mode: ChartScenario["mode"]): ChartScenario {
  const invalid = mode === "invalid";
  const narrative = mode === "narrative";
  const replay = mode === "replay";
  const bias = index % 3 === 0 ? "up" : index % 3 === 1 ? "down" : "range";
  const flaw = whyNotReasons[index % whyNotReasons.length];
  const promptList = conceptPrompts[model.key];
  const prompt = invalid
    ? `Spot the flaw: why is this ${model.shortName} setup not valid?`
    : replay
      ? `Replay ${model.shortName}: step forward before judging the setup.`
      : narrative
        ? `Walk through the full ${model.shortName} trade narrative.`
        : promptList[index % promptList.length];
  return {
    id: `${mode}-${model.key}-${index}`,
    title: `${model.shortName} ${mode} drill ${index + 1}`,
    model: model.key,
    market: index % 2 === 0 ? "NQ" : "MNQ",
    imageSrc: invalid ? "/charts/nq-placeholder-invalid.svg" : "/charts/nq-placeholder-bullish.svg",
    mode,
    difficulty: (((index + (invalid ? 2 : 0)) % 5) + 1) as Difficulty,
    exampleType: invalid ? "invalid" : index % 4 === 0 ? "textbook" : index % 4 === 1 ? "realistic" : "borderline",
    isValid: !invalid,
    prompt,
    timeframe: index % 2 === 0 ? "5m" : "1m",
    htfBias: index % 2 === 0 ? "HTF draw is still open; require confirmation before any execution idea." : "HTF draw is near completion; be stricter with continuation assumptions.",
    setupFrame: "5m setup context",
    executionFrame: "1m execution refinement",
    candles: makeCandles(30 + index + modelOrder.indexOf(model.key) * 17, replay ? 56 : 42, bias),
    revealIndex: replay ? 18 + (index % 8) : 26,
    answer: invalid ? flaw : narrative ? "Decision depends on liquidity, displacement, entry, invalidation, target, and risk." : model.title,
    choices: invalid
      ? [flaw, "Valid setup", "Guaranteed continuation", model.title]
      : ["Valid only with context", model.title, "Guaranteed trade", "Nothing to study"],
    flaw: invalid ? flaw : undefined,
    explanation: invalid
      ? `This trains rejection of weak examples. The setup is flawed because there is ${flaw}.`
      : `This trains ${model.shortName} recognition on a chart. The correct read still needs context, liquidity, displacement, timeframe alignment, and risk management.`,
    mistakeTrained: invalid
      ? `Avoid accepting ${model.shortName} when there is ${flaw}.`
      : `Avoid treating ${model.shortName} as a complete setup without context and risk definition.`,
    tags: invalid
      ? [model.shortName, "invalid setup", flaw]
      : [model.shortName, "liquidity sweep", "MSS/BOS", "FVG", "entry", "invalidation"],
    callouts: [
      { id: `${mode}-${model.key}-${index}-a`, label: invalid ? flaw : model.shortName, x: 34 + (index % 5) * 8, y: 28 + (index % 4) * 8, type: index % 2 === 0 ? "marker" : "rectangle", width: 12, height: 10 },
      { id: `${mode}-${model.key}-${index}-b`, label: "context", x: 58, y: 48, type: "arrow", x2: 66, y2: 38 }
    ],
    narrativeSteps: narrative ? [
      "What liquidity is being targeted?",
      "Is the structure shift or continuation valid?",
      "Was there displacement?",
      "Is there a tradeable imbalance or block?",
      "Where is entry?",
      "Where is invalidation?",
      "Where is target?",
      "Would you take this trade?",
      "Why or why not?"
    ] : undefined
  };
}

const generatedChartScenarios = models.flatMap((model) => [
  ...Array.from({ length: 20 }, (_, index) => scenarioFor(model, index, "recognition")),
  ...Array.from({ length: 10 }, (_, index) => scenarioFor(model, index, "invalid")),
  ...Array.from({ length: 5 }, (_, index) => scenarioFor(model, index, "replay")),
  ...Array.from({ length: 5 }, (_, index) => scenarioFor(model, index, "narrative"))
]);

export const chartScenarios: ChartScenario[] = [...baseChartScenarios, ...generatedChartScenarios];

export const learningPaths: LearningPath[] = [
  {
    id: "beginner",
    title: "Foundation Path",
    level: "Beginner",
    models: ["Liquidity", "MSS", "BOS"],
    unlockAccuracy: 0,
    lessons: ["Liquidity pools", "Structure basics", "Displacement", "MSS vs BOS"]
  },
  {
    id: "intermediate",
    title: "Imbalance Path",
    level: "Intermediate",
    models: ["FVG", "IFVG", "BPR", "OrderBlock", "Breaker"],
    unlockAccuracy: 65,
    lessons: ["FVG quality", "Inversion logic", "BPR overlap", "OB to breaker transitions"]
  },
  {
    id: "advanced",
    title: "Execution Path",
    level: "Advanced",
    models: ["PremiumDiscount", "Sessions", "MSS", "FVG"],
    unlockAccuracy: 80,
    lessons: ["MTF alignment", "Execution refinement", "Session models", "Continuation and failure conditions"]
  }
];
