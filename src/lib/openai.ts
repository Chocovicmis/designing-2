export type OpenAIRequest = {
  path: string;
  payload: unknown;
  apiKey: string;
  proxyBase: string;
};

export async function openaiPost<T>({ path, payload, apiKey, proxyBase }: OpenAIRequest): Promise<T> {
  const trimmedProxy = proxyBase.trim();
  if (!trimmedProxy && !apiKey) {
    throw new Error("Provide an OpenAI API key or a proxy endpoint.");
  }

  const url = trimmedProxy ? `${trimmedProxy}${path}` : `https://api.openai.com${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${message || response.statusText}`);
  }

  return (await response.json()) as T;
}
