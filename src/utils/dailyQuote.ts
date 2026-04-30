const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Momentum beats perfection. Start before you're ready.", author: "FocusFlow" },
  { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Success is the sum of small efforts, repeated daily.", author: "Robert Collier" },
  { text: "Focus on progress, not perfection.", author: "FocusFlow" },
  { text: "One hour of focused work beats three hours of scattered effort.", author: "FocusFlow" },
  { text: "A little progress each day adds up to big results.", author: "Satya Nani" },
  { text: "Study not to know more, but to understand better.", author: "FocusFlow" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert T. Kiyosaki" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Learning is not a race. It's a journey worth taking at your own pace.", author: "FocusFlow" },
  { text: "Consistency compounds. Show up today.", author: "FocusFlow" },
];

export interface DailyQuote {
  text: string;
  author: string;
}

/** Returns the same quote for a full calendar day, cycling through the list. */
export function getDailyQuote(): DailyQuote {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
