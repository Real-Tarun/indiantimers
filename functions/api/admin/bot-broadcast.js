/**
 * Admin API Endpoint: /api/admin/bot-broadcast
 * 
 * Allows Admin to trigger 1-click broadcasts, generate custom AI posts with Gemini 3.5,
 * and publish directly to @indiantimers from the Web Dashboard.
 */

const BOT_TOKEN = '8858771667:AAGgdRncGCQcWP6VX5XGO9jH_iWbu8EEMkQ';
const CHANNEL_ID = '@indiantimers';
const DEFAULT_KEY_B64 = 'QVEuQWI4Uk42SUhBU29HMXA2cTdRYkJLUFA4eWlPbWY0RGk5M0JLNng1WlRjUVNFWjFpd0E=';

function getApiKey(env) {
  if (env?.GEMINI_API_KEY) return env.GEMINI_API_KEY;
  try {
    return atob(DEFAULT_KEY_B64);
  } catch {
    return Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf-8');
  }
}

/**
 * Converts mathematical formulas, LaTeX markup, and raw symbols into clean,
 * mobile-friendly Unicode for Telegram broadcasts.
 */
function replaceFractions(str) {
  let s = str;
  const regex = /\\d?frac\{/;
  let safety = 20;
  while (safety-- > 0) {
    const match = regex.exec(s);
    if (!match) break;
    const startIndex = match.index;
    let i = startIndex + match[0].length;
    let depth = 1;
    let num = '';
    while (i < s.length && depth > 0) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') depth--;
      if (depth > 0) num += s[i];
      i++;
    }
    if (depth !== 0 || s[i] !== '{') {
      s = s.slice(0, startIndex) + s.slice(startIndex + match[0].length);
      continue;
    }
    i++; // skip opening '{' of denominator
    depth = 1;
    let den = '';
    while (i < s.length && depth > 0) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') depth--;
      if (depth > 0) den += s[i];
      i++;
    }
    const fullMatched = s.substring(startIndex, i);
    s = s.replace(fullMatched, `(${num.trim()} / ${den.trim()})`);
  }
  return s;
}

