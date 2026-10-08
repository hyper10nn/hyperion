import React from 'react';
import { Clapperboard, Sparkles, Sliders, MessageSquare, Download, Play, Plus, Film, Globe } from 'lucide-react';
import { ImageResolution, AspectRatio } from '../types';
import { SupportedLanguage, LANGUAGES, getTranslation } from '../i18n';

interface HeaderProps {
  imageResolution: ImageResolution;
  onResolutionChange: (res: ImageResolution) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  stylePreset: string;
  onStylePresetChange: (style: string) => void;
  shotCount: number;
  completedCount: number;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onGenerateAll: () => void;
  isGeneratingAll: boolean;
  onAddShot: () => void;
  onOpenExport: () => void;
  onOpenScriptEditor: () => void;
  hasScript: boolean;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic Concept Art', desc: 'Moody film lighting, photorealistic textures, atmospheric depth' },
  { id: 'noir', label: 'Film Noir Black & White', desc: 'High contrast chiaroscuro, venetian blind shadows, 1940s classic' },
  { id: 'blade-runner', label: 'Cyberpunk Neon', desc: 'Volumetric cyan/magenta fog, rain reflections, neon signs' },
  { id: 'western', label: 'Neo-Western Dust', desc: '35mm anamorphic, golden dust, harsh sun, Sergio Leone framing' },
  { id: 'pixar', label: 'Whimsical 3D Animation', desc: 'Vibrant colors, stylized lighting, soft warm character design' },
  { id: 'graphic-novel', label: 'Graphic Novel & Ink', desc: 'Sharp ink outlines, dramatic dynamic cross-hatching' },
];

export const Header: React.FC<HeaderProps> = ({
  imageResolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  stylePreset,
  onStylePresetChange,
  shotCount,
  completedCount,
  isChatOpen,
  onToggleChat,
  onGenerateAll,
  isGeneratingAll,
  onAddShot,
  onOpenExport,
  onOpenScriptEditor,
  hasScript,
  currentLanguage,
  onLanguageChange,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-950">
              <Clapperboard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-wider text-lg text-white">
                  {t('appTitle')}
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {t('studio')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">{t('appSubtitle')}</p>
            </div>
          </div>

          {/* Quick Script Toggle Button */}
          <button
            onClick={onOpenScriptEditor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              hasScript
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold shadow-md'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            {hasScript ? t('screenplay') : t('uploadScript')}
          </button>
        </div>

        {/* Global Controls & Affordances */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          {/* Language Selector Dropdown */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs hover:border-zinc-700 transition-colors">
            <Globe className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent text-zinc-200 outline-none text-xs cursor-pointer font-medium"
              title="Select Interface Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-zinc-900 text-zinc-200">
                  {l.flag} {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* Visual Style Preset */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
            <Sliders className="w-3.5 h-3.5 text-zinc-400 mr-2" />
            <select
              value={stylePreset}
              onChange={(e) => onStylePresetChange(e.target.value)}
              className="bg-transparent text-zinc-200 outline-none text-xs cursor-pointer font-medium"
              title={t('visualStyle')}
            >
              {STYLE_PRESETS.map((p) => (
                <option key={p.id} value={p.desc} className="bg-zinc-900 text-zinc-200">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution Selector (1K, 2K, 4K affordance) */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs" title={t('resolution')}>
            <span className="text-[10px] uppercase font-bold text-zinc-400 px-1.5">{t('resolution')}</span>
            <div className="flex gap-0.5">
              {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => onResolutionChange(res)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    imageResolution === res
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs" title={t('aspectRatio')}>
            <span className="text-[10px] uppercase font-bold text-zinc-400 px-1.5">{t('aspectRatio')}</span>
            <div className="flex gap-0.5">
              {(['16:9', '4:3', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onAspectRatioChange(ratio)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                    aspectRatio === ratio
                      ? 'bg-zinc-700 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Generate All Action */}
          {shotCount > 0 && (
            <button
              onClick={onGenerateAll}
              disabled={isGeneratingAll || completedCount === shotCount}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                completedCount === shotCount
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              }`}
            >
              {isGeneratingAll ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>{t('renderingAll')}</span>
                </>
              ) : completedCount === shotCount ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('allRendered')} ({shotCount})</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>{t('renderAll')} ({completedCount}/{shotCount})</span>
                </>
              )}
            </button>
          )}

          {/* Add Shot Manual */}
          {shotCount > 0 && (
            <button
              onClick={onAddShot}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition-all"
              title={t('addShot')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('shot')}</span>
            </button>
          )}

          {/* Export Button */}
          {shotCount > 0 && (
            <button
              onClick={onOpenExport}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-all"
              title={t('exportPrint')}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* AI Director Chat Toggle */}
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isChatOpen
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('aiDirector')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
