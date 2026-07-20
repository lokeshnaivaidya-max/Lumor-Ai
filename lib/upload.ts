export async function uploadFile(file: File, endpoint: string, onProgress?: (p: number) => void): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append("file", file)

  return new Promise<{ url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round(e.loaded * 100 / e.total))
        }
      }
    }

    xhr.open("POST", endpoint, true)
    xhr.withCredentials = true

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          resolve({ url: result.url || xhr.responseText })
        } catch {
          resolve({ url: xhr.responseText })
        }
      } else {
        let errorDetail = xhr.responseText || `HTTP ${xhr.status}`
        try {
          const j = JSON.parse(xhr.responseText)
          errorDetail = j.message || j.error || errorDetail
        } catch {
        }
        reject(new Error(`Upload failed (${xhr.status}): ${errorDetail}`))
      }
    }

    xhr.onerror = () => reject(new Error("Network error during file upload"))
    xhr.send(formData)
  })
}
