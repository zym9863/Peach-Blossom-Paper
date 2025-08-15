/**
 * 数据存储模块
 * 负责管理本地数据的存储和检索
 */

use crate::models::{MemoryEntry, UserSettings, DreamEchoConfig, SearchFilter};
use crate::crypto::{BackendEncryption, EncryptionResult, DecryptionParams};
use anyhow::{Result, anyhow};
use serde_json;
use std::path::{Path, PathBuf};
use tokio::fs;


/// 存储管理器
pub struct StorageManager {
    data_dir: PathBuf,
    entries_file: PathBuf,
    settings_file: PathBuf,
    config_file: PathBuf,
}

impl StorageManager {
    /// 创建新的存储管理器实例
    pub async fn new(app_data_dir: &str) -> Result<Self> {
        let data_dir = PathBuf::from(app_data_dir);
        
        // 确保数据目录存在
        if !data_dir.exists() {
            fs::create_dir_all(&data_dir).await
                .map_err(|e| anyhow!("Failed to create data directory: {}", e))?;
        }

        let entries_file = data_dir.join("memories.json");
        let settings_file = data_dir.join("settings.json");
        let config_file = data_dir.join("config.json");

        Ok(Self {
            data_dir,
            entries_file,
            settings_file,
            config_file,
        })
    }

    /// 获取数据目录路径
    pub fn get_data_dir(&self) -> &Path {
        &self.data_dir
    }

    /// 保存记忆条目
    pub async fn save_entry(&self, entry: &MemoryEntry, password: Option<&str>) -> Result<()> {
        let mut entries = self.load_all_entries().await.unwrap_or_default();
        
        // 检查是否是更新现有条目
        if let Some(index) = entries.iter().position(|e| e.id == entry.id) {
            entries[index] = entry.clone();
        } else {
            entries.push(entry.clone());
        }

        self.save_all_entries(&entries, password).await
    }

