/**
 * SettingsManager - управление настройками расширения
 * Реализует паттерн Singleton и принципы SOLID
 */
class SettingsManager {
  static #instance = null;
  
  // Константы
  static DEFAULT_TIME_LIMIT = 90; // минуты
  static MIN_TIME_LIMIT = 5; // минуты
  static MAX_TIME_LIMIT = 480; // минуты (8 часов)
  static STORAGE_KEY = 'timeLimitMinutes';
  
  constructor() {
    if (SettingsManager.#instance) {
      return SettingsManager.#instance;
    }
    
    this.listeners = new Set();
    SettingsManager.#instance = this;
  }
  
  /**
   * Получить единственный экземпляр (Singleton)
   */
  static getInstance() {
    if (!SettingsManager.#instance) {
      SettingsManager.#instance = new SettingsManager();
    }
    return SettingsManager.#instance;
  }
  
  /**
   * Получить текущий лимит времени
   * @returns {Promise<number>} лимит в минутах
   */
  async getTimeLimit() {
    try {
      const result = await chrome.storage.local.get({
        [SettingsManager.STORAGE_KEY]: SettingsManager.DEFAULT_TIME_LIMIT
      });
      return result[SettingsManager.STORAGE_KEY];
    } catch (error) {
      console.error('Error getting time limit:', error);
      return SettingsManager.DEFAULT_TIME_LIMIT;
    }
  }
  
  /**
   * Установить лимит времени с валидацией
   * @param {number} minutes - лимит в минутах
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async setTimeLimit(minutes) {
    const validation = this.validateTimeLimit(minutes);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    try {
      await chrome.storage.local.set({
        [SettingsManager.STORAGE_KEY]: minutes
      });
      
      // Уведомить слушателей об изменении
      this.notifyListeners(minutes);
      
      return { success: true };
    } catch (error) {
      console.error('Error setting time limit:', error);
      return { success: false, error: 'Failed to save settings' };
    }
  }
  
  /**
   * Сбросить к значению по умолчанию
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async resetToDefault() {
    return this.setTimeLimit(SettingsManager.DEFAULT_TIME_LIMIT);
  }
  
  /**
   * Валидация лимита времени
   * @param {any} value - значение для валидации
   * @returns {{valid: boolean, error?: string}}
   */
  validateTimeLimit(value) {
    // Проверка типа
    if (typeof value !== 'number') {
      return { valid: false, error: 'Time limit must be a number' };
    }
    
    // Проверка на целое число
    if (!Number.isInteger(value)) {
      return { valid: false, error: 'Time limit must be a whole number' };
    }
    
    // Проверка диапазона
    if (value < SettingsManager.MIN_TIME_LIMIT) {
      return { 
        valid: false, 
        error: `Time limit must be at least ${SettingsManager.MIN_TIME_LIMIT} minutes` 
      };
    }
    
    if (value > SettingsManager.MAX_TIME_LIMIT) {
      return { 
        valid: false, 
        error: `Time limit must not exceed ${SettingsManager.MAX_TIME_LIMIT} minutes` 
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Подписаться на изменения настроек
   * @param {Function} callback - функция обратного вызова
   */
  onSettingsChanged(callback) {
    this.listeners.add(callback);
    
    // Возвращаем функцию для отписки
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  /**
   * Уведомить всех слушателей об изменении
   * @param {number} newLimit - новый лимит
   */
  notifyListeners(newLimit) {
    this.listeners.forEach(callback => {
      try {
        callback(newLimit);
      } catch (error) {
        console.error('Error in settings change listener:', error);
      }
    });
  }
  
  /**
   * Инициализировать слушатель изменений chrome.storage
   */
  initializeStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[SettingsManager.STORAGE_KEY]) {
        const newLimit = changes[SettingsManager.STORAGE_KEY].newValue;
        this.notifyListeners(newLimit);
      }
    });
  }
}

// Делаем доступным глобально для всех скриптов
if (typeof window !== 'undefined') {
  // Браузер - делаем доступным глобально
  window.SettingsManager = SettingsManager;
} else if (typeof globalThis !== 'undefined') {
  // Service Worker - делаем доступным глобально
  globalThis.SettingsManager = SettingsManager;
}
