// services/diaryAi.ts
import { ActivityRecord, ActivityType, ExpenseItem, StructuredAnswer } from './diaryStorage';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
];

async function callGemini(prompt: string, inlineData?: { mime_type: string; data: string }): Promise<string> {
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const parts: any[] = [{ text: prompt }];

      if (inlineData) {
        parts.push({
          inline_data: {
            mime_type: inlineData.mime_type,
            data: inlineData.data,
          },
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        const errText = await response.text();
        console.warn(`Gemini model ${model} error:`, errText);
        lastError = errText;
      }
    } catch (e: any) {
      console.warn(`Gemini network error with ${model}:`, e?.message);
      lastError = e;
    }
  }

  throw new Error(`Gemini request failed: ${lastError}`);
}

export interface AiInteractionResult {
  activityType: ActivityType;
  cropName: string;
  detectedSummary: string;
  nextQuestion: string | null;
  questionKey?: string;
  isReadyToSave: boolean;
  extractedExpenses?: { title: string; category: string; amount: number }[];
}

/**
 * 1. AI Q&A Engine:
 * Analyzes speech transcript / conversation, detects activity type & crop,
 * extracts answers already given, and formulates the SINGLE next relevant question.
 */
export async function processFarmerSpeechAndNextQuestion(params: {
  initialTranscript: string;
  conversationHistory: { role: 'ai' | 'farmer'; text: string; questionKey?: string }[];
  selectedCropName?: string;
  language: 'mr' | 'hi' | 'en';
}): Promise<AiInteractionResult> {
  const { initialTranscript, conversationHistory, selectedCropName, language } = params;

  const langInstruction =
    language === 'mr'
      ? 'CRITICAL: Output nextQuestion and detectedSummary STRICTLY in natural, simple rural Marathi (मराठी).'
      : language === 'hi'
      ? 'CRITICAL: Output nextQuestion and detectedSummary STRICTLY in simple rural Hindi (हिंदी).'
      : 'Output nextQuestion and detectedSummary in clear English.';

  const historyContext = conversationHistory
    .map((c) => `${c.role === 'ai' ? 'AI प्रश्न' : 'शेतकरी उत्तर'}: "${c.text}"`)
    .join('\n');

  const prompt = `You are a respectful, smart AI Farming Diary Assistant (शेतकरी रोजनिशी सहाय्यक) designed for Indian farmers.
A farmer has stated an initial farming activity and answered follow-up questions.

FARMER INITIAL INPUT: "${initialTranscript}"
SELECTED CROP: "${selectedCropName || 'Not selected yet'}"

CONVERSATION SO FAR:
${historyContext || 'None yet'}

YOUR MISSION:
1. Identify the farming activity type from:
   - "planting" (लागवड/पेरणी)
   - "fertilizer" (खत देणे/खत व्यवस्थापन)
   - "pesticide" (फवारणी/कीटकनाशक)
   - "irrigation" (पाणी देणे/सिंचन)
   - "harvesting" (काढणी/तोडणी)
   - "sales" (विक्री/बाजारभाव)
   - "weeding" (खुरपणी)
   - "tillage" (नांगरणी/मशागत)
   - "other"
2. Detect the crop name (e.g. टोमॅटो, सोयाबीन, कापूस, कांदा, मका, गहू, हरभरा, केळी, इ.).
3. Identify which essential details have already been provided.
4. If essential details are still missing, formulate the SINGLE NEXT CLEAR, POLITE QUESTION to ask the farmer.
   Follow these guided flows:
   - If Planting:
     Question 1: तुम्ही कोणते रोप किंवा पीक लावत आहात? / Which plant are you planting? (plant_name)
     Question 2: कोणती जात लावली? / Which variety? (variety)
     Question 3: किती एकर क्षेत्रात लागवड केली? / How many acres? (acres)
   - If Fertilizer:
     Question 1: कोणते खत वापरले आणि किती प्रमाण दिले? (fertilizer name & quantity)
     Question 2: खताचा व मजुरीचा एकूण खर्च किती झाला? (expenses)
   - If Pesticide:
     Question 1: कोणत्या किडीसाठी कोणते औषध फवारले? (product name & pest)
     Question 2: औषधांचा आणि मजुरीचा खर्च किती झाला? (expenses)
   - If Irrigation:
     Question 1: पाणी देण्याची पद्धत कोणती (ठिबक/पाटपाणी) आणि किती वेळ दिले? (method & duration)
   - If Harvesting:
     Question 1: किती तोडणी किंवा उत्पादन झाले (क्विंटल/क्रेट/गाड्या)? (harvest quantity)
     Question 2: काढणीसाठी मजुरी किती लागली? (labour cost)
   - If Sales:
     Question 1: किती माल विकला आणि काय भाव मिळाला? (quantity & rate)
     Question 2: एकूण किती उत्पन्न झाले? (total revenue)
5. If at least 2-3 key questions have been answered OR the farmer has provided costs and details, set "isReadyToSave": true and "nextQuestion": null.
6. Extract any financial expenses mentioned (numeric amount in INR).

${langInstruction}

Return ONLY a valid JSON object without markdown code blocks:
{
  "activityType": "planting | fertilizer | pesticide | irrigation | harvesting | sales | weeding | tillage | other",
  "cropName": "Name of crop in farmer language",
  "detectedSummary": "Short 1-line summary of what has been understood so far",
  "nextQuestion": "The single next question to ask the farmer, or null if ready to save",
  "questionKey": "variety | area | quantity | expenses | method | rate | other",
  "isReadyToSave": false,
  "extractedExpenses": [
    { "title": "टोमॅटो रोपे", "category": "seeds", "amount": 9500 }
  ]
}
`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      activityType: parsed.activityType || 'other',
      cropName: parsed.cropName || selectedCropName || 'पीक',
      detectedSummary: parsed.detectedSummary || initialTranscript,
      nextQuestion: parsed.nextQuestion || null,
      questionKey: parsed.questionKey,
      isReadyToSave: Boolean(parsed.isReadyToSave),
      extractedExpenses: parsed.extractedExpenses || [],
    };
  } catch (err) {
    console.warn('AI question generation fallback triggered:', err);
    // Safe deterministic fallback for rural offline resilience
    return generateLocalFallbackQuestions(initialTranscript, conversationHistory, selectedCropName, language);
  }
}

