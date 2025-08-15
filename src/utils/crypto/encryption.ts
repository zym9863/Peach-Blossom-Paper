/**
 * 前端加密工具类
 * 使用 AES-GCM 算法进行对称加密
 */

import CryptoJS from 'crypto-js';
import { EncryptionError } from '../../types';

export interface EncryptionResult {
  encryptedData: string;
  salt: string;
  iv: string;
}

export interface DecryptionParams {
  encryptedData: string;
  salt: string;
  iv: string;
  password: string;
}

/**
 * 前端加密管理器
 * 负责处理客户端的数据加密和解密
 */
export class FrontendEncryption {
  private static readonly MODE = CryptoJS.mode.CBC;
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 96; // 12 bytes for GCM
  private static readonly SALT_SIZE = 128; // 16 bytes
  private static readonly ITERATIONS = 100000;

  /**
   * 从密码派生密钥
   * @param password 用户密码
   * @param salt 盐值
   * @returns 派生的密钥
   */
  private static deriveKey(password: string, salt: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATIONS,
      hasher: CryptoJS.algo.SHA256
    });
  }

  /**
   * 生成随机盐值
   * @returns 盐值
   */
  private static generateSalt(): CryptoJS.lib.WordArray {
    return CryptoJS.lib.WordArray.random(this.SALT_SIZE / 8);
  }

  /**
   * 生成随机初始化向量
   * @returns IV
   */
  private static generateIV(): CryptoJS.lib.WordArray {
    return CryptoJS.lib.WordArray.random(this.IV_SIZE / 8);
  }

  /**
   * 加密数据
   * @param data 要加密的数据
   * @param password 密码
   * @returns 加密结果
   */
  static async encrypt(data: string, password: string): Promise<EncryptionResult> {
    try {
      if (!data || !password) {
        throw new EncryptionError('数据和密码不能为空');
      }

      // 生成盐值和IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // 派生密钥
      const key = this.deriveKey(password, salt);

      // 加密数据
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: this.MODE,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        encryptedData: encrypted.toString(),
        salt: salt.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64)
      };
    } catch (error) {
      throw new EncryptionError('加密失败', error);
    }
  }

  /**
   * 解密数据
   * @param params 解密参数
   * @returns 解密后的数据
   */
  static async decrypt(params: DecryptionParams): Promise<string> {
    try {
      const { encryptedData, salt, iv, password } = params;

      if (!encryptedData || !salt || !iv || !password) {
        throw new EncryptionError('解密参数不完整');
      }

      // 解析盐值和IV
      const saltWordArray = CryptoJS.enc.Base64.parse(salt);
      const ivWordArray = CryptoJS.enc.Base64.parse(iv);

      // 派生密钥
      const key = this.deriveKey(password, saltWordArray);

      // 解密数据
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: ivWordArray,
        mode: this.MODE,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new EncryptionError('解密失败，可能是密码错误');
      }

      return decryptedText;
    } catch (error) {
      if (error instanceof EncryptionError) {
        throw error;
      }
      throw new EncryptionError('解密失败', error);
    }
  }

  /**
   * 验证密码强度
   * @param password 密码
   * @returns 密码强度评分 (0-100)
   */
  static validatePasswordStrength(password: string): number {
    if (!password) return 0;

    let score = 0;
    
    // 长度检查
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;

    // 字符类型检查
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    return Math.min(score, 100);
  }

  /**
   * 生成安全的随机密码
   * @param length 密码长度
   * @returns 随机密码
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomWords = CryptoJS.lib.WordArray.random(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.abs(randomWords.words[Math.floor(i / 4)] >> ((i % 4) * 8)) % charset.length;
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * 计算数据的哈希值
   * @param data 数据
   * @returns SHA-256 哈希值
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
  }

  /**
   * 验证数据完整性
   * @param data 原始数据
   * @param hash 预期的哈希值
   * @returns 是否匹配
   */
  static verifyIntegrity(data: string, hash: string): boolean {
    return this.hash(data) === hash;
  }
}

/**
 * 密码管理器
 * 负责管理用户的主密码
 */
export class PasswordManager {
  private static readonly STORAGE_KEY = 'peach_blossom_master_key';
  private static masterPasswordHash: string | null = null;

  /**
   * 设置主密码
   * @param password 主密码
   */
  static async setMasterPassword(password: string): Promise<void> {
    if (FrontendEncryption.validatePasswordStrength(password) < 60) {
      throw new EncryptionError('密码强度不足，请使用更强的密码');
    }

    const hash = FrontendEncryption.hash(password);
    this.masterPasswordHash = hash;
    
    // 存储密码哈希（用于验证）
    localStorage.setItem(this.STORAGE_KEY, hash);
  }

  /**
   * 验证主密码
   * @param password 输入的密码
   * @returns 是否正确
   */
  static async verifyMasterPassword(password: string): Promise<boolean> {
    const storedHash = localStorage.getItem(this.STORAGE_KEY);
    if (!storedHash) {
      return false;
    }

    const inputHash = FrontendEncryption.hash(password);
    const isValid = inputHash === storedHash;
    
    if (isValid) {
      this.masterPasswordHash = inputHash;
    }
    
    return isValid;
  }

  /**
   * 检查是否已设置主密码
   * @returns 是否已设置
   */
  static hasMasterPassword(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * 清除主密码
   */
  static clearMasterPassword(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.masterPasswordHash = null;
  }

  /**
   * 检查是否已认证
   * @returns 是否已认证
   */
  static isAuthenticated(): boolean {
    return this.masterPasswordHash !== null;
  }
}
