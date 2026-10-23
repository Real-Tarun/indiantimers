# 🤖 IndianTimers Automated Telegram Broadcast Bot

100% Free, Zero-Maintenance, Cloud-Hosted Telegram Bot for Daily Exam Countdowns, Motivation, and Interactive Quizzes.

---

## 🌟 What This Bot Does Automatically (Every Day)

1. **🌅 Morning Broadcast (7:30 AM IST):**
   * Computes dynamic days left for **all major Indian exams** (NEET, JEE, UPSC, SSC, NDA, CAT, CLAT, CBSE Boards).
   * Highlights the closest upcoming exams.
   * Generates a daily motivational thought + high-resolution study wallpaper.
   * Direct link to IndianTimers live clocks and CBT tools.
2. **📝 Afternoon Quiz Poll (2:00 PM IST):**
   * Posts native Telegram interactive 4-option quiz poll from previous year questions (PYQs).
   * Shows instant explanation and answer reveal on click.
3. **🚨 Breaking Exam Alerts:**
   * Ready for NTA / Exam circular broadcasts.

---

## 🛠️ Step-by-Step Setup Guide (Takes Only 3 Minutes!)

### Step 1: Create Your Free Telegram Bot (1 Minute)
1. Open your Telegram app and search for **`@BotFather`** (verified blue tick).
2. Click **Start** and send the command:
   ```text
   /newbot
   ```
3. Give your bot a name (e.g., `IndianTimers Official Bot`) and a username ending in `bot` (e.g., `indiantimers_alert_bot`).
4. `@BotFather` will give you an **HTTP API Token** (e.g., `789123456:AAFlk...`). **Save this token!**

---

### Step 2: Create Your Telegram Channel & Add the Bot (1 Minute)
1. In Telegram, create a new public **Channel** (e.g., `IndianTimers - Exam Countdowns & Alerts`).
2. Go to **Channel Settings > Administrators > Add Administrator**.
3. Search for your bot's username and add it as an **Admin** with permission to **"Post Messages"**.
4. Note your channel's public username (e.g. `@indiantimers_alerts`).

---

### Step 3: Add Secrets to GitHub (1 Minute)
1. Push this `telegram-bot` folder as a repository on your GitHub (or keep it in your GitHub account).
2. On GitHub, go to your repository:
   * Click **Settings** (gear icon) ➔ **Secrets and variables** ➔ **Actions**.
   * Click **New repository secret**:
     * **Name:** `TELEGRAM_BOT_TOKEN`
     * **Secret:** *(Paste your API Token from BotFather)*
   * Click **New repository secret** again:
     * **Name:** `TELEGRAM_CHAT_ID`
     * **Secret:** *(Your channel username, e.g. `@indiantimers_alerts`)*

---

### Step 4: Test with 1-Click!
1. In your GitHub repository, click on the **Actions** tab at the top.
2. Under "Workflows", click **Daily Telegram Exam Broadcast & Quiz**.
3. Click the **Run workflow** button on the right!
4. Check your Telegram channel — your first automated broadcast will appear instantly! 🚀

---

## ⏰ Automated Cron Schedule
* **Morning Motivation & Countdown:** Every day at **07:30 AM IST** (`02:00 UTC`).
* **Afternoon Quiz Poll:** Every day at **02:00 PM IST** (`08:30 UTC`).
* **Cost:** **₹0 / Lifetime Free** (Hosted entirely on GitHub's free runners).