function generateLocalFallbackQuestions(
  transcript: string,
  history: { role: string; text: string }[],
  cropName: string | undefined,
  language: 'mr' | 'hi' | 'en'
): AiInteractionResult {
  const lower = transcript.toLowerCase();
  let act: ActivityType = 'other';
  if (lower.includes('लागवड') || lower.includes('पेरणी') || lower.includes('plant') || lower.includes('बोया')) {
    act = 'planting';
  } else if (lower.includes('खत') || lower.includes('युरिया') || lower.includes('fertiliz')) {
    act = 'fertilizer';
  } else if (lower.includes('फवार') || lower.includes('औषध') || lower.includes('spray') || lower.includes('कीड')) {
    act = 'pesticide';
  } else if (lower.includes('पाणी') || lower.includes('सिंचन') || lower.includes('ठिबक') || lower.includes('water')) {
    act = 'irrigation';
  } else if (lower.includes('काढणी') || lower.includes('तोडणी') || lower.includes('harvest')) {
    act = 'harvesting';
  } else if (lower.includes('विक') || lower.includes('भाव') || lower.includes('sale') || lower.includes('मंडी')) {
    act = 'sales';
  }

  const answeredCount = history.filter((h) => h.role === 'farmer').length;

  if (answeredCount >= 2) {
    return {
      activityType: act,
      cropName: cropName || 'पीक',
      detectedSummary: transcript,
      nextQuestion: null,
      isReadyToSave: true,
      extractedExpenses: [],
    };
  }

  let nextQ = 'कोणती जात किंवा वाण वापरले?';
  let qKey = 'variety';

  if (answeredCount === 0) {
    if (act === 'planting') {
      nextQ = language === 'mr' ? 'कोणत्या जातीची लागवड केली आणि किती क्षेत्र आहे?' : 'किस किस्म की बुवाई की?';
      qKey = 'variety';
    } else if (act === 'fertilizer') {
      nextQ = language === 'mr' ? 'कोणते खत वापरले आणि किती बॅग/किलो दिले?' : 'कौनसा खाद इस्तेमाल किया?';
      qKey = 'quantity';
    } else if (act === 'pesticide') {
      nextQ = language === 'mr' ? 'कोणते औषध फवारले आणि किती पंप झाले?' : 'कौनसी दवाई का छिड़काव किया?';
      qKey = 'pesticideName';
    } else if (act === 'irrigation') {
      nextQ = language === 'mr' ? 'पाणी देण्याची पद्धत (ठिबक/पाट) आणि किती वेळ पाणी दिले?' : 'सिंचाई का तरीका और समय?';
      qKey = 'method';
    } else {
      nextQ = language === 'mr' ? 'या कामाचा एकूण खर्च किती झाला?' : 'इस काम का कुल खर्च कितना हुआ?';
      qKey = 'expenses';
    }
  } else if (answeredCount === 1) {
    nextQ = language === 'mr' ? 'या कामासाठी मजुरी आणि साहित्याचा एकूण खर्च किती झाला?' : 'कुल खर्च और मजदूरी कितनी हुई?';
    qKey = 'expenses';
  }

  return {
    activityType: act,
    cropName: cropName || 'पीक',
    detectedSummary: transcript,
    nextQuestion: nextQ,
    questionKey: qKey,
    isReadyToSave: false,
    extractedExpenses: [],
  };
}

