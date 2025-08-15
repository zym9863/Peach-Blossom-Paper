/**
 * Rust 后端加密模块
 * 使用 AES-GCM 算法进行对称加密
 */

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use base64::{Engine as _, engine::general_purpose};
use rand::RngCore;
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};

/// 加密结果结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionResult {
    pub encrypted_data: String,
    pub nonce: String,
    pub salt: String,
}

/// 解密参数结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecryptionParams {
    pub encrypted_data: String,
    pub nonce: String,
    pub salt: String,
    pub password: String,
}

/// 后端加密管理器
pub struct BackendEncryption;

impl BackendEncryption {
    const SALT_LENGTH: usize = 32;
    const NONCE_LENGTH: usize = 12;
    const KEY_LENGTH: usize = 32;

    /// 生成随机盐值
    fn generate_salt() -> [u8; Self::SALT_LENGTH] {
        let mut salt = [0u8; Self::SALT_LENGTH];
        OsRng.fill_bytes(&mut salt);
        salt
    }

    /// 生成随机 nonce
    fn generate_nonce() -> [u8; Self::NONCE_LENGTH] {
        let mut nonce = [0u8; Self::NONCE_LENGTH];
        OsRng.fill_bytes(&mut nonce);
        nonce
    }

    /// 从密码和盐值派生密钥
    fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; Self::KEY_LENGTH]> {
        use argon2::{Argon2, PasswordHasher};
        use argon2::password_hash::SaltString;

        let argon2 = Argon2::default();
        let salt_string = SaltString::encode_b64(salt)
            .map_err(|e| anyhow!("Failed to encode salt: {}", e))?;

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt_string)
            .map_err(|e| anyhow!("Failed to hash password: {}", e))?;

        let hash_result = password_hash.hash
            .ok_or_else(|| anyhow!("No hash in password hash"))?;
        let hash_bytes = hash_result.as_bytes();

        if hash_bytes.len() < Self::KEY_LENGTH {
            return Err(anyhow!("Hash too short"));
        }

        let mut key = [0u8; Self::KEY_LENGTH];
        key.copy_from_slice(&hash_bytes[..Self::KEY_LENGTH]);
        Ok(key)
    }

    /// 加密数据
    pub fn encrypt(data: &str, password: &str) -> Result<EncryptionResult> {
        if data.is_empty() || password.is_empty() {
            return Err(anyhow!("Data and password cannot be empty"));
        }

        // 生成盐值和 nonce
        let salt = Self::generate_salt();
        let nonce_bytes = Self::generate_nonce();

        // 派生密钥
        let key_bytes = Self::derive_key(password, &salt)?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 创建加密器
        let cipher = Aes256Gcm::new(key);

        // 加密数据
        let encrypted_bytes = cipher
            .encrypt(nonce, data.as_bytes())
            .map_err(|e| anyhow!("Encryption failed: {}", e))?;

        // 编码为 Base64
        let encrypted_data = general_purpose::STANDARD.encode(&encrypted_bytes);
        let nonce_b64 = general_purpose::STANDARD.encode(&nonce_bytes);
        let salt_b64 = general_purpose::STANDARD.encode(&salt);

        Ok(EncryptionResult {
            encrypted_data,
            nonce: nonce_b64,
            salt: salt_b64,
        })
    }

    /// 解密数据
    pub fn decrypt(params: &DecryptionParams) -> Result<String> {
        if params.encrypted_data.is_empty() 
            || params.nonce.is_empty() 
            || params.salt.is_empty() 
            || params.password.is_empty() {
            return Err(anyhow!("All decryption parameters are required"));
        }

        // 解码 Base64
        let encrypted_bytes = general_purpose::STANDARD
            .decode(&params.encrypted_data)
            .map_err(|e| anyhow!("Failed to decode encrypted data: {}", e))?;
        
        let nonce_bytes = general_purpose::STANDARD
            .decode(&params.nonce)
            .map_err(|e| anyhow!("Failed to decode nonce: {}", e))?;
        
        let salt_bytes = general_purpose::STANDARD
            .decode(&params.salt)
            .map_err(|e| anyhow!("Failed to decode salt: {}", e))?;

        // 验证长度
        if nonce_bytes.len() != Self::NONCE_LENGTH {
            return Err(anyhow!("Invalid nonce length"));
        }

        // 派生密钥
        let key_bytes = Self::derive_key(&params.password, &salt_bytes)?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // 创建解密器
        let cipher = Aes256Gcm::new(key);

        // 解密数据
        let decrypted_bytes = cipher
            .decrypt(nonce, encrypted_bytes.as_ref())
            .map_err(|e| anyhow!("Decryption failed (possibly wrong password): {}", e))?;

        // 转换为字符串
        let decrypted_text = String::from_utf8(decrypted_bytes)
            .map_err(|e| anyhow!("Failed to convert decrypted data to string: {}", e))?;

        Ok(decrypted_text)
    }

    /// 验证密码强度
    pub fn validate_password_strength(password: &str) -> u8 {
        if password.is_empty() {
            return 0;
        }

        let mut score = 0u8;

        // 长度检查
        if password.len() >= 8 {
            score += 25;
        }
        if password.len() >= 12 {
            score += 15;
        }
        if password.len() >= 16 {
            score += 10;
        }

        // 字符类型检查
        if password.chars().any(|c| c.is_ascii_lowercase()) {
            score += 10;
        }
        if password.chars().any(|c| c.is_ascii_uppercase()) {
            score += 10;
        }
        if password.chars().any(|c| c.is_ascii_digit()) {
            score += 10;
        }
        if password.chars().any(|c| !c.is_alphanumeric()) {
            score += 20;
        }

        score.min(100)
    }

    /// 生成安全的随机密码
    pub fn generate_secure_password(length: usize) -> String {
        use rand::seq::SliceRandom;
        
        let charset: Vec<char> = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
            .chars()
            .collect();
        
        let mut rng = OsRng;
        (0..length)
            .map(|_| *charset.choose(&mut rng).unwrap())
            .collect()
    }

    /// 计算数据的 SHA-256 哈希值
    pub fn hash_sha256(data: &str) -> String {
        use sha2::{Sha256, Digest};
        
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        let result = hasher.finalize();
        
        hex::encode(result)
    }

    /// 验证数据完整性
    pub fn verify_integrity(data: &str, expected_hash: &str) -> bool {
        let actual_hash = Self::hash_sha256(data);
        actual_hash == expected_hash
    }
}

