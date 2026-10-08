import React, { useRef } from 'react';
import { X, Printer, Download, Upload, Copy, Check, FileJson, Film } from 'lucide-react';
import { StoryboardShot, ScriptMetadata } from '../types';
import { SupportedLanguage, getTranslation } from '../i18n';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shots: StoryboardShot[];
  metadata: ScriptMetadata | null;
  onImportShots: (importedData: { shots: StoryboardShot[]; metadata: ScriptMetadata }) => void;
  currentLanguage: SupportedLanguage;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  shots,
  metadata,
  onImportShots,
  currentLanguage,
}) => {
  const [copied, setCopied] = React.useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => getTranslation(currentLanguage, key);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const data = {
      metadata: metadata || {
        title: 'CineBoard Storyboard',
        genre: 'Cinema',
        logline: '',
        visualStyle: '',
        characters: [],
      },
      shots,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(metadata?.title || 'storyboard').toLowerCase().replace(/\s+/g, '_')}_cineboard.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.shots && Array.isArray(parsed.shots)) {
          onImportShots({
            shots: parsed.shots,
            metadata: parsed.metadata || {
              title: 'Imported Project',
              logline: '',
              genre: 'Cinema',
              visualStyle: '',
              characters: [],
            },
          });
          onClose();
        } else {
          alert('Invalid JSON: No shots array found in file.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyMarkdown = () => {
    let md = `# ${metadata?.title || 'Storyboard Shot List'}\n`;
    if (metadata?.logline) md += `**Logline:** ${metadata.logline}\n\n`;
    if (metadata?.visualStyle) md += `**Visual Aesthetic:** ${metadata.visualStyle}\n\n`;
    md += `## Sequential Shot Breakdown (${shots.length} Shots)\n\n`;

    shots.forEach((s, idx) => {
      md += `### Shot ${idx + 1}: ${s.slugline}\n`;
      md += `- **Framing:** ${s.shotType} | **Camera Move:** ${s.cameraMovement}\n`;
      md += `- **Action:** ${s.action}\n`;
      if (s.dialogue) md += `- **Dialogue:** "${s.dialogue}"\n`;
      if (s.lighting) md += `- **Lighting:** ${s.lighting}\n`;
      if (s.audioSfx) md += `- **Audio/SFX:** ${s.audioSfx}\n`;
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">{t('exportPrint')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {/* Print / Save to PDF */}
          <button
            onClick={handlePrint}
            className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">{t('printOrPdf')}</h4>
                <p className="text-xs text-zinc-400">
                  {t('printOrPdfDesc')}
                </p>
              </div>
            </div>
          </button>

          {/* Export JSON Project */}
          <button
            onClick={handleExportJSON}
            className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-zinc-950 transition-colors">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">{t('exportJson')}</h4>
                <p className="text-xs text-zinc-400">
                  {t('exportJsonDesc')}
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-white" />
          </button>

          {/* Import JSON Project */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 text-left transition-all flex items-center justify-between group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">{t('loadProject')}</h4>
                <p className="text-xs text-zinc-400">{t('loadProjectDesc')}</p>
              </div>
            </div>
          </button>

          {/* Copy Shot List Markdown */}
          <button
            onClick={handleCopyMarkdown}
            className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-zinc-950 transition-colors">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  {copied ? t('copied') : t('copyMarkdown')}
                </h4>
                <p className="text-xs text-zinc-400">
                  {t('copyMarkdownDesc')}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