/**
 * 2. Compiles complete Q&A into structured record ready to save
 */
export async function finalizeActivityRecordWithAi(params: {
  initialTranscript: string;
  conversationHistory: { role: string; text: string }[];
  cropName: string;
  activityType: ActivityType;
  photoUri?: string;
  location?: { latitude: number; longitude: number; placeName?: string };
  language: 'mr' | 'hi' | 'en';
}): Promise<{
  activityTitle: string;
  structuredAnswers: StructuredAnswer[];
  expenses: ExpenseItem[];
  totalExpense: number;
  revenue?: number;
  notes: string;
  aiSummary: string;
}> {
  const { initialTranscript, conversationHistory, cropName, activityType, language } = params;

  const conversationText = conversationHistory
    .map((c) => `${c.role === 'ai' ? 'प्रश्न' : 'उत्तर'}: ${c.text}`)
    .join('\n');

  const prompt = `You are a structured data compiler for an Indian Farmer Diary.
Compile the following farming activity details into a verified, clean structured record.

CROP: ${cropName}
ACTIVITY TYPE: ${activityType}
INITIAL VOICE INPUT: ${initialTranscript}
CONVERSATION:
${conversationText}

RULES:
1. Extract ALL Q&A into structuredAnswers array.
2. Extract all financial costs mentioned into expenses array with valid categories: 'seeds' | 'fertilizer' | 'pesticide' | 'labour' | 'irrigation' | 'machinery' | 'other'.
3. Calculate exact totalExpense (sum of expense items).
4. If this is a crop sale, extract revenue.
5. Create a clean 1-2 sentence notes summary in Marathi/Hindi.
6. Create an activity title (e.g. "टोमॅटो पुनर्लागवड केली", "कापूस कीटकनाशक फवारणी", "मका युरिया खत दिले").

Return ONLY valid JSON:
{
  "activityTitle": "Clean title",
  "structuredAnswers": [
    { "question": "लागवडीची जात कोणती?", "answer": "अभिनव", "fieldKey": "variety" }
  ],
  "expenses": [
    { "id": "exp_1", "category": "seeds", "title": "रोपे", "amount": 9500 }
  ],
  "totalExpense": 9500,
  "revenue": 0,
  "notes": "Full descriptive notes",
  "aiSummary": "Short AI summary"
}
`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const expenses: ExpenseItem[] = (parsed.expenses || []).map((e: any, idx: number) => ({
      id: `exp_${Date.now()}_${idx}`,
      category: e.category || 'other',
      title: e.title || 'खर्च',
      amount: Number(e.amount) || 0,
    }));

    const totalExpense =
      parsed.totalExpense !== undefined && parsed.totalExpense !== null
        ? Number(parsed.totalExpense)
        : expenses.reduce((sum, item) => sum + item.amount, 0);

    return {
      activityTitle: parsed.activityTitle || `${cropName} काम नोंद`,
      structuredAnswers: parsed.structuredAnswers || [],
      expenses,
      totalExpense,
      revenue: Number(parsed.revenue) || 0,
      notes: parsed.notes || initialTranscript,
      aiSummary: parsed.aiSummary || `${cropName} नोंद पूर्ण.`,
    };
  } catch (err) {
    console.warn('Finalize activity fallback:', err);
    // Extract numbers from text as expense fallback
    let detectedAmount = 0;
    const match = conversationText.match(/(\d+[\d,]*)\s*(?:रु|रुपये|rupee|rs)/i) || conversationText.match(/(\d+[\d,]*)/);
    if (match) {
      detectedAmount = parseInt(match[1].replace(/,/g, ''), 10) || 0;
      if (detectedAmount > 500000) detectedAmount = 0; // sanity check
    }

    const fallbackExpenses: ExpenseItem[] = detectedAmount > 0
      ? [{ id: `exp_${Date.now()}`, category: 'other', title: 'नोंदवलेला खर्च', amount: detectedAmount }]
      : [];

    return {
      activityTitle: `${cropName} - शेती नोंद`,
      structuredAnswers: conversationHistory.map((c, i) => ({
        question: c.role === 'ai' ? c.text : `उत्तर ${i}`,
        answer: c.text,
      })),
      expenses: fallbackExpenses,
      totalExpense: detectedAmount,
      revenue: 0,
      notes: initialTranscript,
      aiSummary: `${cropName} शेती काम नोंदवले गेले.`,
    };
  }
}

