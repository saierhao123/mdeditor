<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <!-- 撤销/重做按钮 -->
        <div class="toolbar-group">
          <ToolbarButton
            :title="'撤销 (Ctrl+Z)'"
            icon="undo"
            width="20"
            height="20"
            @click="handleUndo"
            :disabled="!canUndo"
          />
          <ToolbarButton
            :title="'重做 (Ctrl+Y)'"
            icon="redo"
            width="20"
            height="20"
            @click="handleRedo"
            :disabled="!canRedo"
          />
        </div>
        <div class="toolbar-divider"></div>
        
        <!-- 原有工具栏配置 -->
        <template v-for="(group, groupIndex) in toolbarConfig" :key="groupIndex">
          <div v-if="group.type === 'group'" class="toolbar-group">
            <ToolbarButton
              v-for="item in group.items"
              :key="item.id"
              :title="item.title"
              :icon="item.icon"
              :width="item.width"
              :height="item.height"
              @click="item.action"
            />
          </div>
          <div v-else-if="group.type === 'divider'" class="toolbar-divider"></div>
          <ToolbarButton
            v-else
            :key="group.id"
            :title="group.title"
            :icon="group.icon"
            :width="group.width"
            :height="group.height"
            @click="group.action"
          />
        </template>
      </div>
      <div class="toolbar-right">
        <!-- 显示自动保存状态 -->
        <span class="auto-save-status">
          {{ autoSaveStatus }}
        </span>
      </div>
    </div>

    <div class="editor-container">
      <div ref="editorElement" class="codemirror-wrapper"></div>
    </div>
  </div>
</template>

<script>
import { watch, computed, ref, onUnmounted } from 'vue'
import { useMarkdownEditor } from '../composables/index.js'
import ToolbarButton from './ToolbarButton.vue'
import { createToolbarConfig } from '../config/toolbar.js'
import { EDITOR_CONFIG } from '../config/constants/editor.js'
import { STORAGE_KEYS } from '../config/constants/defaults.js'

// 历史记录管理逻辑（支持多文件隔离）
function useHistory(editorContent, fileId, autoSaveDelay) {
  const history = ref([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 50
  const autoSaveStatus = ref('自动保存中...')

  // 生成带文件ID的存储键（实现多文件历史隔离）
  const getScopedStorageKey = (baseKey) => `${baseKey}_${fileId}`

  // 从本地存储加载当前文件的历史记录
  const initHistory = () => {
    const savedHistory = localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.EDITOR_HISTORY))
    const savedContent = localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.EDITOR_CONTENT))
    
    if (savedHistory) {
      try {
        history.value = JSON.parse(savedHistory)
        historyIndex.value = history.value.length - 1
      } catch (error) {
        console.error('Failed to parse history:', error)
        history.value = []
        historyIndex.value = -1
      }
    }
    
    // 恢复当前文件的上次保存内容
    if (savedContent && editorContent.value !== savedContent) {
      editorContent.value = savedContent
      addToHistory(savedContent)
    }
  }

  // 添加内容到历史记录
  const addToHistory = (content) => {
    if (!content) return

    // 移除当前位置后的历史记录（避免分支历史）
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // 限制历史记录数量
    if (history.value.length >= MAX_HISTORY) {
      history.value.shift() // 移除最旧的记录
    }

    // 添加新记录
    history.value.push({
      content,
      timestamp: new Date().toLocaleTimeString()
    })
    historyIndex.value = history.value.length - 1

    // 保存到本地存储（按文件ID隔离）
    localStorage.setItem(
      getScopedStorageKey(STORAGE_KEYS.EDITOR_HISTORY),
      JSON.stringify(history.value)
    )
    localStorage.setItem(
      getScopedStorageKey(STORAGE_KEYS.EDITOR_CONTENT),
      content
    )
    autoSaveStatus.value = `已保存 (${new Date().toLocaleTimeString()})`
  }

  // 撤销
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      return history.value[historyIndex.value].content
    }
    return editorContent.value
  }

  // 重做
  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      return history.value[historyIndex.value].content
    }
    return editorContent.value
  }

  // 自动保存定时器
  let saveTimer
  const startAutoSave = () => {
    saveTimer = setInterval(() => {
      const lastContent = history.value[historyIndex.value]?.content
      if (editorContent.value !== lastContent) {
        addToHistory(editorContent.value)
      }
    }, autoSaveDelay)
  }

  // 清理函数
  const cleanup = () => {
    clearInterval(saveTimer)
    // 最后保存一次当前内容
    addToHistory(editorContent.value)
  }

  // 初始化
  initHistory()
  startAutoSave()

  return {
    history,
    historyIndex,
    undo,
    redo,
    cleanup,
    autoSaveStatus,
    addToHistory // 暴露用于文件切换时手动保存
  }
}

