import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import BabyPhotoApp from './App'
import './app.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#e48a6f',
          colorInfo: '#e48a6f',
          colorSuccess: '#82b39a',
          colorWarning: '#e2b96c',
          colorError: '#c96d5d',
          colorBgLayout: '#fff8f1',
          colorText: '#3f2a24',
          borderRadius: 22,
          wireframe: false,
          fontFamily:
            '"Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
        components: {
          Button: {
            primaryShadow: 'none',
          },
          Card: {
            colorBorderSecondary: 'rgba(117, 78, 57, 0.12)',
          },
        },
      }}
    >
      <AntdApp>
        <BabyPhotoApp />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
)
