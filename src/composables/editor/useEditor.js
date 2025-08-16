/**
 * @file src/composables/editor/useEditor.js
 * @description Markdown 编辑器 Composable
 */

// 导入历史记录功能
import { useHistory } from './useHistory.js';
// 其他必要导入
import { useEditorState } from './useEditorState.js';
import { useEditorEvents } from './useEditorEvents.js';
import { useEditorTheme } from './useEditorTheme.js';
import { useEditorOperations } from './useEditorOperations.js';
import { useEditorLifecycle } from './useEditorLifecycle.js';
import { useThemeWatcher } from '../theme/useThemeWatcher.js';
import { isFunction, isString, isObject, isValidThemeMode } from '../../shared/utils/type-check.js';
// 导入编辑器配置（假设存在）
import { EDITOR_CONFIG } from '../../config/constants/editor.js';

export function useMarkdownEditor(options = {}) {
  // 验证参数
  if (!isObject(options)) {
    throw new TypeError('配置选项必须是一个对象');
  }

  const {
    initialValue = '',
    theme = 'auto',
    onContentChange = () => {},
    onScroll = () => {}
  } = options;

  // 参数验证逻辑...

  // 初始化编辑器状态
  const editorState = useEditorState(initialValue);
  const editorEvents = useEditorEvents(onContentChange, onScroll);
  const editorTheme = useEditorTheme(theme);
  const editorOperations = useEditorOperations(editorState.getEditorView);
  const editorLifecycle = useEditorLifecycle({
    editorState,
    editorEvents,
    editorTheme
  });

  // 初始化历史记录管理
  const history = useHistory(editorState.content, EDITOR_CONFIG.AUTO_SAVE_DELAY);

  const themeWatcher = useThemeWatcher({
    editorTheme,
    reinitEditor: editorLifecycle.reinitEditor
  }, theme);

  const watchers = themeWatcher.setupThemeWatchers();

  // 清理方法
  const cleanup = () => {
    themeWatcher.cleanupWatchers(watchers);
    history.cleanup(); // 清理历史记录资源
  };

  return {
    // 编辑器状态和方法
    editorElement: editorState.editorElement,
    content: editorState.content,
    isInitialized: editorState.isInitialized,
    currentTheme: editorTheme.currentTheme,
    themeManager: editorTheme.themeManager,
    initEditor: editorLifecycle.initEditor,
    destroyEditor: editorLifecycle.destroyEditor,
    reinitEditor: editorLifecycle.reinitEditor,
    updateContent: editorLifecycle.updateContent,
    forceThemeUpdate: themeWatcher.forceThemeUpdate,
    ...editorOperations,
    getEditorView: editorState.getEditorView,
    cleanup,

    // 历史记录相关方法
    undo: history.undo,
    redo: history.redo
  };
}