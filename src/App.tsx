import { useState, useEffect } from "preact/hooks";
import { MemoryEntry } from "./types";
import { appActions, isLoading, error, currentEntry, filteredEntries, searchFilter } from "./stores/appStore";
import { MemoryEditor } from "./components/MemorySeal/MemoryEditor";
import { MemoryList } from "./components/MemorySeal/MemoryList";
import { DreamEcho } from "./components/DreamEchoes/DreamEcho";
import { useDreamEchoes } from "./hooks/useDreamEchoes";
import { PlusCircle, BookOpen, Settings, Heart, Moon, Search } from "lucide-preact";
import "./App.css";

type ViewMode = 'home' | 'list' | 'editor' | 'settings';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isEditing, setIsEditing] = useState(false);

  const { currentEcho, isVisible: isDreamEchoVisible, showDreamEcho, hideDreamEcho } = useDreamEchoes();

  // 初始化应用
  useEffect(() => {
    const init = async () => {
      await appActions.initialize();
      await appActions.loadEntries();
    };
    init();
  }, []);

  /**
   * 处理创建新记忆
   */
  const handleCreateNew = () => {
    appActions.setCurrentEntry(null);
    setIsEditing(false);
    setViewMode('editor');
  };

  /**
   * 处理编辑记忆
   */
  const handleEditMemory = (entry: MemoryEntry) => {
    appActions.setCurrentEntry(entry);
    setIsEditing(true);
    setViewMode('editor');
  };

  /**
   * 处理保存记忆
   */
  const handleSaveMemory = async (_entry: MemoryEntry) => {
    // 保存成功后返回列表视图
    setViewMode('list');
    appActions.setCurrentEntry(null);

    // 重新加载记忆列表
    await appActions.loadEntries();
  };

  /**
   * 处理取消编辑
   */
  const handleCancelEdit = () => {
    appActions.setCurrentEntry(null);
    setViewMode('home');
  };

  /**
   * 处理删除记忆
   */
  const handleDeleteMemory = async (entryId: string) => {
    await appActions.deleteEntry(entryId);
  };

  /**
   * 处理查看拾梦回响的完整内容
   */
  const handleViewDreamEcho = () => {
    if (currentEcho) {
      handleEditMemory(currentEcho);
      hideDreamEcho();
    }
  };

  /**
   * 渲染主页
   */
  const renderHome = () => (
    <div class="home-view">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="app-title">
            <Heart class="title-icon" size={32} />
            桃花笺
          </h1>
          <p class="app-subtitle">记录生活的美好，封存心中的记忆</p>

          <div class="hero-actions">
            <button class="btn btn-primary btn-large" onClick={handleCreateNew}>
              <PlusCircle size={20} />
              写下新的记忆
            </button>
            <button class="btn btn-secondary btn-large" onClick={() => setViewMode('list')}>
              <BookOpen size={20} />
              浏览所有记忆
            </button>
          </div>
        </div>

        <div class="hero-decoration">
          <div class="floating-petals">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                class={`petal petal-${index + 1}`}
                style={{
                  '--delay': `${index * 0.8}s`,
                  '--duration': `${4 + index * 0.5}s`,
                }}
              >
                🌸
              </div>
            ))}
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <div class="action-card" onClick={() => setViewMode('list')}>
          <Search size={24} />
          <h3>浏览记忆</h3>
          <p>查看和搜索你的所有记忆</p>
        </div>

        <div class="action-card" onClick={showDreamEcho}>
          <Moon size={24} />
          <h3>拾梦回响</h3>
          <p>随机回顾一段过往的记忆</p>
        </div>

        <div class="action-card" onClick={() => setViewMode('settings')}>
          <Settings size={24} />
          <h3>应用设置</h3>
          <p>个性化你的桃花笺体验</p>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染设置页面
   */
  const renderSettings = () => (
    <div class="settings-view">
      <div class="settings-header">
        <h2>应用设置</h2>
        <button class="btn btn-secondary" onClick={() => setViewMode('home')}>
          返回主页
        </button>
      </div>
      <div class="settings-content">
        <p>设置功能正在开发中...</p>
      </div>
    </div>
  );

  if (isLoading.value) {
    return (
      <div class="loading-screen">
        <div class="loading-spinner">
          <Heart size={32} class="spinning-heart" />
        </div>
        <p>正在加载桃花笺...</p>
      </div>
    );
  }

  return (
    <div class="app">
      {/* 错误提示 */}
      {error.value && (
        <div class="error-banner">
          <span>{error.value}</span>
          <button onClick={() => appActions.clearError()}>×</button>
        </div>
      )}

      {/* 主要内容 */}
      <main class="main-content">
        {viewMode === 'home' && renderHome()}
        {viewMode === 'list' && (
          <div class="list-view">
            <div class="list-top-bar">
              <button class="btn btn-secondary" onClick={() => setViewMode('home')}>
                返回主页
              </button>
              <button class="btn btn-primary" onClick={handleCreateNew}>
                <PlusCircle size={16} />
                新建记忆
              </button>
            </div>
            <MemoryList
              entries={filteredEntries.value}
              onSelect={handleEditMemory}
              onDelete={handleDeleteMemory}
              filter={searchFilter.value}
              onFilterChange={(f) => appActions.setSearchFilter(f)}
            />
            <style>{`
              .list-top-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                max-width: 1200px;
                margin: 0 auto;
                padding: 16px 20px 0 20px;
              }
            `}</style>
          </div>
        )}
        {viewMode === 'editor' && (
          <MemoryEditor
            entry={currentEntry.value || undefined}
            onSave={handleSaveMemory}
            onCancel={handleCancelEdit}
            isEditing={isEditing}
          />
        )}
        {viewMode === 'settings' && renderSettings()}
      </main>

      {/* 拾梦回响 */}
      {isDreamEchoVisible && currentEcho && (
        <DreamEcho
          entry={currentEcho}
          onDismiss={hideDreamEcho}
          onViewFull={handleViewDreamEcho}
        />
      )}
    </div>
  );
}

export default App;