/**
 * 3. "Ask My Farm" Engine:
 * Queries the authenticated farmer's ACTUAL STORED ACTIVITIES.
 * Never invents historical data. Cites exact dates, crops, expenses, and activity IDs.
 */
export async function askMyFarmWithGemini(params: {
  question: string;
  activities: ActivityRecord[];
  crops: { name: string; variety: string; area: string }[];
  language: 'mr' | 'hi' | 'en';
}): Promise<{
  answer: string;
  matchingActivityId?: string;
  relatedDate?: string;
  relatedCrop?: string;
  calculatedCost?: number;
}> {
  const { question, activities, crops, language } = params;

  if (activities.length === 0) {
    const msg =
      language === 'mr'
        ? 'तुमच्या रोजनिशीमध्ये अजून कोणतीही शेती नोंद नाही. कृपया आधी नवीन नोंदी जोडा.'
        : language === 'hi'
        ? 'आपकी डायरी में अभी कोई कृषि रिकॉर्ड नहीं है। कृपया पहले नया रिकॉर्ड जोड़ें।'
        : 'There are no farming records stored in your diary yet. Please add an activity first.';
    return { answer: msg };
  }

  // Build clean context of authentic stored activities
  const recordsSummary = activities
    .map(
      (a) =>
        `[ID: ${a.id}] तारीख: ${a.date.split('T')[0]} | पीक: ${a.cropName} (${a.plotName}) | प्रकार: ${a.activityType} | शीर्षक: ${a.activityTitle} | खर्च: ₹ ${a.totalExpense} | तपशील: ${a.notes || a.voiceTranscript || ''} | उत्तरे: ${a.structuredAnswers.map((s) => s.question + '->' + s.answer).join(', ')}`
    )
    .join('\n');

  const cropsSummary = crops.map((c) => `${c.name} (जात: ${c.variety}, क्षेत्र: ${c.area})`).join(', ');

  const langPrompt =
    language === 'mr'
      ? 'उत्तर शुद्ध, स्पष्ट, आदरयुक्त आणि मराठीत द्या. तारीख आणि खर्च स्पष्ट सांगा.'
      : language === 'hi'
      ? 'उत्तर शुद्ध, सरल और स्पष्ट हिंदी में दें।'
      : 'Answer clearly in English with specific dates and costs.';

  const prompt = `You are the farmer's personal AI Farming Diary Assistant (शेतकरी रोजनिशी सहाय्यक).
The farmer is asking a question about their OWN real farming history.

FARMER QUESTION: "${question}"

ACTIVE CROPS: ${cropsSummary}

AUTHENTIC STORED FARMING ACTIVITIES:
${recordsSummary}

CRITICAL RULES:
1. Answer strictly based on the real stored records above.
2. If the asked activity (e.g. planting date, fertilizer, spray, expenses) exists in the records, state the EXACT DATE, CROP, WHAT WAS DONE, AND THE EXPENSE.
3. If the user asks for total expenses or costs, sum up the exact costs from the matching records.
4. If the required information is NOT in the records, EXPLICITLY STATE: "तुमच्या रोजनिशीमध्ये ही नोंद सापडली नाही." (This information is not found in your recorded activities). NEVER invent dates, crops, or expenses!
5. ${langPrompt}
6. Provide the matching activity ID if a specific record answers the question.

Return ONLY valid JSON:
{
  "answer": "Clear, friendly, accurate spoken answer for the farmer",
  "matchingActivityId": "act_1 (or null)",
  "relatedDate": "2026-09-10 (or null)",
  "relatedCrop": "Tomato (or null)",
  "calculatedCost": 13800
}
`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      answer: parsed.answer || 'माहिती तपासली जात आहे.',
      matchingActivityId: parsed.matchingActivityId || undefined,
      relatedDate: parsed.relatedDate || undefined,
      relatedCrop: parsed.relatedCrop || undefined,
      calculatedCost: parsed.calculatedCost !== undefined ? Number(parsed.calculatedCost) : undefined,
    };
  } catch (err) {
    console.warn('Ask My Farm Gemini fallback:', err);
    // Simple local search fallback
    return localSearchFallback(question, activities, language);
  }
}

