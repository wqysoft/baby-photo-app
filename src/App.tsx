import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Image,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
} from 'antd'
import type { UploadProps } from 'antd'
import {
  ClearOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  InboxOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'

import type { BabyPhoto } from './storage'
import { clearPhotos, deletePhoto, getAllPhotos, savePhoto } from './storage'

const { Dragger } = Upload
const { Paragraph, Text, Title } = Typography

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('图片读取失败'))
    }

    reader.onload = () => {
      resolve(String(reader.result))
    }

    reader.readAsDataURL(file)
  })
}

function generatePhotoId() {
  if ('crypto' in globalThis && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    globalThis.crypto.getRandomValues(bytes)

    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function downloadPhoto(photo: BabyPhoto) {
  const anchor = document.createElement('a')
  anchor.href = photo.dataUrl
  anchor.download = photo.name
  anchor.click()
}

export default function BabyPhotoApp() {
  const { message, modal } = AntdApp.useApp()
  const [photos, setPhotos] = useState<BabyPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [activePhoto, setActivePhoto] = useState<BabyPhoto | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPhotos() {
      try {
        const savedPhotos = await getAllPhotos()

        if (!cancelled) {
          setPhotos(savedPhotos)
        }
      } catch (error) {
        if (!cancelled) {
          message.error(error instanceof Error ? error.message : '加载图片失败')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPhotos()

    return () => {
      cancelled = true
    }
  }, [message])

  const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0)

  const handleBeforeUpload: UploadProps['beforeUpload'] = async file => {
    if (!file.type.startsWith('image/')) {
      message.warning('只能上传图片文件')
      return Upload.LIST_IGNORE
    }

    setUploadingCount(count => count + 1)

    try {
      const dataUrl = await fileToDataUrl(file)
      const nextPhoto: BabyPhoto = {
        id: generatePhotoId(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      }

      await savePhoto(nextPhoto)
      setPhotos(current => [nextPhoto, ...current])
      message.success(`已添加 ${file.name}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '图片保存失败')
    } finally {
      setUploadingCount(count => count - 1)
    }

    return Upload.LIST_IGNORE
  }

  async function handleDelete(photo: BabyPhoto) {
    try {
      await deletePhoto(photo.id)
      setPhotos(current => current.filter(item => item.id !== photo.id))

      if (activePhoto?.id === photo.id) {
        setActivePhoto(null)
      }

      message.success(`已删除 ${photo.name}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除图片失败')
    }
  }

  function handleClearAll() {
    modal.confirm({
      title: '清空全部图片',
      content: '这会删除当前浏览器里保存的所有宝宝图片记录。',
      okText: '确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await clearPhotos()
        setPhotos([])
        setActivePhoto(null)
        message.success('图片已清空')
      },
    })
  }

  return (
    <div className="page-shell">
      <div className="page-orb page-orb-left" />
      <div className="page-orb page-orb-right" />

      <section className="hero-panel">
        <div className="hero-copy">
          <Tag className="hero-tag" bordered={false}>
            宝宝成长影像
          </Tag>
          <Title level={1} className="hero-title">
            把珍贵瞬间整理成一个轻量图片库
          </Title>
          <Paragraph className="hero-description">
            支持本地上传、预览查看、单张下载，图片会保存在当前浏览器的 IndexedDB
            中，刷新页面后依然可见。
          </Paragraph>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <Text className="stat-label">图片数量</Text>
            <strong className="stat-value">{photos.length}</strong>
          </div>
          <div className="stat-card">
            <Text className="stat-label">已用空间</Text>
            <strong className="stat-value">{formatFileSize(totalSize)}</strong>
          </div>
          <div className="stat-card">
            <Text className="stat-label">当前状态</Text>
            <strong className="stat-value">
              {uploadingCount > 0 ? `上传中 ${uploadingCount}` : '可继续添加'}
            </strong>
          </div>
        </div>
      </section>

      <section className="control-panel">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">上传区域</Text>
            <Title level={3} className="section-title">
              添加新的宝宝照片
            </Title>
          </div>

          <Space size="middle">
            <Button
              danger
              ghost
              icon={<ClearOutlined />}
              onClick={handleClearAll}
              disabled={!photos.length}
            >
              清空全部
            </Button>
          </Space>
        </div>

        <Dragger
          multiple
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleBeforeUpload}
          disabled={loading}
          className="upload-panel"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="upload-title">拖拽图片到这里，或者点击选择文件</p>
          <p className="upload-description">
            适合存放宝宝日常、旅行、生日等照片，上传后会自动加入下方图片库。
          </p>
        </Dragger>
      </section>

      <section className="gallery-panel">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">图片浏览</Text>
            <Title level={3} className="section-title">
              宝宝相册
            </Title>
          </div>
        </div>

        {loading ? (
          <div className="loading-panel">
            <Spin size="large" />
          </div>
        ) : photos.length ? (
          <div className="gallery-grid">
            {photos.map((photo, index) => (
              <Card
                key={photo.id}
                className="photo-card"
                style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
                cover={
                  <button
                    type="button"
                    className="photo-cover"
                    onClick={() => setActivePhoto(photo)}
                  >
                    <Image
                      src={photo.dataUrl}
                      alt={photo.name}
                      preview={false}
                      className="photo-image"
                    />
                  </button>
                }
              >
                <div className="photo-meta">
                  <div className="photo-name-row">
                    <Title level={5} className="photo-name" ellipsis={{ rows: 1 }}>
                      {photo.name}
                    </Title>
                    <Tag bordered={false} className="photo-size-tag">
                      {formatFileSize(photo.size)}
                    </Tag>
                  </div>

                  <Text className="photo-time">{formatDate(photo.uploadedAt)}</Text>

                  <Space className="photo-actions" wrap>
                    <Button
                      type="default"
                      icon={<EyeOutlined />}
                      onClick={() => setActivePhoto(photo)}
                    >
                      查看
                    </Button>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadPhoto(photo)}
                    >
                      下载
                    </Button>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => void handleDelete(photo)}
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <Empty
              image={<PictureOutlined className="empty-icon" />}
              description="还没有上传图片，先添加几张宝宝照片吧。"
            />
          </div>
        )}
      </section>

      <Modal
        open={Boolean(activePhoto)}
        onCancel={() => setActivePhoto(null)}
        footer={
          activePhoto ? (
            <Space>
              <Button onClick={() => setActivePhoto(null)}>关闭</Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => downloadPhoto(activePhoto)}>
                下载图片
              </Button>
            </Space>
          ) : null
        }
        title={activePhoto?.name}
        width={960}
        centered
        destroyOnHidden
      >
        {activePhoto ? (
          <div className="preview-layout">
            <div className="preview-image-wrap">
              <Image src={activePhoto.dataUrl} alt={activePhoto.name} preview={false} />
            </div>
            <div className="preview-info">
              <div className="preview-info-card">
                <Text className="preview-label">上传时间</Text>
                <strong>{formatDate(activePhoto.uploadedAt)}</strong>
              </div>
              <div className="preview-info-card">
                <Text className="preview-label">文件大小</Text>
                <strong>{formatFileSize(activePhoto.size)}</strong>
              </div>
              <div className="preview-info-card">
                <Text className="preview-label">文件类型</Text>
                <strong>{activePhoto.type || '未知格式'}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
