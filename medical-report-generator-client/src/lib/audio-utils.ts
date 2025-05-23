type RecordAudioType = {
  (stream: MediaStream): Promise<Blob>
  stop: () => void
  currentRecorder?: MediaRecorder
}

export const recordAudio = (function (): RecordAudioType {
  const func = async function recordAudio(stream: MediaStream): Promise<Blob> {
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      const audioChunks: Blob[] = []

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
          resolve(audioBlob)
        }

        mediaRecorder.onerror = () => {
          reject(new Error("MediaRecorder error occurred"))
        }

        mediaRecorder.start(1000)
        ;(func as RecordAudioType).currentRecorder = mediaRecorder
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"
      throw new Error("Failed to start recording: " + errorMessage)
    }
  }

  ;(func as RecordAudioType).stop = () => {
    const recorder = (func as RecordAudioType).currentRecorder
    if (recorder && recorder.state !== "inactive") {
      recorder.stop()
    }
    delete (func as RecordAudioType).currentRecorder
  }

  return func as RecordAudioType
})()


export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Create a File object with the correct MIME type
  const audioFile = new File([audioBlob], "recording.webm", {
    type: "audio/webm",
  })

  const formData = new FormData()
  formData.append("audio", audioFile)

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to transcribe audio")
  }

  const data = await response.json()
  console.log(data.text)
  return data.text
}