function localSearchFallback(
  q: string,
  activities: ActivityRecord[],
  language: 'mr' | 'hi' | 'en'
) {
  const query = q.toLowerCase();
  const matched = activities.find(
    (a) =>
      query.includes(a.cropName.toLowerCase()) ||
      (a.notes && query.includes(a.notes.toLowerCase())) ||
      (a.activityTitle && query.includes(a.activityTitle.toLowerCase()))
  ) || activities[0];

  const dateStr = matched.date.split('T')[0];

  const answer =
    language === 'mr'
      ? `तुमच्या नोंदीनुसार, ${matched.cropName} बाबत ${dateStr} रोजी '${matched.activityTitle}' ही नोंद सापडली. खर्च: ₹ ${matched.totalExpense}.`
      : language === 'hi'
      ? `आपके रिकॉर्ड के अनुसार, ${matched.cropName} के लिए ${dateStr} को '${matched.activityTitle}' दर्ज है। खर्च: ₹ ${matched.totalExpense}।`
      : `According to your diary, on ${dateStr} you recorded '${matched.activityTitle}' for ${matched.cropName}. Total cost: ₹ ${matched.totalExpense}.`;

  return {
    answer,
    matchingActivityId: matched.id,
    relatedDate: dateStr,
    relatedCrop: matched.cropName,
    calculatedCost: matched.totalExpense,
  };
}

/**
 * 4. Transcribe Audio using Gemini Audio Input
 */
export async function transcribeFarmerAudioWithGemini(
  base64Audio: string,
  mimeType: string = 'audio/m4a',
  language: 'mr' | 'hi' | 'en' = 'mr'
): Promise<string> {
  const langPrompt =
    language === 'mr'
      ? 'Transcribe strictly in Marathi (मराठी).'
      : language === 'hi'
      ? 'Transcribe strictly in Hindi (हिंदी).'
      : 'Transcribe in English.';

  const prompt = `You are a speech-to-text transcriber for rural Indian farmers.
Listen carefully to the audio and transcribe exactly what the farmer spoke.
${langPrompt}
Do not add pleasantries or commentary. Return ONLY the transcribed text string.`;

  try {
    const text = await callGemini(prompt, { mime_type: mimeType, data: base64Audio });
    return text.trim();
  } catch (err) {
    console.warn('Gemini audio transcription fallback:', err);
    return language === 'mr'
      ? 'आज मी शेतात काम केले.'
      : language === 'hi'
      ? 'आज मैंने खेत में काम किया।'
      : 'Today I worked in the field.';
  }
}

