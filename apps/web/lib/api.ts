const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3050';

function parseApiErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) {
      const parts = message.filter(
        (part): part is string =>
          typeof part === 'string' && part.trim().length > 0,
      );
      if (parts.length > 0) return parts.join(', ');
    }
  }
  return `HTTP ${status}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = `${API_URL}/v1${path}`;

  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const raw = await res.text();

  if (res.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;

  if (raw.trim()) {
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error(
        `JSON 응답 파싱 실패 (HTTP ${res.status}): ${raw.slice(0, 200)}`,
      );
    }
  }

  if (!res.ok) {
    throw new Error(parseApiErrorMessage(body, res.status));
  }

  if (!raw.trim()) {
    console.error('[apiFetch] 성공했지만 빈 응답:', {
      url,
      status: res.status,
      contentType: res.headers.get('content-type'),
    });

    throw new Error(`빈 응답 (HTTP ${res.status})`);
  }

  return body as T;
}
