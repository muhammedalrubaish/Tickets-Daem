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
    { role: 'assistant', content: 'مرحباً! أنا **مساعد داعم الذكي**. كيف يمكنني مساعدتك اليوم؟' }
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

    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const sendMessage = async (queryText: string) => {
    const userMessage: Message = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
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

  const handleShortcutClick = async (queryText: string) => {
    if (isLoading) return;
    await sendMessage(queryText);
  };

  const shortcuts = [
    { label: '📊 إحصائيات اليوم', query: 'أعطني إحصائيات اليوم بالتفصيل' },
    { label: '🔍 آخر بلاغ', query: 'ما هو تفاصيل آخر بلاغ تم استقباله ومن مستقبله؟' },
    { label: '⚖️ الموزع القادم', query: 'من هو الموظف الذي عليه الدور لاستقبال البلاغ القادم؟' },
    { label: '❓ البلاغات المفتوحة', query: 'كم عدد البلاغات المفتوحة (التي لم تُحل)؟' }
  ];

  // Helper function to format responses with bold, newlines, and list items
  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    const flushList = (key: string | number) => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${key}`} style={{ paddingRight: '1.25rem', marginBlock: '6px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');

      // Process bold text (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      const textToProcess = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : line;

      while ((match = boldRegex.exec(textToProcess)) !== null) {
        if (match.index > lastIndex) {
          parts.push(textToProcess.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} style={{ fontWeight: '800', color: '#ffffff' }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < textToProcess.length) {
        parts.push(textToProcess.substring(lastIndex));
      }

      const contentNode = parts.length > 0 ? parts : textToProcess;

      if (isBullet) {
        currentList.push(
          <li key={`li-${idx}`} style={{ marginBlock: '2px', color: 'inherit' }}>
            {contentNode}
          </li>
        );
      } else {
        flushList(idx);
        elements.push(
          <p key={idx} style={{ marginBlock: '4px', minHeight: '1.1em', lineHeight: '1.5', color: 'inherit' }}>
            {contentNode}
          </p>
        );
      }
    });

    flushList('end');
    return elements;
  };

  return (
    <div className={styles.aiChatWrapper}>
      {/* Chat Toggle Button */}
      <button 
        className={`${styles.chatToggleButton} ${isOpen ? styles.chatOpen : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="مساعد داعم الذكي"
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
                <h3 className={styles.chatTitle}>مساعد داعم الذكي</h3>
                <span className={styles.chatStatus}>متصل الآن</span>
              </div>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userWrapper : styles.assistantWrapper}`}>
                <div className={`${styles.messageBubble} ${m.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                  {formatMessage(m.content)}
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

          {/* Quick Actions Shortcuts */}
          <div className={styles.chatShortcuts} style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 12px',
            overflowX: 'auto',
            background: 'var(--card-bg)',
            borderTop: '1px solid var(--border)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {shortcuts.map((shortcut, sIdx) => (
              <button
                key={sIdx}
                type="button"
                disabled={isLoading}
                onClick={() => handleShortcutClick(shortcut.query)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '15px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }
                }}
              >
                {shortcut.label}
              </button>
            ))}
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
