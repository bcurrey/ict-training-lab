import type { Candle, CertificationModule, CertificationQuizQuestion, ChartScenario, Difficulty, ICTModel, LearningPath, ModelKey, QuizQuestion } from "./types";

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

function liquidityQuestion(id: string, mode: QuizQuestion["mode"], difficulty: Difficulty, prompt: string, choices: string[], answer: string, explanation: string, concept: string, mistakePrevented: string, wrongAnswers: Record<string, string> = {}): QuizQuestion {
  return {
    id,
    mode,
    model: "Liquidity",
    difficulty,
    prompt,
    choices,
    answer,
    explanation,
    concept,
    mistakePrevented,
    wrongAnswers
  };
}

export const liquidityMasteryQuestions: QuizQuestion[] = [
  liquidityQuestion(
    "liq-master-1",
    "multiple",
    1,
    "Price forms three nearly equal highs during the New York morning, then trades a few ticks above them and rejects. What was most likely targeted?",
    ["Buy-side liquidity", "Sell-side liquidity", "A bullish FVG", "Premium equilibrium"],
    "Buy-side liquidity",
    "Equal highs are an obvious pool of buy stops. A run above them is a buy-side liquidity raid, but it still needs rejection and displacement before it supports a directional idea.",
    "Buy-side vs sell-side liquidity recognition",
    "Calling every high a breakout without asking who was trapped.",
    {
      "Sell-side liquidity": "Sell-side liquidity rests below lows, not above equal highs.",
      "A bullish FVG": "An FVG is an imbalance, not the resting stop pool being targeted.",
      "Premium equilibrium": "Premium/discount can matter later, but the question asks what liquidity was targeted."
    }
  ),
  liquidityQuestion(
    "liq-master-2",
    "multiple",
    1,
    "Price trades below a clean double bottom, immediately closes back inside the range, and then expands higher. What is the cleanest label for the first move below the lows?",
    ["Sell-side liquidity sweep", "Break of Structure", "Buy-side liquidity sweep", "Balanced Price Range"],
    "Sell-side liquidity sweep",
    "Stops below equal lows are sell-side liquidity. The move below them is the raid; the rejection and expansion are separate confirmation clues.",
    "Sell-side liquidity sweep mechanics",
    "Mistaking a raid below lows for bearish continuation too quickly.",
    {
      "Break of Structure": "A BOS requires a valid structural swing break, not just a raid through lows.",
      "Buy-side liquidity sweep": "Buy-side liquidity sits above highs.",
      "Balanced Price Range": "A BPR requires overlapping opposing imbalances."
    }
  ),
  liquidityQuestion(
    "liq-master-3",
    "valid",
    2,
    "A wick takes the previous session high by one tick, but price keeps grinding upward with no rejection or displacement away. Does this qualify as a completed liquidity sweep setup?",
    ["Valid", "Invalid"],
    "Invalid",
    "The liquidity may have been touched, but the setup is not completed. Without rejection or displacement away, it may simply be continuation through the level.",
    "Sweep validation vs simple liquidity touch",
    "Calling a one-tick probe a full reversal setup.",
    {
      Valid: "Valid is too aggressive because the follow-through confirming rejection is missing."
    }
  ),
  liquidityQuestion(
    "liq-master-4",
    "valid",
    2,
    "Price raids sell-side liquidity below equal lows, quickly returns above the level, then breaks a minor bullish swing with displacement. Does this meet the basic liquidity-sweep study conditions?",
    ["Valid", "Invalid"],
    "Valid",
    "The sequence has an obvious pool, a raid, rejection, and displacement. It is still only a study condition, not a guaranteed trade.",
    "Minimum liquidity sweep validation",
    "Waiting for perfection while missing the core mechanical sequence.",
    {
      Invalid: "Invalid would make sense if the pool was unclear or displacement never appeared."
    }
  ),
  liquidityQuestion(
    "liq-master-5",
    "whyNot",
    3,
    "A trader marks a bullish liquidity sweep, but the low taken was not obvious and there were no equal lows, session lows, or prior swing lows nearby. Why should this be rejected?",
    ["Level was not meaningful", "FVG already filled", "Buy-side liquidity was swept", "Too much displacement"],
    "Level was not meaningful",
    "Liquidity training starts with obviousness. If the pool was not meaningful to many participants, the sweep label is weak.",
    "Liquidity pool quality",
    "Forcing liquidity labels onto random minor lows.",
    {
      "FVG already filled": "That may invalidate an imbalance, but this flaw is about the liquidity pool itself.",
      "Buy-side liquidity was swept": "The prompt describes a bullish idea below lows, which would involve sell-side liquidity.",
      "Too much displacement": "Displacement is not the stated problem; the pool quality is."
    }
  ),
  liquidityQuestion(
    "liq-master-6",
    "whyNot",
    3,
    "Price sweeps a prior high after the higher-timeframe draw has already been reached, then stalls in chop. What weakens the short idea most?",
    ["HTF draw already reached", "No equal lows", "FVG is too clean", "The raid happened above a high"],
    "HTF draw already reached",
    "If the larger draw has already been satisfied, the context may be exhausted. Liquidity alone does not create a fresh trade narrative.",
    "Liquidity in higher-timeframe context",
    "Taking a late sweep after the main objective is already complete.",
    {
      "No equal lows": "Equal lows are not the issue in a raid above highs.",
      "FVG is too clean": "A clean FVG is not the stated flaw.",
      "The raid happened above a high": "A raid above a high is normal for buy-side liquidity."
    }
  ),
  liquidityQuestion(
    "liq-master-7",
    "sequence",
    2,
    "Choose the best order for studying a bullish liquidity-sweep reversal.",
    [
      "Mark sell-side liquidity > wait for raid > look for rejection > require displacement > study entry/invalidation",
      "Enter long > find liquidity later > ignore displacement > move stop after entry",
      "Mark FVG > assume liquidity was swept > enter before raid > hope for MSS",
      "Wait for target > mark liquidity > ignore context > call it valid"
    ],
    "Mark sell-side liquidity > wait for raid > look for rejection > require displacement > study entry/invalidation",
    "The order matters: pool first, raid second, rejection and displacement third, execution planning last.",
    "Liquidity sweep decision sequence",
    "Entering before the market proves the raid mattered."
  ),
  liquidityQuestion(
    "liq-master-8",
    "sequence",
    2,
    "Choose the best order for rejecting a fake liquidity sweep.",
    [
      "Check if pool was obvious > check raid > check rejection > reject if price continues with no displacement away",
      "See wick > enter reversal > label MSS later > ignore invalidation",
      "Find any candle high > call it liquidity > remove stop > wait",
      "Start with target > skip pool quality > call it certified"
    ],
    "Check if pool was obvious > check raid > check rejection > reject if price continues with no displacement away",
    "A fake or weak sweep often fails the obvious-pool, rejection, or displacement checks.",
    "Invalid sweep filtering",
    "Letting a wick through a level replace the full validation process."
  ),
  liquidityQuestion(
    "liq-master-9",
    "multiple",
    3,
    "What is the most important difference between a liquidity raid and a breakout?",
    ["A raid takes liquidity and rejects; a breakout accepts beyond the level", "A raid always reverses the full day", "A breakout always fails", "There is no difference"],
    "A raid takes liquidity and rejects; a breakout accepts beyond the level",
    "The distinction is acceptance versus rejection. A raid through liquidity is not enough by itself; behavior after the level matters.",
    "Raid vs breakout interpretation",
    "Shorting every move above equal highs without evidence of rejection.",
    {
      "A raid always reverses the full day": "Raids can fail or only cause short-term reactions.",
      "A breakout always fails": "Breakouts can continue when price accepts beyond the level.",
      "There is no difference": "The post-level behavior is the difference."
    }
  ),
  liquidityQuestion(
    "liq-master-10",
    "multiple",
    4,
    "Fast recognition: equal lows sit below price, price runs below them, reclaims the level, then creates bullish displacement. What should you be thinking?",
    ["Possible sell-side raid that needs full context and risk definition", "Guaranteed long signal", "Confirmed bearish BOS only", "Ignore it because all sweeps fail"],
    "Possible sell-side raid that needs full context and risk definition",
    "This is the correct training frame: identify the raid and confirmation clues, then still require context and risk definition.",
    "Rapid liquidity recognition with restraint",
    "Jumping from recognition straight into a signal.",
    {
      "Guaranteed long signal": "No single ICT model is a guaranteed signal.",
      "Confirmed bearish BOS only": "The reclaim and bullish displacement argue against labeling only bearish continuation.",
      "Ignore it because all sweeps fail": "Sweeps can matter, but only with confirmation and context."
    }
  ),
  liquidityQuestion(
    "liq-master-11",
    "valid",
    4,
    "Price wicks above Asia high during New York, immediately closes back below, then forms a lower low with strong displacement. Is the bearish liquidity-sweep idea mechanically reasonable?",
    ["Valid", "Invalid"],
    "Valid",
    "The idea has a session liquidity reference, a raid, rejection, and displacement away. It still needs risk management and broader context.",
    "Session liquidity raid validation",
    "Ignoring session highs and lows as liquidity references.",
    {
      Invalid: "Invalid would fit if price accepted above the Asia high or never displaced lower."
    }
  ),
  liquidityQuestion(
    "liq-master-12",
    "whyNot",
    4,
    "A setup sweeps sell-side liquidity, but the next candles are small overlapping bodies with no expansion. Why is this weak?",
    ["No displacement", "Wrong session high", "Buy-side liquidity already swept", "The level was too obvious"],
    "No displacement",
    "After the raid, displacement helps show intent. Overlapping candles suggest chop, not decisive delivery.",
    "Displacement as liquidity confirmation",
    "Accepting a sweep when the reaction has no force.",
    {
      "Wrong session high": "The prompt is about a sell-side sweep, not a session high.",
      "Buy-side liquidity already swept": "That is not the stated flaw.",
      "The level was too obvious": "Obvious liquidity is usually desirable; the issue is reaction quality."
    }
  ),
  liquidityQuestion(
    "liq-master-13",
    "multiple",
    5,
    "Full narrative: HTF draw is above price, London swept sell-side liquidity, and NY forms bullish displacement. What is the best interpretation?",
    ["The sweep may support a bullish narrative, but entry still depends on structure, location, invalidation, and target", "The sweep alone is a complete setup", "HTF draw no longer matters", "You should only short because lows were taken"],
    "The sweep may support a bullish narrative, but entry still depends on structure, location, invalidation, and target",
    "Liquidity can start the story, but the trade narrative needs structure, displacement, location, invalidation, target, and risk.",
    "Liquidity inside full trade narrative",
    "Treating the first correct label as a complete plan.",
    {
      "The sweep alone is a complete setup": "Liquidity alone is not a trade setup.",
      "HTF draw no longer matters": "HTF draw is a major context filter.",
      "You should only short because lows were taken": "Taking lows can be a raid before bullish delivery."
    }
  ),
  liquidityQuestion(
    "liq-master-14",
    "whyNot",
    5,
    "A trader takes a sweep after a major news spike, with huge spread, no clear structure, and no defined invalidation. What is the biggest process failure?",
    ["No risk-defined execution", "Too many equal highs", "The sweep was below lows", "The chart had candles"],
    "No risk-defined execution",
    "Even if liquidity is visible, execution without invalidation and risk control is not a complete decision process.",
    "Risk discipline after liquidity recognition",
    "Using ICT labels to justify undisciplined execution.",
    {
      "Too many equal highs": "Equal highs may create liquidity, but the process failure is execution risk.",
      "The sweep was below lows": "That can be normal for sell-side liquidity.",
      "The chart had candles": "This is not a meaningful trading flaw."
    }
  )
];

