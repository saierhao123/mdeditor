// src/core/storage/fileManager.js
/**
 * @file src/core/storage/fileManager.js
 * @description 文件管理工具类，处理文件的导入、导出和存储操作
 */

import { AppError, ERROR_TYPES } from '../../shared/utils/error.js';
import { showError } from '../../composables/useNotification.js';

// 存储键名
const FILE_STORAGE_KEY = 'markdown_editor_files';

export class FileManager {
  /**
   * 获取所有文件
   * @returns {Array} 文件列表
   */
  static getAllFiles() {
    try {
      const files = localStorage.getItem(FILE_STORAGE_KEY);
      return files ? JSON.parse(files) : [];
    } catch (error) {
      const appError = new AppError(
        '获取文件列表失败',
        ERROR_TYPES.FILE,
        error
      );
      showError(appError.message);
      console.error('获取文件列表错误:', error);
      return [];
    }
  }

  /**
   * 创建新文件
   * @param {Object} fileData - 文件数据
   * @returns {Object} 新创建的文件
   */
  static createFile(fileData) {
    try {
      const files = this.getAllFiles();
      const newFile = {
        id: Date.now().toString(), // 生成唯一ID
        ...fileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      files.push(newFile);
      localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(files));
      return newFile;
    } catch (error) {
      const appError = new AppError(
        '创建文件失败',
        ERROR_TYPES.FILE,
        error
      );
      showError(appError.message);
      console.error('创建文件错误:', error);
      throw error;
    }
  }

  /**
   * 获取单个文件
   * @param {string} id - 文件ID
   * @returns {Object|null} 文件对象或null
   */
  static getFile(id) {
    try {
      const files = this.getAllFiles();
      return files.find(file => file.id === id) || null;
    } catch (error) {
      const appError = new AppError(
        '获取文件失败',
        ERROR_TYPES.FILE,
        error
      );
      showError(appError.message);
      console.error('获取文件错误:', error);
      return null;
    }
  }

  /**
   * 更新文件
   * @param {string} id - 文件ID
   * @param {Object} updates - 要更新的字段
   * @returns {boolean} 是否更新成功
   */
  static updateFile(id, updates) {
    try {
      const files = this.getAllFiles();
      const index = files.findIndex(file => file.id === id);

      if (index === -1) return false;

      files[index] = {
        ...files[index],
        ...updates,
        updatedAt: new Date().toISOString() // 更新修改时间
      };

      localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(files));
      return true;
    } catch (error) {
      const appError = new AppError(
        '更新文件失败',
        ERROR_TYPES.FILE,
        error
      );
      showError(appError.message);
      console.error('更新文件错误:', error);
      return false;
    }
  }

  /**
   * 删除文件
   * @param {string} id - 文件ID
   * @returns {boolean} 是否删除成功
   */
  static deleteFile(id) {
    try {
      let files = this.getAllFiles();
      const initialLength = files.length;
      files = files.filter(file => file.id !== id);

      if (files.length === initialLength) return false;

      localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(files));
      return true;
    } catch (error) {
      const appError = new AppError(
        '删除文件失败',
        ERROR_TYPES.FILE,
        error
      );
      showError(appError.message);
      console.error('删除文件错误:', error);
      return false;
    }
  }

  /**
   * 导出内容为文件
   * @param {string} content - 要导出的内容
   * @param {string} fileName - 文件名
   * @param {string} mimeType - 文件MIME类型
   * @returns {Promise<boolean>} 操作是否成功
   */
  static async exportFile(content, fileName, mimeType = 'text/plain') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      const appError = new AppError(
        '文件导出失败', 
        ERROR_TYPES.FILE, 
        error
      );
      showError(appError.message);
      console.error('文件导出错误:', error);
      return false;
    }
  }

  /**
   * 导出Markdown文件
   * @param {string} content - Markdown内容
   * @param {string} [fileName='document.md'] - 文件名
   * @returns {Promise<boolean>} 操作是否成功
   */
  static exportMarkdown(content, fileName = 'document.md') {
    return this.exportFile(content, fileName, 'text/markdown');
  }

  /**
   * 导入文件
   * @param {string[]} [acceptTypes=['.md', '.txt']] - 可接受的文件类型
   * @returns {Promise<string|null>} 文件内容或null
   */
  static async importFile(acceptTypes = ['.md', '.txt']) {
    return new Promise((resolve) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = acceptTypes.join(',');
        
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve(event.target.result);
          };
          reader.onerror = () => {
            const error = new AppError(
              '文件读取失败', 
              ERROR_TYPES.FILE, 
              reader.error
            );
            showError(error.message);
            console.error('文件读取错误:', reader.error);
            resolve(null);
          };
          reader.readAsText(file);
        };
        
        input.click();
      } catch (error) {
        const appError = new AppError(
          '文件导入失败', 
          ERROR_TYPES.FILE, 
          error
        );
        showError(appError.message);
        console.error('文件导入错误:', error);
        resolve(null);
      }
    });
  }

  /**
   * 导入Markdown文件
   * @returns {Promise<string|null>} Markdown内容或null
   */
  static importMarkdown() {
    return this.importFile(['.md', '.markdown', '.txt']);
  }
}