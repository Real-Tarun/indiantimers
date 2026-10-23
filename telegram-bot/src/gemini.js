/**
 * Google Gemini AI Engine for IndianTimers Telegram Bot
 * Uses gemini-3.5-flash-lite for ultra-fast, high-quality Hinglish study content.
 */

const DEFAULT_KEY_B64 = 'QVEuQWI4Uk42SUhBU29HMXA2cTdRYkJLUFA4eWlPbWY0RGk5M0JLNng1WlRjUVNFWjFpd0E=';

export function getApiKey(env = null) {
  if (env?.GEMINI_API_KEY) return env.GEMINI_API_KEY;
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    return atob(DEFAULT_KEY_B64);
  } catch {
    return Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf-8');
  }
}

const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.5-flash';

/**
 * Robust Telegram HTML text sanitizer
 * Converts markdown formatting to valid Telegram HTML and removes rogue symbols like *** or raw tags.
 */
export function cleanTelegramHtml(text) {
  if (!text) return '';
  let s = String(text);
  // 1. Horizontal divider lines (---, *** on their own line) -> aesthetic divider
  s = s.replace(/^\s*[\*\-_]{3,}\s*$/gm, '───────────────');
  // 2. Markdown headers (###, ##, #) -> bold title
  s = s.replace(/^#{1,6}\s*(.+)$/gm, '<b>$1</b>');
  // 3. Bold + Italic ***text*** -> <b><i>text</i></b>
  s = s.replace(/\*\*\*([^\*\n]+)\*\*\*/g, '<b><i>$1</i></b>');
  // 4. Bold **text** -> <b>text</b>
  s = s.replace(/\*\*([^\*\n]+)\*\*/g, '<b>$1</b>');
  // 5. Bullet items (* or - at line start) -> clean bullet •
  s = s.replace(/^[\*\-]\s+/gm, '• ');
  // 6. Italic *text* or _text_
  s = s.replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<i>$1</i>');
  s = s.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<i>$1</i>');
  // 7. Strip any remaining rogue asterisks or stray backticks
  s = s.replace(/[\*`]/g, '');
  // 8. Clean up multiple empty lines
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

async function callGemini(prompt, systemInstruction = '', jsonMode = false) {
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError = null;

  for (const model of models) {
    try {
      const key = getApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000)
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(`Gemini API Error (${model}): ${data.error.message}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Engine] ${model} attempt failed:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

/**
 * Generates an inspiring morning quote and innovative topper hack.
 */
export async function generateDailyHack() {
  const system = `You are an elite mentor for Indian exam aspirants (NEET, JEE, UPSC, SSC, NDA, Boards). Write in crisp, energetic Hinglish. Keep it ultra compact under 50 words. Never output raw markdown asterisks (*** or **). Use clean bold headers.`;
  const prompt = `Generate a compact "Daily Topper Study Hack" for Indian competitive exam aspirants.
Requirements:
1. Technique name in bold.
2. Exactly 2 ultra-short bullet points (•) on how to execute it today.
3. Total length strictly under 50 words. Format cleanly with bullet points (•). Do NOT use markdown code blocks or *** symbols.`;

  const raw = await callGemini(prompt, system);
  return cleanTelegramHtml(raw);
}

/**
 * Predefined Exam Categories for true rotation
 */
export const QUIZ_STREAM_PRESETS = [
  {
    key: 'neet_bio',
    exam: 'NEET UG',
    subject: 'Biology (Genetics & Ecology)',
    instruction: 'NCERT standard high-yield Biology concept for NEET'
  },
  {
    key: 'jee_phys',
    exam: 'JEE Main',
    subject: 'Physics (Mechanics & Waves)',
    instruction: 'Conceptual JEE Main level physics question'
  },
  {
    key: 'neet_chem',
    exam: 'NEET UG',
    subject: 'Chemistry (Organic Reaction Mechanisms)',
    instruction: 'High-yield Organic chemistry functional groups / reagents for NEET'
  },
  {
    key: 'jee_math',
    exam: 'JEE Main',
    subject: 'Mathematics (Calculus & Coordinate Geometry)',
    instruction: 'Sharp conceptual JEE Main maths problem'
  },
  {
    key: 'ssc_reasoning',
    exam: 'SSC CGL',
    subject: 'General Intelligence & Reasoning',
    instruction: 'Speed-based logical series, coding-decoding, or analogy question for SSC CGL'
  },
  {
    key: 'upsc_polity',
    exam: 'UPSC CSE',
    subject: 'Indian Polity & Constitution',
    instruction: 'UPSC Prelims standard question on Constitutional Articles, Fundamental Rights, or Parliament'
  },
  {
    key: 'clat_legal',
    exam: 'CLAT',
    subject: 'Legal Reasoning & Constitutional Law',
    instruction: 'Authentic CLAT legal aptitude / principle-fact MCQ'
  },
  {
    key: 'history_pcs',
    exam: 'UPSC / State PCS',
    subject: 'Modern Indian History',
    instruction: 'High-yield Modern Indian History freedom movement or Governor-General acts MCQ'
  }
];

/**
 * Generates an interactive PYQ Quiz Poll formatted as JSON.
 * Genuinely rotates between NEET, JEE, SSC, UPSC, and CLAT.
 */
export async function generateAIQuiz(requestedCategoryOrTopic = '') {
  let targetPreset = null;
  const inputLower = (requestedCategoryOrTopic || '').toLowerCase().trim();

  if (inputLower.includes('neet') || inputLower.includes('bio')) {
    targetPreset = QUIZ_STREAM_PRESETS[0]; // NEET Bio
  } else if (inputLower.includes('chem')) {
    targetPreset = QUIZ_STREAM_PRESETS[2]; // NEET/JEE Chem
  } else if (inputLower.includes('jee') || inputLower.includes('phys')) {
    targetPreset = QUIZ_STREAM_PRESETS[1]; // JEE Phys
  } else if (inputLower.includes('math')) {
    targetPreset = QUIZ_STREAM_PRESETS[3]; // JEE Math
  } else if (inputLower.includes('ssc') || inputLower.includes('reasoning')) {
    targetPreset = QUIZ_STREAM_PRESETS[4]; // SSC CGL
  } else if (inputLower.includes('upsc') || inputLower.includes('polity')) {
    targetPreset = QUIZ_STREAM_PRESETS[5]; // UPSC Polity
  } else if (inputLower.includes('clat') || inputLower.includes('law') || inputLower.includes('legal')) {
    targetPreset = QUIZ_STREAM_PRESETS[6]; // CLAT Legal
  } else if (inputLower.includes('history')) {
    targetPreset = QUIZ_STREAM_PRESETS[7]; // History
  } else if (requestedCategoryOrTopic && requestedCategoryOrTopic !== 'random') {
    targetPreset = {
      exam: 'Competitive Exam',
      subject: requestedCategoryOrTopic,
      instruction: `Generate an authentic, high-yield Multiple Choice Question specifically focused on: "${requestedCategoryOrTopic}"`
    };
  } else {
    // True uniform random pick from all streams
    const idx = Math.floor(Math.random() * QUIZ_STREAM_PRESETS.length);
    targetPreset = QUIZ_STREAM_PRESETS[idx];
  }

  const system = `You are a premier national exam question setter. Output STRICTLY valid JSON only without markdown code blocks, backticks, or asterisks.`;
  const prompt = `Generate a high-yield Multiple Choice Question strictly for ${targetPreset.exam} - Subject: ${targetPreset.subject}.
Special Focus: ${targetPreset.instruction}.

Return JSON strictly in this structure:
{
  "exam": "${targetPreset.exam}",
  "subject": "${targetPreset.subject}",
  "question": "Question text under 220 characters. Do NOT use *** or raw asterisks.",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOptionId": 0,
  "explanation": "Clear 1-sentence conceptual explanation under 160 characters."
}
Rules:
- Question and options must NOT contain raw asterisks (*** or **) or HTML tags.
- Exactly 4 options. Keep each option short (under 35 chars).
- correctOptionId must be an integer between 0 and 3.`;

  const text = await callGemini(prompt, system, true);
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  if (parsed) {
    parsed.question = (parsed.question || '').replace(/[\*`]/g, '').trim();
    if (Array.isArray(parsed.options)) {
      parsed.options = parsed.options.map(opt => String(opt).replace(/[\*`]/g, '').trim());
    }
    parsed.explanation = (parsed.explanation || '').replace(/[\*`]/g, '').trim();
  }

  return parsed;
}

/**
 * Generates a high-yield Subject Revision Capsule / Mnemonic Trick.
 */
export async function generateSubjectTrick(topic = '') {
  const system = `You are a ranker teacher specializing in mnemonics, desi tricks, and memory shortcuts for NEET/JEE/UPSC aspirants. Never output raw markdown asterisks (*** or **).`;
  const prompt = `Generate an ultra-crisp "Formula / Mnemonic / Trick of the Day" ${topic ? `about ${topic}` : 'for a high-weightage topic in Physics, Chemistry, Biology, or Indian Constitution'}.
Structure:
💡 [Topic & Exam Tag]
🎯 The Concept / What to Remember
⚡ The Desi Shortcut / Mnemonic
📝 How to apply in Exam
Keep it punchy, engaging, and under 120 words. Format with clean emojis and clean text without ***.`;

  const raw = await callGemini(prompt, system);
  return cleanTelegramHtml(raw);
}

/**
 * Generates a custom broadcast post from any admin prompt with sanitized HTML.
 */
export async function generateCustomBroadcast(adminPrompt) {
  const system = `You are the lead content strategist for IndianTimers (@indiantimers), India's #1 real-time exam countdown community. Craft compelling, perfectly-formatted Telegram broadcast messages in energetic Hinglish. Do NOT use horizontal divider lines like *** or ---. Do NOT use raw asterisks or markdown code blocks.`;
  const raw = await callGemini(adminPrompt, system);
  return cleanTelegramHtml(raw);
}