/// 文件加密工具
pub struct FileEncryption;

impl FileEncryption {
    /// 加密文件
    pub async fn encrypt_file(file_path: &str, password: &str) -> Result<String> {
        use tokio::fs;
        
        // 读取文件内容
        let content = fs::read_to_string(file_path).await
            .map_err(|e| anyhow!("Failed to read file: {}", e))?;

        // 加密内容
        let encrypted = BackendEncryption::encrypt(&content, password)?;

        // 生成加密文件路径
        let encrypted_path = format!("{}.encrypted", file_path);

        // 保存加密数据
        let encrypted_json = serde_json::to_string(&encrypted)
            .map_err(|e| anyhow!("Failed to serialize encrypted data: {}", e))?;

        fs::write(&encrypted_path, encrypted_json).await
            .map_err(|e| anyhow!("Failed to write encrypted file: {}", e))?;

        Ok(encrypted_path)
    }

    /// 解密文件
    pub async fn decrypt_file(encrypted_file_path: &str, password: &str) -> Result<String> {
        use tokio::fs;

        // 读取加密文件
        let encrypted_json = fs::read_to_string(encrypted_file_path).await
            .map_err(|e| anyhow!("Failed to read encrypted file: {}", e))?;

        // 解析加密数据
        let encrypted_result: EncryptionResult = serde_json::from_str(&encrypted_json)
            .map_err(|e| anyhow!("Failed to parse encrypted data: {}", e))?;

        // 解密内容
        let decrypt_params = DecryptionParams {
            encrypted_data: encrypted_result.encrypted_data,
            nonce: encrypted_result.nonce,
            salt: encrypted_result.salt,
            password: password.to_string(),
        };

        let decrypted_content = BackendEncryption::decrypt(&decrypt_params)?;

        // 生成解密文件路径
        let decrypted_path = encrypted_file_path.replace(".encrypted", ".decrypted");

        // 保存解密内容
        fs::write(&decrypted_path, &decrypted_content).await
            .map_err(|e| anyhow!("Failed to write decrypted file: {}", e))?;

        Ok(decrypted_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let data = "这是一段测试数据";
        let password = "test_password_123";

        // 加密
        let encrypted = BackendEncryption::encrypt(data, password).unwrap();
        
        // 解密
        let decrypt_params = DecryptionParams {
            encrypted_data: encrypted.encrypted_data,
            nonce: encrypted.nonce,
            salt: encrypted.salt,
            password: password.to_string(),
        };
        
        let decrypted = BackendEncryption::decrypt(&decrypt_params).unwrap();
        
        assert_eq!(data, decrypted);
    }

    #[test]
    fn test_password_strength() {
        assert_eq!(BackendEncryption::validate_password_strength(""), 0);
        assert_eq!(BackendEncryption::validate_password_strength("weak"), 25);
        assert!(BackendEncryption::validate_password_strength("StrongP@ssw0rd123") > 80);
    }

    #[test]
    fn test_hash_integrity() {
        let data = "test data";
        let hash = BackendEncryption::hash_sha256(data);
        assert!(BackendEncryption::verify_integrity(data, &hash));
        assert!(!BackendEncryption::verify_integrity("modified data", &hash));
    }
}
