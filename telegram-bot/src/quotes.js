// Curated high-impact motivational quotes for Indian competitive exam aspirants
export const MOTIVATIONAL_QUOTES = [
  {
    quote: "Koshish karne walon ki kabhi haar nahi hoti. Har ek mock test aapki kamzori ko taakat banata hai.",
    author: "Harivansh Rai Bachchan",
    theme: "Resilience"
  },
  {
    quote: "You have to dream before your dreams can come true. Hard work beats talent when talent fails to work hard.",
    author: "Dr. A.P.J. Abdul Kalam",
    theme: "Determination"
  },
  {
    quote: "Arise, awake, and stop not until the goal is reached.",
    author: "Swami Vivekananda",
    theme: "Focus"
  },
  {
    quote: "The pain of discipline is far less than the pain of regret on result day. Give it your 100% today.",
    author: "Study Discipline",
    theme: "Consistency"
  },
  {
    quote: "Ek saal ki tapasya, agle 40 saal ka aaram aur respect tay karti hai. Put your phone away and start solving.",
    author: "Aspirant Mindset",
    theme: "Sacrifice"
  },
  {
    quote: "Don't measure your progress with someone else's ruler. Today's 1% improvement is tomorrow's top rank.",
    author: "Daily Progress",
    theme: "Growth"
  },
  {
    quote: "Jab padhte-padhte neend aaye, to aankhon par paani daalo aur socho: 'Mujhe kyu shuru kiya tha?'",
    author: "Ranker's Motto",
    theme: "Drive"
  },
  {
    quote: "Small daily disciplines repeated consistently lead to great achievements gained slowly over time.",
    author: "John C. Maxwell",
    theme: "Habits"
  }
];

// Curated high quality minimal/aesthetic study wallpaper images
export const POSTER_IMAGES = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80', // Books & Library
  'https://images.unsplash.com/photo-1507842229451-7f01be7ffc1d?auto=format&fit=crop&w=1200&q=80', // Desk & Lamp
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80', // Study & Notes
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80', // Focus Study
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', // Laptop & Productivity
];

export function getRandomQuote() {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}

export function getRandomPoster() {
  const index = Math.floor(Math.random() * POSTER_IMAGES.length);
  return POSTER_IMAGES[index];
}