function cleanMathAndLatex(text) {
  if (!text) return '';
  let s = String(text);

  // 1. Remove display math wrappers \[ ... \] and \( ... \)
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$1');

  // 2. Remove $$...$$ and $...$ wrappers
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  s = s.replace(/\$([^\$\n]+)\$/g, '$1');

  // 3. Remove \left and \right delimiters: \left( \right) -> ( )
  s = s.replace(/\\left\s*([(\[{|])/g, '$1');
  s = s.replace(/\\right\s*([)\]}|])/g, '$1');
  s = s.replace(/\\left\./g, '');
  s = s.replace(/\\right\./g, '');

  // 4. \text{...}, \mathrm{...}, \mathbf{...}, \pu{...}, \ce{...}
  s = s.replace(/\\(?:text|mathrm|operatorname|pu|ce)\{([^}]+)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]+)\}/g, '<b>$1</b>');
  s = s.replace(/\\mathit\{([^}]+)\}/g, '<i>$1</i>');
  s = s.replace(/\\vec\{([^}]+)\}/g, '$1→');
  s = s.replace(/\\hat\{([a-zA-Z])\}/g, '$1̂');

  // 5. Fractions with nested support: \frac{a}{\sqrt{2}} -> (a / √(2))
  s = replaceFractions(s);
  // Avoid double parentheses like ((a / b)) -> (a / b)
  s = s.replace(/\(\s*\(([^()]+)\)\s*\)/g, '($1)');

  // 6. Roots: \sqrt[n]{x} -> n√(x), \sqrt{x} -> √(x)
  s = s.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, '$1√($2)');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // 7. Common Math Functions (\sin, \cos, \log, etc.)
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lim|det|max|min)\b/g, '$1');

  // 8. Degrees & Temperature: ^\circ C, \degree C, etc.
  s = s.replace(/\^\{\\circ\}\s*(C|F|K)?/g, '°$1');
  s = s.replace(/\^\\circ\s*(C|F|K)?/g, '°$1');
  s = s.replace(/\\degree\s*(C|F|K)?/g, '°$1');
  s = s.replace(/\\circ\s*(C|F|K)?/g, '°$1');

  // 9. Common LaTeX Operators & Symbols
  const symbols = [
    [/\\times\b/g, '×'],
    [/\\div\b/g, '÷'],
    [/\\pm\b/g, '±'],
    [/\\mp\b/g, '∓'],
    [/\\cdot\b/g, '·'],
    [/\\bullet\b/g, '•'],
    [/\\approx\b/g, '≈'],
    [/\\neq\b/g, '≠'],
    [/\\ne\b/g, '≠'],
    [/\\leq\b/g, '≤'],
    [/\\le\b/g, '≤'],
    [/\\geq\b/g, '≥'],
    [/\\ge\b/g, '≥'],
    [/\\infty\b/g, '∞'],
    [/\\propto\b/g, '∝'],
    [/\\to\b/g, '→'],
    [/\\rightarrow\b/g, '→'],
    [/\\leftarrow\b/g, '←'],
    [/\\leftrightarrow\b/g, '↔'],
    [/\\Rightarrow\b/g, '⇒'],
    [/\\Leftarrow\b/g, '⇐'],
    [/\\Leftrightarrow\b/g, '⇔'],
    [/\\rightleftharpoons\b/g, '⇌'],
    [/\\uparrow\b/g, '↑'],
    [/\\downarrow\b/g, '↓'],
    [/\\partial\b/g, '∂'],
    [/\\nabla\b/g, '∇'],
    [/\\sum\b/g, '∑'],
    [/\\prod\b/g, '∏'],
    [/\\int\b/g, '∫'],
    [/\\oint\b/g, '∮'],
    [/\\hbar\b/g, 'ℏ'],
    [/\\AA\b/g, 'Å']
  ];
  for (const [pattern, rep] of symbols) {
    s = s.replace(pattern, rep);
  }

  // 10. Greek letters commonly used in Physics/Chemistry/Math
  const greek = [
    [/\\alpha\b/g, 'α'], [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'], [/\\Gamma\b/g, 'Γ'],
    [/\\delta\b/g, 'δ'], [/\\Delta\b/g, 'Δ'],
    [/\\epsilon\b/g, 'ε'], [/\\varepsilon\b/g, 'ε'],
    [/\\zeta\b/g, 'ζ'], [/\\eta\b/g, 'η'],
    [/\\theta\b/g, 'θ'], [/\\Theta\b/g, 'Θ'], [/\\vartheta\b/g, 'θ'],
    [/\\iota\b/g, 'ι'], [/\\kappa\b/g, 'κ'],
    [/\\lambda\b/g, 'λ'], [/\\Lambda\b/g, 'Λ'],
    [/\\mu\b/g, 'μ'], [/\\nu\b/g, 'ν'],
    [/\\xi\b/g, 'ξ'], [/\\Xi\b/g, 'Ξ'],
    [/\\pi\b/g, 'π'], [/\\Pi\b/g, 'Π'],
    [/\\rho\b/g, 'ρ'], [/\\sigma\b/g, 'σ'], [/\\Sigma\b/g, 'Σ'],
    [/\\tau\b/g, 'τ'], [/\\upsilon\b/g, 'υ'],
    [/\\phi\b/g, 'φ'], [/\\Phi\b/g, 'Φ'], [/\\varphi\b/g, 'φ'],
    [/\\chi\b/g, 'χ'], [/\\psi\b/g, 'ψ'], [/\\Psi\b/g, 'Ψ'],
    [/\\omega\b/g, 'ω'], [/\\Omega\b/g, 'Ω']
  ];
  for (const [pattern, rep] of greek) {
    s = s.replace(pattern, rep);
  }

  // 11. Superscripts: ^{10}, ^{-3}, ^2, ^3, ^12, ^-5
  const superMap = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ'
  };
  s = s.replace(/\^\{([^{}]+)\}/g, (_, exp) => {
    return exp.split('').map(c => superMap[c] || c).join('');
  });
  s = s.replace(/\^([-+]?[0-9nixy]+)/g, (_, exp) => {
    return exp.split('').map(c => superMap[c] || c).join('');
  });

  // 12. Subscripts: _{1}, _{2}, _0, _1, _x
  const subMap = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
  };
  s = s.replace(/_\{([^{}]+)\}/g, (_, sub) => {
    return sub.split('').map(c => subMap[c] || c).join('');
  });
  s = s.replace(/_([0-9aeox]+)/g, (_, sub) => {
    return sub.split('').map(c => subMap[c] || c).join('');
  });

  // 13. Unescape LaTeX escaped characters: \%, \&, \_, \#
  s = s.replace(/\\([%&_#])/g, '$1');

  // 14. Cleanup stray backslashes before ordinary words
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');

  // 15. Strip any remaining stray dollar signs
  s = s.replace(/\$/g, '');

  return s;
}

/**
 * Sanitizes markdown text into Telegram HTML without raw asterisks, broken LaTeX, or $ signs
 */
function cleanTelegramHtml(text) {
  if (!text) return '';
  let s = cleanMathAndLatex(String(text));
  // 1. Horizontal divider lines (--- or *** on their own line)
  s = s.replace(/^\s*[\*\-_]{3,}\s*$/gm, '───────────────');
  // 2. Headers
  s = s.replace(/^#{1,6}\s*(.+)$/gm, '<b>$1</b>');
  // 3. Bold + Italic ***text***
  s = s.replace(/\*\*\*([^\*\n]+)\*\*\*/g, '<b><i>$1</i></b>');
  // 4. Bold **text**
  s = s.replace(/\*\*([^\*\n]+)\*\*/g, '<b>$1</b>');
  // 5. Bullets
  s = s.replace(/^[\*\-]\s+/gm, '• ');
  // 6. Italic *text* or _text_
  s = s.replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<i>$1</i>');
  s = s.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<i>$1</i>');
  // 7. Strip stray asterisks and backticks
  s = s.replace(/[\*`]/g, '');
  // 8. Clean excessive newlines
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

async function sendTelegram(method, payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

async function callGemini(prompt, system = '', jsonMode = false, env = null) {
  const key = getApiKey(env);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {})
    }
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

const QUIZ_PRESETS = [
  { key: 'neet', exam: 'NEET UG', subject: 'Biology (Genetics & Physiology)', focus: 'NCERT standard high-yield Biology concept' },
  { key: 'jee', exam: 'JEE Main', subject: 'Physics (Mechanics & Waves)', focus: 'conceptual calculation-friendly JEE Main physics question' },
  { key: 'chem', exam: 'JEE / NEET', subject: 'Organic Chemistry', focus: 'organic reaction mechanism or functional groups question' },
  { key: 'ssc', exam: 'SSC CGL', subject: 'General Intelligence & Reasoning', focus: 'speed-based logical reasoning series or analogy question' },
  { key: 'upsc', exam: 'UPSC CSE', subject: 'Indian Polity & Constitution', focus: 'UPSC Prelims level question on Fundamental Rights, Articles or Parliament' },
  { key: 'clat', exam: 'CLAT', subject: 'Legal Reasoning & Constitution', focus: 'authentic CLAT legal reasoning or fundamental duties question' },
  { key: 'history', exam: 'UPSC / State PCS', subject: 'Modern Indian History', focus: 'high-yield Indian freedom struggle or acts question' },
];

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const action = body.action || '';
    const env = context.env;

    // 0. Auto-Cron Slot Determination (Dynamic IST Schedule)
    let targetAction = action;
    if (action === 'auto_cron') {
      const now = new Date();
      const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istTime = new Date(utcMs + (5.5 * 3600000));
      const hour = istTime.getHours();

      if (hour >= 6 && hour <= 8) {
        targetAction = 'morning';
      } else if (hour >= 9 && hour <= 11) {
        targetAction = 'trick';
      } else if (hour >= 12 && hour <= 13) {
        targetAction = 'quiz';
      } else if (hour >= 14 && hour <= 16) {
        targetAction = 'slump';
      } else if (hour >= 17 && hour <= 18) {
        targetAction = 'quiz';
      } else if (hour >= 19 && hour <= 20) {
        targetAction = 'strategy';
      } else {
        targetAction = 'poll';
      }
    }

    // 1. Dynamic Morning Exam Radar & Kickoff
    if (targetAction === 'morning') {
      const todayIST = new Date().toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const rawMorning = await callGemini(
        `Write a fresh, high-energy morning study kickoff for Indian exam aspirants (NEET, JEE, UPSC, SSC, Boards) for ${todayIST}.
Requirements:
1. A 1-line unhackneyed punchy motivation in Hinglish.
2. A 2-line practical "Daily Mindset Goal" (e.g. active recall, avoiding mobile distractions, deep work blocks).
3. Under 70 words. Format cleanly with bullet points (•) and bold titles. Never use *** or raw markdown divider lines.`,
        'You are an elite exam coach for Indian aspirants.',
        false,
        env
      );
      const cleanMorning = cleanTelegramHtml(rawMorning);

      const now = new Date();
      const neetDays = Math.max(0, Math.ceil((new Date('2027-05-02') - now) / 86400000));
      const jeeDays = Math.max(0, Math.ceil((new Date('2027-01-22') - now) / 86400000));
      const upscDays = Math.max(0, Math.ceil((new Date('2027-05-23') - now) / 86400000));
      const boardDays = Math.max(0, Math.ceil((new Date('2027-02-15') - now) / 86400000));

      const text = `🌅 <b>DAILY EXAM RADAR &amp; KICKOFF</b> • <i>${todayIST}</i>\n\n` +
        `${cleanMorning}\n\n` +
        `⏳ <b>KEY EXAM COUNTDOWNS:</b>\n` +
        `• ⚡ <b>JEE Main 2027:</b> <code>${jeeDays} days left</code>\n` +
        `• 📚 <b>Class 12 Boards:</b> <code>${boardDays} days left</code>\n` +
        `• 🧬 <b>NEET UG 2027:</b> <code>${neetDays} days left</code>\n` +
        `• 🏛️ <b>UPSC Prelims 2027:</b> <code>${upscDays} days left</code>\n\n` +
        `🔗 <b>Live Exam Clocks &amp; Free Study Tools:</b>\n👉 <a href="https://indiantimers.com/?utm_source=telegram&utm_medium=daily_radar">indiantimers.com</a>`;

      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      return new Response(JSON.stringify({ success: true, action: targetAction, message: 'Morning Radar broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Send Daily Hack (Clean formatted text)
    if (targetAction === 'hack') {
      const rawHack = await callGemini(
        'Generate a high-impact Topper Study Hack with motivation in crisp Hinglish for competitive exam aspirants. Keep under 100 words with bullet points (•) and bold headings. Never use *** or raw markdown divider lines.',
        'You are an elite exam coach for Indian aspirants.',
        false,
        env
      );
      const cleanHack = cleanTelegramHtml(rawHack);
      const text = `💡 <b>TODAY\'S TOPPER STUDY HACK</b>\n\n${cleanHack}\n\n🔗 <b>Track 85+ Live Exam Timers:</b>\n👉 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      return new Response(JSON.stringify({ success: true, action: targetAction, message: 'Topper Hack broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Send Real Interactive Telegram Quiz Poll (Diverse Exams)
    if (targetAction === 'quiz' || targetAction === 'quiz_custom') {
      const category = (body.category || body.prompt || '').toLowerCase().trim();
      let preset = null;

      if (category.includes('neet') || category.includes('bio')) {
        preset = QUIZ_PRESETS[0]; // NEET
      } else if (category.includes('jee') || category.includes('phys')) {
        preset = QUIZ_PRESETS[1]; // JEE
      } else if (category.includes('chem')) {
        preset = QUIZ_PRESETS[2]; // Chem
      } else if (category.includes('ssc') || category.includes('reasoning')) {
        preset = QUIZ_PRESETS[3]; // SSC
      } else if (category.includes('upsc') || category.includes('polity')) {
        preset = QUIZ_PRESETS[4]; // UPSC
      } else if (category.includes('clat') || category.includes('legal') || category.includes('law')) {
        preset = QUIZ_PRESETS[5]; // CLAT
      } else if (category.includes('history')) {
        preset = QUIZ_PRESETS[6]; // History
      } else if (body.prompt && action === 'quiz_custom') {
        preset = {
          exam: 'Competitive Exam',
          subject: body.prompt,
          focus: `authentic conceptual question specifically about "${body.prompt}"`
        };
      } else {
        // Uniform Random pick from all presets
        const idx = Math.floor(Math.random() * QUIZ_PRESETS.length);
        preset = QUIZ_PRESETS[idx];
      }

      const prompt = `Generate a high-yield Multiple Choice Question strictly for ${preset.exam} - Subject: ${preset.subject}.
Focus: ${preset.focus}.

Return JSON strictly in this structure:
{
  "exam": "${preset.exam}",
  "subject": "${preset.subject}",
  "question": "Question text under 220 characters. No asterisks.",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOptionId": 0,
  "explanation": "Clear 1-sentence conceptual explanation under 160 characters."
}
Rules:
- Exactly 4 options. Keep each option short (under 35 chars).
- Do not use ***, **, or markdown symbols in question or options.
- CRITICAL: Never use LaTeX ($ or $$) or raw tags (no \\frac, \\sqrt, \\times). Use clean Unicode (², ³, ×, ÷, √, θ, λ, π, Δ, →, °).
- correctOptionId must be 0, 1, 2, or 3.`;

      const quizJsonRaw = await callGemini(
        prompt,
        'You are an official exam question setter. Output STRICTLY valid JSON only without code blocks, LaTeX or dollar signs.',
        true,
        env
      );

      let q = {};
      try {
        q = JSON.parse(quizJsonRaw);
      } catch {
        q = JSON.parse(quizJsonRaw.replace(/```json|```/g, '').trim());
      }

      const qText = cleanMathAndLatex(String(q.question || '')).replace(/[\*`]/g, '').trim();
      const options = (q.options || ['A', 'B', 'C', 'D']).map((o) => cleanMathAndLatex(String(o)).replace(/[\*`]/g, '').slice(0, 50));
      const explanation = cleanMathAndLatex(String(q.explanation || 'Verified conceptual answer.')).replace(/[\*`]/g, '').slice(0, 190);
      const correctIdx = typeof q.correctOptionId === 'number' && q.correctOptionId >= 0 && q.correctOptionId <= 3 ? q.correctOptionId : 0;

      // Send REAL native Telegram Quiz Poll!
      const tgRes = await sendTelegram('sendPoll', {
        chat_id: CHANNEL_ID,
        question: `📝 [${q.exam || preset.exam} - ${q.subject || preset.subject}]\n${qText}`.slice(0, 290),
        options,
        type: 'quiz',
        correct_option_id: correctIdx,
        explanation,
        is_anonymous: true,
      });

      // Follow up with CBT Mock simulator tool link
      await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text: `💡 <b>Daily CBT Practice:</b> Simulate real exam conditions with our free 3-Hour CBT Mock Test Timer!\n👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      return new Response(JSON.stringify({ 
        success: true, 
        action, 
        message: `Real Quiz Poll on [${q.exam || preset.exam}] broadcasted live!`, 
        tgRes 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Send Formula / Mnemonic Trick (Clean formatted text, random subject rotation)
    if (targetAction === 'trick') {
      const subjects = [
        'NEET Biology (NCERT Classification, Genetics or Physiology)',
        'JEE Physics (Electrodynamics, Mechanics or Modern Physics)',
        'Organic Chemistry (Named Reactions, Functional Groups or Reagents)',
        'UPSC Indian Polity (Fundamental Rights, Articles, Parliament or Schedules)',
        'SSC CGL Reasoning (Number Series, Analogies or Coding-Decoding Tricks)',
        'Modern Indian History (Acts, Movements, Chronology or Personalities)'
      ];
      const randomSub = subjects[Math.floor(Math.random() * subjects.length)];
      const rawTrick = await callGemini(
        `Generate a brand new, highly clever Desi Mnemonic or Shortcut Trick for: ${randomSub}.
Under 80 words with emojis and clean bullet points. Write in conversational Hinglish. Explain the trick simply so a student never forgets.
CRITICAL FORMATTING:
- Never use LaTeX syntax or dollar signs ($ or $$). No \\frac, no \\sqrt, no \\times, no \\Delta, no \\theta.
- For math & science, ALWAYS write clean Unicode symbols: ², ³, ×, ÷, √, θ, λ, π, Δ, →, °, μ.
- Never use *** or raw markdown divider lines.`,
        'You are a master shortcut teacher for competitive Indian exams. You always write math and scientific equations using clean mobile Unicode characters, never LaTeX.',
        false,
        env
      );
      const cleanTrick = cleanTelegramHtml(rawTrick);
      const text = `⚡ <b>HIGH-YIELD SHORTCUT &amp; MNEMONIC TRICK</b>\n📚 <i>Focus: ${randomSub}</i>\n\n` +
        `${cleanTrick}\n\n` +
        `🎯 <b>Practice on Free CBT Mock Simulator:</b>\n👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;

      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      return new Response(JSON.stringify({ success: true, action: targetAction, message: 'Trick broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Afternoon Focus Slump Breaker (3 PM Block)
    if (targetAction === 'slump') {
      const rawSlump = await callGemini(
        `Write an ultra-practical, relatable 3 PM Afternoon Study Slump Breaker tip in energetic Hinglish for Indian aspirants.
Give 2 actionable tactics to immediately beat afternoon sleepiness / brain fog (e.g. 10-minute active recall walk, water splash, switching from theory to question solving, 25/5 Pomodoro block).
Under 80 words. Bullet points (•). Never use *** or raw markdown divider lines.`,
        'You are an energetic study mentor for Indian aspirants.',
        false,
        env
      );
      const cleanSlump = cleanTelegramHtml(rawSlump);
      const text = `💡 <b>3:00 PM AFTERNOON FOCUS BOOSTER</b>\n\n` +
        `${cleanSlump}\n\n` +
        `⏱️ <b>Start a 25-Min Deep Focus Session (Free):</b>\n👉 <a href="https://indiantimers.com/tools/pomodoro-timer/">indiantimers.com/tools/pomodoro-timer/</a>`;

      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      return new Response(JSON.stringify({ success: true, action: targetAction, message: 'Slump booster broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Evening Exam Strategy & PYQ Factoid (8 PM Block)
    if (targetAction === 'strategy') {
      const rawStrat = await callGemini(
        `Write a high-yield PYQ exam strategy or critical factoid in Hinglish for Indian competitive exams.
Topic ideas: 2-Pass Exam Attempt Strategy, Negative Marking Elimination Method, High-weightage chapters rule, or common silly mistake traps.
Under 90 words with punchy bullet points (•). Never use *** or raw markdown divider lines.`,
        'You are an elite exam strategist for Indian aspirants.',
        false,
        env
      );
      const cleanStrat = cleanTelegramHtml(rawStrat);
      const text = `🧠 <b>TOPPER EXAM STRATEGY &amp; PYQ FACTOID</b>\n\n` +
        `${cleanStrat}\n\n` +
        `⏳ <b>Check All 85+ Real-Time Exam Countdowns:</b>\n👉 <a href="https://indiantimers.com/">indiantimers.com</a>`;

      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      return new Response(JSON.stringify({ success: true, action: targetAction, message: 'Strategy broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Send Accountability Study Poll (Real Telegram Poll + Night Review)
    if (targetAction === 'poll') {
      const todayIST = new Date().toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const tgRes = await sendTelegram('sendPoll', {
        chat_id: CHANNEL_ID,
        question: `📊 [Daily Aspirants Check • ${todayIST}]\nAaj kitne ghante focused self-study hui?`,
        options: [
          '🚀 8+ Ghante (Topper Mode!)',
          '⚡ 6 to 8 Ghante (Solid Focus!)',
          '🎯 4 to 6 Ghante (Good Progress!)',
          '🔄 2 to 4 Ghante (Push harder kal!)',
          '😴 Aaj break/kam padhai (Kal double mehnat!)'
        ],
        is_anonymous: true,
      });

      await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text: `🌙 <b>Night Review:</b> Consistency hi rankers banati hai! Kal ka target sone se pehle decide karein.\n\n⏱️ <b>Online Pomodoro &amp; Study Clock:</b>\n👉 <a href="https://indiantimers.com/tools/study-timer/">indiantimers.com/tools/study-timer/</a>`,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      return new Response(JSON.stringify({ success: true, action: targetAction, message: 'Accountability Poll broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Generate Custom Text Post with Gemini (returns sanitized HTML preview)
    if (action === 'generate_custom') {
      const prompt = body.prompt || '';
      if (!prompt) {
        return new Response(JSON.stringify({ success: false, error: 'Prompt is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const rawGenerated = await callGemini(
        `Write an engaging, high-retention Telegram post for Indian aspirants about this topic: "${prompt}". Include punchy emojis, bold headers, and actionable advice. Under 180 words. Never use *** or raw markdown divider lines.`,
        'You are the lead content creator for IndianTimers (@indiantimers).',
        false,
        env
      );

      const generated = cleanTelegramHtml(rawGenerated);

      return new Response(JSON.stringify({ success: true, generated }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Broadcast Custom Text
    if (action === 'send_custom') {
      const text = body.text || '';
      if (!text) {
        return new Response(JSON.stringify({ success: false, error: 'Text is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const cleanText = cleanTelegramHtml(text);
      const broadcastMessage = `${cleanText}\n\n🔗 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text: broadcastMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      return new Response(JSON.stringify({ success: true, tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Broadcast Official Circular Alert (NTA / CBSE / UPSC)
    if (action === 'broadcast_official_notice') {
      const { authority, examName, title, examDate, documentUrl, examSlug } = body;
      const cleanTitle = cleanTelegramHtml(title || 'Official Notification Released');
      const cleanAuth = cleanTelegramHtml(authority || 'Official Examination Body');
      const cleanExam = cleanTelegramHtml(examName || 'Competitive Examination');

      let alertText = `🚨 <b>OFFICIAL CIRCULAR / NOTICE RELEASED</b> 🚨\n\n` +
        `🏛️ <b>Authority:</b> ${cleanAuth}\n` +
        `🎯 <b>Target Exam:</b> ${cleanExam}\n` +
        `📢 <b>Notice Title:</b> ${cleanTitle}\n`;

      if (examDate) {
        alertText += `📅 <b>Confirmed Date:</b> <code>${examDate}</code>\n`;
      }

      alertText += `\n───────────────\n`;

      if (documentUrl) {
        alertText += `📄 <b>Official Document / Circular:</b>\n👉 <a href="${documentUrl}">Click to View / Download Official PDF</a>\n\n`;
      }

      const timerUrl = examSlug ? `https://indiantimers.com/exams/${examSlug}/` : 'https://indiantimers.com/';
      alertText += `⏱️ <b>Live Real-Time Exam Countdown &amp; Tools:</b>\n👉 <a href="${timerUrl}">${timerUrl}</a>\n\n` +
        `<i>Verified by IndianTimers Monitoring Desk</i>`;

      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text: alertText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Official Notice for ${cleanExam} broadcasted live to @indiantimers!`, 
        tgRes 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
