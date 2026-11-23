import { GoogleGenAI } from '@google/genai';
import { schemes as defaultSchemes } from '../src/data/schemes.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dynamically read GEMINI_API_KEY from .env.local, .env, or system environment.
 * Re-reads on demand so users don't have to restart the dev server after editing their key!
 */
export function getApiKey() {
  const projectRoot = process.cwd();
  const envFiles = [
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env'),
  ];

  for (const envPath of envFiles) {
    if (!fs.existsSync(envPath)) continue;
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();

        if (key === 'GEMINI_API_KEY' || key === 'VITE_GEMINI_API_KEY') {
          let val = line.slice(eqIdx + 1).trim();
          // Strip inline comments if unquoted
          if (!val.startsWith('"') && !val.startsWith("'") && val.includes('#')) {
            val = val.split('#')[0].trim();
          }
          // Strip surrounding quotes
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          val = val.trim();
          if (val && val !== 'your_gemini_api_key_here' && val !== 'your_key_here') {
            process.env.GEMINI_API_KEY = val;
            return val;
          }
        }
      }
    } catch {
      // Continue to next env file
    }
  }

  // Fallback to system environment variable
  const sysKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (sysKey && sysKey !== 'your_gemini_api_key_here' && sysKey !== 'your_key_here') {
    return sysKey.trim();
  }

  return null;
}

/**
 * Preloads environment settings from .env / .env.local
 */
export function loadEnvironment() {
  getApiKey();
  getModelName();
}

/**
 * Get active Gemini Model
 */
export function getModelName() {
  const projectRoot = process.cwd();
  const envFiles = [
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env'),
  ];

  for (const envPath of envFiles) {
    if (!fs.existsSync(envPath)) continue;
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        if (key === 'GEMINI_MODEL') {
          let val = line.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (val.trim()) return val.trim();
        }
      }
    } catch {
      // Ignore
    }
  }

  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Build JanSetu-specific system instruction grounded in the curated schemes database.
 */
export function buildSystemInstruction(schemesList = defaultSchemes) {
  const schemesFormatted = (schemesList && schemesList.length > 0 ? schemesList : defaultSchemes).map(s => `
- **${s.name}**
  - Category: ${s.category} | Tag: ${s.tag || 'General'}
  - Applicable State: ${s.state || 'All India'}
  - Description: ${s.description || ''}
  - Key Benefits: ${s.benefit || ''}
  - Eligibility Criteria: ${s.eligibility || ''}
  - Required Documents: ${Array.isArray(s.documents) ? s.documents.join(', ') : (s.documents || '')}
  - How to Apply: ${s.howToApply || ''}
  - Official Application Portal: ${s.applicationLink || ''}
  - Application Deadline: ${s.deadline || 'Open'}
`).join('\n');

  return `You are JanSetu Assistant, a helpful assistant for discovering and understanding Indian government welfare schemes. Explain information in simple language. Do not invent eligibility requirements, benefits, application procedures, or official government information. If reliable information is unavailable, clearly say that the information is unavailable.

CORE OBJECTIVES & DOMAINS:
1. Help users discover and understand Indian welfare schemes across domains:
   - Education schemes & Scholarships
   - Healthcare & Medical support schemes
   - Agriculture & Farmer welfare schemes
   - Employment, Apprenticeship & Skill Development
   - Housing schemes (Urban & Rural)
   - Women & Child welfare schemes
   - Senior Citizen & Pension schemes
   - Financial Aid & Entrepreneurship (e.g. Mudra loans)
2. Detail scheme eligibility, key benefits, required documentation, and step-by-step application instructions.
3. Ground your knowledge in the curated JanSetu Schemes database provided below. When referring to schemes in this database, provide exact official application links and guidelines.
4. If a user asks about a scheme or scenario where specific official details are unavailable or unverified, clearly say: "Reliable information for this is unavailable. Please verify on the official government portal."
5. Format your responses in clean, readable markdown with bold titles and bullet points. Keep explanations empathetic, clear, and easy to read.

CURATED JANSETU SCHEMES DATABASE:
${schemesFormatted}
`;
}

/**
 * Format conversation history into valid alternating turns for @google/genai.
 * Drops leading assistant greetings so history starts with a user turn.
 */
