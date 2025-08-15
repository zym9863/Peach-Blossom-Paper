/**
 * 桃花笺应用的核心数据类型定义
 */

// 记忆类型枚举
export enum MemoryType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  MIXED = 'mixed'
}

// 情感标签枚举
export enum EmotionTag {
  JOY = 'joy',           // 喜悦
  SADNESS = 'sadness',   // 悲伤
  NOSTALGIA = 'nostalgia', // 怀念
  HOPE = 'hope',         // 希望
  REGRET = 'regret',     // 悔过
  ATTACHMENT = 'attachment', // 难舍
  PERSISTENCE = 'persistence' // 执着
}

// 基础记忆条目接口
export interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  type: MemoryType;
  emotionTags: EmotionTag[];
  createdAt: Date;
  updatedAt: Date;
  isEncrypted: boolean;
  attachments?: Attachment[];
  metadata?: MemoryMetadata;
}

// 附件接口
export interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  isEncrypted: boolean;
  createdAt: Date;
}

// 记忆元数据
export interface MemoryMetadata {
  wordCount?: number;
  readingTime?: number; // 预估阅读时间（分钟）
  location?: string;
  weather?: string;
  mood?: string;
  tags?: string[];
}

// 加密配置
export interface EncryptionConfig {
  algorithm: string;
  keyDerivation: string;
  iterations: number;
  saltLength: number;
  ivLength: number;
}

// 用户设置
export interface UserSettings {
  theme: 'light' | 'dark' | 'peach';
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
  autoSaveInterval: number; // 秒
  enableDreamEchoes: boolean;
  dreamEchoesFrequency: 'low' | 'medium' | 'high';
  enableNotifications: boolean;
  encryptionEnabled: boolean;
  backupEnabled: boolean;
  language: 'zh-CN' | 'en-US';
}

// 拾梦回响配置
export interface DreamEchoConfig {
  enabled: boolean;
  frequency: number; // 小时
  maxEntriesPerDay: number;
  preferredTimeRanges: TimeRange[];
  excludedDays: number[]; // 0-6, 0为周日
}

// 时间范围
export interface TimeRange {
  start: string; // HH:mm 格式
  end: string;   // HH:mm 格式
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 搜索过滤器
export interface SearchFilter {
  keyword?: string;
  type?: MemoryType;
  emotionTags?: EmotionTag[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
}

// 统计数据
export interface MemoryStats {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  entriesByType: Record<MemoryType, number>;
  entriesByEmotion: Record<EmotionTag, number>;
  entriesByMonth: Record<string, number>;
  longestStreak: number;
  currentStreak: number;
}

// 导出/导入数据格式
export interface ExportData {
  version: string;
  exportDate: Date;
  entries: MemoryEntry[];
  settings: UserSettings;
  metadata: {
    totalEntries: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}

// 应用状态
export interface AppState {
  isLoading: boolean;
  currentEntry?: MemoryEntry;
  entries: MemoryEntry[];
  filteredEntries: MemoryEntry[];
  searchFilter: SearchFilter;
  settings: UserSettings;
  stats: MemoryStats;
  dreamEchoConfig: DreamEchoConfig;
  isAuthenticated: boolean;
  lastSyncTime?: Date;
}

// 组件 Props 类型
export interface MemoryEditorProps {
  entry?: MemoryEntry;
  onSave: (entry: MemoryEntry) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

export interface MemoryListProps {
  entries: MemoryEntry[];
  onSelect: (entry: MemoryEntry) => void;
  onDelete: (id: string) => Promise<void>;
  filter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
}

export interface DreamEchoProps {
  entry: MemoryEntry;
  onDismiss: () => void;
  onViewFull: () => void;
}

// 错误类型
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 加密相关错误
export class EncryptionError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'ENCRYPTION_ERROR', details);
    this.name = 'EncryptionError';
  }
}

// 存储相关错误
export class StorageError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}
