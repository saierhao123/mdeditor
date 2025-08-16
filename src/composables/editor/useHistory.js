// src/composables/editor/useHistory.js
import { ref, watch } from 'vue';

export function useHistory(editorContent, autoSaveDelay) {
  // 历史记录列表（存储每次编辑的内容和时间）
  const history = ref([]);
  // 当前历史记录索引
  const historyIndex = ref(-1);
  // 最大历史记录条数（避免占用过多内存）
  const MAX_HISTORY = 50;

  // 初始化：从本地存储加载历史记录
  const initHistory = () => {
    const savedHistory = localStorage.getItem('mdEditorHistory');
    const savedContent = localStorage.getItem('mdEditorContent');
    if (savedHistory) {
      history.value = JSON.parse(savedHistory);
      historyIndex.value = history.value.length - 1;
    }
    // 如果有保存的内容，同步到编辑器
    if (savedContent && editorContent.value !== savedContent) {
      editorContent.value = savedContent;
      addToHistory(savedContent); // 加入历史记录
    }
  };

  // 添加内容到历史记录
  const addToHistory = (content) => {
    // 移除当前索引后的历史（避免分支历史）
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }
    // 限制历史记录数量
    if (history.value.length >= MAX_HISTORY) {
      history.value.shift(); // 移除最旧的记录
    }
    // 添加新记录
    history.value.push({
      content,
      timestamp: new Date().toISOString()
    });
    historyIndex.value = history.value.length - 1;
    // 保存历史记录到本地存储
    localStorage.setItem('mdEditorHistory', JSON.stringify(history.value));
  };

  // 回退到上一步
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      editorContent.value = history.value[historyIndex.value].content;
    }
  };

  // 前进到下一步
  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      editorContent.value = history.value[historyIndex.value].content;
    }
  };

  // 自动保存定时器：每10秒检查内容变化并保存
  let saveTimer;
  const startAutoSave = () => {
    saveTimer = setInterval(() => {
      const lastHistory = history.value[historyIndex.value];
      // 内容有变化时才保存
      if (editorContent.value && editorContent.value !== lastHistory?.content) {
        addToHistory(editorContent.value);
        // 同时单独保存一份最新内容（用于初始化）
        localStorage.setItem('mdEditorContent', editorContent.value);
      }
    }, autoSaveDelay);
  };

  // 清理定时器
  const stopAutoSave = () => {
    if (saveTimer) clearInterval(saveTimer);
  };

  // 监听内容变化，即时记录（可选，增强体验）
  watch(editorContent, (newVal, oldVal) => {
    if (newVal !== oldVal && newVal) {
      // 避免频繁触发（例如输入过程中），这里用防抖
      clearTimeout(window.tempDebounce);
      window.tempDebounce = setTimeout(() => {
        addToHistory(newVal);
      }, 500); // 输入暂停0.5秒后记录
    }
  });

  // 初始化
  initHistory();
  startAutoSave();

  // 组件卸载时清理
  const cleanup = () => {
    stopAutoSave();
    // 最后保存一次
    localStorage.setItem('mdEditorContent', editorContent.value);
  };

  return {
    history,
    undo,
    redo,
    cleanup
  };
}