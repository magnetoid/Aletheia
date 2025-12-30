import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, ChatMessage } from '../types';
import { createInvestigationChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import { Send, Bot, User, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface AiAssistantProps {
  report: AnalysisResult;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ report }) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  const suggestedQuestions = language === 'sr' 
    ? ["Objasni skor rizika", "Napiši zahtev tužilaštvu", "Ko su povezana lica?"]
    : ["Explain the risk score", "Draft a prosecutor request", "Who are the connected entities?"];

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex items-center gap-3">
         <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
            <Sparkles className="text-sky-400 w-5 h-5" />
         </div>
         <div>
            <h3 className="text-white font-bold">{t.assistant.title}</h3>
            <p className="text-slate-400 text-xs">{t.assistant.subtitle}</p>
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                 <Bot size={16} className="text-white" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-slate-400" />
                 <span className="text-slate-400 text-xs italic">Aletheia is thinking...</span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/30">
        {messages.length < 3 && (
           <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              <span className="text-xs text-slate-500 uppercase font-bold self-center mr-1">{t.assistant.suggested}</span>
              {suggestedQuestions.map((q, idx) => (
                 <button 
                   key={idx}
                   onClick={() => handleSendMessage(q)}
                   className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-400 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
                 >
                   {q}
                 </button>
              ))}
           </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.assistant.placeholder}
            disabled={isTyping}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none disabled:opacity-50"
          />
          <button 
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;