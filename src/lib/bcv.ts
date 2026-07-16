const BCV_URL = "https://rates.dolarvzla.com/bcv/current.json";
const CDN_BASE_URL = "https://rates.dolarvzla.com/bcv";

let cachedRate: number | null = null;
let cachedInfo: { usd: number; eur: number; date: string | null } | null = null;
let cachedAt: number | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export type BcvRate = {
  usd: number;
  eur: number;
  date: string | null;
};

function getBusinessDate(date?: Date): string {
  const now = date ?? new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  if (day === 0) {
    // Sunday -> Friday (2 days ago)
    now.setDate(now.getDate() - 2);
  } else if (day === 6) {
    // Saturday -> Friday (1 day ago)
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split("T")[0];
}

async function fetchBcv(): Promise<BcvRate | null> {
  // For weekends, fetch the actual rate for the business date (Friday)
  const businessDateStr = getBusinessDate();
  const [year, month, day] = businessDateStr.split("-");
  const historicalUrl = `${CDN_BASE_URL}/${year}/${Number(month)}/${Number(day)}.json`;

  try {
    const res = await fetch(historicalUrl);
    if (res.status === 200) {
      const data = await res.json();
      const usd = data.usd;
      const eur = data.eur ?? 0;
      if (typeof usd === "number" && usd > 0) {
        return { usd, eur, date: businessDateStr };
      }
    }
    // Fallback to current.json if historical not available
    const res2 = await fetch(BCV_URL);
    const data2 = await res2.json();
    const usd = data2.current?.usd;
    const eur = data2.current?.eur ?? 0;
    if (typeof usd === "number" && usd > 0) {
      return { usd, eur, date: businessDateStr };
    }
  } catch {
    /* ignore network errors */
  }
  return null;
}

export async function getBcvRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate !== null && cachedAt !== null && now - cachedAt < CACHE_TTL) {
    return cachedRate;
  }
  const info = (await fetchBcv()) ?? (cachedInfo ? { ...cachedInfo } : null);
  if (info) {
    cachedRate = info.usd;
    cachedInfo = info;
    cachedAt = now;
    return info.usd;
  }
  return cachedRate ?? 0;
}

export async function getBcvRateInfo(): Promise<BcvRate> {
  const now = Date.now();
  if (cachedInfo !== null && cachedAt !== null && now - cachedAt < CACHE_TTL) {
    return cachedInfo;
  }
  const info = (await fetchBcv()) ?? (cachedInfo ? { ...cachedInfo } : null);
  if (info) {
    cachedRate = info.usd;
    cachedInfo = info;
    cachedAt = now;
    return info;
  }
  return cachedInfo ?? { usd: 0, eur: 0, date: null };
}

/**
 * Fetch historical BCV rate for a specific date from CDN.
 * Falls back to previous business day if date not found (weekend/holiday).
 * Date format: "YYYY-MM-DD"
 */
export async function getBcvRateForDate(dateStr: string): Promise<BcvRate | null> {
  // Try exact date first
  let rate = await _tryFetchHistoricalRate(dateStr);
  if (rate) return rate;

  // Fallback: try previous days (max 10 days back)
  const targetDate = new Date(dateStr);
  for (let i = 1; i <= 10; i++) {
    const fallbackDate = new Date(targetDate);
    fallbackDate.setDate(fallbackDate.getDate() - i);
    const fallbackStr = fallbackDate.toISOString().split("T")[0];
    rate = await _tryFetchHistoricalRate(fallbackStr);
    if (rate) return rate;
  }
  return null;
}

async function _tryFetchHistoricalRate(dateStr: string): Promise<BcvRate | null> {
  const [year, month, day] = dateStr.split("-");
  // CDN format: /bcv/{year}/{month}/{day}.json (NOT zero-padded)
  const url = `${CDN_BASE_URL}/${year}/${Number(month)}/${Number(day)}.json`;
  try {
    const res = await fetch(url);
    if (res.status === 404) return null;
    const data = await res.json();
    const usd = data.usd;
    const eur = data.eur ?? 0;
    if (typeof usd === "number" && usd > 0) {
      return { usd, eur, date: dateStr };
    }
  } catch {
    // ignore network errors
  }
  return null;
}

export function formatBcv(usdAmount: number, rate: number): string {
  if (!rate || rate <= 0) return "";
  const bcv = usdAmount * rate;
  return `${bcv.toLocaleString("es-VE", { maximumFractionDigits: 2 })}bs`;
}