export default {
  name: 'MarkdownEditor',
  components: {
    ToolbarButton
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    fileId: {
      type: String,
      required: true, // 多文件支持：必须传入文件ID
      description: '当前编辑的文件唯一标识'
    },
    theme: {
      type: String,
      default: 'light'
    },
    syncScrollEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'showMarkdownGuide'],
  setup(props, { emit }) {
    // 滚动同步处理
    const handleEditorScroll = (scrollPercentage) => {
      if (!props.syncScrollEnabled) return
      const previewElement = document.querySelector('.preview-rendered')
      if (previewElement) {
        const previewMaxScrollTop = Math.max(0, previewElement.scrollHeight - previewElement.clientHeight)
        const targetScrollTop = Math.round(previewMaxScrollTop * scrollPercentage)
        previewElement.scrollTop = targetScrollTop
      }
    }

    // 初始化编辑器
    const editor = useMarkdownEditor({
      initialValue: props.modelValue,
      theme: props.theme,
      onContentChange: (content) => {
        emit('update:modelValue', content)
      },
      onScroll: handleEditorScroll
    })

    // 初始化历史记录管理（传入当前文件ID实现隔离）
    const {
      undo: historyUndo,
      redo: historyRedo,
      historyIndex,
      history,
      cleanup,
      autoSaveStatus,
      addToHistory
    } = useHistory(editor.content, props.fileId, EDITOR_CONFIG.AUTO_SAVE_DELAY)

    // 监听文件ID变化（切换文件时）
    watch(
      () => props.fileId,
      (newFileId, oldFileId) => {
        if (newFileId !== oldFileId) {
          // 保存当前文件的历史记录
          addToHistory(editor.content.value)
          // 重新初始化新文件的历史记录
          cleanup() // 清理旧定时器
          Object.assign(
            { history, historyIndex, autoSaveStatus },
            useHistory(editor.content, newFileId, EDITOR_CONFIG.AUTO_SAVE_DELAY)
          )
        }
      }
    )

    // 处理撤销操作
    const handleUndo = () => {
      const prevContent = historyUndo()
      editor.updateContent(prevContent)
    }

    // 处理重做操作
    const handleRedo = () => {
      const nextContent = historyRedo()
      editor.updateContent(nextContent)
    }

    // 撤销/重做按钮状态
    const canUndo = computed(() => historyIndex.value > 0)
    const canRedo = computed(() => historyIndex.value < history.value.length - 1)

    // 监听外部内容变化（如文件切换时的内容更新）
    watch(() => props.modelValue, (newValue) => {
      if (newValue !== editor.content.value) {
        editor.updateContent(newValue)
      }
    })

    // 工具栏配置
    const toolbarConfig = computed(() => createToolbarConfig(editor))

    // 组件卸载时清理
    onUnmounted(cleanup)

    return {
      ...editor,
      toolbarConfig,
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
      autoSaveStatus
    }
  }
}
</script>

<style scoped>
/* 自动保存状态样式 */
.auto-save-status {
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--bg-secondary);
}

/* 编辑器容器样式 */
.editor-container {
  width: 100%;
  height: calc(100% - 40px);
  overflow: hidden;
}

.codemirror-wrapper {
  width: 100%;
  height: 100%;
}
</style>