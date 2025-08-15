/**
 * 桃花笺应用的 Rust 数据模型
 */

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::collections::HashMap;

/// 记忆类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum MemoryType {
    Text,
    Image,
    Audio,
    Mixed,
}

/// 情感标签枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum EmotionTag {
    Joy,           // 喜悦
    Sadness,       // 悲伤
    Nostalgia,     // 怀念
    Hope,          // 希望
    Regret,        // 悔过
    Attachment,    // 难舍
    Persistence,   // 执着
}

/// 附件结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: u64,
    pub is_encrypted: bool,
    pub created_at: DateTime<Utc>,
}

/// 记忆元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryMetadata {
    pub word_count: Option<u32>,
    pub reading_time: Option<u32>, // 预估阅读时间（分钟）
    pub location: Option<String>,
    pub weather: Option<String>,
    pub mood: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// 记忆条目结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub title: String,
    pub content: String,
    pub memory_type: MemoryType,
    pub emotion_tags: Vec<EmotionTag>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_encrypted: bool,
    pub attachments: Option<Vec<Attachment>>,
    pub metadata: Option<MemoryMetadata>,
}

/// 加密数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedData {
    pub data: String,
    pub salt: String,
    pub nonce: String,
    pub algorithm: String,
}


/// 搜索过滤器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchFilter {
    pub keyword: Option<String>,
    pub memory_type: Option<MemoryType>,
    pub emotion_tags: Option<Vec<EmotionTag>>,
    pub date_range: Option<DateRange>,
    pub tags: Option<Vec<String>>,
}

/// 日期范围
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

/// 统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    pub total_entries: u32,
    pub total_words: u32,
    pub average_words_per_entry: f32,
    pub entries_by_type: HashMap<MemoryType, u32>,
    pub entries_by_emotion: HashMap<EmotionTag, u32>,
    pub entries_by_month: HashMap<String, u32>,
    pub longest_streak: u32,
    pub current_streak: u32,
}

/// API 响应结构
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    /// 创建成功响应
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message: None,
        }
    }

    /// 创建成功响应（无数据）
    pub fn success_empty() -> Self {
        Self {
            success: true,
            data: None,
            error: None,
            message: None,
        }
    }

    /// 创建错误响应
    pub fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
            message: None,
        }
    }

    /// 创建带消息的响应
    pub fn with_message(mut self, message: String) -> Self {
        self.message = Some(message);
        self
    }
}


impl MemoryEntry {
    /// 创建新的记忆条目
    pub fn new(title: String, content: String, memory_type: MemoryType) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            memory_type,
            emotion_tags: Vec::new(),
            created_at: now,
            updated_at: now,
            is_encrypted: false,
            attachments: None,
            metadata: None,
        }
    }

    /// 更新记忆条目
    pub fn update(&mut self, title: Option<String>, content: Option<String>) {
        if let Some(title) = title {
            self.title = title;
        }
        if let Some(content) = content {
            self.content = content;
            // 重新计算字数
            if let Some(ref mut metadata) = self.metadata {
                metadata.word_count = Some(self.content.chars().count() as u32);
                metadata.reading_time = Some((self.content.chars().count() as u32 / 200).max(1));
            }
        }
        self.updated_at = Utc::now();
    }

    /// 添加情感标签
    pub fn add_emotion_tag(&mut self, tag: EmotionTag) {
        if !self.emotion_tags.contains(&tag) {
            self.emotion_tags.push(tag);
        }
    }

    /// 移除情感标签
    pub fn remove_emotion_tag(&mut self, tag: &EmotionTag) {
        self.emotion_tags.retain(|t| t != tag);
    }
}
