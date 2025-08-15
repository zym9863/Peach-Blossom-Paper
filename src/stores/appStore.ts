/**
 * 应用状态管理
 * 使用简单的状态管理模式
 */

import { signal, computed } from '@preact/signals';
import { invoke } from '@tauri-apps/api/core';
import { 
  MemoryEntry, 
  UserSettings, 
  DreamEchoConfig, 
  SearchFilter, 
  ApiResponse,
  MemoryType,
  EmotionTag 
} from '../types';

// 应用状态信号
export const isLoading = signal(false);
export const isAuthenticated = signal(false);
export const currentEntry = signal<MemoryEntry | null>(null);
export const entries = signal<MemoryEntry[]>([]);
export const searchFilter = signal<SearchFilter>({});
export const settings = signal<UserSettings | null>(null);
export const dreamConfig = signal<DreamEchoConfig | null>(null);
export const error = signal<string | null>(null);

// 计算属性
export const filteredEntries = computed(() => {
  const allEntries = entries.value;
  const filter = searchFilter.value;
  
  if (!filter.keyword && !filter.type && !filter.emotionTags?.length) {
    return allEntries;
  }
  
  return allEntries.filter((entry: MemoryEntry) => {
    // 关键词搜索
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      if (!entry.title.toLowerCase().includes(keyword) && 
          !entry.content.toLowerCase().includes(keyword)) {
        return false;
      }
    }
    
    // 类型过滤
    if (filter.type && entry.type !== filter.type) {
      return false;
    }
    
    // 情感标签过滤
    if (filter.emotionTags?.length) {
      if (!filter.emotionTags.some((tag: EmotionTag) => entry.emotionTags.includes(tag))) {
        return false;
      }
    }
    
    return true;
  });
});

// 应用操作
export const appActions = {
  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 初始化后端
      await invoke<ApiResponse<string>>('initialize_app');
      
      // 加载设置
      await this.loadSettings();
      
      // 加载拾梦回响配置
      await this.loadDreamConfig();
      
      console.log('应用初始化成功');
    } catch (err) {
      error.value = `初始化失败: ${err}`;
      console.error('应用初始化失败:', err);
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 设置错误信息
   */
  setError(message: string | null): void {
    error.value = message;
  },

  /**
   * 清除错误信息
   */
  clearError(): void {
    error.value = null;
  },

  /**
   * 设置认证状态
   */
  setAuthenticated(authenticated: boolean): void {
    isAuthenticated.value = authenticated;
  },

  /**
   * 创建记忆条目
   */
  async createEntry(
    title: string,
    content: string,
    type: MemoryType = MemoryType.TEXT,
    emotionTags: EmotionTag[] = [],
    password?: string
  ): Promise<MemoryEntry> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await invoke<ApiResponse<MemoryEntry>>('create_memory_entry', {
        title,
        content,
        memoryType: type,
        emotionTags: emotionTags.map(tag => tag.toString()),
        password
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '创建记忆条目失败');
      }
      
      // 更新本地状态
      entries.value = [...entries.value, response.data];
      
      return response.data;
    } catch (err) {
      error.value = `创建记忆条目失败: ${err}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 更新记忆条目
   */
  async updateEntry(
    entryId: string,
    title?: string,
    content?: string,
    emotionTags?: EmotionTag[],
    password?: string
  ): Promise<MemoryEntry> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await invoke<ApiResponse<MemoryEntry>>('update_memory_entry', {
        entryId,
        title,
        content,
        emotionTags: emotionTags?.map(tag => tag.toString()),
        password
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '更新记忆条目失败');
      }
      
      // 更新本地状态
      const index = entries.value.findIndex((e: MemoryEntry) => e.id === entryId);
      if (index !== -1) {
        const newEntries = [...entries.value];
        newEntries[index] = response.data;
        entries.value = newEntries;
      }
      
      // 如果是当前编辑的条目，也更新它
      if (currentEntry.value?.id === entryId) {
        currentEntry.value = response.data;
      }
      
      return response.data;
    } catch (err) {
      error.value = `更新记忆条目失败: ${err}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 删除记忆条目
   */
  async deleteEntry(entryId: string): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await invoke<ApiResponse<boolean>>('delete_memory_entry', {
        entryId
      });
      
      if (!response.success) {
        throw new Error(response.error || '删除记忆条目失败');
      }
      
      // 更新本地状态
      entries.value = entries.value.filter((e: MemoryEntry) => e.id !== entryId);
      
      // 如果删除的是当前条目，清除当前条目
      if (currentEntry.value?.id === entryId) {
        currentEntry.value = null;
      }
    } catch (err) {
      error.value = `删除记忆条目失败: ${err}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 加载所有记忆条目
   */
  async loadEntries(password?: string): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await invoke<ApiResponse<MemoryEntry[]>>('get_all_memory_entries', {
        password
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '加载记忆条目失败');
      }
      
      entries.value = response.data;
    } catch (err) {
      error.value = `加载记忆条目失败: ${err}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 设置当前编辑的条目
   */
  setCurrentEntry(entry: MemoryEntry | null): void {
    currentEntry.value = entry;
  },

  /**
   * 设置搜索过滤器
   */
  setSearchFilter(filter: SearchFilter): void {
    searchFilter.value = filter;
  },

  /**
   * 保存用户设置
   */
  async saveSettings(newSettings: UserSettings): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await invoke<ApiResponse<void>>('save_user_settings', {
        settings: newSettings
      });
      
      if (!response.success) {
        throw new Error(response.error || '保存设置失败');
      }
      
      settings.value = newSettings;
    } catch (err) {
      error.value = `保存设置失败: ${err}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 加载用户设置
   */
  async loadSettings(): Promise<void> {
    try {
      const response = await invoke<ApiResponse<UserSettings>>('load_user_settings');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '加载设置失败');
      }
      
      settings.value = response.data;
    } catch (err) {
      error.value = `加载设置失败: ${err}`;
      throw err;
    }
  },

  /**
   * 保存拾梦回响配置
   */
  async saveDreamConfig(config: DreamEchoConfig): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await invoke<ApiResponse<void>>('save_dream_config', {
        config
      });
      
      if (!response.success) {
        throw new Error(response.error || '保存拾梦回响配置失败');
      }
      
      dreamConfig.value = config;
    } catch (err) {
      error.value = `保存拾梦回响配置失败: ${err}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 加载拾梦回响配置
   */
  async loadDreamConfig(): Promise<void> {
    try {
      const response = await invoke<ApiResponse<DreamEchoConfig>>('load_dream_config');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '加载拾梦回响配置失败');
      }
      
      dreamConfig.value = response.data;
    } catch (err) {
      error.value = `加载拾梦回响配置失败: ${err}`;
      throw err;
    }
  },

  /**
   * 获取随机记忆（用于拾梦回响）
   */
  async getRandomMemory(): Promise<MemoryEntry | null> {
    try {
      const response = await invoke<ApiResponse<MemoryEntry | null>>('get_random_memory');
      
      if (!response.success) {
        throw new Error(response.error || '获取随机记忆失败');
      }
      
      return response.data || null;
    } catch (err) {
      error.value = `获取随机记忆失败: ${err}`;
      return null;
    }
  }
};
