/**
 * Tauri 命令模块
 * 定义前端可以调用的所有后端命令
 */

use crate::models::{MemoryEntry, SearchFilter, ApiResponse, MemoryType};
use crate::crypto::{BackendEncryption, DecryptionParams};
use crate::storage::StorageManager;
use tauri::{AppHandle, Manager};
use std::sync::Mutex;
use std::collections::HashMap;


// 全局存储管理器
#[allow(dead_code)]
type StorageManagerMap = Mutex<HashMap<String, StorageManager>>;

/// 获取或创建存储管理器
async fn get_storage_manager(app: &AppHandle) -> Result<StorageManager, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let data_dir_str = app_data_dir
        .to_str()
        .ok_or("Invalid app data directory path")?;

    StorageManager::new(data_dir_str)
        .await
        .map_err(|e| format!("Failed to create storage manager: {}", e))
}

/// 初始化应用
#[tauri::command]
pub async fn initialize_app(app: AppHandle) -> Result<ApiResponse<String>, String> {
    let storage = get_storage_manager(&app).await?;
    
    
    Ok(ApiResponse::success("应用初始化成功".to_string()))
}

/// 创建记忆条目
#[tauri::command]
pub async fn create_memory_entry(
    app: AppHandle,
    title: String,
    content: String,
    memory_type: String,
    emotion_tags: Vec<String>,
    password: Option<String>,
) -> Result<ApiResponse<MemoryEntry>, String> {
    let storage = get_storage_manager(&app).await?;
    
    // 解析记忆类型
    let memory_type = match memory_type.as_str() {
        "text" => MemoryType::Text,
        "image" => MemoryType::Image,
        "audio" => MemoryType::Audio,
        "mixed" => MemoryType::Mixed,
        _ => MemoryType::Text,
    };
    
    // 创建新的记忆条目
    let mut entry = MemoryEntry::new(title, content, memory_type);
    
    // 添加情感标签
    for tag_str in emotion_tags {
        if let Ok(tag) = serde_json::from_str(&format!("\"{}\"", tag_str)) {
            entry.add_emotion_tag(tag);
        }
    }
    
    // 计算元数据
    let word_count = entry.content.chars().count() as u32;
    let reading_time = (word_count / 200).max(1);
    
    entry.metadata = Some(crate::models::MemoryMetadata {
        word_count: Some(word_count),
        reading_time: Some(reading_time),
        location: None,
        weather: None,
        mood: None,
        tags: None,
    });
    
    // 保存条目
    storage
        .save_entry(&entry, password.as_deref())
        .await
        .map_err(|e| format!("Failed to save entry: {}", e))?;
    
    Ok(ApiResponse::success(entry))
}

/// 更新记忆条目
#[tauri::command]
pub async fn update_memory_entry(
    app: AppHandle,
    entry_id: String,
    title: Option<String>,
    content: Option<String>,
    emotion_tags: Option<Vec<String>>,
    password: Option<String>,
) -> Result<ApiResponse<MemoryEntry>, String> {
    let storage = get_storage_manager(&app).await?;
    
    // 获取现有条目
    let mut entry = storage
        .get_entry(&entry_id)
        .await
        .map_err(|e| format!("Failed to get entry: {}", e))?
        .ok_or("Entry not found")?;
    
    // 更新条目
    entry.update(title, content);
    
    // 更新情感标签
    if let Some(tags) = emotion_tags {
        entry.emotion_tags.clear();
        for tag_str in tags {
            if let Ok(tag) = serde_json::from_str(&format!("\"{}\"", tag_str)) {
                entry.add_emotion_tag(tag);
            }
        }
    }
    
    // 保存更新后的条目
    storage
        .save_entry(&entry, password.as_deref())
        .await
        .map_err(|e| format!("Failed to update entry: {}", e))?;
    
    Ok(ApiResponse::success(entry))
}

