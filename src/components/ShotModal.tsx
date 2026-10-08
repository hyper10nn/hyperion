import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Download, Sparkles, Camera, Sun, Volume2, MessageSquare, Save } from 'lucide-react';
import { StoryboardShot, ImageResolution } from '../types';
import { SupportedLanguage, getTranslation } from '../i18n';

interface ShotModalProps {
  shot: StoryboardShot | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateShot: (updatedShot: StoryboardShot) => void;
  onGenerateImage: (shotId: string, customPrompt?: string, resolution?: ImageResolution) => void;
  globalResolution: ImageResolution;
  currentLanguage: SupportedLanguage;
}

export const ShotModal: React.FC<ShotModalProps> = ({
  shot,
  isOpen,
  onClose,
  onUpdateShot,
  onGenerateImage,
  globalResolution,
  currentLanguage,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);

  if (!isOpen || !shot) return null;

  const [prompt, setPrompt] = useState<string>(shot.visualPrompt || '');
  const [action, setAction] = useState<string>(shot.action || '');
  const [dialogue, setDialogue] = useState<string>(shot.dialogue || '');
  const [audioSfx, setAudioSfx] = useState<string>(shot.audioSfx || '');
  const [lighting, setLighting] = useState<string>(shot.lighting || '');
  const [shotType, setShotType] = useState<string>(shot.shotType || '');
  const [cameraMovement, setCameraMovement] = useState<string>(shot.cameraMovement || '');
  const [notes, setNotes] = useState<string>(shot.notes || '');
  const [modalResolution, setModalResolution] = useState<ImageResolution>(
    shot.imageResolution || globalResolution
  );

  useEffect(() => {
    if (shot) {
      setPrompt(shot.visualPrompt || '');
      setAction(shot.action || '');
      setDialogue(shot.dialogue || '');
      setAudioSfx(shot.audioSfx || '');
      setLighting(shot.lighting || '');
      setShotType(shot.shotType || '');
      setCameraMovement(shot.cameraMovement || '');
      setNotes(shot.notes || '');
      setModalResolution(shot.imageResolution || globalResolution);
    }
  }, [shot, globalResolution]);

  const handleSaveDetails = () => {
    onUpdateShot({
      ...shot,
      visualPrompt: prompt,
      action,
      dialogue,
      audioSfx,
      lighting,
      shotType,
      cameraMovement,
      notes,
    });
  };

  const handleReRender = () => {
    handleSaveDetails();
    onGenerateImage(shot.id, prompt, modalResolution);
  };

  const handleDownloadImage = () => {
    if (!shot.imageUrl) return;
    const link = document.createElement('a');
    link.href = shot.imageUrl;
    link.download = `Shot-${shot.shotNumber}-${shot.shotType.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold text-xs border border-amber-500/20">
              {t('shot').toUpperCase()} {String(shot.shotNumber).padStart(2, '0')}
            </span>
            <div className="text-sm font-semibold text-white">
              {shot.slugline || `Scene ${shot.sceneNumber}`}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Preview & Resolution Affordance (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center aspect-video group">
              {shot.imageUrl ? (
                <img
                  src={shot.imageUrl}
                  alt={`Shot ${shot.shotNumber}`}
                  className="w-full h-full object-contain bg-zinc-950"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                  <Camera className="w-8 h-8 mb-2" />
                  <p className="text-xs">{t('noShotsYet')}</p>
                </div>
              )}

              {shot.status === 'generating' && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-xs font-semibold text-zinc-200">
                    {t('renderingFrame')} ({modalResolution})...
                  </p>
                </div>
              )}
            </div>

            {/* Resolution Affordance & Render Controls */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-300">{t('modelResolution')}:</span>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                      <button
                        key={res}
                        onClick={() => setModalResolution(res)}
                        className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                          modalResolution === res
                            ? 'bg-amber-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {shot.imageUrl && (
                    <button
                      onClick={handleDownloadImage}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title={t('downloadFrame')}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('downloadFrame')}</span>
                    </button>
                  )}
                  <button
                    onClick={handleReRender}
                    disabled={shot.status === 'generating'}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('renderWord')} ({modalResolution})</span>
                  </button>
                </div>
              </div>

              {/* Visual Prompt Editor */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <span>{t('visualPrompt')}</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 leading-relaxed custom-scrollbar"
                  placeholder="Cinematic description for the frame..."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Shot Cinematography & Script Parameters (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Camera Setup */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {t('cameraFraming')}
                </label>
                <input
                  type="text"
                  value={shotType}
                  onChange={(e) => setShotType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {t('cameraMovement')}
                </label>
                <input
                  type="text"
                  value={cameraMovement}
                  onChange={(e) => setCameraMovement(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Action Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {t('visualAction')}
              </label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 custom-scrollbar"
              />
            </div>

            {/* Dialogue */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('dialogue')}</span>
              </label>
              <input
                type="text"
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                placeholder="CHARACTER: 'Spoken line here...'"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            {/* Lighting */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('lightingScheme')}</span>
              </label>
              <input
                type="text"
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                placeholder="e.g. Neon cyan backlight with deep shadows"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            {/* Audio SFX */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('audioSound')}</span>
              </label>
              <input
                type="text"
                value={audioSfx}
                onChange={(e) => setAudioSfx(e.target.value)}
                placeholder="e.g. Rain lashing, drone humming"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            {/* Director's Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {t('directorsNotes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notes for DP, grip, actors, or VFX..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 custom-scrollbar"
              />
            </div>

            <button
              onClick={handleSaveDetails}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('saveChanges')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
