/**
 * Google Gemini AI Engine for IndianTimers Telegram Bot
 * Uses gemini-3.5-flash-lite for ultra-fast, high-quality Hinglish study content.
 */

const DEFAULT_KEY_B64 = 'QVEuQWI4Uk42SUhBU29HMXA2cTdRYkJLUFA4eWlPbWY0RGk5M0JLNng1WlRjUVNFWjFpd0E=';
function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    return Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf-8');
  } catch {
    return atob(DEFAULT_KEY_B64);
  }
}
const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.5-flash';

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
  const system = `You are an elite mentor for Indian exam aspirants (NEET, JEE, UPSC, SSC, NDA, Boards). Write in crisp, energetic Hinglish. Keep it highly practical and concise.`;
  const prompt = `Generate a fresh, unique "Daily Topper Study Hack" for Indian competitive exam aspirants.
Requirements:
1. A 1-line powerful reality check / motivation (Hinglish).
2. The name of the technique (e.g., 20-20-20 Focus Rule, Interleaving Method, Blurting Technique, Feynman Step, 3-Pass Mock Rule, Error-Log Mastery).
3. Exactly 2-3 short bullet points on how to execute it today.
4. Keep it under 100 words. Format cleanly with bullet points and bold headers. Do NOT use markdown code blocks.`;

  return await callGemini(prompt, system);
}

/**
 * Generates an interactive PYQ Quiz Poll formatted as JSON.
 */
export async function generateAIQuiz(topic = '') {
  const system = `You are a premier question setter for Indian competitive exams (NEET UG Biology, JEE Main Physics/Math, UPSC CSE Polity/Modern History, SSC CGL Reasoning). Return strictly valid JSON.`;
  const prompt = `Generate a high-yield, realistic Multiple Choice Question for Indian aspirants ${topic ? `focused on ${topic}` : '(randomly pick from NEET Biology, JEE Physics, UPSC Polity, or SSC Reasoning)'}.
Return JSON strictly in this structure:
{
  "exam": "NEET UG / JEE Main / UPSC / SSC",
  "subject": "Subject Name",
  "question": "Clear, concise question text under 250 characters",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOptionId": 0,
  "explanation": "Short 1-2 sentence crystal clear explanation of why this is correct (under 180 characters)"
}
Rule: The question must be authentic and conceptually sharp. Keep options short (under 40 chars each).`;

  const text = await callGemini(prompt, system, true);
  try {
    return JSON.parse(text);
  } catch (e) {
    // Clean potential markdown wrap
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

/**
 * Generates a high-yield Subject Revision Capsule / Mnemonic Trick.
 */
export async function generateSubjectTrick(topic = '') {
  const system = `You are a ranker teacher specializing in mnemonics, desi tricks, and memory shortcuts for NEET/JEE/UPSC aspirants.`;
  const prompt = `Generate an ultra-crisp "Formula / Mnemonic / Trick of the Day" ${topic ? `about ${topic}` : 'for a high-weightage topic in Physics, Chemistry, Biology, or Indian Constitution'}.
Structure:
💡 [Topic & Exam Tag]
🎯 The Concept / What to Remember
⚡ The Desi Shortcut / Mnemonic
📝 How to apply in Exam
Keep it punchy, engaging, and under 120 words. Format with clean emojis.`;

  return await callGemini(prompt, system);
}

/**
 * Generates a custom broadcast post from any admin prompt.
 */
export async function generateCustomBroadcast(adminPrompt) {
  const system = `You are the lead content strategist for IndianTimers (@indiantimers), India's #1 real-time exam countdown and student productivity community. Craft compelling, perfectly-formatted Telegram broadcast messages in energetic Hinglish. Include relevant emojis and clean structure.`;
  return await callGemini(adminPrompt, system);
}
