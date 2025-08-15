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
          padding: 20px;
        }

        .list-header {
          margin-bottom: 24px;
        }

        .search-bar {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .search-input-group {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #d4567a;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-primary {
          background: #d4567a;
          color: white;
        }

        .btn-primary:hover {
          background: #c44569;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .filters-panel {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e0e0e0;
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
          padding: 6px 12px;
          border: 2px solid var(--tag-color);
          background: transparent;
          color: var(--tag-color);
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .emotion-filter-tag:hover,
        .emotion-filter-tag.selected {
          background: var(--tag-color);
          color: white;
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
          padding: 60px 20px;
          color: #999;
        }

        .empty-icon {
          color: #d4567a;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #666;
        }

        .empty-state p {
          margin: 0;
        }

        .entries-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .memory-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .memory-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          border-color: #d4567a;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
          flex: 1;
          margin-right: 12px;
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
          padding: 6px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-btn {
          background: #f0f8ff;
          color: #4a90e2;
        }

        .edit-btn:hover {
          background: #e6f3ff;
        }

        .delete-btn {
          background: #fff0f0;
          color: #e74c3c;
        }

        .delete-btn:hover {
          background: #ffe6e6;
        }

        .card-content {
          margin-bottom: 16px;
        }

        .content-preview {
          margin: 0;
          color: #666;
          line-height: 1.5;
          font-size: 14px;
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
          gap: 4px;
          font-size: 12px;
          color: #999;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .emotion-tag {
          padding: 3px 8px;
          background: var(--tag-color);
          color: white;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 500;
        }

        .more-tags {
          font-size: 10px;
          color: #999;
          font-weight: 500;
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
