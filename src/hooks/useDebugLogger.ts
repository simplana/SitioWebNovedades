import { useState, useCallback } from 'react';

export interface DebugLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: string;
  message: string;
  data?: any;
}

export const useDebugLogger = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addLog = useCallback((
    level: DebugLog['level'],
    category: string,
    message: string,
    data?: any
  ) => {
    const log: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    setLogs(prev => [log, ...prev.slice(0, 99)]); // Keep only last 100 logs
    
    // Console logging for development
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${category}] ${message}`, data || '');
  }, []);

  const info = useCallback((category: string, message: string, data?: any) => {
    addLog('info', category, message, data);
  }, [addLog]);

  const warn = useCallback((category: string, message: string, data?: any) => {
    addLog('warn', category, message, data);
  }, [addLog]);

  const error = useCallback((category: string, message: string, data?: any) => {
    addLog('error', category, message, data);
  }, [addLog]);

  const success = useCallback((category: string, message: string, data?: any) => {
    addLog('success', category, message, data);
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  return {
    logs,
    isVisible,
    addLog,
    info,
    warn,
    error,
    success,
    clearLogs,
    toggleVisibility,
    setIsVisible
  };
};