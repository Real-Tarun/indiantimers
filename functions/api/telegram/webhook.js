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
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

export async function onRequestPost(context) {
  try {
    const update = await context.request.json().catch(() => null);
    if (!update) {
      return new Response('No payload', { status: 200 });
    }

    // 1. Identify Sender
    const message = update.message;
    const callbackQuery = update.callback_query;
    const sender = message?.from || callbackQuery?.from;

    if (!sender) {
      return new Response('OK', { status: 200 });
    }

    // 2. Strict Admin-Only Authorization
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

    // 3. Handle Inline Button Clicks (Callback Queries)
    if (callbackQuery) {
      const data = callbackQuery.data;
      const callbackId = callbackQuery.id;

      await sendTelegram('answerCallbackQuery', {
        callback_query_id: callbackId,
        text: '⚡ Processing action with Gemini AI...',
      });

      if (data === 'btn_daily_hack') {
        const hack = await callGemini(
          'Generate a high-impact Topper Study Hack with motivation in crisp Hinglish for competitive exam aspirants. Keep under 100 words with bold headings and emojis.',
          'You are an elite exam coach for Indian aspirants.'
        );
        const text = `💡 <b>TODAY\'S TOPPER STUDY HACK</b>\n\n${hack}\n\n🔗 <b>More Hacks &amp; Free Timers:</b>\n👉 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
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
      } else if (data === 'btn_ai_quiz') {
        const quizJsonRaw = await callGemini(
          'Generate 1 authentic PYQ MCQ for Indian aspirants (NEET, JEE, UPSC, or SSC). Return JSON with fields: exam, subject, question, options (array of 4 strings), correctOptionId (0-3), explanation (1-2 lines).',
          'Return strictly valid JSON only.',
          true
        );
        let q = {};
        try {
          q = JSON.parse(quizJsonRaw);
        } catch {
          q = JSON.parse(quizJsonRaw.replace(/```json|```/g, '').trim());
        }

        await sendTelegram('sendPoll', {
          chat_id: CHANNEL_ID,
          question: `📝 [${q.exam} - ${q.subject}]\n${q.question}`.slice(0, 300),
          options: q.options.map((opt) => String(opt).slice(0, 100)),
          type: 'quiz',
          correct_option_id: q.correctOptionId || 0,
          explanation: (q.explanation || 'Verified concept').slice(0, 200),
          is_anonymous: true,
        });

        await sendTelegram('sendMessage', {
          chat_id: ADMIN_ID,
          text: `✅ <b>Success!</b> AI Quiz on <i>${q.subject}</i> posted live to ${CHANNEL_ID}!`,
          parse_mode: 'HTML',
        });
      } else if (data === 'btn_subject_trick') {
        const trick = await callGemini(
          'Generate an ultra-crisp Mnemonic or Desi Shortcut Trick for a high-weightage topic in NEET, JEE, or UPSC (Physics/Chemistry/Bio/Polity). Under 100 words with emojis.',
          'You are a premier trick & shortcut teacher.'
        );
        const text = `⚡ <b>DESI SHORTCUT &amp; MNEMONIC TRICK</b>\n\n${trick}\n\n🎯 <b>Practice on CBT Mock Simulator:</b>\n👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;
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

    // 4. Handle Direct Messages from Admin
    if (message) {
      const text = message.text || '';

      if (text.startsWith('/start') || text.startsWith('/admin') || text.startsWith('/menu')) {
        await sendAdminMenu();
        return new Response('OK', { status: 200 });
      }

      // Any other text is treated as a Custom Prompt to generate and broadcast!
      await sendTelegram('sendMessage', {
        chat_id: ADMIN_ID,
        text: `🤖 <b>Prompt Received:</b> <i>"${text}"</i>\n\n⚡ Generating post with Gemini 3.5 Flash and broadcasting to ${CHANNEL_ID}...`,
        parse_mode: 'HTML',
      });

      const generated = await callGemini(
        `Write an engaging, high-retention Telegram post for Indian aspirants about this topic: "${text}". Include punchy emojis, bold headers, and actionable advice. Under 180 words.`,
        'You are the lead content creator for IndianTimers (@indiantimers).'
      );

      const broadcastMessage = `${generated}\n\n🔗 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
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
    `Tap any 1-Click button below to instantly generate &amp; broadcast fresh AI content, or simply type any topic in this chat to generate a custom post!\n\n` +
    `<i>⚡ Powered by Google Gemini 3.5 Flash</i>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '💡 1-Click Daily Study Hack', callback_data: 'btn_daily_hack' },
        { text: '🎯 1-Click AI Quiz Poll', callback_data: 'btn_ai_quiz' }
      ],
      [
        { text: '⚡ 1-Click Formula / Mnemonic Trick', callback_data: 'btn_subject_trick' },
        { text: '📊 1-Click Accountability Poll', callback_data: 'btn_study_poll' }
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