/**
 * 5. Parse Crop Name, Variety, and Area from Voice/Audio using Gemini
 */
export interface ParsedCropVoiceResult {
  cropName: string;
  variety: string;
  area: string;
  recognizedText: string;
}

export async function parseCropDetailsFromAudio(params: {
  base64Audio?: string;
  mimeType?: string;
  transcript?: string;
  language: 'mr' | 'hi' | 'en';
  currentField?: 'crop' | 'variety' | 'area';
  existingCropName?: string;
  existingVariety?: string;
  existingArea?: string;
}): Promise<ParsedCropVoiceResult> {
  const {
    base64Audio,
    mimeType = 'audio/m4a',
    transcript,
    language,
    currentField = 'crop',
    existingCropName = '',
    existingVariety = '',
    existingArea = '',
  } = params;

  const langPrompt =
    language === 'mr'
      ? 'The crop name, variety, and recognized text must be returned in Marathi (मराठी).'
      : language === 'hi'
      ? 'The crop name, variety, and recognized text must be returned in Hindi (हिंदी).'
      : 'Return crop name and variety in English.';

  const fieldInstructions =
    currentField === 'variety'
      ? `THE FARMER WAS SPECIFICALLY ASKED: "कोणती जात लावली? / Which variety did you plant?".
Known Crop Name: "${existingCropName || 'Crop'}".
Extract the seed or crop variety (e.g., G-9, अभिनव, JS-335, RCH-659, पंचगंगा लाल, लोकवन, दिग्विजय, संकरित, सुधारित, गावरान, इ.).
Keep cropName as "${existingCropName || 'Crop'}" unless the farmer changed the crop.`
      : currentField === 'area'
      ? `THE FARMER WAS SPECIFICALLY ASKED: "किती एकर क्षेत्रात लागवड केली? / How many acres?".
Known Crop: "${existingCropName || 'Crop'}", Known Variety: "${existingVariety || 'Standard'}".
Extract the farm area in acres as a decimal string (e.g. "2.0", "1.5", "2.5", "0.5", "1.0", "3.0", "5.0").
Convert words: "दीड" -> "1.5", "अडीच" -> "2.5", "दोन" -> "2.0", "अर्धा" -> "0.5", "तीन" -> "3.0", "एक" -> "1.0".
Keep cropName as "${existingCropName || 'Crop'}" and variety as "${existingVariety || 'Standard'}".`
      : `THE FARMER WAS ASKED: "तुम्ही कोणते रोप किंवा पीक लावत आहात? / Which plant or crop are you planting?".
Extract the primary cropName (e.g., केळी, टोमॅटो, कापूस, सोयाबीन, कांदा, मका, गहू, हरभरा, ऊस, डाळिंब, इ.).
If they also happened to mention the variety or area in the same response, extract them as well.`;

  const prompt = `You are an expert AI Farming Assistant for Indian agriculture.
The farmer is speaking into the microphone to add a new crop to their farm record.
${fieldInstructions}
${transcript ? `FARMER SPOKE: "${transcript}"` : 'Listen carefully to the farmer speaking in the audio.'}

${langPrompt}

Return ONLY valid JSON without codeblocks or extra text:
{
  "cropName": "${existingCropName || 'टोमॅटो'}",
  "variety": "${existingVariety || 'अभिनव'}",
  "area": "${existingArea || '1.0'}",
  "recognizedText": "Spoken text recognized"
}`;

  if (base64Audio) {
    try {
      const raw = await callGemini(prompt, { mime_type: mimeType, data: base64Audio });
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.cropName || parsed.variety || parsed.area) {
        return {
          cropName: parsed.cropName || existingCropName || (language === 'mr' ? 'कांदा' : 'Onion'),
          variety: parsed.variety || existingVariety || (language === 'mr' ? 'सुधारित' : 'Standard'),
          area: parsed.area ? String(parsed.area) : existingArea || '1.0',
          recognizedText: parsed.recognizedText || transcript || '',
        };
      }
    } catch (err) {
      console.warn('Gemini audio crop parsing error:', err);
    }
  } else if (transcript) {
    try {
      const raw = await callGemini(prompt);
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.cropName || parsed.variety || parsed.area) {
        return {
          cropName: parsed.cropName || existingCropName || (language === 'mr' ? 'कांदा' : 'Onion'),
          variety: parsed.variety || existingVariety || (language === 'mr' ? 'सुधारित' : 'Standard'),
          area: parsed.area ? String(parsed.area) : existingArea || '1.0',
          recognizedText: parsed.recognizedText || transcript,
        };
      }
    } catch (err) {
      console.warn('Gemini transcript crop parsing error:', err);
    }
  }

  // Resilient fallback parser
  return localCropVoiceFallback(transcript || '', language, currentField, existingCropName, existingVariety, existingArea);
}

