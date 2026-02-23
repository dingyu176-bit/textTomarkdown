import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 页面加载时的调试信息
console.log('🚀 Markdown Dashboard Plugin 正在启动...')
console.log('📦 React 版本:', React.version)
console.log('⏱️ 加载时间:', new Date().toISOString())

// 显示一个加载占位符，直到 React 渲染完成
const rootElement = document.getElementById('root')!

// 在 React 渲染前显示简单信息
rootElement.innerHTML = `
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    background: #f5f5f5;
  ">
    <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
    <div style="font-size: 18px; color: #333; margin-bottom: 8px;">
      Markdown 渲染插件
    </div>
    <div style="font-size: 14px; color: #666;">
      正在加载中...
    </div>
    <div style="margin-top: 24px; font-size: 12px; color: #999;">
      ${new Date().toLocaleString()}
    </div>
  </div>
`

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ React 渲染成功')
} catch (error) {
  console.error('❌ React 渲染失败:', error)
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background: #fff2f0;
      padding: 20px;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
      <div style="font-size: 18px; color: #cf1322; margin-bottom: 8px;">
        插件加载失败
      </div>
      <div style="font-size: 14px; color: #666; max-width: 400px; text-align: center;">
        ${error instanceof Error ? error.message : '未知错误'}
      </div>
      <div style="margin-top: 24px; font-size: 12px; color: #999;">
        请检查控制台获取更多信息
      </div>
    </div>
  `
}
