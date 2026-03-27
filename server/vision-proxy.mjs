import http from 'node:http';

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const hfToken = process.env.HF_TOKEN;
const model = process.env.FITDIARY_VISION_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct';
const hfBaseUrl = process.env.FITDIARY_VISION_BASE_URL || 'https://router.huggingface.co/v1/chat/completions';
const allowOrigin = process.env.CORS_ORIGIN || '*';

const json = (statusCode, payload, headers = {}) => ({
  statusCode,
  payload: JSON.stringify(payload),
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    ...headers,
  },
});

const nutritionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['label', 'calories', 'protein', 'carbs', 'fat', 'confidence', 'notes'],
  properties: {
    label: { type: 'string' },
    calories: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    confidence: { type: 'number' },
    notes: { type: 'string' },
  },
};

const prompt = [
  'You estimate nutrition from a meal photo.',
  'Return a single JSON object only.',
  'Use common serving assumptions when exact portion size is unclear.',
  'Be conservative and practical, not maximalist.',
  'Fields:',
  '- label: short meal description',
  '- calories: estimated total kcal',
  '- protein: estimated grams',
  '- carbs: estimated grams',
  '- fat: estimated grams',
  '- confidence: number between 0 and 1',
  '- notes: one short sentence describing assumptions',
].join(' ');

const parseBody = async (request) =>
  new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 8_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });

const normalizeResult = (result) => ({
  label: String(result.label || 'Meal estimate').trim(),
  calories: Number(result.calories || 0),
  protein: Number(result.protein || 0),
  carbs: Number(result.carbs || 0),
  fat: Number(result.fat || 0),
  confidence: Math.max(0, Math.min(1, Number(result.confidence || 0.55))),
  notes: String(result.notes || 'Estimated from visible ingredients and common serving sizes.').trim(),
});

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    const result = json(204, {});
    response.writeHead(result.statusCode, result.headers);
    response.end();
    return;
  }

  if (request.url === '/health' && request.method === 'GET') {
    const result = json(200, {
      ok: true,
      service: 'fitdiary-vision-proxy',
      model,
      hasToken: Boolean(hfToken),
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.payload);
    return;
  }

  if (request.url === '/' && request.method === 'GET') {
    const result = json(200, {
      ok: true,
      service: 'fitdiary-vision-proxy',
      endpoints: {
        health: '/health',
        estimateFuel: '/estimate-fuel',
      },
      model,
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.payload);
    return;
  }

  if (request.url !== '/estimate-fuel' || request.method !== 'POST') {
    const result = json(404, { error: 'Not found' });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.payload);
    return;
  }

  if (!hfToken) {
    const result = json(500, { error: 'HF_TOKEN is not configured on the server.' });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.payload);
    return;
  }

  try {
    const body = await parseBody(request);
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      const result = json(400, { error: 'imageBase64 is required.' });
      response.writeHead(result.statusCode, result.headers);
      response.end(result.payload);
      return;
    }

    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    const upstreamResponse = await fetch(hfBaseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 300,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'nutrition_estimate',
            strict: true,
            schema: nutritionSchema,
          },
        },
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Estimate the nutrition for the food shown in this image.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      const result = json(502, { error: 'Upstream model request failed.', details: errorText });
      response.writeHead(result.statusCode, result.headers);
      response.end(result.payload);
      return;
    }

    const upstreamPayload = await upstreamResponse.json();
    const content = upstreamPayload?.choices?.[0]?.message?.content;
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    const result = json(200, normalizeResult(parsedContent));
    response.writeHead(result.statusCode, result.headers);
    response.end(result.payload);
  } catch (error) {
    const result = json(500, {
      error: 'Fuel estimate failed.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.payload);
  }
});

server.listen(port, host, () => {
  console.log(`FitDiary vision proxy listening on http://${host}:${port}/estimate-fuel`);
  console.log(`Using model: ${model}`);
});
