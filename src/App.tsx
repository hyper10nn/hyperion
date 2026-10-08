import React, { useState, useEffect } from 'react';
import { Header, STYLE_PRESETS } from './components/Header';
import { ScriptEditor } from './components/ScriptEditor';
import { ShotCard } from './components/ShotCard';
import { ShotModal } from './components/ShotModal';
import { DirectorChat } from './components/DirectorChat';
import { ExportModal } from './components/ExportModal';
import { SAMPLE_SCRIPTS } from './sampleScripts';
import {
  StoryboardShot,
  ScriptMetadata,
  ImageResolution,
  AspectRatio,
} from './types';
import { SupportedLanguage, getTranslation } from './i18n';
import {
  Film,
  Play,
  AlertCircle,
  Clapperboard,
} from 'lucide-react';

const STORAGE_KEY = 'cineboard_studio_data_v2';

export default function App() {
  // Language state (default to 'tr' as requested, with persistence)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('tr');

  // Script state
  const [scriptText, setScriptText] = useState<string>(SAMPLE_SCRIPTS[0].content);
  const [metadata, setMetadata] = useState<ScriptMetadata>({
    title: SAMPLE_SCRIPTS[0].title,
    genre: SAMPLE_SCRIPTS[0].genre,
    logline: SAMPLE_SCRIPTS[0].description,
    visualStyle: SAMPLE_SCRIPTS[0].defaultStyle,
    characters: ['Valentina', 'Kael'],
  });

  // Storyboard shots state
  const [shots, setShots] = useState<StoryboardShot[]>([]);

  // Settings affordances
  const [imageResolution, setImageResolution] = useState<ImageResolution>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [stylePreset, setStylePreset] = useState<string>(STYLE_PRESETS[0].desc);

  // UI state
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState<boolean>(false);
  const [isDirectorChatOpen, setIsDirectorChatOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [selectedShotForModal, setSelectedShotForModal] = useState<StoryboardShot | null>(null);

  // Loading states
  const [isBreakingDown, setIsBreakingDown] = useState<boolean>(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const t = (key: string) => getTranslation(currentLanguage, key);

  // Restore previous session if present, or initialize with sample
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentLanguage) setCurrentLanguage(parsed.currentLanguage);
        if (parsed.shots && parsed.shots.length > 0) {
          setShots(parsed.shots);
          if (parsed.metadata) setMetadata(parsed.metadata);
          if (parsed.scriptText) setScriptText(parsed.scriptText);
          if (parsed.imageResolution) setImageResolution(parsed.imageResolution);
          if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
          if (parsed.stylePreset) setStylePreset(parsed.stylePreset);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached project:', e);
    }

    // Default: break down the sample script on first visit
    handleBreakdownScript(6, SAMPLE_SCRIPTS[0].content, 'tr');
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (shots.length > 0) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currentLanguage,
            shots,
            metadata,
            scriptText,
            imageResolution,
            aspectRatio,
            stylePreset,
          })
        );
      } catch (e) {
        // LocalStorage quota may be reached if images are large
      }
    }
  }, [currentLanguage, shots, metadata, scriptText, imageResolution, aspectRatio, stylePreset]);

  // Breakdown Script
  const handleBreakdownScript = async (
    count: number = 6,
    textToUse?: string,
    langToUse?: SupportedLanguage
  ) => {
    const text = textToUse || scriptText;
    if (!text.trim()) return;

    setIsBreakingDown(true);
    setGlobalError(null);

    const lang = langToUse || currentLanguage;

    try {
      const response = await fetch('/api/breakdown-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: text,
          stylePreset,
          shotCountPreference: count,
          targetLanguage: lang,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to analyze script');
      }

      const data = await response.json();
      setMetadata(data.metadata);
      const newShots: StoryboardShot[] = (data.shots || []).map((s: StoryboardShot) => ({
        ...s,
        aspectRatio,
      }));
      setShots(newShots);
      setIsScriptEditorOpen(false);

      // Automatically generate first shot so the user gets instant visual gratification
      if (newShots.length > 0) {
        generateShotImage(newShots[0].id, newShots[0].visualPrompt, imageResolution);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Script breakdown failed.');
    } finally {
      setIsBreakingDown(false);
    }
  };

  // Generate a single shot image with gemini-3-pro-image-preview
  const generateShotImage = async (
    shotId: string,
    customPrompt?: string,
    resolution?: ImageResolution
  ) => {
    const targetShot = shots.find((s) => s.id === shotId);
    if (!targetShot) return;

    const chosenResolution = resolution || imageResolution;
    const promptToUse = customPrompt || targetShot.visualPrompt || targetShot.action;

    // Set shot status to generating
    setShots((prev) =>
      prev.map((s) =>
        s.id === shotId ? { ...s, status: 'generating', error: undefined } : s
      )
    );

    try {
      const response = await fetch('/api/generate-shot-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          imageSize: chosenResolution,
          aspectRatio: targetShot.aspectRatio || aspectRatio,
          stylePreset,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to render image');
      }

      const data = await response.json();

      setShots((prev) =>
        prev.map((s) =>
          s.id === shotId
            ? {
                ...s,
                imageUrl: data.imageUrl,
                imageResolution: chosenResolution,
                status: 'completed',
                visualPrompt: promptToUse,
              }
            : s
        )
      );

      // If modal is currently open for this shot, update modal shot
      if (selectedShotForModal && selectedShotForModal.id === shotId) {
        setSelectedShotForModal((prev) =>
          prev
            ? {
                ...prev,
                imageUrl: data.imageUrl,
                imageResolution: chosenResolution,
                status: 'completed',
                visualPrompt: promptToUse,
              }
            : null
        );
      }
    } catch (err: any) {
      setShots((prev) =>
        prev.map((s) =>
          s.id === shotId
            ? {
                ...s,
                status: 'error',
                error: err.message || 'Image rendering failed',
              }
            : s
        )
      );
    }
  };

  // Generate All Pending Shots in Sequence
  const handleGenerateAll = async () => {
    if (isGeneratingAll) return;
    setIsGeneratingAll(true);

    const pendingShots = shots.filter((s) => s.status !== 'completed');
    for (const shot of pendingShots) {
      await generateShotImage(shot.id, undefined, imageResolution);
    }

    setIsGeneratingAll(false);
  };

  // Shot CRUD & Reordering
  const handleAddShot = () => {
    const nextNumber = shots.length + 1;
    const newShot: StoryboardShot = {
      id: `shot-manual-${Date.now()}`,
      shotNumber: nextNumber,
      sceneNumber: shots[shots.length - 1]?.sceneNumber || 1,
      slugline: shots[shots.length - 1]?.slugline || 'INT. SCENE - DAY',
      shotType: 'Medium Shot (MS)',
      cameraMovement: 'Static',
      action: 'New storyboard action beat...',
      dialogue: '',
      audioSfx: '',
      lighting: 'Atmospheric rim lighting',
      visualPrompt: 'Cinematic storyboard frame, medium shot, atmospheric lighting',
      aspectRatio,
      status: 'pending',
    };
    setShots((prev) => [...prev, newShot]);
  };

  const handleDeleteShot = (shotId: string) => {
    setShots((prev) => {
      const filtered = prev.filter((s) => s.id !== shotId);
      return filtered.map((s, idx) => ({ ...s, shotNumber: idx + 1 }));
    });
    if (selectedShotForModal?.id === shotId) {
      setSelectedShotForModal(null);
    }
  };

  const handleDuplicateShot = (shot: StoryboardShot) => {
    const duplicated: StoryboardShot = {
      ...shot,
      id: `shot-dup-${Date.now()}`,
      shotNumber: shot.shotNumber + 1,
      status: 'pending',
      imageUrl: undefined,
    };
    const index = shots.findIndex((s) => s.id === shot.id);
    const newShots = [...shots];
    newShots.splice(index + 1, 0, duplicated);
    setShots(newShots.map((s, idx) => ({ ...s, shotNumber: idx + 1 })));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newShots = [...shots];
    const temp = newShots[index - 1];
    newShots[index - 1] = newShots[index];
    newShots[index] = temp;
    setShots(newShots.map((s, idx) => ({ ...s, shotNumber: idx + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === shots.length - 1) return;
    const newShots = [...shots];
    const temp = newShots[index + 1];
    newShots[index + 1] = newShots[index];
    newShots[index] = temp;
    setShots(newShots.map((s, idx) => ({ ...s, shotNumber: idx + 1 })));
  };

  const handleUpdateShot = (updatedShot: StoryboardShot) => {
    setShots((prev) => prev.map((s) => (s.id === updatedShot.id ? updatedShot : s)));
    setSelectedShotForModal(updatedShot);
  };

  const handleInsertSuggestedShot = (suggested: any) => {
    const newShot: StoryboardShot = {
      id: `shot-director-${Date.now()}`,
      shotNumber: shots.length + 1,
      sceneNumber: 1,
      slugline: metadata.title.toUpperCase(),
      shotType: suggested.shotType || 'Close-Up (CU)',
      cameraMovement: suggested.cameraMovement || 'Slow Push-In',
      action: suggested.action || 'Director suggested beat',
      dialogue: suggested.dialogue || '',
      audioSfx: suggested.audioSfx || '',
      lighting: suggested.lighting || 'Cinematic Key Light',
      visualPrompt: suggested.visualPrompt || suggested.action || 'Cinematic shot',
      aspectRatio,
      status: 'pending',
    };
    setShots((prev) => [...prev, newShot]);
  };

  const completedCount = shots.filter((s) => s.status === 'completed').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Studio Header */}
      <Header
        imageResolution={imageResolution}
        onResolutionChange={setImageResolution}
        aspectRatio={aspectRatio}
        onAspectRatioChange={(newRatio) => {
          setAspectRatio(newRatio);
          setShots((prev) => prev.map((s) => ({ ...s, aspectRatio: newRatio })));
        }}
        stylePreset={stylePreset}
        onStylePresetChange={setStylePreset}
        shotCount={shots.length}
        completedCount={completedCount}
        isChatOpen={isDirectorChatOpen}
        onToggleChat={() => setIsDirectorChatOpen(!isDirectorChatOpen)}
        onGenerateAll={handleGenerateAll}
        isGeneratingAll={isGeneratingAll}
        onAddShot={handleAddShot}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenScriptEditor={() => setIsScriptEditorOpen(true)}
        hasScript={Boolean(scriptText.trim())}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Global Error Notice */}
        {globalError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium"
            >
              {t('dismiss')}
            </button>
          </div>
        )}

        {/* Project Info Banner / Summary Card */}
        {shots.length > 0 && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {metadata.genre || 'SCREENPLAY'}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {shots.length} {t('sequenceFrames')} • {completedCount} {t('rendered')} ({imageResolution})
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-white">
                {metadata.title}
              </h1>
              {metadata.logline && (
                <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
                  {metadata.logline}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsScriptEditorOpen(true)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700"
              >
                <Film className="w-3.5 h-3.5" />
                <span>{t('screenplay')}</span>
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={isGeneratingAll || completedCount === shots.length}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isGeneratingAll ? (
                  <>
                    <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>{t('renderingAll')}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t('renderAll')} ({imageResolution})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Storyboard Shots Grid */}
        {shots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shots.map((shot, index) => (
              <ShotCard
                key={shot.id}
                shot={shot}
                index={index}
                totalShots={shots.length}
                globalResolution={imageResolution}
                onGenerateImage={generateShotImage}
                onOpenModal={setSelectedShotForModal}
                onDeleteShot={handleDeleteShot}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onDuplicateShot={handleDuplicateShot}
                currentLanguage={currentLanguage}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-inner">
              <Clapperboard className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{t('noShotsYet')}</h3>
              <p className="text-xs text-zinc-400 max-w-md">
                {t('noShotsDesc')}
              </p>
            </div>
            <button
              onClick={() => setIsScriptEditorOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              {t('openScriptStudio')}
            </button>
          </div>
        )}
      </main>

      {/* Script Breakdown & Upload Modal */}
      <ScriptEditor
        scriptText={scriptText}
        onScriptChange={setScriptText}
        onBreakdown={handleBreakdownScript}
        isBreakingDown={isBreakingDown}
        onClose={() => setIsScriptEditorOpen(false)}
        isOpen={isScriptEditorOpen}
        hasExistingShots={shots.length > 0}
        currentLanguage={currentLanguage}
      />

      {/* Shot Inspector & Re-Render Modal */}
      <ShotModal
        shot={selectedShotForModal}
        isOpen={Boolean(selectedShotForModal)}
        onClose={() => setSelectedShotForModal(null)}
        onUpdateShot={handleUpdateShot}
        onGenerateImage={generateShotImage}
        globalResolution={imageResolution}
        currentLanguage={currentLanguage}
      />

      {/* AI Director Chat Drawer */}
      <DirectorChat
        isOpen={isDirectorChatOpen}
        onClose={() => setIsDirectorChatOpen(false)}
        scriptContext={scriptText}
        currentShots={shots}
        onInsertSuggestedShot={handleInsertSuggestedShot}
        currentLanguage={currentLanguage}
      />

      {/* Export & Project Management Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        shots={shots}
        metadata={metadata}
        onImportShots={({ shots: importedShots, metadata: importedMetadata }) => {
          setShots(importedShots);
          setMetadata(importedMetadata);
        }}
        currentLanguage={currentLanguage}
      />

      {/* Print Storyboard Sheet View */}
      <div className="hidden print:block p-8 bg-white text-black min-h-screen">
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black uppercase tracking-wider">{metadata.title}</h1>
          <p className="text-sm font-serif italic">{metadata.logline}</p>
          <div className="text-xs font-mono mt-1 text-zinc-700">
            Genre: {metadata.genre} | Visual Style: {metadata.visualStyle}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {shots.map((shot, idx) => (
            <div key={shot.id} className="border border-black p-3 rounded break-inside-avoid">
              <div className="font-mono font-bold text-xs mb-1">
                {t('shot').toUpperCase()} {String(idx + 1).padStart(2, '0')} - {shot.slugline}
              </div>
              <div className="w-full aspect-video bg-zinc-200 border border-zinc-400 mb-2 overflow-hidden flex items-center justify-center">
                {shot.imageUrl ? (
                  <img src={shot.imageUrl} alt={`Shot ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-mono text-zinc-500">[FRAME NOT RENDERED]</span>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold text-zinc-800">
                {shot.shotType} • {shot.cameraMovement}
              </div>
              <div className="text-xs mt-1 text-black font-sans">{shot.action}</div>
              {shot.dialogue && (
                <div className="text-[11px] italic mt-1 font-mono">"{shot.dialogue}"</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
