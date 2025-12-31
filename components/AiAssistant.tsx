import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, ChatMessage } from '../types';
import { createInvestigationChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import { Send, Bot, User, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface AiAssistantProps {
  report: AnalysisResult;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ report }) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session when component mounts or report changes
    if (report) {
      chatSessionRef.current = createInvestigationChat(report.report, language);
      setMessages([{
        id: 'init',
        role: 'model',
        content: language === 'sr' 
           ? `Ja sam Aletheia AI. Analizirao sam slučaj "${report.report.target}". Spreman sam da odgovorim na dodatna pitanja, sastavim pravne dokumente ili objasnim specifične nalaze.`
           : `I am Aletheia AI. I have analyzed the case of "${report.report.target}". I am ready to answer follow-up questions, draft legal documents, or explain specific findings.`,
        timestamp: Date.now()
      }]);
    }
  }, [report, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: text });
      const responseText = result.text || (language === 'sr' ? "Nisam uspeo da generišem odgovor." : "I could not generate a response.");

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
         id: crypto.randomUUID(),
         role: 'model',
         content: language === 'sr' ? "Došlo je do greške u komunikaciji sa AI modelom." : "An error occurred while communicating with the AI model.",
         timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple formatter to handle bold text (e.g. **text**)
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-emerald-300 font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const suggestedQuestions = language === 'sr' 
    ? ["Objasni skor rizika", "Napiši zahtev tužilaštvu", "Ko su povezana lica?"]
    : ["Explain the risk score", "Draft a prosecutor request", "Who are the connected entities?"];

  return (
    <div className="flex flex-col h-[600px] bg-[#0b1120] rounded-xl border border-slate-700 overflow-hidden animate-fade-in shadow-2xl relative">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"></div>

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-2 rounded-lg shadow-lg shadow-sky-500/20">
                <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
                <h3 className="text-white font-bold tracking-wide">{t.assistant.title}</h3>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider">{t.assistant.subtitle}</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
         </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' 
                : 'bg-gradient-to-br from-emerald-600 to-teal-800'
            }`}>
              {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
            </div>

            {/* Message Bubble */}
            <div className={`relative max-w-[85%] rounded-2xl p-5 text-sm leading-7 shadow-xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-500/50' 
                : 'bg-slate-800/90 text-slate-200 border border-slate-700 rounded-tl-none backdrop-blur-sm'
            }`}>
              <div className="whitespace-pre-wrap font-sans">
                {msg.role === 'model' ? renderFormattedText(msg.content) : msg.content}
              </div>

              {/* Timestamp & Actions */}
              <div className={`mt-2 flex items-center gap-3 opacity-60 text-[10px] uppercase font-bold tracking-wider ${
                  msg.role === 'user' ? 'justify-end text-indigo-200' : 'justify-start text-slate-500'
              }`}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  {msg.role === 'model' && (
                      <button 
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                        title="Copy to clipboard"
                      >
                         {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                         {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                  )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center flex-shrink-0 shadow-lg">
                 <Bot size={20} className="text-white" />
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl rounded-tl-none px-6 py-4 flex items-center gap-3 shadow-inner">
                 <Loader2 size={18} className="animate-spin text-emerald-400" />
                 <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase animate-pulse">Processing...</span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-4 border-t border-slate-700 bg-slate-900/90 backdrop-blur-md">
        {messages.length < 3 && (
           <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[10px] text-slate-500 uppercase font-bold self-center mr-2 tracking-widest">{t.assistant.suggested}</span>
              {suggestedQuestions.map((q, idx) => (
                 <button 
                   key={idx}
                   onClick={() => handleSendMessage(q)}
                   className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-sky-500 text-slate-300 hover:text-white text-xs px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-sm"
                 >
                   {q}
                 </button>
              ))}
           </div>
        )}
        <div className="relative group">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.assistant.placeholder}
            disabled={isTyping}
            rows={1}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-14 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none disabled:opacity-50 resize-none overflow-hidden transition-all shadow-inner font-sans"
            style={{ minHeight: '56px' }}
          />
          <button 
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-900/20 flex items-center justify-center group-focus-within:bg-sky-500"
          >
            <Send size={18} className={isTyping ? 'opacity-0' : 'opacity-100'} />
            {isTyping && <Loader2 size={18} className="absolute animate-spin" />}
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">Aletheia AI generated content may require independent verification.</p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;