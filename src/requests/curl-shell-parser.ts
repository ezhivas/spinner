/**
 * Parse a curl command into a JS object.
 * Supports:
 * - backslash line continuations
 * - single-quoted args
 * - escaped sequence: '\'' (shell single quote in single quotes)
 * - --location, -L
 * - --request/-X
 * - --header/-H (multiple)
 * - --data/--data-raw/--data-binary/-d (last wins)
 */
export function parseCurlToRequest(curlText: string) {
  if (typeof curlText !== 'string')
    throw new TypeError('curlText must be a string');

  // 1) normalize line continuations: "...\ \n ..." -> "... ..."
  const normalized = curlText.replace(/\\\r?\n/g, ' ').trim();
  console.log('[curl-shell-parser] Normalized input:', normalized);

  // 2) tokenize like a shell (minimal but good for typical curl)
  const tokens = shellTokenize(normalized);
  console.log('[curl-shell-parser] Tokens:', tokens);

  if (tokens.length === 0 || tokens[0] !== 'curl') {
    throw new Error(
      "Input does not look like a curl command (must start with 'curl').",
    );
  }

  const req: any = {
    url: null,
    method: 'GET',
    headers: {},
    data: undefined,
    followRedirects: false,
  };

  // helper: add header (preserve last value on duplicates)
  const addHeader = (line: string) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) req.headers[key] = val;
  };

  // 3) parse args
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];

    // URL: usually first non-flag token, but could appear anywhere
    if (!t.startsWith('-') && !req.url) {
      req.url = t;
      continue;
    }

    if (t === '--location' || t === '-L') {
      req.followRedirects = true;
      continue;
    }

    if (t === '--request' || t === '-X') {
      const m = tokens[++i];
      if (m) req.method = m.toUpperCase();
      continue;
    }

    if (t === '--header' || t === '-H') {
      const h = tokens[++i];
      if (h) addHeader(h);
      continue;
    }

    if (
      t === '--data' ||
      t === '--data-raw' ||
      t === '--data-binary' ||
      t === '-d'
    ) {
      const d = tokens[++i];
      if (d != null) {
        req.data = d;
        if (req.method === 'GET') req.method = 'POST';
      }
      continue;
    }

    if (t === '--url') {
      const u = tokens[++i];
      if (u) req.url = u;
      continue;
    }
  }

  if (!req.url) throw new Error('Could not find URL in curl command.');

  // попытка распарсить JSON payload, если похоже на JSON
  if (typeof req.data === 'string') {
    const trimmed = req.data.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        req.data = JSON.parse(trimmed);
      } catch {
        // оставляем строкой
      }
    }
    console.log('[curl-shell-parser] Parsed request:', req);
  }

  return req;
}

/**
 * Minimal shell tokenizer:
 * - splits by whitespace not in quotes
 * - supports single quotes '...'
 * - supports double quotes "..." (basic)
 * - supports escaped characters with backslash outside single quotes
 * - supports the shell pattern: '\'' to embed a single quote inside a single-quoted string
 */
export function shellTokenize(input: string): string[] {
  const out: string[] = [];
  let i = 0;
  let cur = '';
  let mode: 'none' | 'single' | 'double' = 'none';

  const push = () => {
    if (cur.length) out.push(cur);
    cur = '';
  };

  while (i < input.length) {
    const ch = input[i];

    if (mode === 'none' && /\s/.test(ch)) {
      push();
      while (i < input.length && /\s/.test(input[i])) i++;
      continue;
    }

    if (mode === 'none') {
      if (ch === "'") {
        mode = 'single';
        i++;
        continue;
      }
      if (ch === '"') {
        mode = 'double';
        i++;
        continue;
      }
      if (ch === '\\') {
        const next = input[i + 1];
        if (next != null) {
          cur += next;
          i += 2;
          continue;
        }
      }
      cur += ch;
      i++;
      continue;
    }

    if (mode === 'single') {
      if (ch === "'" && input.slice(i, i + 4) === "'\\''") {
        cur += "'";
        i += 4;
        continue;
      }
      if (ch === "'") {
        mode = 'none';
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }

    if (mode === 'double') {
      if (ch === '"') {
        mode = 'none';
        i++;
        continue;
      }
      if (ch === '\\') {
        const next = input[i + 1];
        if (next != null) {
          cur += next;
          i += 2;
          continue;
        }
      }
      cur += ch;
      i++;
      continue;
    }
  }

  push();
  return out;
}
