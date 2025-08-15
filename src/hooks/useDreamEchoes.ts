/**
 * 拾梦回响 Hook
 * 管理随机记忆的显示逻辑
 */

import { useState, useCallback } from 'preact/hooks';
import { MemoryEntry } from '../types';
import { entries } from '../stores/appStore';

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

  /**
   * 获取随机记忆条目
   */
  const getRandomEntry = useCallback((): MemoryEntry | null => {
    const availableEntries = entries.value.filter(entry => 
      !echoHistory.includes(entry.id)
    );

    if (availableEntries.length === 0) {
      // 如果所有条目都显示过了，重置历史记录
      setEchoHistory([]);
      if (entries.value.length > 0) {
        const randomIndex = Math.floor(Math.random() * entries.value.length);
        return entries.value[randomIndex];
      }
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableEntries.length);
    return availableEntries[randomIndex];
  }, [echoHistory]);

  /**
   * 显示拾梦回响
   */
  const showDreamEcho = useCallback(() => {
    const randomEntry = getRandomEntry();
    if (!randomEntry) return;

    setEchoState(prev => ({
      ...prev,
      currentEcho: randomEntry,
      isVisible: true,
    }));

    // 更新历史记录
    setEchoHistory(prev => [...prev, randomEntry.id]);
  }, [getRandomEntry]);

  /**
   * 隐藏拾梦回响
   */
  const hideDreamEcho = useCallback(() => {
    setEchoState(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  return {
    currentEcho: echoState.currentEcho,
    isVisible: echoState.isVisible,
    nextEchoTime: echoState.nextEchoTime,
    showDreamEcho,
    hideDreamEcho,
  };
}