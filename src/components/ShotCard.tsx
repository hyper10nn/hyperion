import React from 'react';
import {
  Maximize2,
  RefreshCw,
  Trash2,
  ChevronUp,
  ChevronDown,
  Volume2,
  MessageSquare,
  Sun,
  Camera,
  AlertCircle,
  Copy,
  Sparkles,
} from 'lucide-react';
import { StoryboardShot, ImageResolution } from '../types';
import { SupportedLanguage, getTranslation } from '../i18n';

interface ShotCardProps {
  shot: StoryboardShot;
  index: number;
  totalShots: number;
  globalResolution: ImageResolution;
  onGenerateImage: (shotId: string, customPrompt?: string, resolution?: ImageResolution) => void;
  onOpenModal: (shot: StoryboardShot) => void;
  onDeleteShot: (shotId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicateShot: (shot: StoryboardShot) => void;
  currentLanguage: SupportedLanguage;
}

export const ShotCard: React.FC<ShotCardProps> = ({
  shot,
  index,
  totalShots,
  globalResolution,
  onGenerateImage,
  onOpenModal,
  onDeleteShot,
  onMoveUp,
  onMoveDown,
  onDuplicateShot,
  currentLanguage,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);

  // Determine aspect ratio class
  const getAspectRatioClass = () => {
    switch (shot.aspectRatio) {
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-[4/3]';
      case '9:16':
        return 'aspect-[9/16]';
      case '1:1':
        return 'aspect-square';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-zinc-700/80 transition-all flex flex-col group">
      {/* Shot Card Header */}
      <div className="px-4 py-3 bg-zinc-950/70 border-b border-zinc-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold text-xs border border-amber-500/20 shrink-0">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-zinc-400 uppercase truncate">
              {shot.slugline || `SCENE ${shot.sceneNumber}`}
            </div>
          </div>
        </div>

        {/* Card Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-20 hover:bg-zinc-800 transition-colors"
            title="Move Shot Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalShots - 1}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-20 hover:bg-zinc-800 transition-colors"
            title="Move Shot Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicateShot(shot)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Duplicate Shot"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteShot(shot.id)}
            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            title="Delete Shot"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Visual / Preview Area */}
      <div className={`relative bg-zinc-950 flex items-center justify-center overflow-hidden ${getAspectRatioClass()}`}>
        {shot.status === 'completed' && shot.imageUrl ? (
          <>
            <img
              src={shot.imageUrl}
              alt={`Shot ${index + 1}: ${shot.action}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] cursor-pointer"
              onClick={() => onOpenModal(shot)}
            />
            {/* Resolution Tag */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-amber-300">
              {shot.imageResolution || globalResolution}
            </div>
            {/* Aspect Ratio Tag */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
              {shot.aspectRatio}
            </div>

            {/* Hover Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
              <div className="pointer-events-auto flex gap-1.5">
                <button
                  onClick={() => onOpenModal(shot)}
                  className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-zinc-800 text-white text-xs font-medium border border-zinc-700 flex items-center gap-1.5 backdrop-blur-md shadow-md"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{t('inspect')}</span>
                </button>
                <button
                  onClick={() => onGenerateImage(shot.id, undefined, globalResolution)}
                  className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-zinc-800 text-amber-300 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 backdrop-blur-md shadow-md"
                  title={t('reRender')}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('reRender')}</span>
                </button>
              </div>
            </div>
          </>
        ) : shot.status === 'generating' ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
              <Camera className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-200">{t('renderingFrame')}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Gemini 3 Pro Image • {globalResolution}</p>
            </div>
          </div>
        ) : shot.status === 'error' ? (
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
            <div className="p-2 rounded-full bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-rose-400 font-medium">{t('generationError')}</p>
            <p className="text-[11px] text-zinc-500 line-clamp-2 max-w-[200px]">
              {shot.error || 'Failed to render frame'}
            </p>
            <button
              onClick={() => onGenerateImage(shot.id, undefined, globalResolution)}
              className="mt-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('retry')}</span>
            </button>
          </div>
        ) : (
          /* Pending state with prompt preview and render button */
          <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 w-full h-full bg-gradient-to-b from-zinc-950 to-zinc-900/60 border border-dashed border-zinc-800/80">
            {/* Viewfinder crosshairs */}
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Camera className="w-4 h-4" />
            </div>
            <div className="max-w-[85%]">
              <p className="text-xs text-zinc-300 font-medium line-clamp-2">
                {shot.action || 'Frame setup ready'}
              </p>
            </div>
            <button
              onClick={() => onGenerateImage(shot.id, undefined, globalResolution)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all hover:scale-105 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('renderWord')} ({globalResolution})</span>
            </button>
          </div>
        )}
      </div>

      {/* Shot Specifications Badges */}
      <div className="px-4 py-2 bg-zinc-950/40 border-y border-zinc-800/60 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 font-mono font-medium border border-zinc-700/50">
          {shot.shotType || 'Standard Shot'}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 font-mono border border-zinc-700/30">
          {shot.cameraMovement || 'Static'}
        </span>
      </div>

      {/* Shot Details (Action, Dialogue, Audio, Lighting) */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
        {/* Action description */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {t('visualAction')}
          </div>
          <p className="text-zinc-200 leading-relaxed font-sans line-clamp-3">
            {shot.action}
          </p>
        </div>

        {/* Dialogue snippet if exists */}
        {shot.dialogue && (
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2 text-zinc-300">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="font-mono text-[11px] italic leading-tight line-clamp-2">
              "{shot.dialogue}"
            </div>
          </div>
        )}

        {/* Technical specs footer (Audio SFX & Lighting) */}
        <div className="pt-2 border-t border-zinc-800/60 space-y-1.5 text-[11px] text-zinc-400">
          {shot.lighting && (
            <div className="flex items-center gap-1.5 truncate text-zinc-400" title={t('lightingScheme')}>
              <Sun className="w-3 h-3 text-amber-500/70 shrink-0" />
              <span className="truncate">{shot.lighting}</span>
            </div>
          )}
          {shot.audioSfx && (
            <div className="flex items-center gap-1.5 truncate text-zinc-400" title={t('audioSound')}>
              <Volume2 className="w-3 h-3 text-blue-400/70 shrink-0" />
              <span className="truncate">{shot.audioSfx}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
