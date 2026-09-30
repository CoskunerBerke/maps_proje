import { Request, Response, NextFunction } from 'express';

/**
 * This server is a local, single-user tool without any login system.
 * It stores API tokens (Gemini, Vercel) and CRM data, so it must only be
 * reachable from the machine it runs on.
 *
 * Besides binding to 127.0.0.1, we reject requests whose Host header is not a
 * loopback name (DNS rebinding protection) and requests coming from a foreign
 * web page (Origin header of another site -> CSRF protection).
 */

const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '::1'];

/** Parses a comma separated ALLOWED_HOSTS value into lowercase hostnames. */
export function parseAllowedHosts(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** Extracts the hostname (without port / IPv6 brackets) from a Host header value. */
export function hostnameFromHostHeader(hostHeader: string | undefined): string | null {
  if (!hostHeader) return null;
  try {
    return new URL(`http://${hostHeader}`).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Extracts the hostname from an Origin header value (e.g. "http://localhost:5173"). */
export function hostnameFromOrigin(origin: string): string | null {
  try {
    return new URL(origin).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedHostname(hostname: string | null, extraHosts: string[] = []): boolean {
  if (!hostname) return false;
  return LOOPBACK_HOSTNAMES.includes(hostname) || extraHosts.includes(hostname);
}

/**
 * Express middleware that only lets through requests addressed to a loopback
 * host name and (when an Origin header is present) sent from a loopback page.
 */
export function localOnly(extraHosts: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const hostname = hostnameFromHostHeader(req.headers.host);
    if (!isAllowedHostname(hostname, extraHosts)) {
      return res.status(403).json({
        error: 'Bu sunucu yalnızca yerel erişim içindir (Host izin listesinde değil).',
      });
    }

    // "Origin: null" (sandboxed iframes, file:// pages) is rejected as well.
    const origin = req.headers.origin;
    if (origin && !isAllowedHostname(hostnameFromOrigin(origin), extraHosts)) {
      return res.status(403).json({
        error: 'Bu sunucu yalnızca yerel erişim içindir (Origin izin listesinde değil).',
      });
    }

    next();
  };
}
