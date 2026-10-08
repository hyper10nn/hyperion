import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, ChatModel, StoryboardShot, DirectorRole } from '../types';
import { SupportedLanguage, getTranslation } from '../i18n';

interface DirectorChatProps {
  isOpen: boolean;
  onClose: () => void;
  scriptContext: string;
  currentShots: StoryboardShot[];
  onInsertSuggestedShot: (suggested: any) => void;
  currentLanguage: SupportedLanguage;
}

export const getLocalizedRoles = (lang: SupportedLanguage): DirectorRole[] => {
  const isTr = lang === 'tr';
  const isDe = lang === 'de';
  const isKo = lang === 'ko';
  const isZh = lang === 'zh';

  return [
    {
      id: 'lead-director',
      name: isTr
        ? 'Baş Yönetmen & Görüntü Yönetmeni'
        : isDe
        ? 'Chefregisseur & Kameramann'
        : isKo
        ? '총괄 감독 & 촬영 감독'
        : isZh
        ? '主导导演与摄影指导 (DP)'
        : 'Lead Director & Cinematographer',
      title: 'Visual Storytelling & Framing',
      description: 'Expertise in shot composition, lens choice, emotional subtext, and pacing.',
      systemInstruction:
        'You are a veteran Hollywood Film Director and Master Cinematographer. Your job is to advise the creator on visual storytelling, camera angles, color grading, and dramatic shot composition.',
    },
    {
      id: 'script-doctor',
      name: isTr
        ? 'Senaryo Doktoru & Hikaye Danışmanı'
        : isDe
        ? 'Script Doctor & Story Consultant'
        : isKo
        ? '시나리오 닥터 & 스토리 컨설턴트'
        : isZh
        ? '剧本医生与故事顾问'
        : 'Script Doctor & Story Consultant',
      title: 'Pacing, Dialogue & Narrative Tension',
      description: 'Refines dramatic beats, character conflict, subtext, and scene transitions.',
      systemInstruction:
        'You are an acclaimed Script Doctor. Your focus is screenplay structure, scene pacing, tension escalation, character motivations, and compelling narrative visual hooks.',
    },
    {
      id: 'lighting-vfx',
      name: isTr
        ? 'Işık & Görsel Efekt (VFX) Süpervizörü'
        : isDe
        ? 'Beleuchtung & VFX Supervisor'
        : isKo
        ? '조명 및 VFX 슈퍼바이저'
        : isZh
        ? '灯光设计与视效总监 (VFX)'
        : 'Lighting & VFX Supervisor',
      title: 'Color Palettes & Atmosphere',
      description: 'Specializes in volumetric lighting, practical keys, shadows, and VFX setups.',
      systemInstruction:
        'You are a premier Lighting Designer and VFX Supervisor. Advise on practical fixtures, color palettes, chiaroscuro contrast, volumetric fog, rim lighting, and photorealistic visual effects.',
    },
    {
      id: 'camera-operator',
      name: isTr
        ? 'A-Kamera Operatörü & Sahneleme'
        : isDe
        ? 'Kameraoperator & Blocking'
        : isKo
        ? 'A-카메라 오퍼레이터 & 블로킹'
        : isZh
        ? 'A机摄影师与演员走位调度'
        : 'A-Camera Operator & Blocking',
      title: 'Camera Movement & Spatial Continuity',
      description: 'Focuses on dolly moves, steadicam paths, axis of action, and actor blocking.',
      systemInstruction:
        'You are a veteran A-Camera Operator. Advise on camera motion, dolly tracks, crane shots, Dutch angles, 180-degree rule continuity, and actor blocking.',
    },
  ];
};

