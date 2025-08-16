<template>
  <div class="file-manager">
    <div class="file-manager-header">
      <h3>我的文档</h3>
      <button class="new-file-btn" @click="createNewFile">
        <span>+</span> 新建文档
      </button>
    </div>
    
    <div class="file-list">
      <div 
        v-for="file in files" 
        :key="file.id"
        class="file-item"
        :class="{ active: file.id === currentFileId, starred: file.isStarred }"
        @click="openFile(file.id)"
      >
        <div class="file-info">
          <div class="file-title">{{ file.title || '未命名文件' }}</div>
          <div class="file-meta">
            <span class="update-time">{{ formatTime(file.updatedAt) }}</span>
            <span class="star-btn" @click.stop="toggleStar(file.id)">
              {{ file.isStarred ? '★' : '☆' }}
            </span>
          </div>
        </div>
        <button class="delete-btn" @click.stop="deleteFile(file.id)">×</button>
      </div>
      
      <div v-if="files.length === 0" class="empty-state">
        暂无文档，点击"新建文档"开始创作
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue';
// 调整导入路径以匹配项目实际结构
import { FileManager } from '../../core/storage/fileManager.js';
import { ThemeStorage } from '../../core/theme/storage.js';
import { STORAGE_KEYS } from '../../config/constants/defaults.js';

// 状态管理
const files = ref([]);
const currentFileId = ref('');

// 格式化时间显示
const formatTime = (isoString) => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 加载文件列表
const loadFiles = () => {
  try {
    files.value = FileManager.getAllFiles() || [];
    // 加载上次打开的文件
    const lastOpenId = ThemeStorage.load(STORAGE_KEYS.CURRENT_FILE_ID);
    
    if (lastOpenId && files.value.some(f => f.id === lastOpenId)) {
      currentFileId.value = lastOpenId;
    } else if (files.value.length > 0) {
      currentFileId.value = files.value[0].id;
    } else {
      currentFileId.value = '';
    }
  } catch (error) {
    console.error('加载文件列表失败:', error);
    files.value = [];
  }
};

// 新建文件
const createNewFile = () => {
  try {
    const newFile = FileManager.createFile({
      title: '未命名文档',
      content: '',
      isStarred: false,
      updatedAt: new Date().toISOString()
    });
    loadFiles();
    openFile(newFile.id);
  } catch (error) {
    console.error('创建新文件失败:', error);
    alert('创建文件失败，请重试');
  }
};

// 打开文件
const openFile = (id) => {
  if (!id) return;
  
  currentFileId.value = id;
  ThemeStorage.save(STORAGE_KEYS.CURRENT_FILE_ID, id);
  
  // 触发父组件更新
  const file = FileManager.getFile(id);
  if (file) {
    emit('file-change', file);
  }
};

// 删除文件
const deleteFile = (id) => {
  if (!id || !confirm('确定要删除这个文档吗？此操作不可恢复。')) {
    return;
  }
  
  try {
    FileManager.deleteFile(id);
    loadFiles();
    
    // 如果删除的是当前文件，自动切换到第一个文件
    if (id === currentFileId.value) {
      if (files.value.length > 0) {
        openFile(files.value[0].id);
      } else {
        currentFileId.value = '';
        emit('file-change', null);
      }
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    alert('删除文件失败，请重试');
  }
};

// 切换星标状态
const toggleStar = (id) => {
  try {
    const file = FileManager.getFile(id);
    if (file) {
      FileManager.updateFile(id, { 
        isStarred: !file.isStarred,
        updatedAt: new Date().toISOString() // 更新修改时间
      });
      loadFiles();
    }
  } catch (error) {
    console.error('更新文件星标状态失败:', error);
  }
};

// 初始化时加载文件
onMounted(loadFiles);

// 监听文件变化（使用防抖处理，避免频繁触发）
const debouncedLoadFiles = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(loadFiles, 300);
  };
})();

watchEffect(debouncedLoadFiles);

// 暴露给父组件的事件
const emit = defineEmits(['file-change', 'error']);

// 提供给父组件的方法
defineExpose({
  createNewFile,
  getCurrentFile: () => {
    try {
      return FileManager.getFile(currentFileId.value);
    } catch (error) {
      console.error('获取当前文件失败:', error);
      emit('error', error);
      return null;
    }
  },
  refreshFiles: loadFiles
});
</script>

<style scoped>
.file-manager {
  border-right: 1px solid var(--theme-border-light);
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--theme-bg-primary);
}

.file-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--theme-border-light);
}

.file-manager-header h3 {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.new-file-btn {
  background: var(--theme-primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
}

.new-file-btn:hover {
  background: var(--theme-primary-hover);
}

.file-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--theme-border-light) transparent;
}

.file-list::-webkit-scrollbar {
  width: 6px;
}

.file-list::-webkit-scrollbar-thumb {
  background-color: var(--theme-border-light);
  border-radius: 3px;
}

.file-item {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--theme-bg-secondary);
  transition: all 0.2s;
}

.file-item:hover {
  background: var(--theme-bg-tertiary);
}

.file-item.active {
  background: var(--theme-bg-highlight);
  border-left: 3px solid var(--theme-primary);
}

.file-item.starred .file-title {
  color: #ffb74d;
}

.file-title {
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--theme-text-primary);
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.update-time {
  white-space: nowrap;
}

.star-btn {
  margin-left: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.star-btn:hover {
  transform: scale(1.2);
}

.delete-btn {
  background: transparent;
  border: none;
  color: var(--theme-danger);
  cursor: pointer;
  font-size: 16px;
  display: none;
  padding: 2px 6px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: rgba(255, 82, 82, 0.1);
}

.file-item:hover .delete-btn {
  display: inline-block;
}

.empty-state {
  color: var(--theme-text-secondary);
  text-align: center;
  padding: 30px 0;
  font-size: 14px;
  line-height: 1.6;
}
</style>