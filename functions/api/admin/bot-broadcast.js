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

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const action = body.action || '';

    if (action === 'hack') {
      const hack = await callGemini(
        'Generate a high-impact Topper Study Hack with motivation in crisp Hinglish for competitive exam aspirants. Keep under 100 words with bold headings and emojis.',
        'You are an elite exam coach for Indian aspirants.'
      );
      const text = `💡 <b>TODAY\'S TOPPER STUDY HACK</b>\n\n${hack}\n\n🔗 <b>More Hacks &amp; Free Timers:</b>\n👉 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      return new Response(JSON.stringify({ success: true, action, message: 'Hack broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'quiz') {
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

      const tgRes = await sendTelegram('sendPoll', {
        chat_id: CHANNEL_ID,
        question: `📝 [${q.exam} - ${q.subject}]\n${q.question}`.slice(0, 300),
        options: q.options.map((opt) => String(opt).slice(0, 100)),
        type: 'quiz',
        correct_option_id: q.correctOptionId || 0,
        explanation: (q.explanation || 'Verified concept').slice(0, 200),
        is_anonymous: true,
      });

      return new Response(JSON.stringify({ success: true, action, message: `Quiz on ${q.subject} broadcasted live!`, tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'trick') {
      const trick = await callGemini(
        'Generate an ultra-crisp Mnemonic or Desi Shortcut Trick for a high-weightage topic in NEET, JEE, or UPSC (Physics/Chemistry/Bio/Polity). Under 100 words with emojis.',
        'You are a premier trick & shortcut teacher.'
      );
      const text = `⚡ <b>DESI SHORTCUT &amp; MNEMONIC TRICK</b>\n\n${trick}\n\n🎯 <b>Practice on CBT Mock Simulator:</b>\n👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;
      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
      return new Response(JSON.stringify({ success: true, action, message: 'Trick broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'poll') {
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
      return new Response(JSON.stringify({ success: true, action, message: 'Poll broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate_custom') {
      const prompt = body.prompt || '';
      if (!prompt) {
        return new Response(JSON.stringify({ success: false, error: 'Prompt is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const generated = await callGemini(
        `Write an engaging, high-retention Telegram post for Indian aspirants about this topic: "${prompt}". Include punchy emojis, bold headers, and actionable advice. Under 180 words.`,
        'You are the lead content creator for IndianTimers (@indiantimers).'
      );

      return new Response(JSON.stringify({ success: true, generated }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'send_custom') {
      const text = body.text || '';
      if (!text) {
        return new Response(JSON.stringify({ success: false, error: 'Text is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const broadcastMessage = `${text}\n\n🔗 <a href="https://indiantimers.com/?utm_source=telegram">indiantimers.com</a>`;
      const tgRes = await sendTelegram('sendMessage', {
        chat_id: CHANNEL_ID,
        text: broadcastMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      return new Response(JSON.stringify({ success: true, message: 'Custom post sent live to @indiantimers!', tgRes }), {
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
