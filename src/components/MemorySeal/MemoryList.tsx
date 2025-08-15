/**
 * 记忆列表组件
 * 显示所有记忆条目的列表
 */

import { useState } from 'preact/hooks';
import { MemoryEntry, MemoryListProps, EmotionTag, MemoryType } from '../../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Search, Filter, Edit, Trash2, Heart, Calendar, Type } from 'lucide-preact';

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

export function MemoryList({ entries, onSelect, onDelete, filter, onFilterChange }: MemoryListProps) {
  const [searchKeyword, setSearchKeyword] = useState(filter.keyword || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<MemoryType | undefined>(filter.type);
  const [selectedEmotionTags, setSelectedEmotionTags] = useState<EmotionTag[]>(filter.emotionTags || []);

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    onFilterChange({
      ...filter,
      keyword: searchKeyword.trim() || undefined,
      type: selectedType,
      emotionTags: selectedEmotionTags.length > 0 ? selectedEmotionTags : undefined,
    });
  };

  /**
   * 清除过滤器
   */
  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedType(undefined);
    setSelectedEmotionTags([]);
    onFilterChange({});
  };

  /**
   * 切换情感标签过滤
   */
  const toggleEmotionTagFilter = (tag: EmotionTag) => {
    setSelectedEmotionTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  /**
   * 格式化日期
   */
  const formatDate = (date: Date) => {
    return format(new Date(date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
  };

  /**
   * 截取内容预览
   */
  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  /**
   * 处理删除确认
   */
  const handleDelete = async (entry: MemoryEntry, event: Event) => {
    event.stopPropagation();
    
    if (confirm(`确定要删除记忆"${entry.title}"吗？此操作无法撤销。`)) {
      try {
        await onDelete(entry.id);
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  return (
    <div class="memory-list">
      {/* 搜索和过滤器 */}
      <div class="list-header">
        <div class="search-bar">
          <div class="search-input-group">
            <Search size={20} class="search-icon" />
            <input
              type="text"
              class="search-input"
              placeholder="搜索记忆..."
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.currentTarget.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button class="btn btn-primary" onClick={handleSearch}>
            搜索
          </button>
          <button
            class="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            过滤器
          </button>
        </div>

        {/* 过滤器面板 */}
        {showFilters && (
          <div class="filters-panel">
            <div class="filter-group">
              <label class="filter-label">类型</label>
              <select
                class="filter-select"
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.currentTarget.value as MemoryType || undefined)}
              >
                <option value="">全部类型</option>
                <option value={MemoryType.TEXT}>文本</option>
                <option value={MemoryType.IMAGE}>图片</option>
                <option value={MemoryType.AUDIO}>音频</option>
                <option value={MemoryType.MIXED}>混合</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">情感标签</label>
              <div class="emotion-filter-tags">
                {Object.entries(emotionTagLabels).map(([tag, label]) => (
                  <button
                    key={tag}
                    class={`emotion-filter-tag ${selectedEmotionTags.includes(tag as EmotionTag) ? 'selected' : ''}`}
                    onClick={() => toggleEmotionTagFilter(tag as EmotionTag)}
                    style={{ '--tag-color': emotionTagColors[tag as EmotionTag] }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div class="filter-actions">
              <button class="btn btn-secondary" onClick={clearFilters}>
                清除过滤器
              </button>
              <button class="btn btn-primary" onClick={handleSearch}>
                应用过滤器
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 记忆条目列表 */}
      <div class="entries-container">
        {entries.length === 0 ? (
          <div class="empty-state">
            <Heart size={48} class="empty-icon" />
            <h3>还没有记忆</h3>
            <p>开始记录你的第一段记忆吧</p>
          </div>
        ) : (
          <div class="entries-grid">
            {entries.map((entry) => (
              <div
                key={entry.id}
                class="memory-card"
                onClick={() => onSelect(entry)}
              >
                <div class="card-header">
                  <h3 class="card-title">{entry.title}</h3>
                  <div class="card-actions">
                    <button
                      class="action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(entry);
                      }}
                      title="编辑"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      class="action-btn delete-btn"
                      onClick={(e) => handleDelete(entry, e)}
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div class="card-content">
                  <p class="content-preview">
                    {getContentPreview(entry.content)}
                  </p>
                </div>

                <div class="card-footer">
                  <div class="card-meta">
                    <div class="meta-item">
                      <Calendar size={14} />
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>
                    <div class="meta-item">
                      <Type size={14} />
                      <span>{entry.metadata?.wordCount || 0} 字</span>
                    </div>
                  </div>

                  {entry.emotionTags.length > 0 && (
                    <div class="card-tags">
                      {entry.emotionTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          class="emotion-tag"
                          style={{ '--tag-color': emotionTagColors[tag] }}
                        >
                          {emotionTagLabels[tag]}
                        </span>
                      ))}
                      {entry.emotionTags.length > 3 && (
                        <span class="more-tags">+{entry.emotionTags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .memory-list {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          animation: fadeIn 0.5s ease;
        }

        .list-header {
          margin-bottom: 32px;
        }

        .search-bar {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-input-group {
          position: relative;
          flex: 1;
          max-width: 500px;
          min-width: 280px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #95a5a6;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          border: 2px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }

        .search-input:focus {
          outline: none;
          border-color: #ff6b9d;
          background: white;
          box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.1);
        }

        .search-input::placeholder {
          color: #bdc3c7;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
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
          border: 1px solid rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }

        .btn-secondary:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .filters-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(255, 107, 157, 0.1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-group {
          margin-bottom: 16px;
        }

        .filter-label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .filter-select {
          width: 200px;
          padding: 8px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
        }

        .emotion-filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .emotion-filter-tag {
          padding: 8px 16px;
          border: 2px solid var(--tag-color);
          background: rgba(255, 255, 255, 0.8);
          color: var(--tag-color);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .emotion-filter-tag::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--tag-color);
          opacity: 0;
          transition: opacity 0.25s ease;
          z-index: 0;
        }

        .emotion-filter-tag:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .emotion-filter-tag:hover::before {
          opacity: 0.1;
        }

        .emotion-filter-tag.selected {
          background: var(--tag-color);
          color: white;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .filter-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .entries-container {
          min-height: 400px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #95a5a6;
          animation: fadeIn 0.5s ease;
        }

        .empty-icon {
          color: #ff6b9d;
          margin-bottom: 20px;
          filter: drop-shadow(0 4px 8px rgba(255, 107, 157, 0.3));
          animation: pulse 2s ease-in-out infinite;
        }

        .empty-state h3 {
          margin: 0 0 12px 0;
          color: #2c3e50;
          font-size: 22px;
          font-weight: 700;
        }

        .empty-state p {
          margin: 0;
          font-size: 16px;
          color: #7f8c8d;
        }

        .entries-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
          animation: fadeIn 0.6s ease;
        }

        .memory-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.5);
          position: relative;
          overflow: hidden;
        }

        .memory-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #ff6b9d, #feca57, #66d9ef);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .memory-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 40px rgba(255, 107, 157, 0.15);
          border-color: rgba(255, 107, 157, 0.3);
        }

        .memory-card:hover::before {
          opacity: 1;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .card-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1.4;
          flex: 1;
          margin-right: 12px;
          letter-spacing: 0.3px;
        }

        .card-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .memory-card:hover .card-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 8px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .edit-btn {
          background: rgba(102, 217, 239, 0.1);
          color: #66d9ef;
        }

        .edit-btn:hover {
          background: rgba(102, 217, 239, 0.2);
          transform: scale(1.1);
        }

        .delete-btn {
          background: rgba(238, 90, 111, 0.1);
          color: #ee5a6f;
        }

        .delete-btn:hover {
          background: rgba(238, 90, 111, 0.2);
          transform: scale(1.1);
        }

        .card-content {
          margin-bottom: 16px;
        }

        .content-preview {
          margin: 0;
          color: #7f8c8d;
          line-height: 1.6;
          font-size: 15px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-meta {
          display: flex;
          gap: 16px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #95a5a6;
        }

        .meta-item svg {
          color: #bdc3c7;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .emotion-tag {
          padding: 4px 10px;
          background: var(--tag-color);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .more-tags {
          font-size: 11px;
          color: #95a5a6;
          font-weight: 600;
          background: rgba(0, 0, 0, 0.05);
          padding: 4px 8px;
          border-radius: 12px;
        }

        @media (max-width: 768px) {
          .memory-list {
            padding: 16px;
          }

          .search-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input-group {
            max-width: none;
          }

          .entries-grid {
            grid-template-columns: 1fr;
          }

          .card-actions {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
