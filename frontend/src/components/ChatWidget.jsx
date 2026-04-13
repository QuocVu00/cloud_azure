import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Chào bạn! Tôi là Gemini AI, tôi có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch usage on open
  useEffect(() => {
    if (isOpen) {
      fetchUsage();
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/ai/usage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsage(res.data);
    } catch (err) {
      console.error('Failed to fetch AI usage');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/ai/chat', 
        { prompt: userMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
      if (res.data.usage) {
        setUsage(prev => ({
            ...prev,
            count: res.data.usage.count,
            remaining: res.data.usage.remaining
        }));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Không thể kết nối với AI.';
      setError(errorMsg);
      setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu này.', isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-2xl shadow-blue-900/40 transition-all duration-300 hover:scale-110 active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <MessageSquare className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl shadow-3xl w-[380px] h-[520px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-blue-100" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Gemini Assistant</h3>
                <p className="text-blue-200 text-[10px] font-medium uppercase tracking-widest">Powered by Google AI</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Usage Info Bar */}
          {usage && (
            <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-800 flex items-center justify-between text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-tight">Hạn mức sử dụng ({usage.plan})</span>
              <span className={`${usage.remaining === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {usage.unlimited ? 'VÔ HẠN' : `${usage.remaining || 0} / ${usage.limit || 10} câu còn lại`}
              </span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] space-x-2 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    m.role === 'user' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-blue-600/20 border-blue-500/20 text-blue-400'
                  }`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                      : m.isError 
                        ? 'bg-red-500/20 text-red-200 border border-red-500/30 rounded-tl-none'
                        : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700/50'
                  }`}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex space-x-2 items-center bg-gray-800/50 px-4 py-2 rounded-2xl border border-gray-700/50">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-xs text-gray-400 italic">Gemini đang suy nghĩ...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-red-400 font-medium">{error}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="relative">
              <input 
                type="text"
                placeholder="Hỏi AI bất cứ điều gì..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:ring-2 focus:ring-blue-500/50 placeholder-gray-600 transition-all outline-none"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                  input.trim() && !loading ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-500'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
