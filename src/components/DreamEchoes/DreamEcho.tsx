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
          transition: opacity 0.4s ease;
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
          background: linear-gradient(135deg, rgba(255, 107, 157, 0.3), rgba(102, 217, 239, 0.2));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .dream-echo-card {
          position: relative;
          max-width: 520px;
          width: 90%;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(30px) saturate(1.5);
          -webkit-backdrop-filter: blur(30px) saturate(1.5);
          border-radius: 32px;
          padding: 40px;
          box-shadow: 
            0 30px 60px rgba(255, 107, 157, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.3) inset;
          border: 1px solid rgba(255, 107, 157, 0.2);
          transform: scale(0.8) translateY(20px);
          animation: dreamEchoAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          overflow: visible;
        }

        @keyframes dreamEchoAppear {
          to {
            transform: scale(1) translateY(0);
          }
        }

        .dream-echo-card::before {
          content: '';
          position: absolute;
          top: -100px;
          left: -100px;
          right: -100px;
          bottom: -100px;
          background: 
            radial-gradient(circle at 20% 30%, rgba(255, 107, 157, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(102, 217, 239, 0.15) 0%, transparent 40%);
          pointer-events: none;
          z-index: -1;
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
          filter: drop-shadow(0 2px 4px rgba(255, 107, 157, 0.3));
          animation: float 4s ease-in-out infinite;
        }

        .wind {
          top: 30px;
          right: 30px;
          color: rgba(254, 202, 87, 0.5);
          animation-delay: 0s;
        }

        .moon {
          top: 30px;
          left: 30px;
          color: rgba(102, 217, 239, 0.5);
          animation-delay: 1s;
        }

        .star1 {
          top: 70px;
          right: 70px;
          color: rgba(255, 107, 157, 0.6);
          animation-delay: 0.5s;
        }

        .star2 {
          bottom: 100px;
          left: 50px;
          color: rgba(29, 209, 161, 0.5);
          animation-delay: 1.5s;
        }

        .star3 {
          bottom: 50px;
          right: 50px;
          color: rgba(238, 90, 111, 0.5);
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
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 157, 0.2);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #7f8c8d;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .close-btn:hover {
          background: white;
          color: #ff6b9d;
          transform: rotate(90deg) scale(1.1);
          box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
        }

        .echo-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .echo-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #ff6b9d, #feca57);
          border-radius: 50%;
          color: white;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(255, 107, 157, 0.4);
          animation: pulse 2s ease-in-out infinite;
        }

        .echo-title {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #ff6b9d, #c44569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.5px;
        }

        .echo-subtitle {
          margin: 0;
          font-size: 15px;
          color: #95a5a6;
          font-style: italic;
          letter-spacing: 0.3px;
        }

        .echo-content {
          margin-bottom: 24px;
        }

        .memory-date {
          font-size: 13px;
          color: #bdc3c7;
          text-align: center;
          margin-bottom: 16px;
          padding: 6px 16px;
          background: rgba(255, 107, 157, 0.05);
          border-radius: 20px;
          display: inline-block;
          width: auto;
        }

        .memory-title {
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
          text-align: center;
          letter-spacing: 0.3px;
        }

        .memory-content {
          line-height: 1.7;
          color: #7f8c8d;
          margin-bottom: 20px;
          padding: 20px;
          background: rgba(255, 245, 248, 0.5);
          border-radius: 16px;
          border: 1px solid rgba(255, 107, 157, 0.08);
        }

        .memory-content p {
          margin: 0 0 10px 0;
          font-size: 15px;
        }

        .memory-content p:last-child {
          margin-bottom: 0;
        }

        .memory-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }

        .emotion-tag {
          padding: 5px 12px;
          background: var(--tag-color);
          color: white;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.5s ease backwards;
        }

        .emotion-tag:nth-child(1) { animation-delay: 0.1s; }
        .emotion-tag:nth-child(2) { animation-delay: 0.2s; }
        .emotion-tag:nth-child(3) { animation-delay: 0.3s; }

        .echo-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn:active::before {
          width: 200px;
          height: 200px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ff6b9d, #c44569);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 157, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: #7f8c8d;
          border: 1px solid rgba(255, 107, 157, 0.2);
          backdrop-filter: blur(10px);
        }

        .btn-secondary:hover {
          background: white;
          color: #ff6b9d;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
          font-size: 18px;
          animation: petalFall var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
          opacity: 0.8;
          filter: drop-shadow(0 2px 4px rgba(255, 107, 157, 0.2));
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
            transform: translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            top: 100%;
            transform: translateX(50px) rotate(720deg);
            opacity: 0;
          }
        }
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
