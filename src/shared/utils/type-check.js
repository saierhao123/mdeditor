/**
 * @file src/shared/utils/type-check.js
 * @description 通用类型检查工具函数
 * 
 * 提供通用的类型验证工具，用于参数校验和类型判断
 */

/**
 * 检查值是否为函数
 * @param {*} value - 待检查的值
 * @returns {boolean} 是否为函数
 */
export const isFunction = (value) => typeof value === 'function';

/**
 * 检查值是否为字符串
 * @param {*} value - 待检查的值
 * @returns {boolean} 是否为字符串
 */
export const isString = (value) => typeof value === 'string';

/**
 * 检查值是否为非空对象（排除数组）
 * @param {*} value - 待检查的值
 * @returns {boolean} 是否为对象
 */
export const isObject = (value) => 
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * 检查值是否为有效的主题模式
 * @param {*} value - 待检查的值
 * @returns {boolean} 是否为有效的主题模式
 */
export const isValidThemeMode = (value) => 
  ['auto', 'light', 'dark'].includes(value);

/**
 * 检查值是否为非空字符串
 * @param {*} value - 待检查的值
 * @returns {boolean} 是否为非空字符串
 */
export const isNonEmptyString = (value) => 
  isString(value) && value.trim().length > 0;