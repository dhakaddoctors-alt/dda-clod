'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { chatWithAI } from '@/app/actions/aiActions';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', content: 'Hi there! 👋 I am the DDA Support Bot. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    
    // Add user message to UI
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userMsg };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    // Call AI Backend Action
    const response = await chatWithAI(userMsg);
    
    setIsTyping(false);
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', content: response.reply };
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 ${isOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open AI Support"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 pb-6 flex justify-between items-start text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex justify-center items-center backdrop-blur-sm shadow-inner">
               <Bot className="w-6 h-6" />
             </div>
             <div>
               <h3 className="font-bold flex items-center gap-1">DDA Assist <Sparkles className="w-3 h-3 text-yellow-300" /></h3>
               <p className="text-xs text-blue-100">Smart Support Agent</p>
             </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Wave SVG to blend header and chat body seamlessly */}
        <div className="w-full bg-transparent -mt-5 flex-shrink-0 z-10">
          <svg viewBox="0 0 1440 120" className="w-full h-8 text-white fill-current block" preserveAspectRatio="none">
             <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50/50 -mt-2">
          {messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-200' : 'bg-blue-100'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-gray-500" /> : <Bot className="w-4 h-4 text-blue-600" />}
                  </div>

                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>

               </div>
             </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start">
               <div className="flex gap-2 max-w-[85%] flex-row">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-blue-100">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="p-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2 items-center bg-gray-50 rounded-full border border-gray-200 p-1 pl-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
             <input 
               type="text" 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               placeholder="Ask me anything..."
               className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
               disabled={isTyping}
             />
             <button 
               type="submit" 
               disabled={!inputValue.trim() || isTyping}
               className="w-10 h-10 flex border-none focus-within:outline-none items-center justify-center bg-blue-600 text-white rounded-full shrink-0 shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:scale-95 transition-all outline-none"
             >
               <Send className="w-4 h-4 ml-0.5" />
             </button>
          </form>
        </div>

      </div>
    </>
  );
}
