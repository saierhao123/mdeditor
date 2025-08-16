<template>
  <div id="app">
    <!-- 应用头部 -->
    <AppHeader
      :show-settings-panel="showSettingsPanel"
      :view-mode="viewMode"
      :copy-format-options="copyFormatOptions"
      :selected-copy-format="selectedCopyFormat"
      :has-content="hasContent"
      :file-count="files.length"
      @open-github="openGithub"
      @toggle-settings="toggleSettingsPanel"
      @set-view-mode="setViewMode"
      @show-guide="showGuide"
      @copy-format-select="handleCopyFormatSelect"
      @update:selected-copy-format="selectedCopyFormat = $event"
      @new-file="createNewFile"
      @delete-file="deleteCurrentFile"
    />

    <!-- 主内容区域（左侧文件列表 + 右侧编辑区） -->
    <div class="main-container">
      <!-- 文件管理器侧边栏 -->
      <FileManager
        :files="files"
        :current-file-id="currentFileId"
        @select-file="selectFile"
        @create-file="createNewFile"
        @rename-file="renameFile"
        @delete-file="deleteFile"
      />

      <!-- 编辑与预览区域 -->
      <AppMain
        :markdown-content="currentFile.content"
        :sync-scroll-enabled="syncScrollEnabled"
        :view-mode="viewMode"
        :current-file-id="currentFileId"
        @update:markdown-content="updateFileContent"
        @clear-content="clearCurrentFileContent"
        @load-sample="loadSampleToCurrentFile"
        @html-generated="updateHtmlContent"
      />
    </div>

    <!-- 应用底部 -->
    <AppFooter
      :character-count="currentFileCharacterCount"
      :line-count="currentFileLineCount"
      :word-count="currentFileWordCount"
      :estimated-read-time="currentFileReadTime"
      :sync-scroll-enabled="syncScrollEnabled"
      @toggle-sync-scroll="toggleSyncScroll"
    />

    <!-- 通知组件 -->
    <div v-if="notifications.length > 0" class="notification-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', notification.type, { 'slide-out': notification.isRemoving }]"
      >
        {{ notification.message }}
      </div>
    </div>

    <!-- 设置面板 -->
    <SettingsPanel
      :visible="showSettingsPanel"
      @close="closeSettingsPanel"
      @show-notification="showNotification"
    />

    <!-- Markdown 语法指南 -->
    <MarkdownGuide
      :show="showMarkdownGuide"
      @close="closeGuide"
    />
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useAppState } from './composables/useAppState.js'
import { useGlobalThemeManager } from './composables/index.js'
import { STORAGE_KEYS } from './config/constants/defaults.js'
import AppHeader from './components/layout/AppHeader.vue'
import AppMain from './components/layout/AppMain.vue'
import AppFooter from './components/layout/AppFooter.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import MarkdownGuide from './components/MarkdownGuide.vue'
import FileManager from './components/FileManager.vue'
import { v4 as uuidv4 } from 'uuid' // 需安装 uuid 依赖：npm install uuid

// 初始化文件系统
const initFiles = () => {
  const savedFiles = localStorage.getItem(STORAGE_KEYS.FILES)
  const savedCurrentFileId = localStorage.getItem(STORAGE_KEYS.CURRENT_FILE_ID)
  
  if (savedFiles) {
    try {
      return {
        files: JSON.parse(savedFiles),
        currentFileId: savedCurrentFileId
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }
  
  // 默认文件
  const defaultFileId = uuidv4()
  return {
    files: [{
      id: defaultFileId,
      name: '未命名文档',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }],
    currentFileId: defaultFileId
  }
}

// 文件状态管理
const { files: initialFiles, currentFileId: initialCurrentFileId } = initFiles()
const files = ref(initialFiles)
const currentFileId = ref(initialCurrentFileId)

// 保存文件到本地存储
const saveFilesToStorage = () => {
  localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files.value))
  localStorage.setItem(STORAGE_KEYS.CURRENT_FILE_ID, currentFileId.value)
}

