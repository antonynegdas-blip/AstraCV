/**
 * Rate Limiter Híbrido (Serverless Vercel Ready):
 * - Usa Upstash Redis REST API automaticamente quando UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estão definidos.
 * - Fallback em memória com limite máximo de chaves (5.000) para evitar vazamento de memória (DoS por IP spoofing).
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const MAX_MEMORY_KEYS = 5000;
const ipMap = new Map<string, RateLimitRecord>();

function pruneExpiredMemoryKeys(now: number): void {
  if (ipMap.size < MAX_MEMORY_KEYS) return;
  for (const [ip, record] of ipMap.entries()) {
    if (now > record.resetAt) {
      ipMap.delete(ip);
    }
  }
  // Se ainda exceder o teto após limpar expirados, remove a entrada mais antiga
  if (ipMap.size >= MAX_MEMORY_KEYS) {
    const oldestKey = ipMap.keys().next().value;
    if (oldestKey) ipMap.delete(oldestKey);
  }
}

export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  pruneExpiredMemoryKeys(now);

  const record = ipMap.get(ip);

  if (!record || now > record.resetAt) {
    ipMap.set(ip, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Rate limiter assíncrono com suporte nativo ao Upstash Redis REST na Vercel
 */
export async function checkRateLimitAsync(
  ip: string,
  limit: number = 10,
  windowSeconds: number = 60,
  namespace: string = "astracv_rl"
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return checkRateLimit(`${namespace}:${ip}`, limit, windowSeconds);
  }

  try {
    const key = `${namespace}:${ip}`;
    const pipelineBody = [
      ["INCR", key],
      ["TTL", key],
    ];

    const res = await fetch(`${redisUrl.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipelineBody),
      cache: "no-store",
    });

    if (!res.ok) {
      return checkRateLimit(key, limit, windowSeconds);
    }

    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 1);
    let ttl = Number(data?.[1]?.result ?? -1);

    if (count === 1 || ttl < 0) {
      await fetch(`${redisUrl.replace(/\/$/, "")}/expire/${encodeURIComponent(key)}/${windowSeconds}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
        cache: "no-store",
      });
      ttl = windowSeconds;
    }

    const allowed = count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      resetInSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch {
    // Em caso de falha transitória de rede com o Redis, faz fallback seguro em memória
    return checkRateLimit(`${namespace}:${ip}`, limit, windowSeconds);
  }
}
