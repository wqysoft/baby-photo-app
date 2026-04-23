export interface BabyPhoto {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  dataUrl: string
}

const DB_NAME = 'baby-photo-app'
const DB_VERSION = 1
const STORE_NAME = 'photos'

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('当前浏览器不支持 IndexedDB'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error ?? new Error('图片数据库初始化失败'))
    }

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export async function getAllPhotos() {
  const database = await openDatabase()

  return new Promise<BabyPhoto[]>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => {
      reject(request.error ?? new Error('读取图片失败'))
    }

    request.onsuccess = () => {
      const photos = [...request.result].sort((left, right) => {
        return Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt)
      })

      resolve(photos)
    }

    transaction.oncomplete = () => {
      database.close()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('读取图片事务失败'))
    }
  })
}

export async function savePhoto(photo: BabyPhoto) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(photo)

    request.onerror = () => {
      reject(request.error ?? new Error('保存图片失败'))
    }

    request.onsuccess = () => {
      resolve()
    }

    transaction.oncomplete = () => {
      database.close()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('保存图片事务失败'))
    }
  })
}

export async function deletePhoto(id: string) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => {
      reject(request.error ?? new Error('删除图片失败'))
    }

    request.onsuccess = () => {
      resolve()
    }

    transaction.oncomplete = () => {
      database.close()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('删除图片事务失败'))
    }
  })
}

export async function clearPhotos() {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onerror = () => {
      reject(request.error ?? new Error('清空图片失败'))
    }

    request.onsuccess = () => {
      resolve()
    }

    transaction.oncomplete = () => {
      database.close()
    }

    transaction.onerror = () => {
      reject(transaction.error ?? new Error('清空图片事务失败'))
    }
  })
}
