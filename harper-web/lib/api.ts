const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function apiClient<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}
