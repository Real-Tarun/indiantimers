/**
 * Telegram Webhook Handler for Cloudflare Pages Functions
 * Route: /api/telegram/webhook
 * 
 * Exclusively responds to Master Admin (Telegram ID: 8515665160).
 * Provides interactive Telegram command deck to generate & post AI content on demand.
 */

const ADMIN_ID = 8515665160;
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
 * Sanitizes markdown text into Telegram HTML without raw asterisks or broken symbols
 */
function cleanTelegramHtml(text) {
  if (!text) return '';
  let s = String(text);
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
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

const QUIZ_PRESETS = [
  { key: 'neet', exam: 'NEET UG', subject: 'Biology (Genetics & Physiology)', focus: 'NCERT standard high-yield Biology concept' },
  { key: 'jee', exam: 'JEE Main', subject: 'Physics (Mechanics & Waves)', focus: 'conceptual calculation-friendly JEE Main physics question' },
  { key: 'chem', exam: 'JEE / NEET', subject: 'Organic Chemistry', focus: 'organic reaction mechanism or functional groups question' },
  { key: 'ssc', exam: 'SSC CGL', subject: 'General Intelligence & Reasoning', focus: 'speed-based logical reasoning series or analogy question' },
  { key: 'upsc', exam: 'UPSC CSE', subject: 'Indian Polity & Constitution', focus: 'UPSC Prelims level question on Fundamental Rights, Articles or Parliament' },
  { key: 'clat', exam: 'CLAT', subject: 'Legal Reasoning & Constitution', focus: 'authentic CLAT legal reasoning or fundamental duties question' },
];

async function broadcastRealQuiz(categoryOrPrompt, env) {
  const cat = (categoryOrPrompt || '').toLowerCase();
  let preset = null;

  if (cat.includes('neet') || cat.includes('bio')) preset = QUIZ_PRESETS[0];
  else if (cat.includes('jee') || cat.includes('phys')) preset = QUIZ_PRESETS[1];
  else if (cat.includes('chem')) preset = QUIZ_PRESETS[2];
  else if (cat.includes('ssc') || cat.includes('reasoning')) preset = QUIZ_PRESETS[3];
  else if (cat.includes('upsc') || cat.includes('polity')) preset = QUIZ_PRESETS[4];
  else if (cat.includes('clat') || cat.includes('legal') || cat.includes('law')) preset = QUIZ_PRESETS[5];
  else if (categoryOrPrompt && categoryOrPrompt !== 'random') {
    preset = { exam: 'Competitive Exam', subject: categoryOrPrompt, focus: `conceptual question specifically on "${categoryOrPrompt}"` };
  } else {
    preset = QUIZ_PRESETS[Math.floor(Math.random() * QUIZ_PRESETS.length)];
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
- Do not use ***, **, or markdown symbols.
- correctOptionId must be 0, 1, 2, or 3.`;

  const quizJsonRaw = await callGemini(prompt, 'Output STRICTLY valid JSON only.', true, env);
  let q = {};
  try {
    q = JSON.parse(quizJsonRaw);
  } catch {
    q = JSON.parse(quizJsonRaw.replace(/```json|```/g, '').trim());
  }

  const qText = String(q.question || '').replace(/[\*`]/g, '').trim();
  const options = (q.options || ['A', 'B', 'C', 'D']).map((o) => String(o).replace(/[\*`]/g, '').slice(0, 50));
  const explanation = String(q.explanation || 'Verified conceptual answer.').replace(/[\*`]/g, '').slice(0, 190);
  const correctIdx = typeof q.correctOptionId === 'number' && q.correctOptionId >= 0 && q.correctOptionId <= 3 ? q.correctOptionId : 0;

  // Send Real Native Quiz Poll to Channel
  await sendTelegram('sendPoll', {
    chat_id: CHANNEL_ID,
    question: `📝 [${q.exam || preset.exam} - ${q.subject || preset.subject}]\n${qText}`.slice(0, 290),
    options,
    type: 'quiz',
    correct_option_id: correctIdx,
    explanation,
    is_anonymous: true,
  });

  // Follow-up CBT tool link
  await sendTelegram('sendMessage', {
    chat_id: CHANNEL_ID,
    text: `💡 <b>Daily CBT Practice:</b> Simulate real exam conditions with our free CBT Mock Test Timer!\n👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  return q.exam || preset.exam;
}

export async function onRequestPost(context) {
  try {
    const update = await context.request.json().catch(() => null);
    if (!update) return new Response('No payload', { status: 200 });

    const message = update.message;
    const callbackQuery = update.callback_query;
    const sender = message?.from || callbackQuery?.from;
    const env = context.env;

    if (!sender) return new Response('OK', { status: 200 });

    // Strict Admin Authorization
    if (Number(sender.id) !== ADMIN_ID) {
      if (message?.chat?.id) {
        await sendTelegram('sendMessage', {
          chat_id: message.chat.id,
          text: '⛔ <b>Access Denied:</b> This bot is strictly reserved for the IndianTimers Master Admin.',
          parse_mode: 'HTML',
        });
      }
      return new Response('Unauthorized', { status: 200 });
    }

    // Handle Inline Button Taps
    if (callbackQuery) {
      const data = callbackQuery.data;
      const callbackId = callbackQuery.id;

      await sendTelegram('answerCallbackQuery', {
        callback_query_id: callbackId,
        text: '⚡ Processing with Gemini AI...',
      });

      if (data === 'btn_daily_hack') {
        const rawHack = await callGemini(
          'Generate a high-impact Topper Study Hack with motivation in crisp Hinglish for competitive exam aspirants. Keep under 100 words with bullet points (•) and bold headings. Never use *** or raw markdown divider lines.',
          'You are an elite exam coach for Indian aspirants.',
          false,
          env
        );
        const cleanHack = cleanTelegramHtml(rawHack);
        const text = `💡 <b>TODAY\'S TOPPER STUDY HACK</b>\n\n${cleanHack}\n\n🔗 <b>More Hacks &amp; Free Timers:</b>\n👉 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
        await sendTelegram('sendMessage', {
          chat_id: CHANNEL_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
        await sendTelegram('sendMessage', {
          chat_id: ADMIN_ID,
          text: `✅ <b>Success!</b> Daily Hack posted live to ${CHANNEL_ID}!`,
          parse_mode: 'HTML',
        });
      } else if (data.startsWith('btn_quiz_')) {
        const cat = data.replace('btn_quiz_', '');
        const examName = await broadcastRealQuiz(cat, env);
        await sendTelegram('sendMessage', {
          chat_id: ADMIN_ID,
          text: `✅ <b>Success!</b> Real Quiz Poll for <b>[${examName}]</b> posted live to ${CHANNEL_ID}!`,
          parse_mode: 'HTML',
        });
      } else if (data === 'btn_subject_trick') {
        const rawTrick = await callGemini(
          'Generate an ultra-crisp Mnemonic or Desi Shortcut Trick for a high-weightage topic in NEET, JEE, or UPSC (Physics/Chemistry/Bio/Polity). Under 100 words with emojis. Never use ***.',
          'You are a premier trick & shortcut teacher.',
          false,
          env
        );
        const cleanTrick = cleanTelegramHtml(rawTrick);
        const text = `⚡ <b>DESI SHORTCUT &amp; MNEMONIC TRICK</b>\n\n${cleanTrick}\n\n🎯 <b>Practice on CBT Mock Simulator:</b>\n👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;
        await sendTelegram('sendMessage', {
          chat_id: CHANNEL_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
        await sendTelegram('sendMessage', {
          chat_id: ADMIN_ID,
          text: `✅ <b>Success!</b> Subject Trick posted live to ${CHANNEL_ID}!`,
          parse_mode: 'HTML',
        });
      } else if (data === 'btn_study_poll') {
        const todayIST = new Date().toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        await sendTelegram('sendPoll', {
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
          chat_id: ADMIN_ID,
          text: `✅ <b>Success!</b> Evening Accountability Poll posted live to ${CHANNEL_ID}!`,
          parse_mode: 'HTML',
        });
      } else if (data === 'btn_bot_menu') {
        await sendAdminMenu();
      }

      return new Response('OK', { status: 200 });
    }

    // Handle Direct Messages from Admin
    if (message) {
      const text = message.text || '';

      if (text.startsWith('/start') || text.startsWith('/admin') || text.startsWith('/menu')) {
        await sendAdminMenu();
        return new Response('OK', { status: 200 });
      }

      // Check if Admin wants a QUIZ (e.g. "Physics quiz", "make a quiz on genetics", "mcq on polity")
      const lowerText = text.toLowerCase();
      const isQuizRequest = lowerText.includes('quiz') || lowerText.includes('poll') || lowerText.includes('mcq') || lowerText.includes('question');

      if (isQuizRequest) {
        await sendTelegram('sendMessage', {
          chat_id: ADMIN_ID,
          text: `🎯 <b>Quiz Request Detected:</b> <i>"${text}"</i>\n\n⚡ Generating a Real Interactive Telegram Poll and broadcasting to ${CHANNEL_ID}...`,
          parse_mode: 'HTML',
        });

        const examName = await broadcastRealQuiz(text, env);

        await sendTelegram('sendMessage', {
          chat_id: ADMIN_ID,
          text: `✅ <b>Real Quiz Poll Broadcasted!</b> Live poll on <b>[${examName}]</b> is now active on ${CHANNEL_ID}!`,
          parse_mode: 'HTML',
        });

        return new Response('OK', { status: 200 });
      }

      // Regular Custom Post (Motivation, Hack, Advice)
      await sendTelegram('sendMessage', {
        chat_id: ADMIN_ID,
        text: `🤖 <b>Prompt Received:</b> <i>"${text}"</i>\n\n⚡ Generating post with Gemini 3.5 Flash and broadcasting to ${CHANNEL_ID}...`,
        parse_mode: 'HTML',
      });

      const rawGenerated = await callGemini(
        `Write an engaging, high-retention Telegram post for Indian aspirants about this topic: "${text}". Include punchy emojis, bold headers, and actionable advice. Under 180 words. Never use *** or raw markdown divider lines.`,
        'You are the lead content creator for IndianTimers (@indiantimers).',
        false,
        env
      );

      const cleanGenerated = cleanTelegramHtml(rawGenerated);
      const broadcastMessage = `${cleanGenerated}\n\n🔗 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
      await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text: broadcastMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      await sendTelegram('sendMessage', {
        chat_id: ADMIN_ID,
        text: `✅ <b>Broadcast Successful!</b> Your custom post is live on ${CHANNEL_ID}!`,
        parse_mode: 'HTML',
      });

      return new Response('OK', { status: 200 });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 200 });
  }
}

async function sendAdminMenu() {
  const text = `👑 <b>IndianTimers Master Command Deck</b>\n\n` +
    `Hello Admin! You have exclusive control over <b>${CHANNEL_ID}</b>.\n` +
    `Tap any 1-Click button below to instantly post real polls or fresh hacks, or type any topic in this chat!\n\n` +
    `💡 <i>Tip: Type "quiz on [topic]" anytime to send a real interactive poll!</i>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🧬 Post NEET Quiz Poll', callback_data: 'btn_quiz_neet' },
        { text: '⚡ Post JEE Quiz Poll', callback_data: 'btn_quiz_jee' }
      ],
      [
        { text: '🏛️ Post UPSC Quiz Poll', callback_data: 'btn_quiz_upsc' },
        { text: '📊 Post SSC Quiz Poll', callback_data: 'btn_quiz_ssc' }
      ],
      [
        { text: '🎲 Random Stream Quiz Poll', callback_data: 'btn_quiz_random' },
        { text: '💡 Post Daily Topper Hack', callback_data: 'btn_daily_hack' }
      ],
      [
        { text: '⚡ Post Formula Trick', callback_data: 'btn_subject_trick' },
        { text: '📈 Post Study Hours Poll', callback_data: 'btn_study_poll' }
      ],
      [
        { text: '🌐 Open Mission Control Web Dashboard', url: 'https://indiantimers.com/admin/?key=it_admin_secret_2027_k9x' }
      ]
    ]
  };

  await sendTelegram('sendMessage', {
    chat_id: ADMIN_ID,
    text,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}
