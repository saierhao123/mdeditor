/**
 * @file vite.config.js
 * @description Vite 构建配置文件
 *
 * 这个文件用于配置 Vite，一个现代化的前端构建工具。
 * 它定义了项目在开发和生产环境中的行为。
 *
 * 主要配置项:
 * 1.  **`plugins`**: 
 *     - `@vitejs/plugin-vue`: 官方 Vue 插件，支持 .vue 单文件组件
 *
 * 2.  **`resolve.alias`**: 路径别名配置，简化导入路径
 *     - `@`: 指代 src 目录，避免冗长的相对路径
 *
 * 3.  **`server`**: 开发服务器配置
 *     - `port: 3000`: 开发服务器端口
 *     - `host: true`: 允许局域网访问
 *
 * 4.  **`build`**: 生产构建配置
 *     - `outDir: 'dist'`: 输出目录
 *     - `assetsDir: 'assets'`: 静态资源目录
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path'; // 引入 path 模块处理路径

// https://vitejs.dev/config/
export default defineConfig({
  // 插件配置
  plugins: [
    vue() // 支持 Vue 单文件组件
  ],

  // 路径解析配置
  resolve: {
    alias: {
      // 配置 @ 作为 src 目录的别名
      '@': resolve(__dirname, './src')
    }
  },

  // 开发服务器配置
  server: {
    port: 3000,
    host: true
  },

  // 生产构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});