/// 删除记忆条目
#[tauri::command]
pub async fn delete_memory_entry(
    app: AppHandle,
    entry_id: String,
) -> Result<ApiResponse<bool>, String> {
    let storage = get_storage_manager(&app).await?;
    
    let deleted = storage
        .delete_entry(&entry_id)
        .await
        .map_err(|e| format!("Failed to delete entry: {}", e))?;
    
    if deleted {
        Ok(ApiResponse::success(true).with_message("记忆条目已删除".to_string()))
    } else {
        Ok(ApiResponse::error("记忆条目未找到".to_string()))
    }
}

/// 获取单个记忆条目
#[tauri::command]
pub async fn get_memory_entry(
    app: AppHandle,
    entry_id: String,
) -> Result<ApiResponse<Option<MemoryEntry>>, String> {
    let storage = get_storage_manager(&app).await?;
    
    let entry = storage
        .get_entry(&entry_id)
        .await
        .map_err(|e| format!("Failed to get entry: {}", e))?;
    
    Ok(ApiResponse::success(entry))
}

/// 获取所有记忆条目
#[tauri::command]
pub async fn get_all_memory_entries(
    app: AppHandle,
    password: Option<String>,
) -> Result<ApiResponse<Vec<MemoryEntry>>, String> {
    let storage = get_storage_manager(&app).await?;
    
    let entries = if let Some(password) = password {
        storage
            .load_entries_with_password(&password)
            .await
            .map_err(|e| format!("Failed to load encrypted entries: {}", e))?
    } else {
        storage
            .get_all_entries()
            .await
            .map_err(|e| format!("Failed to get entries: {}", e))?
    };
    
    Ok(ApiResponse::success(entries))
}

/// 搜索记忆条目
#[tauri::command]
pub async fn search_memory_entries(
    app: AppHandle,
    filter: SearchFilter,
) -> Result<ApiResponse<Vec<MemoryEntry>>, String> {
    let storage = get_storage_manager(&app).await?;
    
    let entries = storage
        .search_entries(&filter)
        .await
        .map_err(|e| format!("Failed to search entries: {}", e))?;
    
    Ok(ApiResponse::success(entries))
}

/// 加密数据
#[tauri::command]
pub async fn encrypt_data(
    data: String,
    password: String,
) -> Result<ApiResponse<crate::crypto::EncryptionResult>, String> {
    let encrypted = BackendEncryption::encrypt(&data, &password)
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    Ok(ApiResponse::success(encrypted))
}

/// 解密数据
#[tauri::command]
pub async fn decrypt_data(
    params: DecryptionParams,
) -> Result<ApiResponse<String>, String> {
    let decrypted = BackendEncryption::decrypt(&params)
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    Ok(ApiResponse::success(decrypted))
}

/// 验证密码强度
#[tauri::command]
pub async fn validate_password_strength(password: String) -> Result<ApiResponse<u8>, String> {
    let strength = BackendEncryption::validate_password_strength(&password);
    Ok(ApiResponse::success(strength))
}


/// 获取随机记忆（用于拾梦回响）
#[tauri::command]
pub async fn get_random_memory(app: AppHandle) -> Result<ApiResponse<Option<MemoryEntry>>, String> {
    let storage = get_storage_manager(&app).await?;
    
    let entry = storage
        .get_random_entry()
        .await
        .map_err(|e| format!("Failed to get random entry: {}", e))?;
    
    Ok(ApiResponse::success(entry))
}

/// 备份数据
#[tauri::command]
pub async fn backup_data(
    app: AppHandle,
    backup_path: String,
) -> Result<ApiResponse<()>, String> {
    let storage = get_storage_manager(&app).await?;
    
    storage
        .backup_data(&backup_path)
        .await
        .map_err(|e| format!("Failed to backup data: {}", e))?;
    
    Ok(ApiResponse::success_empty().with_message("数据备份成功".to_string()))
}