export function formatMessagesForGemini(messages = []) {
  const contents = [];
  let foundFirstUser = false;

  for (const msg of messages) {
    if (!foundFirstUser && msg.role !== 'user') {
      continue;
    }
    foundFirstUser = true;

    const role = msg.role === 'assistant' ? 'model' : 'user';
    const text = typeof msg.content === 'string' ? msg.content.trim() : '';
    if (!text) continue;

    // Ensure strictly alternating roles required by Gemini API
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  return contents;
}

/**
 * Generate a reply from Gemini API using the official @google/genai SDK.
 */
export async function generateGeminiReply({ messages, schemes }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your .env or .env.local file in the project root.');
    error.code = 'MISSING_API_KEY';
    error.status = 503;
    throw error;
  }

  const contents = formatMessagesForGemini(messages);
  if (contents.length === 0) {
    const error = new Error('No user message provided.');
    error.code = 'INVALID_REQUEST';
    error.status = 400;
    throw error;
  }

  const systemInstruction = buildSystemInstruction(schemes);
  const primaryModel = getModelName();
  const modelsToTry = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

  const ai = new GoogleGenAI({ apiKey });
  let lastErr = null;

  for (const currentModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response?.text?.trim();
      if (!reply) {
        throw new Error('Received an empty response from Gemini API.');
      }

      return reply;
    } catch (err) {
      lastErr = err;
      const rawMsg = err?.message || String(err);
      console.warn(`[Gemini API Warning with model ${currentModel}]:`, rawMsg);

      // If key is invalid, no need to retry other models
      if (rawMsg.includes('api_key_invalid') || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('api key not valid')) {
        break;
      }
      // If 503 high demand or 404 deprecated or quota, try next fallback model
    }
  }

  // If all models failed, categorize the last error with a clean message
  const err = lastErr || new Error('Unable to connect to JanSetu Assistant.');
  const rawMsg = (err?.message || '').toLowerCase();
  const details = JSON.stringify(err?.details || '');

  if (rawMsg.includes('api_key_invalid') || rawMsg.includes('api key not valid') || details.includes('API_KEY_INVALID')) {
    const error = new Error('The configured GEMINI_API_KEY is invalid. Please verify your API key from Google AI Studio.');
    error.code = 'INVALID_API_KEY';
    error.status = 401;
    throw error;
  }

  if (rawMsg.includes('high demand') || rawMsg.includes('unavailable') || err?.status === 503) {
    const error = new Error('Gemini API is currently experiencing high demand. Please try again in a few moments.');
    error.code = 'HIGH_DEMAND';
    error.status = 503;
    throw error;
  }

  if (rawMsg.includes('resource_exhausted') || rawMsg.includes('quota') || rawMsg.includes('429')) {
    const error = new Error('Gemini API rate limit or quota exceeded. Please wait a moment and try again.');
    error.code = 'RATE_LIMIT';
    error.status = 429;
    throw error;
  }

  if (rawMsg.includes('fetch') || rawMsg.includes('enotfound') || rawMsg.includes('econnrefused') || rawMsg.includes('timeout')) {
    const error = new Error('Network error communicating with Google Gemini API.');
    error.code = 'NETWORK_ERROR';
    error.status = 504;
    throw error;
  }

  // Extract clean message if it was wrapped JSON
  let cleanMsg = err.message || 'Unable to connect to JanSetu Assistant.';
  try {
    if (cleanMsg.includes('{') && cleanMsg.includes('}')) {
      const parsed = JSON.parse(cleanMsg.slice(cleanMsg.indexOf('{'), cleanMsg.lastIndexOf('}') + 1));
      if (parsed?.error?.message) {
        cleanMsg = parsed.error.message;
      }
    }
  } catch {
    // Keep cleanMsg
  }

  const error = new Error(cleanMsg);
  error.code = 'API_ERROR';
  error.status = err.status || 500;
  throw error;
}

/**
 * Node HTTP request handler for POST /api/chat.
 */
export async function handleChatRequest(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' }));
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 2e6) { // 2MB protection
      req.destroy();
    }
  });

  req.on('end', async () => {
    try {
      let parsed = {};
      if (body) {
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'INVALID_JSON', message: 'Invalid JSON payload received.' }));
        }
      }

      const { messages, schemes } = parsed;
      if (!messages || !Array.isArray(messages)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'INVALID_REQUEST', message: 'Messages array is required.' }));
      }

      const reply = await generateGeminiReply({ messages, schemes });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ reply }));
    } catch (err) {
      const status = err.status || 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: err.code || 'API_ERROR',
        message: err.message || 'Unable to connect to JanSetu Assistant.'
      }));
    }
  });
}
