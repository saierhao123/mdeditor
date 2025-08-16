/**
 * @file src/config/constants/defaults.js
 * @description 默认值常量定义
 * 
 * 包含应用程序中各种功能的默认配置值，
 * 确保在用户未设置或配置丢失时有合理的回退值。
 */

/**
 * 存储键
 */
export const STORAGE_KEYS = Object.freeze({
  // 主题相关
  COLOR_THEME: 'markdown-editor-color-theme',
  CODE_STYLE: 'markdown-editor-code-style',
  THEME_SYSTEM: 'markdown-editor-theme-system',
  FONT_FAMILY: 'markdown-editor-font-family',
  FONT_SIZE: 'markdown-editor-font-size',
  LETTER_SPACING: 'markdown-editor-letter-spacing',
  LINE_HEIGHT: 'markdown-editor-line-height',
  
  // 文件管理相关
  FILES: 'md_editor_files',               // 存储所有文件数据
  CURRENT_FILE_ID: 'md_editor_current_file_id', // 当前激活的文件ID
  EDITOR_HISTORY: 'md_editor_history',    // 编辑器历史记录
  EDITOR_CONTENT: 'md_editor_content'     // 最新编辑内容
});

/**
 * 主题默认配置 - 简化为统一默认主题
 */
export const THEME_DEFAULTS = {
  // 颜色主题 - 改为煤黑主题
  COLOR_THEME_ID: 'meihei',

  // 代码样式
  CODE_STYLE_ID: 'mac',

  // 布局主题
  THEME_SYSTEM_ID: 'default',

  // 字体设置
  FONT_FAMILY: 'system-default',
  FONT_SIZE: 16,
  LETTER_SPACING: 0, // px
  LINE_HEIGHT: 1.6,

  // 自动切换
  AUTO_SWITCH: true,
  FOLLOW_SYSTEM: true,

  // 过渡效果
  SMOOTH_TRANSITION: true,
  TRANSITION_DURATION: 300,
};