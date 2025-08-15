/**
 * 拾梦回响组件
 * 显示随机的记忆片段
 */

import { useState, useEffect } from 'preact/hooks';
import { DreamEchoProps, EmotionTag } from '../../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X, Eye, Heart, Wind, Moon, Star } from 'lucide-preact';

const emotionTagLabels = {
  [EmotionTag.JOY]: '喜悦',
  [EmotionTag.SADNESS]: '悲伤',
  [EmotionTag.NOSTALGIA]: '怀念',
  [EmotionTag.HOPE]: '希望',
  [EmotionTag.REGRET]: '悔过',
  [EmotionTag.ATTACHMENT]: '难舍',
  [EmotionTag.PERSISTENCE]: '执着',
};

const emotionTagColors = {
  [EmotionTag.JOY]: '#FFD700',
  [EmotionTag.SADNESS]: '#87CEEB',
  [EmotionTag.NOSTALGIA]: '#DDA0DD',
  [EmotionTag.HOPE]: '#98FB98',
  [EmotionTag.REGRET]: '#F0E68C',
  [EmotionTag.ATTACHMENT]: '#FFB6C1',
  [EmotionTag.PERSISTENCE]: '#FFA07A',
};

export function DreamEcho({ entry, onDismiss, onViewFull }: DreamEchoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // 延迟显示动画
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * 处理关闭
   */
  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  /**
   * 处理查看完整内容
   */
  const handleViewFull = () => {
    onViewFull();
  };

  /**
   * 格式化日期
   */
  const formatDate = (date: Date) => {
    return format(new Date(date), 'yyyy年MM月dd日', { locale: zhCN });
  };

  /**
   * 获取内容预览
   */
  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  /**
   * 获取随机的诗意句子
   */
  const getPoetryLine = () => {
    const lines = [
      '风吹开了记忆的锁',
      '梦醒后想起你',
      '桃花落，闲池阁',
      '时光荏苒，记忆如花',
      '往事如烟，情深如海',
      '岁月静好，回忆温柔',
      '花开花落，缘起缘灭',
      '浮生若梦，为欢几何',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  };

  return (
    <div class={`dream-echo-overlay ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}>
      <div class="dream-echo-backdrop" onClick={handleDismiss} />
      
      <div class="dream-echo-card">
        {/* 装饰元素 */}
        <div class="decoration-elements">
          <Wind class="decoration-icon wind" size={20} />
          <Moon class="decoration-icon moon" size={16} />
          <Star class="decoration-icon star1" size={12} />
          <Star class="decoration-icon star2" size={10} />
          <Star class="decoration-icon star3" size={8} />
        </div>

        {/* 关闭按钮 */}
        <button class="close-btn" onClick={handleDismiss}>
          <X size={20} />
        </button>

        {/* 标题区域 */}
        <div class="echo-header">
          <div class="echo-icon">
            <Heart size={24} />
          </div>
          <h2 class="echo-title">拾梦回响</h2>
          <p class="echo-subtitle">{getPoetryLine()}</p>
        </div>

        {/* 记忆内容 */}
        <div class="echo-content">
          <div class="memory-date">
            {formatDate(entry.createdAt)}
          </div>
          
          <h3 class="memory-title">{entry.title}</h3>
          
          <div class="memory-content">
            {getContentPreview(entry.content).split('\n').map((line, index) => (
              <p key={index}>{line || '\u00A0'}</p>
            ))}
          </div>

          {entry.emotionTags.length > 0 && (
            <div class="memory-tags">
              {entry.emotionTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  class="emotion-tag"
                  style={{ '--tag-color': emotionTagColors[tag] }}
                >
                  {emotionTagLabels[tag]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div class="echo-actions">
          <button class="btn btn-secondary" onClick={handleDismiss}>
            <X size={16} />
            稍后再看
          </button>
          <button class="btn btn-primary" onClick={handleViewFull}>
            <Eye size={16} />
            查看完整
          </button>
        </div>

        {/* 桃花飘落动画 */}
        <div class="petals">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              class={`petal petal-${index + 1}`}
              style={{
                '--delay': `${index * 0.5}s`,
                '--duration': `${3 + index * 0.5}s`,
              }}
            >
              🌸
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dream-echo-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .dream-echo-overlay.visible {
          opacity: 1;
        }

        .dream-echo-overlay.closing {
          opacity: 0;
        }

        .dream-echo-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }

        .dream-echo-card {
          position: relative;
          max-width: 500px;
          width: 90%;
          background: linear-gradient(135deg, #fff5f8 0%, #ffe8ed 100%);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(212, 86, 122, 0.3);
          border: 2px solid rgba(212, 86, 122, 0.2);
          transform: scale(0.9);
          animation: dreamEchoAppear 0.3s ease forwards;
          overflow: hidden;
        }

        @keyframes dreamEchoAppear {
          to {
            transform: scale(1);
          }
        }

        .decoration-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .decoration-icon {
          position: absolute;
          color: rgba(212, 86, 122, 0.3);
          animation: float 3s ease-in-out infinite;
        }

        .wind {
          top: 20px;
          right: 20px;
          animation-delay: 0s;
        }

        .moon {
          top: 20px;
          left: 20px;
          animation-delay: 1s;
        }

        .star1 {
          top: 60px;
          right: 60px;
          animation-delay: 0.5s;
        }

        .star2 {
          bottom: 80px;
          left: 40px;
          animation-delay: 1.5s;
        }

        .star3 {
          bottom: 40px;
          right: 40px;
          animation-delay: 2s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.8);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #666;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 1);
          color: #333;
          transform: scale(1.1);
        }

        .echo-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .echo-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #d4567a, #ff6b9d);
          border-radius: 50%;
          color: white;
          margin-bottom: 12px;
        }

        .echo-title {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #d4567a;
          text-shadow: 0 2px 4px rgba(212, 86, 122, 0.2);
        }

        .echo-subtitle {
          margin: 0;
          font-size: 14px;
          color: #999;
          font-style: italic;
        }

        .echo-content {
          margin-bottom: 24px;
        }

        .memory-date {
          font-size: 12px;
          color: #999;
          text-align: center;
          margin-bottom: 12px;
        }

        .memory-title {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          text-align: center;
        }

        .memory-content {
          line-height: 1.6;
          color: #555;
          margin-bottom: 16px;
        }

        .memory-content p {
          margin: 0 0 8px 0;
        }

        .memory-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }

        .emotion-tag {
          padding: 4px 10px;
          background: var(--tag-color);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .echo-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #d4567a;
          color: white;
        }

        .btn-primary:hover {
          background: #c44569;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.8);
          color: #666;
          border: 1px solid rgba(212, 86, 122, 0.3);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 1);
          color: #333;
          transform: translateY(-1px);
        }

        .petals {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .petal {
          position: absolute;
          font-size: 16px;
          animation: petalFall var(--duration) linear infinite;
          animation-delay: var(--delay);
          opacity: 0.7;
        }

        .petal-1 { left: 10%; }
        .petal-2 { left: 20%; }
        .petal-3 { left: 40%; }
        .petal-4 { left: 60%; }
        .petal-5 { left: 80%; }
        .petal-6 { left: 90%; }

        @keyframes petalFall {
          0% {
            top: -20px;
            transform: rotate(0deg);
          }
          100% {
            top: 100%;
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .dream-echo-card {
            width: 95%;
            padding: 24px;
          }

          .echo-actions {
            flex-direction: column;
          }

          .btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
