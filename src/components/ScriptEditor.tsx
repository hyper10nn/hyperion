import React, { useState, useRef } from 'react';
import { Upload, FileText, Wand2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { SAMPLE_SCRIPTS, SampleScript } from '../sampleScripts';
import { SupportedLanguage, getTranslation } from '../i18n';

interface ScriptEditorProps {
  scriptText: string;
  onScriptChange: (text: string) => void;
  onBreakdown: (count: number) => Promise<void>;
  isBreakingDown: boolean;
  onClose: () => void;
  isOpen: boolean;
  hasExistingShots: boolean;
  currentLanguage: SupportedLanguage;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  scriptText,
  onScriptChange,
  onBreakdown,
  isBreakingDown,
  onClose,
  isOpen,
  hasExistingShots,
  currentLanguage,
}) => {
  const [shotCount, setShotCount] = useState<number>(6);
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => getTranslation(currentLanguage, key);

  if (!isOpen) return null;

  const handleSelectSample = (sample: SampleScript) => {
    setSelectedSample(sample.id);
    onScriptChange(sample.content);
    setErrorMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onScriptChange(content);
        setSelectedSample('');
        setErrorMessage('');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please ensure it is a valid text or screenplay file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleStartBreakdown = async () => {
    if (!scriptText.trim()) {
      setErrorMessage('Please paste, upload, or choose a screenplay script first.');
      return;
    }
    setErrorMessage('');
    await onBreakdown(shotCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {t('scriptStudio')}
              </h2>
              <p className="text-xs text-zinc-400">
                {t('scriptStudioDesc')}
              </p>
            </div>
          </div>
          {hasExistingShots && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* Preset Sample Scripts */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 block">
              {t('quickSampleScripts')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SAMPLE_SCRIPTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    selectedSample === sample.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-zinc-950/50 hover:bg-zinc-800/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      {sample.genre}
                    </span>
                    <h3 className="text-xs font-semibold text-zinc-100 line-clamp-1 mb-1">
                      {sample.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.fountain,.md,.rtf,.pdf"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-300">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-zinc-200">
                {t('uploadDropzone')}
              </p>
              <p className="text-[11px] text-zinc-500">
                {t('uploadSupported')}
              </p>
            </div>
          </div>

          {/* Screenplay Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t('screenplayTextLabel')}
              </label>
              <span className="text-xs text-zinc-500 font-mono">
                {scriptText.split(/\r\n|\r|\n/).length} lines • {scriptText.length} characters
              </span>
            </div>
            <textarea
              value={scriptText}
              onChange={(e) => {
                onScriptChange(e.target.value);
                setErrorMessage('');
              }}
              placeholder={`EXT. LOCATION - DAY\n\nACTION DESCRIPTION OF SCENE...\n\nCHARACTER\nDialogue goes here...\n\nINT. NEXT LOCATION - NIGHT...`}
              rows={10}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Breakdown Preferences */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800">
            <div>
              <span className="text-xs font-bold text-zinc-200 block mb-0.5">
                {t('shotCountLabel')}
              </span>
              <p className="text-[11px] text-zinc-400">
                {t('shotCountDesc')}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {[4, 6, 8, 10, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => setShotCount(num)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    shotCount === num
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {num} {t('shotsWord')}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="text-xs text-zinc-500 hidden sm:block">
            Gemini will extract sluglines, camera framing, lighting, and action beats.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasExistingShots && (
              <button
                onClick={onClose}
                disabled={isBreakingDown}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                {t('cancel')}
              </button>
            )}
            <button
              onClick={handleStartBreakdown}
              disabled={isBreakingDown}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isBreakingDown ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('analyzingScript')}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>{t('generateStoryboardSequence')} ({shotCount} {t('shotsWord')})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