    /// 删除记忆条目
    pub async fn delete_entry(&self, entry_id: &str) -> Result<bool> {
        let mut entries = self.load_all_entries().await.unwrap_or_default();
        let initial_len = entries.len();
        
        entries.retain(|e| e.id != entry_id);
        
        if entries.len() < initial_len {
            self.save_all_entries(&entries, None).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// 根据ID获取记忆条目
    pub async fn get_entry(&self, entry_id: &str) -> Result<Option<MemoryEntry>> {
        let entries = self.load_all_entries().await?;
        Ok(entries.into_iter().find(|e| e.id == entry_id))
    }

    /// 获取所有记忆条目
    pub async fn get_all_entries(&self) -> Result<Vec<MemoryEntry>> {
        self.load_all_entries().await
    }

    /// 根据过滤器搜索记忆条目
    pub async fn search_entries(&self, filter: &SearchFilter) -> Result<Vec<MemoryEntry>> {
        let entries = self.load_all_entries().await?;
        
        let filtered_entries: Vec<MemoryEntry> = entries
            .into_iter()
            .filter(|entry| self.matches_filter(entry, filter))
            .collect();

        Ok(filtered_entries)
    }

    /// 检查条目是否匹配过滤器
    fn matches_filter(&self, entry: &MemoryEntry, filter: &SearchFilter) -> bool {
        // 关键词搜索
        if let Some(keyword) = &filter.keyword {
            let keyword_lower = keyword.to_lowercase();
            if !entry.title.to_lowercase().contains(&keyword_lower) 
                && !entry.content.to_lowercase().contains(&keyword_lower) {
                return false;
            }
        }

        // 类型过滤
        if let Some(memory_type) = &filter.memory_type {
            if entry.memory_type != *memory_type {
                return false;
            }
        }

        // 情感标签过滤
        if let Some(emotion_tags) = &filter.emotion_tags {
            if !emotion_tags.iter().any(|tag| entry.emotion_tags.contains(tag)) {
                return false;
            }
        }

        // 日期范围过滤
        if let Some(date_range) = &filter.date_range {
            if entry.created_at < date_range.start || entry.created_at > date_range.end {
                return false;
            }
        }

        // 标签过滤
        if let Some(tags) = &filter.tags {
            if let Some(entry_metadata) = &entry.metadata {
                if let Some(entry_tags) = &entry_metadata.tags {
                    if !tags.iter().any(|tag| entry_tags.contains(tag)) {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        true
    }

    /// 加载所有记忆条目
    async fn load_all_entries(&self) -> Result<Vec<MemoryEntry>> {
        if !self.entries_file.exists() {
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&self.entries_file).await
            .map_err(|e| anyhow!("Failed to read entries file: {}", e))?;

        if content.trim().is_empty() {
            return Ok(Vec::new());
        }

        // 尝试解析为加密数据
        if let Ok(_encrypted_data) = serde_json::from_str::<EncryptionResult>(&content) {
            // 这是加密数据，需要密码解密
            return Err(anyhow!("Entries are encrypted, password required"));
        }

        // 尝试解析为普通JSON
        let entries: Vec<MemoryEntry> = serde_json::from_str(&content)
            .map_err(|e| anyhow!("Failed to parse entries: {}", e))?;

        Ok(entries)
    }

    /// 保存所有记忆条目
    async fn save_all_entries(&self, entries: &[MemoryEntry], password: Option<&str>) -> Result<()> {
        let json_content = serde_json::to_string_pretty(entries)
            .map_err(|e| anyhow!("Failed to serialize entries: {}", e))?;

        let content_to_save = if let Some(password) = password {
            // 加密保存
            let encrypted = BackendEncryption::encrypt(&json_content, password)?;
            serde_json::to_string(&encrypted)
                .map_err(|e| anyhow!("Failed to serialize encrypted data: {}", e))?
        } else {
            // 明文保存
            json_content
        };

        fs::write(&self.entries_file, content_to_save).await
            .map_err(|e| anyhow!("Failed to write entries file: {}", e))?;

        Ok(())
    }

    /// 使用密码解密并加载条目
    pub async fn load_entries_with_password(&self, password: &str) -> Result<Vec<MemoryEntry>> {
        if !self.entries_file.exists() {
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&self.entries_file).await
            .map_err(|e| anyhow!("Failed to read entries file: {}", e))?;

        if content.trim().is_empty() {
            return Ok(Vec::new());
        }

        // 尝试解析为加密数据
        let encrypted_data: EncryptionResult = serde_json::from_str(&content)
            .map_err(|e| anyhow!("Failed to parse encrypted data: {}", e))?;

        // 解密数据
        let decrypt_params = DecryptionParams {
            encrypted_data: encrypted_data.encrypted_data,
            nonce: encrypted_data.nonce,
            salt: encrypted_data.salt,
            password: password.to_string(),
        };

        let decrypted_content = BackendEncryption::decrypt(&decrypt_params)?;

        // 解析解密后的JSON
        let entries: Vec<MemoryEntry> = serde_json::from_str(&decrypted_content)
            .map_err(|e| anyhow!("Failed to parse decrypted entries: {}", e))?;

        Ok(entries)
    }

    /// 保存用户设置
    pub async fn save_settings(&self, settings: &UserSettings) -> Result<()> {
        let json_content = serde_json::to_string_pretty(settings)
            .map_err(|e| anyhow!("Failed to serialize settings: {}", e))?;

        fs::write(&self.settings_file, json_content).await
            .map_err(|e| anyhow!("Failed to write settings file: {}", e))?;

        Ok(())
    }

    /// 加载用户设置
    pub async fn load_settings(&self) -> Result<UserSettings> {
        if !self.settings_file.exists() {
            let default_settings = UserSettings::default();
            self.save_settings(&default_settings).await?;
            return Ok(default_settings);
        }

        let content = fs::read_to_string(&self.settings_file).await
            .map_err(|e| anyhow!("Failed to read settings file: {}", e))?;

        let settings: UserSettings = serde_json::from_str(&content)
            .map_err(|e| anyhow!("Failed to parse settings: {}", e))?;

        Ok(settings)
    }

    /// 保存拾梦回响配置
    pub async fn save_dream_config(&self, config: &DreamEchoConfig) -> Result<()> {
        let json_content = serde_json::to_string_pretty(config)
            .map_err(|e| anyhow!("Failed to serialize dream config: {}", e))?;

        fs::write(&self.config_file, json_content).await
            .map_err(|e| anyhow!("Failed to write config file: {}", e))?;

        Ok(())
    }

    /// 加载拾梦回响配置
    pub async fn load_dream_config(&self) -> Result<DreamEchoConfig> {
        if !self.config_file.exists() {
            let default_config = DreamEchoConfig::default();
            self.save_dream_config(&default_config).await?;
            return Ok(default_config);
        }

        let content = fs::read_to_string(&self.config_file).await
            .map_err(|e| anyhow!("Failed to read config file: {}", e))?;

        let config: DreamEchoConfig = serde_json::from_str(&content)
            .map_err(|e| anyhow!("Failed to parse config: {}", e))?;

        Ok(config)
    }

    /// 获取随机记忆条目（用于拾梦回响）
    pub async fn get_random_entry(&self) -> Result<Option<MemoryEntry>> {
        let entries = self.load_all_entries().await?;
        
        if entries.is_empty() {
            return Ok(None);
        }

        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        let random_entry = entries.choose(&mut rng).cloned();
        
        Ok(random_entry)
    }

    /// 备份数据
    pub async fn backup_data(&self, backup_path: &str) -> Result<()> {
        let backup_dir = PathBuf::from(backup_path);
        
        if !backup_dir.exists() {
            fs::create_dir_all(&backup_dir).await
                .map_err(|e| anyhow!("Failed to create backup directory: {}", e))?;
        }

        // 备份记忆条目
        if self.entries_file.exists() {
            let backup_entries_file = backup_dir.join("memories_backup.json");
            fs::copy(&self.entries_file, backup_entries_file).await
                .map_err(|e| anyhow!("Failed to backup entries: {}", e))?;
        }

        // 备份设置
        if self.settings_file.exists() {
            let backup_settings_file = backup_dir.join("settings_backup.json");
            fs::copy(&self.settings_file, backup_settings_file).await
                .map_err(|e| anyhow!("Failed to backup settings: {}", e))?;
        }

        // 备份配置
        if self.config_file.exists() {
            let backup_config_file = backup_dir.join("config_backup.json");
            fs::copy(&self.config_file, backup_config_file).await
                .map_err(|e| anyhow!("Failed to backup config: {}", e))?;
        }

        Ok(())
    }
}
