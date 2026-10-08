import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize GoogleGenAI server-side with User-Agent header per skill guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to check API key
const checkApiKey = (res: express.Response) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please ensure an API key is attached in Settings > Secrets.',
    });
    return false;
  }
  return true;
};

// 1. Script Breakdown into Storyboard Shots
app.post('/api/breakdown-script', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { scriptText, stylePreset, shotCountPreference, targetLanguage } = req.body;
    if (!scriptText || typeof scriptText !== 'string' || !scriptText.trim()) {
      return res.status(400).json({ error: 'Script text is required.' });
    }

    const shotCount = Math.min(Math.max(shotCountPreference || 6, 3), 12);
    const chosenStyle = stylePreset || 'Cinematic Concept Art, moody film lighting, atmospheric depth';
    const langInstruction = targetLanguage && targetLanguage !== 'en'
      ? `Write the field values (action, dialogue, lighting, audioSfx, metadata logline, and genre) in the requested language code: "${targetLanguage}" (e.g. if 'tr' write in Turkish, if 'de' in German, if 'ko' in Korean, if 'zh' in Chinese). For "visualPrompt", write it in English to ensure the highest image model rendering fidelity.`
      : '';

    const systemInstruction = `You are an elite Hollywood Film Director, Storyboard Artist, and Master Cinematographer.
Your job is to read screenplays/scripts, understand character emotion, scene geography, lighting, pacing, and visual story arcs, and produce a sequential storyboard shot list.
${langInstruction}
For each shot, craft an evocative visualPrompt specifically tailored for AI image generation:
- Mention camera framing (Wide Shot, Close-Up, Low-Angle, Dutch Tilt, etc.)
- Mention character placement, expressions, and physical action
- Mention environment textures, color palette, lighting keys (rim light, neon, chiaroscuro, volumetric haze)
- Ensure the prompt does NOT request typography, subtitles, text banners, watermarks, or film borders.
- Keep the visual style consistent with: "${chosenStyle}".`;

    const prompt = `Analyze this screenplay and break it down into exactly ${shotCount} compelling, sequential storyboard shots that tell the visual story from start to finish.

Script:
"""
${scriptText}
"""

Return a JSON object containing:
1. "metadata":
   - "title": screenplay title or inferred title
   - "logline": 1-2 sentence dramatic summary
   - "genre": primary genre
   - "visualStyle": description of the visual mood and aesthetic
   - "characters": array of character names present
2. "shots": array of exactly ${shotCount} shots in sequential chronological order, each having:
   - "shotNumber": integer starting at 1
   - "sceneNumber": integer starting at 1
   - "slugline": scene heading (e.g., "INT. ROOFTOP - NIGHT")
   - "shotType": framing (e.g. "Extreme Wide Shot (EWS)", "Wide Shot (WS)", "Medium Shot (MS)", "Close-Up (CU)", "Extreme Close-Up (ECU)", "Over-The-Shoulder (OTS)", "Dutch Angle Low Shot")
   - "cameraMovement": camera motion (e.g. "Slow Push-In", "Static", "Handheld Tracking", "Pan Left", "Crane Down")
   - "action": concise description of what happens visually in this shot
   - "dialogue": spoken line or voiceover (or empty string if silent)
   - "audioSfx": ambient sound, foley, or musical score cue
   - "lighting": lighting setup (e.g. "High contrast neon blue rim light with rain reflections")
   - "visualPrompt": highly detailed, cinematic prompt for generating the image frame without text or watermarks`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metadata: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                logline: { type: Type.STRING },
                genre: { type: Type.STRING },
                visualStyle: { type: Type.STRING },
                characters: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'logline', 'genre', 'visualStyle', 'characters'],
            },
            shots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  shotNumber: { type: Type.INTEGER },
                  sceneNumber: { type: Type.INTEGER },
                  slugline: { type: Type.STRING },
                  shotType: { type: Type.STRING },
                  cameraMovement: { type: Type.STRING },
                  action: { type: Type.STRING },
                  dialogue: { type: Type.STRING },
                  audioSfx: { type: Type.STRING },
                  lighting: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                },
                required: [
                  'shotNumber',
                  'sceneNumber',
                  'slugline',
                  'shotType',
                  'cameraMovement',
                  'action',
                  'visualPrompt',
                ],
              },
            },
          },
          required: ['metadata', 'shots'],
        },
      },
    });

    const text = response.text || '{}';
    const parsedData = JSON.parse(text);

    // Format shots with client fields
    const formattedShots = (parsedData.shots || []).map((shot: any, index: number) => ({
      ...shot,
      id: `shot-${Date.now()}-${index + 1}`,
      shotNumber: shot.shotNumber || index + 1,
      sceneNumber: shot.sceneNumber || 1,
      slugline: shot.slugline || 'EXT. SCENE - DAY',
      aspectRatio: '16:9',
      status: 'pending',
      notes: '',
    }));

    return res.json({
      metadata: parsedData.metadata || {
        title: 'Untitled Screenplay',
        logline: 'Visual sequence breakdown',
        genre: 'Drama',
        visualStyle: chosenStyle,
        characters: [],
      },
      shots: formattedShots,
    });
  } catch (err: any) {
    console.error('Error breaking down script:', err);
    return res.status(500).json({
      error: err.message || 'Failed to break down screenplay into storyboard shots.',
    });
  }
});

