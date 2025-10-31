'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SongPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const setlistId = searchParams.get('setlistId')
  
  const [song, setSong] = useState(null)
  const [setlist, setSetlist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showChartForm, setShowChartForm] = useState(false)
  const [chartForm, setChartForm] = useState({ name: '', driveUrl: '' })
  const [submittingChart, setSubmittingChart] = useState(false)
  const [showRecordingForm, setShowRecordingForm] = useState(false)
  const [recordingForm, setRecordingForm] = useState({ name: '', driveUrl: '', recordedAt: '' })
  const [submittingRecording, setSubmittingRecording] = useState(false)

  const fetchSong = () => {
    fetch(`/api/songs/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setSong(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSong()
  }, [params.id])

  useEffect(() => {
    if (setlistId) {
      fetch(`/api/setlists/${setlistId}`)
        .then(res => res.json())
        .then(data => {
          setSetlist(data)
        })
        .catch(error => {
          console.error('Error fetching setlist:', error)
        })
    }
  }, [setlistId])

  const handleChartSubmit = async (e) => {
    e.preventDefault()
    setSubmittingChart(true)

    try {
      const response = await fetch(`/api/songs/${params.id}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chartForm)
      })

      if (response.ok) {
        setChartForm({ name: '', driveUrl: '' })
        setShowChartForm(false)
        fetchSong() // Refresh song data
      }
    } catch (error) {
      console.error('Error adding chart:', error)
    } finally {
      setSubmittingChart(false)
    }
  }

  const handleRecordingSubmit = async (e) => {
    e.preventDefault()
    setSubmittingRecording(true)

    try {
      const response = await fetch(`/api/songs/${params.id}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordingForm)
      })

      if (response.ok) {
        setRecordingForm({ name: '', driveUrl: '', recordedAt: '' })
        setShowRecordingForm(false)
        fetchSong() // Refresh song data
      }
    } catch (error) {
      console.error('Error adding recording:', error)
    } finally {
      setSubmittingRecording(false)
    }
  }

  if (loading) return <div className="p-8 bg-gray-900 text-white min-h-screen">Loading...</div>
  if (!song) return <div className="p-8 bg-gray-900 text-white min-h-screen">Song not found</div>

  // Extract file ID from Google Drive URL
  const getFileId = (url) => {
    const match = url.match(/\/d\/([^\/]+)/)
    return match ? match[1] : null
  }

  // Find current position and next/prev songs in setlist
  const currentIndex = setlist ? setlist.songs.findIndex(s => s.id === params.id) : -1
  const nextSong = currentIndex >= 0 && currentIndex < setlist.songs.length - 1 ? setlist.songs[currentIndex + 1] : null
  const prevSong = currentIndex > 0 ? setlist.songs[currentIndex - 1] : null

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Song Header with Navigation */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {setlist && currentIndex >= 0 && (
                <p className="text-blue-400 text-sm mb-2">
                  {setlist.name} • Song {currentIndex + 1} of {setlist.songs.length}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {prevSong && (
                <Link
                  href={`/songs/${prevSong.id}?setlistId=${setlistId}`}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
                >
                  ← Previous
                </Link>
              )}
              {nextSong && (
                <Link
                  href={`/songs/${nextSong.id}?setlistId=${setlistId}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">{song.title}</h1>
          {song.artist && <p className="text-gray-300 text-lg mb-4">{song.artist}</p>}
          {song.comments && <p className="text-gray-400">{song.comments}</p>}
        </div>

        {/* Charts Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Chart</h2>
            <button
              onClick={() => setShowChartForm(!showChartForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition text-sm"
            >
              {showChartForm ? 'Cancel' : 'Add Chart'}
            </button>
          </div>

          {showChartForm && (
            <form onSubmit={handleChartSubmit} className="mb-6 p-4 bg-gray-700 rounded border border-gray-600">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Chart Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={chartForm.name}
                    onChange={(e) => setChartForm({...chartForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Lead Sheet, Chord Chart"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Google Drive URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={chartForm.driveUrl}
                    onChange={(e) => setChartForm({...chartForm, driveUrl: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingChart}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition text-sm"
                >
                  {submittingChart ? 'Adding...' : 'Add Chart'}
                </button>
              </div>
            </form>
          )}

          {song.charts && song.charts.length > 0 ? (
            song.charts.map(chart => {
              const fileId = getFileId(chart.driveUrl)
              return (
                <div key={chart.id} className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">
                    {chart.name} - uploaded by {chart.uploadedBy.name}
                  </p>
                  {fileId && (
                    <iframe
                      src={`https://drive.google.com/file/d/${fileId}/preview`}
                      className="w-full h-[600px] border border-gray-600 rounded bg-white"
                      allow="autoplay"
                    />
                  )}
                </div>
              )
            })
          ) : (
            !showChartForm && <p className="text-gray-500">No charts yet. Add one to get started!</p>
          )}
        </div>

        {/* Recordings Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Recordings</h2>
            <button
              onClick={() => setShowRecordingForm(!showRecordingForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition text-sm"
            >
              {showRecordingForm ? 'Cancel' : 'Add Recording'}
            </button>
          </div>

          {showRecordingForm && (
            <form onSubmit={handleRecordingSubmit} className="mb-6 p-4 bg-gray-700 rounded border border-gray-600">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Recording Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recordingForm.name}
                    onChange={(e) => setRecordingForm({...recordingForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Practice Session, Live Performance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Google Drive URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={recordingForm.driveUrl}
                    onChange={(e) => setRecordingForm({...recordingForm, driveUrl: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Recording Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recordingForm.recordedAt}
                    onChange={(e) => setRecordingForm({...recordingForm, recordedAt: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingRecording}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition text-sm"
                >
                  {submittingRecording ? 'Adding...' : 'Add Recording'}
                </button>
              </div>
            </form>
          )}

          {song.recordings && song.recordings.length > 0 ? (
            <div className="space-y-4">
              {song.recordings.map(recording => {
                const fileId = getFileId(recording.driveUrl)
                return (
                  <div key={recording.id} className="border border-gray-600 rounded p-4 bg-gray-750">
                    <p className="font-semibold text-white">{recording.name}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(recording.recordedAt).toLocaleDateString()}
                    </p>
                    {fileId && (
                      <iframe
                        src={`https://drive.google.com/file/d/${fileId}/preview`}
                        className="w-full h-screen mt-2 rounded"
                        allow="autoplay"
                        allowFullScreen
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            !showRecordingForm && <p className="text-gray-500">No recordings yet. Add one to get started!</p>
          )}
        </div>
      </div>
    </div>
  )
}