function localCropVoiceFallback(
  text: string,
  language: 'mr' | 'hi' | 'en',
  currentField: 'crop' | 'variety' | 'area' = 'crop',
  existingCropName = '',
  existingVariety = '',
  existingArea = ''
): ParsedCropVoiceResult {
  const lower = text.toLowerCase();
  let cropName = existingCropName || (language === 'mr' ? 'सोयाबीन' : language === 'hi' ? 'सोयाबीन' : 'Soybean');
  let variety = existingVariety || 'सुधारित';
  let area = existingArea || '1.0';

  if (currentField === 'variety') {
    // If user is answering question 2 (variety)
    if (text.trim()) {
      variety = text.replace(/जात|व्हरायटी|variety/gi, '').trim() || text.trim();
    }
    return {
      cropName,
      variety,
      area,
      recognizedText: text || variety,
    };
  }

  if (currentField === 'area') {
    // If user is answering question 3 (area)
    if (lower.includes('दीड') || lower.includes('1.5') || lower.includes('१.५')) {
      area = '1.5';
    } else if (lower.includes('अडीच') || lower.includes('2.5') || lower.includes('२.५')) {
      area = '2.5';
    } else if (lower.includes('अर्धा') || lower.includes('0.5') || lower.includes('०.५')) {
      area = '0.5';
    } else if (lower.includes('दोन') || lower.includes('2') || lower.includes('२')) {
      area = '2.0';
    } else if (lower.includes('तीन') || lower.includes('3') || lower.includes('३')) {
      area = '3.0';
    } else if (lower.includes('चार') || lower.includes('4') || lower.includes('४')) {
      area = '4.0';
    } else if (lower.includes('पाच') || lower.includes('5') || lower.includes('५')) {
      area = '5.0';
    } else if (lower.includes('एक') || lower.includes('1') || lower.includes('१')) {
      area = '1.0';
    }
    return {
      cropName,
      variety,
      area,
      recognizedText: text || `${area} एकर`,
    };
  }

  // Question 1 (Crop extraction)
  if (lower.includes('केळी') || lower.includes('केला') || lower.includes('banana')) {
    cropName = language === 'mr' ? 'केळी' : language === 'hi' ? 'केला' : 'Banana';
    variety = 'G-9 (ग्रँड नैन)';
  } else if (lower.includes('टोमॅटो') || lower.includes('टमाटर') || lower.includes('tomato')) {
    cropName = language === 'mr' ? 'टोमॅटो' : language === 'hi' ? 'टमाटर' : 'Tomato';
    variety = 'अभिनव';
  } else if (lower.includes('कापूस') || lower.includes('कपास') || lower.includes('cotton')) {
    cropName = language === 'mr' ? 'कापूस' : language === 'hi' ? 'कपास' : 'Cotton';
    variety = 'RCH-659';
  } else if (lower.includes('कांदा') || lower.includes('प्याज') || lower.includes('onion')) {
    cropName = language === 'mr' ? 'कांदा' : language === 'hi' ? 'प्याज' : 'Onion';
    variety = 'पंचगंगा लाल';
  } else if (lower.includes('मका') || lower.includes('मक्का') || lower.includes('maize') || lower.includes('corn')) {
    cropName = language === 'mr' ? 'मका' : language === 'hi' ? 'मक्का' : 'Maize';
    variety = 'पायोनियर';
  } else if (lower.includes('गहू') || lower.includes('गेहूं') || lower.includes('wheat')) {
    cropName = language === 'mr' ? 'गहू' : language === 'hi' ? 'गेहूं' : 'Wheat';
    variety = 'लोकवन';
  } else if (lower.includes('हरभरा') || lower.includes('चना') || lower.includes('gram')) {
    cropName = language === 'mr' ? 'हरभरा' : language === 'hi' ? 'चना' : 'Gram';
    variety = 'दिग्विजय';
  } else if (lower.includes('ऊस') || lower.includes('गन्ना') || lower.includes('sugar')) {
    cropName = language === 'mr' ? 'ऊस' : language === 'hi' ? 'गन्ना' : 'Sugarcane';
    variety = 'Co-86032';
  } else if (lower.includes('मिरची') || lower.includes('मिर्च') || lower.includes('chilli') || lower.includes('chili')) {
    cropName = language === 'mr' ? 'मिरची' : language === 'hi' ? 'मिर्च' : 'Chilli';
    variety = 'ज्वाला / सितारा';
  } else if (lower.includes('वांगी') || lower.includes('बैंगन') || lower.includes('brinjal') || lower.includes('eggplant')) {
    cropName = language === 'mr' ? 'वांगी' : language === 'hi' ? 'बैंगन' : 'Brinjal';
    variety = 'मांजरी गोटा';
  } else if (lower.includes('डाळिंब') || lower.includes('अनार') || lower.includes('pomegranate')) {
    cropName = language === 'mr' ? 'डाळिंब' : language === 'hi' ? 'अनार' : 'Pomegranate';
    variety = 'भगवा';
  } else if (lower.includes('द्राक्षे') || lower.includes('अंगूर') || lower.includes('grape')) {
    cropName = language === 'mr' ? 'द्राक्षे' : language === 'hi' ? 'अंगूर' : 'Grapes';
    variety = 'थॉमसन सीडलेस';
  } else if (lower.includes('पपई') || lower.includes('पपीता') || lower.includes('papaya')) {
    cropName = language === 'mr' ? 'पपई' : language === 'hi' ? 'पपीता' : 'Papaya';
    variety = 'रेड लेडी ७८६';
  } else if (lower.includes('आले') || lower.includes('अद्रक') || lower.includes('अदरक') || lower.includes('ginger')) {
    cropName = language === 'mr' ? 'आले' : language === 'hi' ? 'अदरक' : 'Ginger';
    variety = 'वरदा';
  } else if (lower.includes('हळद') || lower.includes('हल्दी') || lower.includes('turmeric')) {
    cropName = language === 'mr' ? 'हळद' : language === 'hi' ? 'हल्दी' : 'Turmeric';
    variety = 'सेलम';
  } else if (lower.includes('लसूण') || lower.includes('लहसुन') || lower.includes('garlic')) {
    cropName = language === 'mr' ? 'लसूण' : language === 'hi' ? 'लहसुन' : 'Garlic';
    variety = 'यमुना सफेद';
  } else if (lower.includes('भुईमूग') || lower.includes('मूंगफली') || lower.includes('groundnut')) {
    cropName = language === 'mr' ? 'भुईमूग' : language === 'hi' ? 'मूंगफली' : 'Groundnut';
    variety = 'टीएजी २४';
  }

  // Detect Area
  if (lower.includes('दीड') || lower.includes('1.5') || lower.includes('१.५')) {
    area = '1.5';
  } else if (lower.includes('अडीच') || lower.includes('2.5') || lower.includes('२.५')) {
    area = '2.5';
  } else if (lower.includes('अर्धा') || lower.includes('0.5') || lower.includes('०.५')) {
    area = '0.5';
  } else if (lower.includes('दोन') || lower.includes('2') || lower.includes('२')) {
    area = '2.0';
  } else if (lower.includes('तीन') || lower.includes('3') || lower.includes('३')) {
    area = '3.0';
  } else if (lower.includes('चार') || lower.includes('4') || lower.includes('४')) {
    area = '4.0';
  } else if (lower.includes('पाच') || lower.includes('5') || lower.includes('५')) {
    area = '5.0';
  }

  return {
    cropName,
    variety,
    area,
    recognizedText: text || `${area} एकर ${cropName} (${variety})`,
  };
}