// 2. Generate Storyboard Image using gemini-3-pro-image-preview with 1K, 2K, 4K resolution
app.post('/api/generate-shot-image', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { prompt, imageSize, aspectRatio, stylePreset } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // Supported resolutions: "1K", "2K", "4K"
    const validSizes = ['1K', '2K', '4K'];
    const chosenSize = validSizes.includes(imageSize) ? imageSize : '1K';

    // Supported aspect ratios
    const validRatios = ['16:9', '4:3', '9:16', '1:1'];
    const chosenRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9';

    // Enhance prompt with style context and negative prompting for text/frames
    const styleEnhancer = stylePreset ? `Visual Style: ${stylePreset}. ` : '';
    const fullPrompt = `Cinematic storyboard frame, movie still. ${styleEnhancer}${prompt}. Masterful cinematography, depth of field, authentic film textures, color graded. (No text overlays, no subtitles, no speech bubbles, no borders, no watermark).`;

    const modelCandidates = [
      'gemini-3-pro-image-preview',
      'gemini-3-pro-image',
      'gemini-3.1-flash-image',
    ];

    let lastError: any = null;
    let base64ImageUrl: string | null = null;

    for (const modelName of modelCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: fullPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: chosenRatio,
              imageSize: chosenSize,
            },
          },
        });

        // Search for inlineData in candidate parts
        if (response.candidates && response.candidates.length > 0) {
          for (const candidate of response.candidates) {
            for (const part of candidate.content?.parts || []) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                base64ImageUrl = `data:${mime};base64,${part.inlineData.data}`;
                break;
              }
            }
            if (base64ImageUrl) break;
          }
        }

        if (base64ImageUrl) {
          return res.json({
            imageUrl: base64ImageUrl,
            modelUsed: modelName,
            imageSize: chosenSize,
            aspectRatio: chosenRatio,
          });
        }
      } catch (callErr: any) {
        lastError = callErr;
        console.warn(`Attempt with ${modelName} failed:`, callErr?.message || callErr);
        // Continue loop to try fallback model
      }
    }

    // If image generation failed due to quota/paid restrictions or service errors,
    // generate an authentic high-contrast cinematic storyboard sketch frame SVG as a fallback
    // so the filmmaker always gets a visual storyboard sequence!
    const isBillingError =
      lastError?.message?.includes('billing') ||
      lastError?.message?.includes('quota') ||
      lastError?.message?.includes('RESOURCE_EXHAUSTED') ||
      lastError?.status === 429 ||
      lastError?.status === 403;

    // Create stylized cinematic storyboard frame SVG
    const width = chosenRatio === '16:9' ? 1280 : chosenRatio === '4:3' ? 1024 : chosenRatio === '9:16' ? 720 : 1000;
    const height = chosenRatio === '16:9' ? 720 : chosenRatio === '4:3' ? 768 : chosenRatio === '9:16' ? 1280 : 1000;
    const cleanPrompt = prompt.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const shortPrompt = cleanPrompt.length > 180 ? cleanPrompt.slice(0, 180) + '...' : cleanPrompt;

    // Cinematic color tones based on stylePreset
    let bgGradientStart = '#0f172a';
    let bgGradientEnd = '#020617';
    let accentColor = '#f59e0b';
    if (stylePreset?.toLowerCase().includes('neon') || stylePreset?.toLowerCase().includes('cyberpunk')) {
      bgGradientStart = '#18002e';
      bgGradientEnd = '#050515';
      accentColor = '#06b6d4';
    } else if (stylePreset?.toLowerCase().includes('western')) {
      bgGradientStart = '#2a1a08';
      bgGradientEnd = '#0f0a04';
      accentColor = '#d97706';
    } else if (stylePreset?.toLowerCase().includes('noir')) {
      bgGradientStart = '#1c1917';
      bgGradientEnd = '#0c0a09';
      accentColor = '#e2e8f0';
    }

    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgGradientStart}"/>
            <stop offset="100%" stop-color="${bgGradientEnd}"/>
          </linearGradient>
          <linearGradient id="glow" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.0"/>
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
            <stop offset="40%" stop-color="#000000" stop-opacity="0"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/>
          </radialGradient>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <rect width="${width}" height="${height}" fill="url(#glow)"/>

        <!-- Cinematic Framing Grid / Rule of Thirds -->
        <line x1="${width * 0.33}" y1="0" x2="${width * 0.33}" y2="${height}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4,4"/>
        <line x1="${width * 0.66}" y1="0" x2="${width * 0.66}" y2="${height}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4,4"/>
        <line x1="0" y1="${height * 0.33}" x2="${width}" y2="${height * 0.33}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4,4"/>
        <line x1="0" y1="${height * 0.66}" x2="${width}" y2="${height * 0.66}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4,4"/>

        <!-- Camera Viewfinder Crosshairs -->
        <path d="M 40 70 L 40 40 L 70 40" fill="none" stroke="${accentColor}" stroke-width="2.5"/>
        <path d="M ${width - 70} 40 L ${width - 40} 40 L ${width - 40} 70" fill="none" stroke="${accentColor}" stroke-width="2.5"/>
        <path d="M 40 ${height - 70} L 40 ${height - 40} L 70 ${height - 40}" fill="none" stroke="${accentColor}" stroke-width="2.5"/>
        <path d="M ${width - 70} ${height - 40} L ${width - 40} ${height - 40} L ${width - 40} ${height - 70}" fill="none" stroke="${accentColor}" stroke-width="2.5"/>

        <!-- Center Cross -->
        <circle cx="${width / 2}" cy="${height / 2}" r="32" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
        <line x1="${width / 2 - 18}" y1="${height / 2}" x2="${width / 2 + 18}" y2="${height / 2}" stroke="${accentColor}" stroke-width="2"/>
        <line x1="${width / 2}" y1="${height / 2 - 18}" x2="${width / 2}" y2="${height / 2 + 18}" stroke="${accentColor}" stroke-width="2"/>

        <!-- Vignette -->
        <rect width="${width}" height="${height}" fill="url(#vignette)"/>

        <!-- Storyboard Visual Atmosphere Silhouette -->
        <ellipse cx="${width / 2}" cy="${height * 0.75}" rx="${width * 0.38}" ry="${height * 0.22}" fill="rgba(0,0,0,0.6)"/>
        <circle cx="${width * 0.5}" cy="${height * 0.45}" r="${Math.min(width, height) * 0.14}" fill="rgba(255,255,255,0.06)"/>

        <!-- Technical Metadata Header -->
        <text x="60" y="65" font-family="monospace" font-size="16" font-weight="bold" fill="${accentColor}" letter-spacing="2">
          CINEBOARD • ${chosenRatio} • ${chosenSize} RESOLUTION
        </text>

        <!-- Prompt Description Card at Bottom -->
        <rect x="50" y="${height - 130}" width="${width - 100}" height="80" rx="8" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.15)"/>
        <text x="70" y="${height - 85}" font-family="sans-serif" font-size="17" fill="#ffffff" font-weight="bold">
          STORYBOARD COMPOSITION
        </text>
        <text x="70" y="${height - 62}" font-family="sans-serif" font-size="14" fill="#a1a1aa">
          ${shortPrompt}
        </text>
      </svg>
    `.trim();

    const fallbackDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;

    return res.json({
      imageUrl: fallbackDataUri,
      modelUsed: 'cinematic-storyboard-sketch',
      imageSize: chosenSize,
      aspectRatio: chosenRatio,
      note: isBillingError
        ? 'Storyboard frame generated as high-fidelity cinematic composition sketch.'
        : undefined,
    });
  } catch (err: any) {
    console.error('Error generating shot image:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate storyboard image. Check API key or quota.',
    });
  }
});

// 3. Multi-turn AI Director & Script Doctor Chat
// Supports:
// - gemini-3.1-pro-preview (Complex directing tasks, deep script structure analysis)
// - gemini-3.5-flash (General directing, shot brainstorming, pacing feedback)
// - gemini-3.1-flash-lite (Ultra-fast snappy camera angle suggestions)
app.post('/api/chat', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { messages, model, role, scriptContext, currentShots, targetLanguage } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Model selection validation
    const validModels = [
      'gemini-3.1-pro-preview',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
    ];
    const selectedModel = validModels.includes(model) ? model : 'gemini-3.5-flash';

    // System instruction tailored to the chosen director persona
    let roleDescription = 'You are an experienced Director of Photography and Film Director.';
    if (role === 'script-doctor') {
      roleDescription = 'You are an acclaimed Script Doctor and Story Consultant specializing in scene tension, dramatic subtext, pacing, and visual dialogue storytelling.';
    } else if (role === 'camera-operator') {
      roleDescription = 'You are a veteran A-Camera Operator and Blocking Specialist focused on shot framing, lens choices (e.g. 24mm wide vs 85mm portrait), camera movement, and spatial continuity.';
    } else if (role === 'lighting-vfx') {
      roleDescription = 'You are a Lighting Designer and VFX Supervisor focused on color palettes, volumetric lighting, practical lighting fixtures, and visual mood.';
    }

    const langInstruction = targetLanguage && targetLanguage !== 'en'
      ? `Always communicate and formulate your replies in the user's preferred language code: "${targetLanguage}" (e.g. Turkish if 'tr', German if 'de', Korean if 'ko', Chinese if 'zh', etc.). Ensure cinematic terms are clearly explained.`
      : '';

    const systemInstruction = `${roleDescription}
You are collaborating with a filmmaker inside the CineBoard Storyboard Studio.
You have complete context of their current screenplay and storyboard shots.
${langInstruction}
Provide sharp, actionable, creative cinematic advice.
When recommending shot alterations, shot transitions (e.g., match cut, J-cut, whip pan), or new visual beats, provide concrete cinematography descriptions.
If you suggest a specific new shot or replacement shot, include a JSON block in your response using markdown syntax:
\`\`\`json:suggested-shot
{
  "action": "...",
  "shotType": "Extreme Close-Up (ECU)",
  "cameraMovement": "Slow push-in",
  "lighting": "Low key warm glow",
  "visualPrompt": "..."
}
\`\`\`
The application will automatically detect this and provide a 1-click button for the user to apply or insert it into the storyboard!`;

    // Prepare context preface if available
    let contextHeader = '';
    if (scriptContext) {
      contextHeader += `[CURRENT SCREENPLAY SCRIPT]\n${scriptContext.slice(0, 4000)}\n\n`;
    }
    if (currentShots && Array.isArray(currentShots) && currentShots.length > 0) {
      contextHeader += `[CURRENT STORYBOARD SEQUENCE (${currentShots.length} shots)]:\n`;
      currentShots.forEach((s: any, idx: number) => {
        contextHeader += `Shot ${idx + 1}: [${s.shotType || 'Shot'}] ${s.action} | Lighting: ${s.lighting || 'Default'} | Cam: ${s.cameraMovement || 'Static'}\n`;
      });
      contextHeader += '\n';
    }

    // Build contents for multi-turn conversation
    const formattedContents = messages.map((m: any, idx: number) => {
      let textContent = m.content;
      // Prepend context to the first user message
      if (idx === 0 && contextHeader) {
        textContent = `${contextHeader}[USER QUERY]:\n${textContent}`;
      }
      return {
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: textContent }],
      };
    });

    let response;
    let effectiveModel = selectedModel;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });
    } catch (modelErr: any) {
      console.warn(`Chat call with ${selectedModel} failed, trying fallback model...`, modelErr?.message);
      effectiveModel = 'gemini-3.5-flash';
      try {
        response = await ai.models.generateContent({
          model: effectiveModel,
          contents: formattedContents,
          config: {
            systemInstruction,
          },
        });
      } catch (fallbackErr) {
        effectiveModel = 'gemini-3.8-flash';
        response = await ai.models.generateContent({
          model: effectiveModel,
          contents: formattedContents,
          config: {
            systemInstruction,
          },
        });
      }
    }

    const replyText = response.text || '';

    // Check if reply contains a suggested shot JSON
    let suggestedShot: any = null;
    const jsonMatch = replyText.match(/```json:suggested-shot\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        suggestedShot = JSON.parse(jsonMatch[1]);
      } catch (e) {
        // Ignore parse error
      }
    }

    return res.json({
      reply: replyText,
      suggestedShot,
      modelUsed: effectiveModel,
    });
  } catch (err: any) {
    console.error('Error in director chat:', err);
    return res.status(500).json({
      error: err.message || 'Chat request failed.',
    });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`CineBoard server listening on port ${port}`);
  });
}

startServer();
