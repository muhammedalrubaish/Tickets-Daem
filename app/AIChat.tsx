'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface AIChatProps {
  stats?: any;
}

export default function AIChat({ stats }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'مرحباً! أنا مساعد بلدي الذكي. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          stats: stats 
        }),
      });

      const data = await response.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'عذراً، يبدو أن هناك مشكلة في الاتصال بالمساعد الذكي. تأكد من إعداد مفتاح API الخاص بـ Gemini.' }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.aiChatWrapper}>
      {/* Chat Toggle Button */}
      <button 
        className={`${styles.chatToggleButton} ${isOpen ? styles.chatOpen : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="المساعد الذكي"
      >
        {isOpen ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <span style={{fontSize: '2rem'}}>🤖</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <span className={styles.aiAvatar}>🤖</span>
              <div>
                <h3 className={styles.chatTitle}>مساعد بلدي الذكي</h3>
                <span className={styles.chatStatus}>متصل الآن</span>
              </div>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userWrapper : styles.assistantWrapper}`}>
                <div className={`${styles.messageBubble} ${m.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={styles.assistantWrapper}>
                <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                  <span className={styles.typingDots}>...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={styles.chatInputArea}>
            <input 
              type="text" 
              className={styles.chatInput} 
              placeholder="اكتب سؤالك هنا..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className={styles.chatSendBtn} disabled={isLoading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
