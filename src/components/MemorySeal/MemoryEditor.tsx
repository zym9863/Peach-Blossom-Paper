/**
 * 记忆编辑器组件
 * 用于创建和编辑记忆条目
 */

import { useState, useEffect } from 'preact/hooks';
import { MemoryEntry, MemoryType, EmotionTag, MemoryEditorProps } from '../../types';
import { appActions } from '../../stores/appStore';
import { Save, X, Smile, Frown, Star, Clock, Anchor, Target } from 'lucide-preact';

const emotionTagOptions = [
  { tag: EmotionTag.JOY, label: '喜悦', icon: Smile, color: '#FFD700' },
  { tag: EmotionTag.SADNESS, label: '悲伤', icon: Frown, color: '#87CEEB' },
  { tag: EmotionTag.NOSTALGIA, label: '怀念', icon: Clock, color: '#DDA0DD' },
  { tag: EmotionTag.HOPE, label: '希望', icon: Star, color: '#98FB98' },
  { tag: EmotionTag.REGRET, label: '悔过', icon: X, color: '#F0E68C' },
  { tag: EmotionTag.ATTACHMENT, label: '难舍', icon: Anchor, color: '#FFB6C1' },
  { tag: EmotionTag.PERSISTENCE, label: '执着', icon: Target, color: '#FFA07A' },
];

export function MemoryEditor({ entry, onSave, onCancel, isEditing }: MemoryEditorProps) {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [selectedTags, setSelectedTags] = useState<EmotionTag[]>(entry?.emotionTags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // 计算字数
  useEffect(() => {
    setWordCount(content.length);
  }, [content]);

  /**
   * 处理情感标签切换
   */
  const toggleEmotionTag = (tag: EmotionTag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  /**
   * 处理保存
   */
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      appActions.setError('标题和内容不能为空');
      return;
    }

    try {
      setIsSaving(true);
      
      let savedEntry: MemoryEntry;
      
      if (isEditing && entry) {
        // 更新现有条目
        savedEntry = await appActions.updateEntry(
          entry.id,
          title.trim(),
          content.trim(),
          selectedTags
        );
      } else {
        // 创建新条目
        savedEntry = await appActions.createEntry(
          title.trim(),
          content.trim(),
          MemoryType.TEXT,
          selectedTags
        );
      }
      
      await onSave(savedEntry);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    onCancel();
  };

  return (
    <div class="memory-editor">
      <div class="editor-header">
        <h2 class="editor-title">
          {isEditing ? '编辑记忆' : '新建记忆'}
        </h2>
        <div class="editor-actions">
          <button
            class="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X size={16} />
            取消
          </button>
          <button
            class="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
          >
            <Save size={16} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div class="editor-content">
        {/* 标题输入 */}
        <div class="form-group">
          <label class="form-label">标题</label>
          <input
            type="text"
            class="form-input title-input"
            value={title}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="为这段记忆起个标题..."
            maxLength={100}
          />
        </div>

        {/* 内容编辑 */}
        <div class="form-group">
          <label class="form-label">
            内容
            <span class="word-count">({wordCount} 字)</span>
          </label>
          <textarea
            class="form-textarea content-textarea"
            value={content}
            onInput={(e) => setContent(e.currentTarget.value)}
            placeholder="在这里写下你的记忆、感受或想法..."
            rows={12}
          />
        </div>

        {/* 情感标签选择 */}
        <div class="form-group">
          <label class="form-label">情感标签</label>
          <div class="emotion-tags">
            {emotionTagOptions.map(({ tag, label, icon: Icon, color }) => (
              <button
                key={tag}
                class={`emotion-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleEmotionTag(tag)}
                style={{ '--tag-color': color }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 预览区域 */}
        {content && (
          <div class="form-group">
            <label class="form-label">预览</label>
            <div class="content-preview">
              <h3 class="preview-title">{title || '无标题'}</h3>
              <div class="preview-content">
                {content.split('\n').map((line, index) => (
                  <p key={index}>{line || '\u00A0'}</p>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div class="preview-tags">
                  {selectedTags.map(tag => {
                    const tagOption = emotionTagOptions.find(opt => opt.tag === tag);
                    return tagOption ? (
                      <span
                        key={tag}
                        class="preview-tag"
                        style={{ '--tag-color': tagOption.color }}
                      >
                        {tagOption.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .memory-editor {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.5);
          animation: fadeIn 0.5s ease;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(255, 107, 157, 0.1);
          position: relative;
        }

        .editor-header::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 80px;
          height: 2px;
          background: linear-gradient(90deg, #ff6b9d, transparent);
        }

        .editor-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #ff6b9d, #c44569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.5px;
        }

        .editor-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
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

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ff6b9d, #c44569);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 157, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.8);
          color: #666;
          border: 1px solid rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .editor-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .form-label {
          font-weight: 600;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          letter-spacing: 0.3px;
        }

        .word-count {
          font-size: 12px;
          color: #95a5a6;
          font-weight: normal;
          background: rgba(255, 107, 157, 0.1);
          padding: 2px 8px;
          border-radius: 12px;
        }

        .form-input,
        .form-textarea {
          padding: 14px 16px;
          border: 2px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
          font-family: inherit;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #ff6b9d;
          background: white;
          box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.1);
        }

        .title-input {
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .content-textarea {
          resize: vertical;
          min-height: 240px;
          line-height: 1.7;
          font-size: 15px;
        }

        .emotion-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .emotion-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: 2px solid var(--tag-color);
          background: rgba(255, 255, 255, 0.8);
          color: var(--tag-color);
          border-radius: 24px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .emotion-tag::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--tag-color);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .emotion-tag > * {
          position: relative;
          z-index: 1;
        }

        .emotion-tag:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .emotion-tag:hover::before {
          opacity: 0.1;
        }

        .emotion-tag.selected {
          background: var(--tag-color);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.05);
        }

        .emotion-tag.selected::before {
          opacity: 1;
        }

        .content-preview {
          padding: 20px;
          background: linear-gradient(135deg, rgba(255, 245, 248, 0.8) 0%, rgba(255, 232, 237, 0.8) 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 107, 157, 0.1);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .preview-title {
          margin: 0 0 16px 0;
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #ff6b9d, #c44569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .preview-content {
          margin-bottom: 16px;
          line-height: 1.7;
          color: #2c3e50;
          font-size: 15px;
        }

        .preview-content p {
          margin: 0 0 10px 0;
        }

        .preview-content p:last-child {
          margin-bottom: 0;
        }

        .preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 107, 157, 0.1);
        }

        .preview-tag {
          padding: 5px 12px;
          background: var(--tag-color);
          color: white;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .memory-editor {
            margin: 0;
            padding: 16px;
            border-radius: 0;
          }

          .editor-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .editor-actions {
            justify-content: center;
          }

          .emotion-tags {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
