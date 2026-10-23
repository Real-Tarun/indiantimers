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

    // 1. Send Daily Hack (Clean formatted text)
    if (action === 'hack') {
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
      return new Response(JSON.stringify({ success: true, action, message: 'Topper Hack broadcasted live!', tgRes }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Send Real Interactive Telegram Quiz Poll (Diverse Exams)
    if (action === 'quiz' || action === 'quiz_custom') {
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
- correctOptionId must be 0, 1, 2, or 3.`;

      const quizJsonRaw = await callGemini(
        prompt,
        'You are an official exam question setter. Output STRICTLY valid JSON only without code blocks or backticks.',
        true,
        env
      );

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

    // 3. Send Formula / Mnemonic Trick (Clean formatted text)
    if (action === 'trick') {
      const rawTrick = await callGemini(
        'Generate an ultra-crisp Mnemonic or Desi Shortcut Trick for a high-weightage topic in NEET, JEE, or UPSC (Physics/Chemistry/Bio/Polity). Under 100 words with emojis. Never use *** or raw markdown divider lines.',
        'You are a premier trick & shortcut teacher for Indian exams.',
        false,
        env
      );
      const cleanTrick = cleanTelegramHtml(rawTrick);
      const text = `⚡ <b>DESI SHORTCUT &amp; MNEMONIC TRICK</b>\n\n${cleanTrick}\n\n🎯 <b>Practice on CBT Mock Simulator:</b>\n👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;
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

    // 4. Send Accountability Study Poll (Real Telegram Poll)
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
      return new Response(JSON.stringify({ success: true, action, message: 'Accountability Poll broadcasted live!', tgRes }), {
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
