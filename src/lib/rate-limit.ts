// Simple in-memory rate limiter for image saves
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(
  userId: string,
  maxRequests = 10,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now - userLimit.lastReset > windowMs) {
    // Reset the rate limit window
    rateLimitMap.set(userId, { count: 1, lastReset: now });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Increment count
  userLimit.count++;
  return true;
}

export function getRemainingRequests(userId: string, maxRequests = 10): number {
  const userLimit = rateLimitMap.get(userId);
  if (!userLimit) return maxRequests;
  return Math.max(0, maxRequests - userLimit.count);
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute

  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now - limit.lastReset > windowMs) {
      rateLimitMap.delete(userId);
    }
  }
}, 60000); // Clean up every minute