export const quizQuestions: QuizQuestion[] = [
  ...liquidityMasteryQuestions,
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

export const certificationModules: CertificationModule[] = [
  {
    id: "liquidity",
    title: "Liquidity",
    level: "Foundation",
    model: "Liquidity",
    certification: "LIQUIDITY CERTIFIED",
    videos: [
      {
        id: "liq-ict-understanding",
        title: "Liquidity: Buyside & Sellside - ICT Concepts",
        creator: "TTrades",
        runtime: "10 min",
        url: "https://www.youtube.com/watch?v=U8xH2dEgH5A",
        concepts: ["buyside liquidity", "sellside liquidity", "equal highs", "equal lows", "stop clusters"],
        whyRequired: "This is the first required video because it teaches the basic map: where buy stops and sell stops are likely resting before you judge any sweep.",
        requiredQuiz: "Liquidity Fundamentals Quiz"
      },
      {
        id: "liq-ttrades-important-levels",
        title: "Important Liquidity Levels - Draw On Liquidity - ICT",
        creator: "TTrades",
        runtime: "13 min",
        url: "https://www.youtube.com/watch?v=YESqIoA7Wyg",
        concepts: ["draw on liquidity", "liquidity targets", "liquidity framework"],
        whyRequired: "This video is required because you need to know which liquidity levels matter most instead of marking every high or low on the chart.",
        requiredQuiz: "Draw On Liquidity Quiz"
      }
    ],
    chartDrillsRequired: 10,
    replayRequired: 3,
    examCharts: 50,
    passingScore: 85,
    examTopics: ["Mark buy side liquidity", "Mark sell side liquidity", "Identify equal highs", "Identify equal lows", "Has liquidity already been taken?", "Is this a raid or breakout?"],
    description: "Learn where resting orders are likely to sit, how raids differ from continuation, and why liquidity alone is not a trade signal."
  },
  {
    id: "displacement",
    title: "Displacement",
    level: "Foundation",
    model: "MSS",
    certification: "DISPLACEMENT CERTIFIED",
    videos: [
      {
        id: "disp-ttrades-intro",
        title: "Intro to Market Structure Shifts, Fair Value Gaps, and Displacement",
        creator: "TTrades",
        runtime: "TTrades lesson",
        url: "https://www.youtube.com/watch?v=PePk1V0Q4QQ",
        concepts: ["displacement", "imbalance creation", "delivery shift"],
        whyRequired: "This video introduces displacement as the force behind MSS and FVG creation, so it must come before displacement recognition drills.",
        requiredQuiz: "Displacement Fundamentals"
      },
      {
        id: "disp-ict-2022",
        title: "January 22, 2025 - Live Execution - Forex GbpUsd London Macro",
        creator: "ICT",
        runtime: "ICT live execution lesson",
        url: "https://www.youtube.com/watch?v=q5lz5594dpE",
        concepts: ["institutional displacement", "market structure shift", "strong vs weak moves", "live execution context"],
        whyRequired: "This ICT video is required because it shows displacement and market structure in a live execution context instead of isolated textbook definitions.",
        requiredQuiz: "Advanced Displacement Recognition"
      }
    ],
    chartDrillsRequired: 20,
    replayRequired: 5,
    examCharts: 40,
    passingScore: 85,
    examTopics: ["Is this displacement?", "Strong or weak displacement?", "Is it sufficient to support MSS?"],
    description: "Train the difference between meaningful delivery and ordinary candle movement.",
    unlockAfter: ["liquidity"]
  },
  {
    id: "mss",
    title: "Market Structure Shift",
    level: "Foundation",
    model: "MSS",
    certification: "MSS CERTIFIED",
    videos: [
      {
        id: "mss-ttrades-core",
        title: "Market Structure Shift - ICT Concepts",
        creator: "TTrades",
        runtime: "TTrades lesson",
        url: "https://www.youtube.com/watch?v=_94CPMjWi9E",
        concepts: ["bullish MSS", "bearish MSS", "displacement confirmation"],
        whyRequired: "This is the core MSS lesson and defines what must shift before a reversal model is valid.",
        requiredQuiz: "MSS Fundamentals"
      },
      {
        id: "mss-ttrades-liquidity-grab",
        title: "Market Structure Shift vs Liquidity Grab - ICT Concepts",
        creator: "TTrades",
        runtime: "TTrades lesson",
        url: "https://www.youtube.com/watch?v=ynFA6E3qHj0",
        concepts: ["valid MSS", "fake MSS", "liquidity grab comparison"],
        whyRequired: "This video is required because it trains the difference between a true structure shift and a liquidity grab that should be rejected.",
        requiredQuiz: "MSS Validation Quiz"
      }
    ],
    chartDrillsRequired: 30,
    replayRequired: 10,
    examCharts: 50,
    passingScore: 90,
    examTopics: ["Mark MSS", "Explain why MSS exists", "Identify fake MSS", "Identify valid MSS", "MSS vs BOS"],
    description: "Certify that you can identify valid structure shifts after liquidity and displacement.",
    unlockAfter: ["displacement"]
  },
  {
    id: "bos",
    title: "Break of Structure",
    level: "Foundation",
    model: "BOS",
    certification: "BOS CERTIFIED",
    videos: [
      {
        id: "bos-ttrades-market-structure",
        title: "Understanding Market Structure For Trading",
        creator: "TTrades",
        runtime: "14 min",
        url: "https://www.youtube.com/watch?v=sgAnVR6RSDg",
        concepts: ["continuation structure", "higher highs", "higher lows", "lower highs", "lower lows"],
        whyRequired: "This video is required because BOS recognition depends on understanding continuation structure before labeling breaks.",
        requiredQuiz: "BOS Recognition Quiz"
      },
      {
        id: "bos-ttrades-mss-grab",
        title: "Market Structure Shift vs Liquidity Grab - ICT Concepts",
        creator: "TTrades",
        runtime: "TTrades lesson",
        url: "https://www.youtube.com/watch?v=ynFA6E3qHj0",
        concepts: ["BOS vs MSS", "continuation vs reversal", "liquidity grab comparison"],
        whyRequired: "This comparison is required so BOS is not confused with MSS or a failed liquidity grab.",
        requiredQuiz: "BOS vs MSS Exam"
      }
    ],
    chartDrillsRequired: 25,
    replayRequired: 5,
    examCharts: 40,
    passingScore: 85,
    examTopics: ["BOS or MSS?", "Continuation or reversal?", "Valid swing?"],
    description: "Separate continuation structure from reversal structure and avoid forcing BOS labels.",
    unlockAfter: ["mss"]
  },
  {
    id: "fvg",
    title: "Fair Value Gap",
    level: "Foundation",
    model: "FVG",
    certification: "FVG CERTIFIED",
    videos: [
      {
        id: "fvg-ttrades-intro",
        title: "Intro to Market Structure Shifts, Fair Value Gaps, and Displacement",
        creator: "TTrades",
        runtime: "TTrades lesson",
        url: "https://www.youtube.com/watch?v=PePk1V0Q4QQ",
        concepts: ["FVG creation", "displacement relationship"],
        whyRequired: "This video is required because FVGs should be tied to displacement rather than treated as random gaps.",
        requiredQuiz: "FVG Fundamentals"
      },
      {
        id: "fvg-ict-lesson",
        title: "ICT Fair Value Gap Lesson",
        creator: "ICT",
        runtime: "ICT lesson",
        url: "https://www.youtube.com/watch?v=GFdWahZUNOw",
        concepts: ["premium FVG", "discount FVG", "mitigation"],
        whyRequired: "This ICT lesson is required to understand FVG quality, mitigation, and location in premium or discount.",
        requiredQuiz: "Advanced FVG Recognition"
      }
    ],
    chartDrillsRequired: 40,
    replayRequired: 10,
    examCharts: 75,
    passingScore: 90,
    examTopics: ["Valid FVG?", "High quality?", "Discount or premium?", "Tradeable?", "Weak FVG?"],
    description: "Certify imbalance recognition, quality filtering, and context-aware FVG decisions.",
    unlockAfter: ["bos"]
  },
  {
    id: "ifvg",
    title: "Inversion Fair Value Gap",
    level: "Intermediate",
    model: "IFVG",
    certification: "IFVG CERTIFIED",
    videos: [
      {
        id: "ifvg-ttrades",
        title: "Inversion Fair Value Gaps (IFVG) - ICT Concepts",
        creator: "TTrades",
        runtime: "10 min",
        url: "https://www.youtube.com/watch?v=uDJI2AbyyCs",
        concepts: ["failed FVG", "inversion", "opposite-side retest", "consequent encroachment"],
        whyRequired: "This video is required because IFVG starts with recognizing when a valid FVG fails and changes role.",
        requiredQuiz: "IFVG Fundamentals Quiz"
      }
    ],
    chartDrillsRequired: 30,
    replayRequired: 8,
    examCharts: 50,
    passingScore: 88,
    examTopics: ["Did the FVG invert?", "Was the original imbalance valid?", "Did retest respect the opposite side?"],
    description: "Learn failed imbalance logic and when inversion is meaningful.",
    unlockAfter: ["fvg"]
  },
  {
    id: "bpr",
    title: "Balanced Price Range",
    level: "Intermediate",
    model: "BPR",
    certification: "BPR CERTIFIED",
    videos: [
      {
        id: "bpr-core",
        title: "ICT Concepts - Balanced Price Ranges",
        creator: "RealTraderTim",
        runtime: "13 min",
        url: "https://www.youtube.com/watch?v=G9YjagfYKog",
        concepts: ["opposing imbalances", "balanced price range", "overlap refinement", "failed BPRs"],
        whyRequired: "This video is required because BPR recognition depends on seeing how opposing deliveries rebalance price, not just drawing a generic box.",
        requiredQuiz: "BPR Recognition Quiz"
      }
    ],
    chartDrillsRequired: 25,
    replayRequired: 6,
    examCharts: 40,
    passingScore: 88,
    examTopics: ["Do opposing imbalances overlap?", "Where is the BPR?", "Was the range respected?"],
    description: "Certify that you can locate the overlap, not just the full imbalance.",
    unlockAfter: ["ifvg"]
  },
  {
    id: "order-blocks",
    title: "Order Blocks",
    level: "Intermediate",
    model: "OrderBlock",
    certification: "ORDER BLOCKS CERTIFIED",
    videos: [
      {
        id: "ob-ttrades-simplified",
        title: "Order Blocks Simplified - ICT Concepts",
        creator: "TTrades",
        runtime: "15 min",
        url: "https://www.youtube.com/watch?v=DMUiDBnTYc8",
        concepts: ["order block validation", "liquidity sweep", "displacement", "mean threshold", "mitigation"],
        whyRequired: "This video is required because order blocks should be selected after displacement and structure, not by marking random candles.",
        requiredQuiz: "Order Block Fundamentals Quiz"
      },
      {
        id: "ob-ttrades-irl-erl",
        title: "Trading IRL & ERL With Order Blocks! - ICT Concepts",
        creator: "TTrades",
        runtime: "14 min",
        url: "https://www.youtube.com/watch?v=TfHlNgAZ_II",
        concepts: ["internal range liquidity", "external range liquidity", "order blocks", "higher-timeframe bias"],
        whyRequired: "This video is required because it connects order blocks to the IRL-to-ERL narrative instead of treating them as isolated zones.",
        requiredQuiz: "Order Block Context Quiz"
      }
    ],
    chartDrillsRequired: 35,
    replayRequired: 8,
    examCharts: 50,
    passingScore: 88,
    examTopics: ["Did this block cause displacement?", "Is the zone mitigated?", "Is the block too broad?"],
    description: "Train order-block selection after displacement, not before confirmation.",
    unlockAfter: ["bpr"]
  },
  {
    id: "breaker-blocks",
    title: "Breaker Blocks",
    level: "Intermediate",
    model: "Breaker",
    certification: "BREAKER BLOCKS CERTIFIED",
    videos: [
      {
        id: "breaker-ttrades",
        title: "Breaker Blocks Simplified - ICT Concepts",
        creator: "TTrades",
        runtime: "13 min",
        url: "https://www.youtube.com/watch?v=75S4vwD4P1U",
        concepts: ["bullish breaker", "bearish breaker", "failed structure", "unicorn model", "breaker vs order block"],
        whyRequired: "This video is required because breaker blocks are failed-structure stories, not ordinary support and resistance.",
        requiredQuiz: "Breaker Block Fundamentals Quiz"
      },
      {
        id: "breaker-ict-advanced",
        title: "ICT Mentorship 2023 - Advanced Theory On ICT Breaker",
        creator: "ICT",
        runtime: "ICT mentorship lesson",
        url: "https://www.youtube.com/watch?v=1HtRfFYiwO0",
        concepts: ["advanced breaker theory", "failed order blocks", "invalidation", "context"],
        whyRequired: "This ICT lesson is required to compare simplified breaker mechanics against ICT's broader advanced breaker framework.",
        requiredQuiz: "Advanced Breaker Recognition Quiz"
      }
    ],
    chartDrillsRequired: 35,
    replayRequired: 8,
    examCharts: 50,
    passingScore: 88,
    examTopics: ["Did the original block fail?", "Was protected structure broken?", "Did retest reject?"],
    description: "Certify failed-block logic and avoid ordinary support/resistance labeling.",
    unlockAfter: ["order-blocks"]
  },
  {
    id: "premium-discount",
    title: "Premium / Discount",
    level: "Advanced",
    model: "PremiumDiscount",
    certification: "PREMIUM DISCOUNT CERTIFIED",
    videos: [{
      id: "pd-ttrades",
      title: "Understanding Premium and Discount in Trading",
      creator: "TTrades",
      runtime: "TTrades lesson",
      url: "https://www.youtube.com/watch?v=MlMsG7li9zY",
      concepts: ["dealing range", "equilibrium", "premium", "discount", "trade location"],
      whyRequired: "This curated lesson is required because premium and discount determine whether the setup is forming in a favorable part of the range.",
      requiredQuiz: "Premium Discount Location Quiz"
    }],
    chartDrillsRequired: 30,
    replayRequired: 8,
    examCharts: 45,
    passingScore: 90,
    examTopics: ["Correct dealing range?", "Favorable side of equilibrium?", "Does location support the idea?"],
    description: "Train location quality and dealing-range discipline.",
    unlockAfter: ["breaker-blocks"]
  },
  {
    id: "sessions",
    title: "Session Highs & Lows",
    level: "Advanced",
    model: "Sessions",
    certification: "SESSIONS CERTIFIED",
    videos: [{
      id: "sessions-ttrades-killzones",
      title: "Kill Zones Explained: Best Trading Sessions for Entries",
      creator: "TTrades",
      runtime: "TTrades lesson",
      url: "https://www.youtube.com/watch?v=MPeeE55rNOw",
      concepts: ["Asia range", "London session", "New York AM", "session highs and lows", "killzone timing"],
      whyRequired: "This lesson is required because session highs and lows only matter when the correct session context and timing are understood.",
      requiredQuiz: "Session Highs and Lows Quiz"
    }],
    chartDrillsRequired: 30,
    replayRequired: 10,
    examCharts: 45,
    passingScore: 90,
    examTopics: ["Which session high/low matters?", "Was liquidity raided in an active window?", "Was the level already used?"],
    description: "Build session-aware liquidity recognition.",
    unlockAfter: ["premium-discount"]
  },
  {
    id: "mtf-alignment",
    title: "Multi-Timeframe Alignment",
    level: "Advanced",
    model: "PremiumDiscount",
    certification: "MTF ALIGNMENT CERTIFIED",
    videos: [{
      id: "mtf-ttrades-alignment",
      title: "Timeframe Alignment: How To Align Timeframes For Expansion",
      creator: "TTrades",
      runtime: "16 min",
      url: "https://www.youtube.com/watch?v=ubCe509_JLY",
      concepts: ["higher timeframe point of interest", "setup timeframe", "entry timeframe", "timeframe alignment"],
      whyRequired: "This video is required because multi-timeframe training depends on linking bias, structure, and entry into one sequence.",
      requiredQuiz: "MTF Alignment Quiz"
    }],
    chartDrillsRequired: 35,
    replayRequired: 10,
    examCharts: 60,
    passingScore: 90,
    examTopics: ["Is HTF draw aligned?", "Would you execute the 1m setup?", "Is this counter-trend?"],
    description: "Certify bias, setup, and execution alignment.",
    unlockAfter: ["sessions"]
  },
  {
    id: "trade-narrative",
    title: "Full Trade Narrative",
    level: "Advanced",
    model: "FVG",
    certification: "TRADE NARRATIVE CERTIFIED",
    videos: [{
      id: "narrative-ttrades-irl-erl",
      title: "Trading IRL & ERL With Order Blocks! - ICT Concepts",
      creator: "TTrades",
      runtime: "14 min",
      url: "https://www.youtube.com/watch?v=TfHlNgAZ_II",
      concepts: ["higher timeframe bias", "IRL to ERL narrative", "entry confirmation", "target selection"],
      whyRequired: "This video is required because full trade narrative means connecting draw, context, entry, invalidation, and target.",
      requiredQuiz: "Trade Narrative Construction Quiz"
    }],
    chartDrillsRequired: 40,
    replayRequired: 12,
    examCharts: 60,
    passingScore: 90,
    examTopics: ["Liquidity target", "MSS validity", "Displacement", "Entry", "Invalidation", "Target", "Take or pass?"],
    description: "Train complete decision construction, not isolated pattern labeling.",
    unlockAfter: ["mtf-alignment"]
  },
  {
    id: "failure-recognition",
    title: "Failure Recognition",
    level: "Advanced",
    certification: "FAILURE RECOGNITION CERTIFIED",
    videos: [{
      id: "failure-ttrades-why-fail",
      title: "Why Most Traders Fail with ICT: The Power of Focusing on One PD Array",
      creator: "TTrades",
      runtime: "TTrades lesson",
      url: "https://www.youtube.com/watch?v=r_UF8U-hsL8",
      concepts: ["overcomplication", "PD array selection", "weak narratives", "failure filtering"],
      whyRequired: "This lesson is required because failure recognition starts with knowing when not to force multiple concepts onto one chart.",
      requiredQuiz: "Failure Recognition Quiz"
    }],
    chartDrillsRequired: 50,
    replayRequired: 15,
    examCharts: 75,
    passingScore: 90,
    examTopics: ["Fake MSS", "Weak displacement", "Poor liquidity sweeps", "Completed draw", "Weak FVG", "Bad execution location", "Invalid narratives"],
    description: "The hardest specialist certification: identify why the setup should be rejected.",
    unlockAfter: ["trade-narrative"]
  },
  {
    id: "master",
    title: "Master Trader Certification",
    level: "Master",
    certification: "ICT TRAINING LAB MASTER CERTIFIED",
    videos: [{
      id: "master-ttrades-reversal-sequence",
      title: "Reversal Sequence (TTRS) - How To Blend PD Arrays",
      creator: "TTrades",
      runtime: "17 min",
      url: "https://www.youtube.com/watch?v=wik00c9_2nk",
      concepts: ["liquidity", "displacement", "PD arrays", "narrative construction", "execution sequence"],
      whyRequired: "This capstone lesson is required because Master certification blends concepts into one coherent decision process.",
      requiredQuiz: "Master Certification Briefing Quiz"
    }],
    chartDrillsRequired: 100,
    replayRequired: 25,
    examCharts: 100,
    passingScore: 90,
    examTopics: ["Liquidity", "Displacement", "MSS", "BOS", "FVG", "Entry", "Invalidation", "Target", "Multi-timeframe narrative"],
    description: "Final capstone: 100 mixed charts, hidden future candles, multiple timeframes, and narrative construction.",
    unlockAfter: ["failure-recognition"]
  }
];

export function certificationQuizFor(video: { id: string; title: string; requiredQuiz?: string }, module: CertificationModule): CertificationQuizQuestion[] {
  const topics = module.examTopics.length ? module.examTopics : [module.title];
  const quizName = video.requiredQuiz ?? `${module.title} Video Quiz`;
  return Array.from({ length: 10 }, (_, index) => {
    const topic = topics[index % topics.length];
    const correct = `Apply ${topic} using context, confirmation, and invalidation.`;
    return {
      id: `${video.id}-q-${index + 1}`,
      prompt: `${quizName}: how should you interpret "${topic}" after studying ${video.title}?`,
      choices: [
        correct,
        "Treat the pattern as a guaranteed trade signal.",
        "Ignore timeframe alignment if the candle looks strong.",
        "Label it valid before liquidity and displacement are checked."
      ],
      answer: correct,
      explanation: `This checks application, not trivia. ${module.title} requires context, validation, and awareness of what would invalidate the read.`
    };
  });
}
