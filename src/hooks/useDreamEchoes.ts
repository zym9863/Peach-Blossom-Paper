/**
 * 拾梦回响 Hook
 * 管理随机记忆的显示逻辑
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { MemoryEntry, DreamEchoConfig } from '../types';
import { dreamConfig, entries } from '../stores/appStore';

interface DreamEchoState {
  currentEcho: MemoryEntry | null;
  isVisible: boolean;
  nextEchoTime: Date | null;
}

export function useDreamEchoes() {
  const [echoState, setEchoState] = useState<DreamEchoState>({
    currentEcho: null,
    isVisible: false,
    nextEchoTime: null,
  });

  const [echoHistory, setEchoHistory] = useState<string[]>([]);
  const [dailyEchoCount, setDailyEchoCount] = useState(0);

  /**
   * 检查是否在允许的时间范围内
   */
  const isInAllowedTimeRange = useCallback((config: DreamEchoConfig): boolean => {
    if (!config.enabled || config.preferredTimeRanges.length === 0) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    // 检查是否在排除的日期
    if (config.excludedDays.includes(currentDay)) {
      return false;
    }

    // 检查是否在允许的时间范围内
    return config.preferredTimeRanges.some(range => {
      return currentTime >= range.start && currentTime <= range.end;
    });
  }, []);

  /**
   * 检查今日是否已达到最大回响次数
   */
  const hasReachedDailyLimit = useCallback((config: DreamEchoConfig): boolean => {
    return dailyEchoCount >= config.maxEntriesPerDay;
  }, [dailyEchoCount]);

  /**
   * 获取随机记忆（排除最近显示过的）
   */
  const getRandomMemory = useCallback(async (): Promise<MemoryEntry | null> => {
    const allEntries = entries.value;
    
    if (allEntries.length === 0) {
      return null;
    }

    // 过滤掉最近显示过的记忆
    const availableEntries = allEntries.filter((entry: MemoryEntry) =>
      !echoHistory.includes(entry.id)
    );

    // 如果所有记忆都显示过了，清空历史记录重新开始
    const entriesToChooseFrom = availableEntries.length > 0 ? availableEntries : allEntries;

    if (entriesToChooseFrom.length === 0) {
      return null;
    }

    // 随机选择一个记忆
    const randomIndex = Math.floor(Math.random() * entriesToChooseFrom.length);
    const selectedEntry = entriesToChooseFrom[randomIndex];

    // 如果清空了历史记录，重新开始记录
    if (availableEntries.length === 0) {
      setEchoHistory([selectedEntry.id]);
    } else {
      setEchoHistory(prev => [...prev, selectedEntry.id].slice(-10)); // 只保留最近10个
    }

    return selectedEntry;
  }, [echoHistory]);

  /**
   * 计算下次回响时间
   */
  const calculateNextEchoTime = useCallback((config: DreamEchoConfig): Date | null => {
    if (!config.enabled) {
      return null;
    }

    const now = new Date();
    const nextTime = new Date(now.getTime() + config.frequency * 60 * 60 * 1000);

    // 如果下次时间不在允许的范围内，找到下一个允许的时间
    if (!isInAllowedTimeRange({ ...config })) {
      // 找到今天或明天的下一个允许时间段
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        
        const dayOfWeek = checkDate.getDay();
        if (config.excludedDays.includes(dayOfWeek)) {
          continue;
        }

        for (const timeRange of config.preferredTimeRanges) {
          const [startHour, startMinute] = timeRange.start.split(':').map(Number);
          const rangeStart = new Date(checkDate);
          rangeStart.setHours(startHour, startMinute, 0, 0);

          if (rangeStart > now) {
            return rangeStart;
          }
        }
      }
    }

    return nextTime;
  }, [isInAllowedTimeRange]);

  /**
   * 显示拾梦回响
   */
  const showDreamEcho = useCallback(async () => {
    const config = dreamConfig.value;
    if (!config || !config.enabled) {
      return;
    }

    // 检查是否在允许的时间范围内
    if (!isInAllowedTimeRange(config)) {
      return;
    }

    // 检查是否已达到今日限制
    if (hasReachedDailyLimit(config)) {
      return;
    }

    // 获取随机记忆
    const randomMemory = await getRandomMemory();
    if (!randomMemory) {
      return;
    }

    // 显示回响
    setEchoState({
      currentEcho: randomMemory,
      isVisible: true,
      nextEchoTime: calculateNextEchoTime(config),
    });

    // 增加今日回响计数
    setDailyEchoCount(prev => prev + 1);
  }, [isInAllowedTimeRange, hasReachedDailyLimit, getRandomMemory, calculateNextEchoTime]);

  /**
   * 隐藏拾梦回响
   */
  const hideDreamEcho = useCallback(() => {
    setEchoState(prev => ({
      ...prev,
      isVisible: false,
    }));

    // 延迟清除当前回响
    setTimeout(() => {
      setEchoState(prev => ({
        ...prev,
        currentEcho: null,
      }));
    }, 300);
  }, []);

  /**
   * 手动触发拾梦回响
   */
  const triggerDreamEcho = useCallback(async () => {
    const config = dreamConfig.value;
    if (!config) {
      return;
    }

    const randomMemory = await getRandomMemory();
    if (!randomMemory) {
      return;
    }

    setEchoState({
      currentEcho: randomMemory,
      isVisible: true,
      nextEchoTime: calculateNextEchoTime(config),
    });
  }, [getRandomMemory, calculateNextEchoTime]);

  /**
   * 重置每日计数（在新的一天开始时调用）
   */
  const resetDailyCount = useCallback(() => {
    setDailyEchoCount(0);
  }, []);

  // 设置定时器
  useEffect(() => {
    const config = dreamConfig.value;
    if (!config || !config.enabled) {
      return;
    }

    const checkInterval = setInterval(() => {
      const now = new Date();
      
      // 检查是否是新的一天，重置计数
      const today = now.toDateString();
      const lastResetDate = localStorage.getItem('dreamEcho_lastResetDate');
      if (lastResetDate !== today) {
        resetDailyCount();
        localStorage.setItem('dreamEcho_lastResetDate', today);
      }

      // 检查是否应该显示回响
      if (isInAllowedTimeRange(config) && !hasReachedDailyLimit(config)) {
        const lastEchoTime = localStorage.getItem('dreamEcho_lastTime');
        const lastTime = lastEchoTime ? new Date(lastEchoTime) : new Date(0);
        const timeSinceLastEcho = now.getTime() - lastTime.getTime();
        const intervalMs = config.frequency * 60 * 60 * 1000;

        if (timeSinceLastEcho >= intervalMs) {
          showDreamEcho();
          localStorage.setItem('dreamEcho_lastTime', now.toISOString());
        }
      }
    }, 60000); // 每分钟检查一次

    return () => clearInterval(checkInterval);
  }, [dreamConfig.value, isInAllowedTimeRange, hasReachedDailyLimit, showDreamEcho, resetDailyCount]);

  // 初始化每日计数
  useEffect(() => {
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem('dreamEcho_lastResetDate');
    const savedCount = localStorage.getItem('dreamEcho_dailyCount');

    if (lastResetDate === today && savedCount) {
      setDailyEchoCount(parseInt(savedCount, 10));
    } else {
      resetDailyCount();
      localStorage.setItem('dreamEcho_lastResetDate', today);
    }
  }, [resetDailyCount]);

  // 保存每日计数
  useEffect(() => {
    localStorage.setItem('dreamEcho_dailyCount', dailyEchoCount.toString());
  }, [dailyEchoCount]);

  return {
    currentEcho: echoState.currentEcho,
    isVisible: echoState.isVisible,
    nextEchoTime: echoState.nextEchoTime,
    dailyEchoCount,
    maxDailyEchoes: dreamConfig.value?.maxEntriesPerDay || 3,
    showDreamEcho: triggerDreamEcho,
    hideDreamEcho,
    resetDailyCount,
  };
}
