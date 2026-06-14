import { RagEmbeddingResponse } from '@/interfaces/ragCoach.interface';
import { assertRagEnabled, getRagConfig } from '@/lib/rag/ragConfig';

function normalizeInput(input: string | string[]) {
  const values = Array.isArray(input) ? input : [input];
  const sanitized = values
    .map((value) => value.replace(/\s+/g, ' ').trim())
    .filter((value) => value.length > 0);

  if (sanitized.length === 0) {
    throw new Error('No hay texto válido para generar embeddings.');
  }

  return sanitized;
}

function assertEmbeddingDimensions(embeddings: number[][], expectedDimensions: number) {
  const invalid = embeddings.find((embedding) => embedding.length !== expectedDimensions);
  if (invalid) {
    throw new Error(
      `Dimensión de embedding inválida. Esperado ${expectedDimensions}, recibido ${invalid.length}.`,
    );
  }
}

async function parseErrorResponse(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) return response.statusText;

  try {
    const json = JSON.parse(text);
    return json?.error?.message || json?.message || text;
  } catch {
    return text;
  }
}

async function createGithubEmbeddings(input: string[]): Promise<RagEmbeddingResponse> {
  const config = getRagConfig();

  if (!config.githubToken) {
    throw new Error('Falta GITHUB_TOKEN para usar embeddings con GitHub Models.');
  }

  const baseUrl = config.githubBaseUrl.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.githubToken}`,
      'X-GitHub-Api-Version': config.githubApiVersion,
    },
    body: JSON.stringify({
      model: config.githubEmbeddingModelId,
      input,
      encoding_format: 'float',
      dimensions: config.vectorDimensions,
    }),
  });

  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw new Error(`GitHub Models embeddings falló (${response.status}): ${error}`);
  }

  const payload = await response.json();
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const embeddings = data
    .sort((a: any, b: any) => Number(a.index ?? 0) - Number(b.index ?? 0))
    .map((item: any) => item.embedding as number[]);

  assertEmbeddingDimensions(embeddings, config.vectorDimensions);

  return {
    embeddings,
    model: payload?.model || config.githubEmbeddingModelId,
    provider: 'github',
    usage: {
      promptTokens: payload?.usage?.prompt_tokens,
      totalTokens: payload?.usage?.total_tokens,
    },
  };
}

async function createOpenAIEmbeddings(input: string[]): Promise<RagEmbeddingResponse> {
  const config = getRagConfig();

  if (!config.openaiApiKey) {
    throw new Error('Falta OPENAI_API_KEY para usar embeddings con OpenAI.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiEmbeddingModel,
      input,
      encoding_format: 'float',
      dimensions: config.vectorDimensions,
    }),
  });

  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw new Error(`OpenAI embeddings falló (${response.status}): ${error}`);
  }

  const payload = await response.json();
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const embeddings = data
    .sort((a: any, b: any) => Number(a.index ?? 0) - Number(b.index ?? 0))
    .map((item: any) => item.embedding as number[]);

  assertEmbeddingDimensions(embeddings, config.vectorDimensions);

  return {
    embeddings,
    model: payload?.model || config.openaiEmbeddingModel,
    provider: 'openai',
    usage: {
      promptTokens: payload?.usage?.prompt_tokens,
      totalTokens: payload?.usage?.total_tokens,
    },
  };
}

export async function createRagEmbeddings(input: string | string[]): Promise<RagEmbeddingResponse> {
  const config = assertRagEnabled();
  const sanitized = normalizeInput(input);

  if (config.provider === 'openai') {
    return createOpenAIEmbeddings(sanitized);
  }

  return createGithubEmbeddings(sanitized);
}

export async function createSingleRagEmbedding(input: string) {
  const response = await createRagEmbeddings(input);
  const [embedding] = response.embeddings;

  if (!embedding) {
    throw new Error('No se generó embedding para la consulta.');
  }

  return {
    embedding,
    model: response.model,
    provider: response.provider,
  };
}