export const DirectorChat: React.FC<DirectorChatProps> = ({
  isOpen,
  onClose,
  scriptContext,
  currentShots,
  onInsertSuggestedShot,
  currentLanguage,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);
  const roles = getLocalizedRoles(currentLanguage);

  const getWelcomeMessage = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'tr':
        return 'CineBoard Yönetmen Süitine hoş geldiniz! Ben sizin Yapay Zeka Film Yönetmeniniz ve Görüntü Yönetmeninizim. Senaryonuzu ve mevcut storyboard karelerinizi inceledim. Sahneleme, kamera hareketleri, lens seçimleri, ışık planları veya yeni çekim kareleri ekleme konusunda bana her şeyi sorabilirsiniz!';
      case 'de':
        return 'Willkommen in der CineBoard Regie-Suite! Ich bin Ihr KI-Regisseur und Kameramann. Ich habe Ihr Drehbuch analysiert. Fragen Sie mich nach Kameraeinstellungen, Licht oder neuen Storyboard-Shots!';
      case 'ko':
        return 'CineBoard 감독 스위트에 오신 것을 환영합니다! 저는 귀하의 AI 영화 감독이자 촬영 감독입니다. 현재 시나리오와 스토리보드를 검토했습니다. 쇼트 블로킹, 조명 설계, 렌즈 추천 등 무엇이든 질문하세요!';
      case 'zh':
        return '欢迎来到 CineBoard 导演控制台！我是您的 AI 电影导演与摄影指导。我已经审阅了您的当前剧本和分镜镜头。您可以随时向我咨询镜头调度、机位移动、灯光色彩，或让我为您推荐新的分镜！';
      default:
        return "Welcome to the CineBoard Director's Suite. I'm your AI Director and Cinematographer. I've reviewed your current script and storyboard shots. Ask me anything about shot blocking, lighting schemes, lens selections, pacing, or ask me to design new storyboard shots!";
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      content: getWelcomeMessage(currentLanguage),
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ChatModel>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<string>('lead-director');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Update welcome message if language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        return [
          {
            ...prev[0],
            content: getWelcomeMessage(currentLanguage),
          },
        ];
      }
      return prev;
    });
  }, [currentLanguage]);

  if (!isOpen) return null;

  const currentRoleObj = roles.find((r) => r.id === selectedRole) || roles[0];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          role: selectedRole,
          systemInstruction: currentRoleObj.systemInstruction,
          scriptContext,
          currentShots,
          targetLanguage: currentLanguage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Chat request failed');
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: data.reply || 'No response returned.',
        timestamp: Date.now(),
        suggestedShot: data.suggestedShot,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: `Error: ${err.message || 'Unable to connect to AI Director.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickPrompts = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'tr':
        return [
          'Açılış karesinde dramatik gerilimi nasıl artırabiliriz?',
          'Sonraki sahneye geçiş için dinamik bir kamera hareketi öner',
          'Bu sekans için lens seçimleri (geniş açı vs tele) nasıl olmalı?',
          'Karakterin tepkisi için bir yakın plan (close-up) kare öner',
        ];
      case 'de':
        return [
          'Wie können wir die dramatische Spannung in Shot 1 steigern?',
          'Schlage einen dynamischen Übergang zur nächsten Szene vor',
          'Welche Objektive (Weitwinkel vs Tele) empfehlen Sie hier?',
          'Schlage eine Nahaufnahme als Zwischenschnitt vor',
        ];
      case 'ko':
        return [
          '오프닝 쇼트의 극적 긴장감을 높이려면 어떻게 해야 할까요?',
          '다음 씬으로 넘어가는 역동적인 카메라 무빙을 추천해주세요',
          '이 시퀀스에 적합한 렌즈(광각 vs 망원) 구성은 무엇인가요?',
          '인물의 감정을 극대화할 클로즈업 인서트 쇼트를 제안해주세요',
        ];
      case 'zh':
        return [
          '如何增强开场镜头的戏剧张力与压迫感？',
          '请为转场至下一场景推荐一组动感运镜方案',
          '针对本组镜头，推荐搭配何种焦段镜头（广角还是长焦）？',
          '请推荐一个展现角色微表情的特写（Close-Up）镜头',
        ];
      default:
        return [
          'How can we increase dramatic tension in our opening shot?',
          'Suggest a dynamic camera move to transition into the next scene',
          'Recommend lens choices (wide vs telephoto) for this sequence',
          'Suggest an extreme close-up reaction shot to insert',
        ];
    }
  };

  const quickPrompts = getQuickPrompts(currentLanguage);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{t('directorSuite')}</h3>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {t('multiTurn')}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
              {currentRoleObj.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role & Model Controls (Required features) */}
      <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 space-y-2">
        {/* Model Selection */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0">
            {t('geminiModel')}:
          </span>
          <div className="grid grid-cols-3 gap-1 w-full max-w-[340px]">
            <button
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all text-center truncate ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
              title="gemini-3.5-flash: General tasks"
            >
              3.5 Flash
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all text-center truncate ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
              title="gemini-3.1-pro-preview: Complex tasks"
            >
              3.1 Pro (Deep)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all text-center truncate ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
              title="gemini-3.1-flash-lite: Fast tasks"
            >
              Flash Lite
            </button>
          </div>
        </div>

        {/* Persona Role Selection */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0">
            {t('consultantRole')}:
          </span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full max-w-[340px] bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 outline-none cursor-pointer"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id} className="bg-zinc-900 text-zinc-200">
                {role.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message Thread (Scrollable) */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-zinc-700 text-white'
                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 shadow-sm ${
                  isUser
                    ? 'bg-amber-500 text-zinc-950 font-medium'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Interactive Suggested Shot Widget */}
                {message.suggestedShot && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('recommendedShot')}</span>
                    </div>
                    <div className="text-[11px] text-zinc-300 space-y-1">
                      <div className="font-semibold text-zinc-200">
                        {message.suggestedShot.shotType || 'Shot'}: {message.suggestedShot.action}
                      </div>
                      {message.suggestedShot.cameraMovement && (
                        <div className="text-zinc-400">
                          {t('cameraMovement')}: {message.suggestedShot.cameraMovement}
                        </div>
                      )}
                      {message.suggestedShot.lighting && (
                        <div className="text-zinc-400">
                          {t('lightingScheme')}: {message.suggestedShot.lighting}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onInsertSuggestedShot(message.suggestedShot)}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('insertIntoStoryboard')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>{t('directorThinking')} ({selectedModel})</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-4 py-2 bg-zinc-900/30 border-t border-zinc-800/60 overflow-x-auto custom-scrollbar flex gap-1.5">
        {quickPrompts.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 whitespace-nowrap transition-colors shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('askDirector')}
            disabled={isLoading}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors shadow-md shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
