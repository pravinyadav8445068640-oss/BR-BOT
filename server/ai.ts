import { GoogleGenAI } from '@google/genai';
import { Strategy, AIMemory, loadDatabase, saveDatabase } from './db.ts';
import { getMarketOverview } from './market.ts';

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client, will use heuristic engine fallback:', err);
  }
}

export interface DoctorDiagnosis {
  strategyName: string;
  riskScore: number; // 1-100 (100 = dangerous)
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  estimatedWinRate: number;
  riskRewardRatio: string;
  logicalFlawsEn: string[];
  logicalFlawsHi: string[];
  missingExitConditionsEn: string[];
  missingExitConditionsHi: string[];
  strengthsEn: string[];
  strengthsHi: string[];
  improvementSuggestionsEn: string[];
  improvementSuggestionsHi: string[];
  hindiExplanation: string;
  englishExplanation: string;
  disclaimer: string;
}

// 1. AI Strategy Builder: Natural Language to Structured Rules
export async function buildStrategyFromPrompt(
  prompt: string,
  userId: string
): Promise<Partial<Strategy>> {
  if (aiClient) {
    try {
      const systemInstruction = `You are BR BOT AI Strategy Architect.
Convert the user's natural language trading instruction into a structured Crypto Options Strategy JSON object.
Return strictly valid JSON adhering to:
{
  "name": string,
  "description": string,
  "underlying": "BTC" | "ETH" | "SOL",
  "strategyType": "iron_condor" | "covered_call" | "cash_secured_put" | "iron_butterfly" | "short_strangle" | "short_straddle" | "bull_put_spread" | "bear_call_spread" | "delta_neutral" | "hedging",
  "legs": [
    { "id": "leg_1", "action": "BUY" | "SELL", "type": "CALL" | "PUT", "strikeOffsetPct": number, "targetDelta": number, "ratio": number }
  ],
  "entryConditions": [
    { "indicator": "RSI" | "EMA" | "MACD" | "IV_PERCENTILE" | "SUPERTREND" | "PRICE", "operator": ">" | "<" | "CROSS_ABOVE" | "CROSS_BELOW" | "BETWEEN", "value": number, "secondaryValue": number, "logic": "AND" | "OR" }
  ],
  "exitConditions": {
    "targetProfitPct": number,
    "stopLossPct": number,
    "daysToExpiryExit": number
  },
  "positionSizing": {
    "type": "PERCENT_OF_EQUITY",
    "value": number
  },
  "expiryType": "DAILY" | "WEEKLY" | "MONTHLY",
  "strikeSelectionMode": "DELTA" | "PERCENT_OTM" | "ATM",
  "deltaTarget": number
}
Do NOT include markdown formatting or backticks, just raw JSON.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      if (parsed.name && parsed.strategyType) {
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini Strategy Builder API error, using algorithmic heuristic fallback:', err);
    }
  }

  // Fallback Rule Parser
  const lower = prompt.toLowerCase();
  const underlying: 'BTC' | 'ETH' | 'SOL' = lower.includes('eth') ? 'ETH' : lower.includes('sol') ? 'SOL' : 'BTC';

  let strategyType: Strategy['strategyType'] = 'iron_condor';
  if (lower.includes('covered call') || lower.includes('call sell')) {
    strategyType = 'covered_call';
  } else if (lower.includes('put spread') || lower.includes('bull put')) {
    strategyType = 'bull_put_spread';
  } else if (lower.includes('strangle')) {
    strategyType = 'short_strangle';
  } else if (lower.includes('straddle')) {
    strategyType = 'short_straddle';
  } else if (lower.includes('delta neutral')) {
    strategyType = 'delta_neutral';
  }

  const legs =
    strategyType === 'covered_call'
      ? [{ id: 'leg_1', action: 'SELL' as const, type: 'CALL' as const, strikeOffsetPct: 6, targetDelta: 0.22, ratio: 1 }]
      : strategyType === 'bull_put_spread'
      ? [
          { id: 'leg_1', action: 'SELL' as const, type: 'PUT' as const, strikeOffsetPct: -4, targetDelta: -0.22, ratio: 1 },
          { id: 'leg_2', action: 'BUY' as const, type: 'PUT' as const, strikeOffsetPct: -8, targetDelta: -0.09, ratio: 1 },
        ]
      : [
          { id: 'leg_1', action: 'SELL' as const, type: 'PUT' as const, strikeOffsetPct: -4, targetDelta: -0.18, ratio: 1 },
          { id: 'leg_2', action: 'BUY' as const, type: 'PUT' as const, strikeOffsetPct: -7, targetDelta: -0.07, ratio: 1 },
          { id: 'leg_3', action: 'SELL' as const, type: 'CALL' as const, strikeOffsetPct: 4, targetDelta: 0.18, ratio: 1 },
          { id: 'leg_4', action: 'BUY' as const, type: 'CALL' as const, strikeOffsetPct: 7, targetDelta: 0.07, ratio: 1 },
        ];

  return {
    name: `AI Generated ${underlying} ${strategyType.replace('_', ' ').toUpperCase()}`,
    description: `Constructed from prompt: "${prompt}"`,
    underlying,
    strategyType,
    legs,
    entryConditions: [
      { indicator: 'RSI', operator: '<', value: 35, logic: 'AND' },
      { indicator: 'IV_PERCENTILE', operator: '>', value: 50, logic: 'AND' },
    ],
    exitConditions: {
      targetProfitPct: 50,
      stopLossPct: 80,
      daysToExpiryExit: 1,
    },
    positionSizing: {
      type: 'PERCENT_OF_EQUITY',
      value: 10,
    },
    expiryType: 'WEEKLY',
    strikeSelectionMode: 'DELTA',
    deltaTarget: 0.2,
  };
}

// 2. AI Strategy Doctor: Comprehensive Diagnostic & Bilingual Analysis (English & Hindi)
export async function diagnoseStrategy(strategy: Strategy): Promise<DoctorDiagnosis> {
  if (aiClient) {
    try {
      const prompt = `Analyze this Crypto Options Strategy for BR BOT platform:
Strategy: ${JSON.stringify(strategy, null, 2)}

Provide a thorough cybersecurity and quant risk diagnosis.
Check for:
1. Missing stop losses or unbounded tail risks.
2. Gamma squeeze danger on naked legs.
3. Liquidity and wide bid-ask spread risks.
4. Logical contradictions in entry/exit conditions.
5. Provide clear, simple explanations in English AND in natural conversational HINDI (हिंदी में सरल भाषा में समझाएं).
Format response strictly as JSON with this structure:
{
  "riskScore": number (1 to 100),
  "riskCategory": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "estimatedWinRate": number,
  "riskRewardRatio": string,
  "logicalFlawsEn": string[],
  "logicalFlawsHi": string[],
  "missingExitConditionsEn": string[],
  "missingExitConditionsHi": string[],
  "strengthsEn": string[],
  "strengthsHi": string[],
  "improvementSuggestionsEn": string[],
  "improvementSuggestionsHi": string[],
  "hindiExplanation": string,
  "englishExplanation": string,
  "disclaimer": string
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      if (parsed.riskScore !== undefined) {
        return {
          strategyName: strategy.name,
          riskScore: parsed.riskScore,
          riskCategory: parsed.riskCategory || (parsed.riskScore > 65 ? 'HIGH' : parsed.riskScore > 35 ? 'MODERATE' : 'LOW'),
          estimatedWinRate: parsed.estimatedWinRate || 78,
          riskRewardRatio: parsed.riskRewardRatio || '1:2.4',
          logicalFlawsEn: parsed.logicalFlawsEn || [],
          logicalFlawsHi: parsed.logicalFlawsHi || [],
          missingExitConditionsEn: parsed.missingExitConditionsEn || [],
          missingExitConditionsHi: parsed.missingExitConditionsHi || [],
          strengthsEn: parsed.strengthsEn || ['Defined risk architecture', 'Adequate theta decay profile'],
          strengthsHi: parsed.strengthsHi || ['सीमित जोखिम आर्किटेक्चर', 'अच्छा थीटा डीके प्रोफाइल'],
          improvementSuggestionsEn: parsed.improvementSuggestionsEn || ['Set stop loss at 80% of premium', 'Close 24h prior to settlement'],
          improvementSuggestionsHi: parsed.improvementSuggestionsHi || ['प्रीमियम के 80% पर स्टॉप लॉस लगाएं', 'एक्सपायरी से 24 घंटे पहले एग्जिट करें'],
          hindiExplanation: parsed.hindiExplanation || 'यह रणनीति आम तौर पर संतुलित है लेकिन बाजार में अचानक बड़े उतार-चढ़ाव से बचने के लिए सुरक्षात्मक विंग्स और कड़ा स्टॉप लॉस लगाना अनिवार्य है।',
          englishExplanation: parsed.englishExplanation || 'This strategy demonstrates solid theta collection properties, but requires disciplined stop-loss execution to prevent tail-risk drawdown.',
          disclaimer: 'BR BOT AI Doctor provides algorithmic educational risk assessments. Crypto options trading involves substantial risk of loss. Past performance does not guarantee future results.',
        };
      }
    } catch (err) {
      console.warn('Gemini Strategy Doctor error, using heuristic engine:', err);
    }
  }

  // Heuristic Algorithmic Doctor Engine
  const hasStopLoss = strategy.exitConditions?.stopLossPct && strategy.exitConditions.stopLossPct > 0;
  const hasTargetProfit = strategy.exitConditions?.targetProfitPct && strategy.exitConditions.targetProfitPct > 0;
  const isNaked = strategy.strategyType === 'short_strangle' || strategy.strategyType === 'short_straddle';
  const hasWings = strategy.strategyType === 'iron_condor' || strategy.strategyType === 'iron_butterfly' || strategy.strategyType === 'bull_put_spread';

  let riskScore = 32;
  const logicalFlawsEn: string[] = [];
  const logicalFlawsHi: string[] = [];
  const missingExitEn: string[] = [];
  const missingExitHi: string[] = [];
  const strengthsEn: string[] = [];
  const strengthsHi: string[] = [];
  const suggestionsEn: string[] = [];
  const suggestionsHi: string[] = [];

  if (!hasStopLoss) {
    riskScore += 35;
    missingExitEn.push('No hard stop-loss configured. A runaway trend can cause catastrophic account drawdown.');
    missingExitHi.push('कोई हार्ड स्टॉप लॉस सेट नहीं है। यदि बाजार तेजी से विपरीत गया तो भारी नुकसान हो सकता है।');
    suggestionsEn.push('Add an automatic stop-loss between 80% and 120% of premium collected.');
    suggestionsHi.push('प्राप्त प्रीमियम के 80% से 120% के बीच स्वचालित स्टॉप-लॉस तुरंत जोड़ें।');
  } else {
    strengthsEn.push(`Hard stop-loss active at ${strategy.exitConditions.stopLossPct}% of premium.`);
    strengthsHi.push(`प्रीमियम के ${strategy.exitConditions.stopLossPct}% पर स्टॉप-लॉस सुरक्षित रूप से सक्रिय है।`);
  }

  if (isNaked) {
    riskScore += 25;
    logicalFlawsEn.push('Unhedged naked short options legs expose your account to theoretical unlimited loss.');
    logicalFlawsHi.push('अनहेज्ड (नेकेड) ऑप्शंस सेलिंग से अचानक बड़े उछाल में असीमित नुकसान का खतरा रहता है।');
    suggestionsEn.push('Convert naked legs into defined-risk spreads by buying far OTM wings (Iron Condor structure).');
    suggestionsHi.push('दूर की OTM विंग्स खरीदकर इसे सीमित जोखिम वाले स्प्रेड (Iron Condor) में बदलें।');
  }

  if (hasWings) {
    strengthsEn.push('Defined risk structure prevents liquidation and caps maximum loss.');
    strengthsHi.push('सीमित जोखिम संरचना लिक्विडेशन से बचाती है और अधिकतम नुकसान को सीमित रखती है।');
  }

  if (!hasTargetProfit) {
    missingExitEn.push('Target profit exit is missing. Unmanaged positions often give back accrued gains before expiry.');
    missingExitHi.push('टारगेट प्रॉफिट नहीं दिया गया है। समय पर लाभ न लेने से अक्सर बना हुआ मुनाफा चला जाता है।');
    suggestionsEn.push('Book profit at 50% - 60% of maximum premium to optimize capital turnover.');
    suggestionsHi.push('पूंजी को सुरक्षित रखने के लिए 50% से 60% लाभ पर पोजीशन बंद करें।');
  } else {
    strengthsEn.push(`Systematic profit taking at ${strategy.exitConditions.targetProfitPct}%.`);
    strengthsHi.push(`${strategy.exitConditions.targetProfitPct}% पर लाभ बुक करने का सुनियोजित नियम सेट है।`);
  }

  riskScore = Math.min(Math.max(riskScore, 15), 95);
  const riskCategory = riskScore > 65 ? 'HIGH' : riskScore > 40 ? 'MODERATE' : 'LOW';

  const hindiExplanation =
    riskCategory === 'HIGH'
      ? 'सावधान! इस रणनीति में अत्यधिक जोखिम है क्योंकि इसमें स्टॉप लॉस या सुरक्षात्मक विंग्स की कमी है। क्रिप्टो बाजार में किसी भी बड़े मूव में यह खाता खाली कर सकती है। कृपया तुरंत स्टॉप लॉस जोड़ें।'
      : riskCategory === 'MODERATE'
      ? 'आपकी रणनीति अच्छी है लेकिन सुधार की गुंजाइश है। समय पर 50% प्रॉफिट बुक करने का नियम और एक्सपायरी के अंतिम 24 घंटे पहले बाहर निकलना आपके रिस्क को बहुत कम कर देगा।'
      : 'शानदार! आपकी रणनीति संतुलित है, जिसमें सीमित नुकसान और सुनियोजित प्रॉफिट बुकिंग का प्रावधान है। यह थीटा डीके का फायदा उठाने के लिए बेहतरीन है।';

  const englishExplanation =
    riskCategory === 'HIGH'
      ? 'High Risk Warning: This strategy exposes capital to unmanaged downside or gamma risk. Ensure hard stop losses and defined wings are configured before simulation.'
      : riskCategory === 'MODERATE'
      ? 'Moderate Profile: The strategy has solid baseline mechanics, but benefit from earlier profit realization (50% rule) and tight expiry management.'
      : 'Optimal Setup: Defined risk bounds, realistic delta exposure, and disciplined stop loss ensure statistical probability of success over time.';

  return {
    strategyName: strategy.name,
    riskScore,
    riskCategory,
    estimatedWinRate: Math.max(88 - Math.round(riskScore * 0.4), 52),
    riskRewardRatio: '1:2.2',
    logicalFlawsEn,
    logicalFlawsHi,
    missingExitConditionsEn: missingExitEn,
    missingExitConditionsHi: missingExitHi,
    strengthsEn,
    strengthsHi,
    improvementSuggestionsEn: suggestionsEn,
    improvementSuggestionsHi: suggestionsHi,
    hindiExplanation,
    englishExplanation,
    disclaimer: 'BR BOT AI Doctor provides algorithmic educational risk assessments. Crypto options trading involves substantial risk of loss. Past performance does not guarantee future results.',
  };
}

// 3. AI Market Pulse: Live options market sentiment
export async function getAIMarketPulse(): Promise<{
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ivRegime: string;
  pcrAnalysisEn: string;
  pcrAnalysisHi: string;
  recommendedStructure: string;
  summaryEn: string;
  summaryHi: string;
}> {
  const overview = getMarketOverview();
  const isHighIV = overview.btc.ivPercentile > 60;
  const pcr = overview.pcrBtc;

  return {
    sentiment: pcr > 1.1 ? 'BULLISH' : pcr < 0.7 ? 'BEARISH' : 'NEUTRAL',
    ivRegime: isHighIV ? 'Elevated Volatility (High IV)' : 'Normal Consolidation (Medium IV)',
    pcrAnalysisEn: `BTC Put/Call Ratio is at ${pcr}. Values below 0.8 suggest call dominance, while above 1.0 signal strong put hedging support.`,
    pcrAnalysisHi: `BTC पुट/कॉल अनुपात (PCR) ${pcr} पर है। 0.8 से नीचे कॉल दबदबा दिखाता है, जबकि 1.0 से ऊपर पुट सपोर्ट का संकेत देता है।`,
    recommendedStructure: isHighIV
      ? 'Iron Condor (0.18 Delta Wings) - High IV makes selling both call and put spreads lucrative.'
      : 'Covered Call / Cash-Secured Put - Favorable for steady income accumulation during range-bound conditions.',
    summaryEn: `Current BTC at $${overview.btc.price.toLocaleString()} with Max Pain at $${overview.maxPainBtc.toLocaleString()}. Theta decay strategies currently offer positive statistical expectancy.`,
    summaryHi: `वर्तमान में बिटकॉइन $${overview.btc.price.toLocaleString()} पर ट्रेड कर रहा है और एक्सपायरी मैक्स पेन $${overview.maxPainBtc.toLocaleString()} है। समय बीतने के साथ प्रीमियम डीके की रणनीति सबसे अनुकूल है।`,
  };
}

// 4. AI Memory Assistant: Chat with contextual persistent memory
export async function chatWithMemoryBot(
  userId: string,
  userMessage: string
): Promise<{ replyEn: string; replyHi: string; memorySaved?: string }> {
  const db = loadDatabase();
  const memories = db.aiMemories.filter((m) => m.userId === userId);
  const memoryContext = memories.map((m) => `${m.key}: ${m.value}`).join('\n');

  if (aiClient) {
    try {
      const prompt = `You are BR BOT AI Memory Assistant, a world-class crypto options expert for Indian and global traders.
User Memories:
${memoryContext || 'None saved yet.'}

User message: "${userMessage}"

Respond with expert insights. If the user mentions their risk preference, favorite coin, or strategy preference, identify it so we can save it to memory.
Return strictly JSON:
{
  "replyEn": "...",
  "replyHi": "...",
  "newMemory": { "key": "string", "value": "string" } (optional, only if user explicitly expresses a preference)
}`;

      const res = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(res.text || '{}');
      if (parsed.replyEn) {
        if (parsed.newMemory?.key && parsed.newMemory?.value) {
          const newMem: AIMemory = {
            id: `mem_${Date.now()}`,
            userId,
            key: parsed.newMemory.key,
            value: parsed.newMemory.value,
            category: 'conversation',
            updatedAt: new Date().toISOString(),
          };
          db.aiMemories.push(newMem);
          saveDatabase(db);
        }
        return {
          replyEn: parsed.replyEn,
          replyHi: parsed.replyHi || parsed.replyEn,
          memorySaved: parsed.newMemory?.value,
        };
      }
    } catch (err) {
      console.warn('Gemini Memory Bot error, falling back:', err);
    }
  }

  // Fallback response
  return {
    replyEn: `BR BOT Assistant received your message: "${userMessage}". Based on current market conditions (BTC $${getMarketOverview().btc.price.toLocaleString()}), selling 0.20 Delta weekly spreads captures optimal theta decay while keeping gamma risk strictly bounded.`,
    replyHi: `BR BOT असिस्टेंट: आपका सवाल मिला। वर्तमान बाजार स्थिति (BTC $${getMarketOverview().btc.price.toLocaleString()}) में, 0.20 डेल्टा के वीकली स्प्रेड्स बेचने से समय के डीके (Theta) का सबसे बेहतर फायदा मिलता है और जोखिम नियंत्रित रहता है।`,
  };
}
