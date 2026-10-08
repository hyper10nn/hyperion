export type ImageResolution = '1K' | '2K' | '4K';
export type AspectRatio = '16:9' | '4:3' | '9:16' | '1:1';
export type ShotStatus = 'pending' | 'generating' | 'completed' | 'error';
export type ChatModel = 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';

export interface StoryboardShot {
  id: string;
  shotNumber: number;
  sceneNumber: number;
  slugline: string;
  shotType: string; // e.g. "Wide Shot (WS)", "Close-Up (CU)", "Extreme Close-Up (ECU)"
  cameraMovement: string; // e.g. "Slow Push-In", "Static", "Pan Right", "Handheld Tracking"
  action: string;
  dialogue?: string;
  audioSfx?: string;
  lighting?: string;
  visualPrompt: string;
  aspectRatio: AspectRatio;
  imageUrl?: string;
  imageResolution?: ImageResolution;
  status: ShotStatus;
  error?: string;
  notes?: string;
}

export interface ScriptMetadata {
  title: string;
  logline: string;
  genre: string;
  visualStyle: string;
  characters: string[];
}

export interface ScriptAnalysisResponse {
  metadata: ScriptMetadata;
  shots: StoryboardShot[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  suggestedShot?: {
    action: string;
    shotType: string;
    cameraMovement: string;
    lighting: string;
    visualPrompt: string;
    dialogue?: string;
  };
}

export interface DirectorRole {
  id: string;
  name: string;
  title: string;
  description: string;
  systemInstruction: string;
}