// 监听文件变化并自动保存
watchEffect(() => {
  saveFilesToStorage()
})

// 获取当前文件
const currentFile = computed(() => {
  return files.value.find(file => file.id === currentFileId.value) || files.value[0] || {
    id: '',
    name: '未命名文档',
    content: ''
  }
})

// 创建新文件
const createNewFile = () => {
  const newFile = {
    id: uuidv4(),
    name: `未命名文档-${files.value.length + 1}`,
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  files.value.push(newFile)
  currentFileId.value = newFile.id
  showNotification('已创建新文档', 'success')
}

// 选择文件
const selectFile = (fileId) => {
  currentFileId.value = fileId
}

// 重命名文件
const renameFile = (fileId, newName) => {
  const file = files.value.find(f => f.id === fileId)
  if (file) {
    file.name = newName
    file.updatedAt = new Date().toISOString()
    showNotification(`文件已重命名为：${newName}`, 'info')
  }
}

// 删除文件
const deleteFile = (fileId) => {
  if (files.value.length <= 1) {
    showNotification('至少保留一个文件', 'warning')
    return
  }
  
  const fileIndex = files.value.findIndex(f => f.id === fileId)
  if (fileIndex > -1) {
    const deletedFile = files.value.splice(fileIndex, 1)[0]
    // 如果删除的是当前文件，自动切换到第一个文件
    if (fileId === currentFileId.value) {
      currentFileId.value = files.value[0].id
    }
    showNotification(`已删除文件：${deletedFile.name}`, 'info')
  }
}

// 删除当前文件
const deleteCurrentFile = () => {
  deleteFile(currentFileId.value)
}

// 更新文件内容
const updateFileContent = (newContent) => {
  if (currentFile.value) {
    currentFile.value.content = newContent
    currentFile.value.updatedAt = new Date().toISOString()
  }
}

// 清空当前文件内容
const clearCurrentFileContent = () => {
  if (currentFile.value) {
    currentFile.value.content = ''
    currentFile.value.updatedAt = new Date().toISOString()
  }
}

// 加载示例内容到当前文件
const loadSampleToCurrentFile = (sampleContent) => {
  if (currentFile.value) {
    currentFile.value.content = sampleContent
    currentFile.value.updatedAt = new Date().toISOString()
  }
}

// 使用应用状态管理
const {
  // 状态
  htmlContent,
  showSettingsPanel,
  showMarkdownGuide,
  syncScrollEnabled,
  viewMode,
  notifications,
  selectedCopyFormat,
  copyFormatOptions,

  // 计算属性
  hasContent,
  isHtmlReady,
  characterCount,
  lineCount,
  wordCount,
  estimatedReadTime,

  // 方法
  updateHtmlContent,
  toggleSettingsPanel,
  closeSettingsPanel,
  showGuide,
  closeGuide,
  toggleSyncScroll,
  setViewMode,
  showNotification,
  removeNotification,
  handleCopyFormatSelect,
  openGithub
} = useAppState()

// 当前文件的统计信息
const currentFileCharacterCount = computed(() => {
  return currentFile.value.content.length
})

const currentFileLineCount = computed(() => {
  return currentFile.value.content.split('\n').length
})

const currentFileWordCount = computed(() => {
  return currentFile.value.content.trim().split(/\s+/).filter(word => word).length
})

const currentFileReadTime = computed(() => {
  const words = currentFileWordCount.value
  return Math.ceil(words / 200) // 假设每分钟阅读200字
})

// 初始化主题管理器
const themeManager = useGlobalThemeManager()
</script>

<style scoped>
/* 导入原来的样式 */
@import './styles/components/layout/app-layout.css';
@import './styles/components/notifications.css';

/* 主容器布局 */
.main-container {
  display: flex;
  width: 100%;
  height: calc(100vh - 110px); /* 减去头部和底部高度 */
  overflow: hidden;
}
</style>