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
          padding: 20px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .editor-title {
          margin: 0;
          color: #d4567a;
          font-size: 24px;
          font-weight: 600;
        }

        .editor-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #d4567a;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #c44569;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e0e0e0;
        }

        .editor-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .word-count {
          font-size: 12px;
          color: #999;
          font-weight: normal;
        }

        .form-input,
        .form-textarea {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
          font-family: inherit;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #d4567a;
        }

        .title-input {
          font-size: 16px;
          font-weight: 500;
        }

        .content-textarea {
          resize: vertical;
          min-height: 200px;
          line-height: 1.6;
        }

        .emotion-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .emotion-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 2px solid var(--tag-color);
          background: transparent;
          color: var(--tag-color);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .emotion-tag:hover {
          background: var(--tag-color);
          color: white;
        }

        .emotion-tag.selected {
          background: var(--tag-color);
          color: white;
        }

        .content-preview {
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .preview-title {
          margin: 0 0 12px 0;
          color: #d4567a;
          font-size: 18px;
          font-weight: 600;
        }

        .preview-content {
          margin-bottom: 12px;
          line-height: 1.6;
          color: #333;
        }

        .preview-content p {
          margin: 0 0 8px 0;
        }

        .preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .preview-tag {
          padding: 4px 8px;
          background: var(--tag-color);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
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
