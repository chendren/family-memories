import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const MODEL = 'cx-intelligence-slm';

export async function generate(prompt: string, system?: string): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    prompt,
    stream: false,
  };
  if (system) {
    body.system = system;
  }

  const res = await fetch(`${config.OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama generate failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response ?? '';
}

export async function* generateStream(prompt: string, system?: string): AsyncGenerator<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    prompt,
    stream: true,
  };
  if (system) {
    body.system = system;
  }

  const res = await fetch(`${config.OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama stream failed: ${res.status} ${text}`);
  }

  if (!res.body) {
    throw new Error('No response body for streaming');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // NDJSON: each line is a JSON object
      let newlineIdx = buffer.indexOf('\n');
      while (newlineIdx !== -1) {
        const line = buffer.substring(0, newlineIdx).trim();
        buffer = buffer.substring(newlineIdx + 1);

        if (line.length > 0) {
          try {
            const parsed = JSON.parse(line) as { response?: string; done?: boolean };
            if (parsed.response) {
              yield parsed.response;
            }
            if (parsed.done) {
              return;
            }
          } catch {
            logger.warn({ line }, 'Failed to parse streaming JSON line');
          }
        }

        newlineIdx = buffer.indexOf('\n');
      }
    }

    // Process any remaining buffer
    const remaining = buffer.trim();
    if (remaining.length > 0) {
      try {
        const parsed = JSON.parse(remaining) as { response?: string };
        if (parsed.response) {
          yield parsed.response;
        }
      } catch {
        // ignore trailing incomplete data
      }
    }
  } finally {
    reader.releaseLock();
  }
}
