'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewSongPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bands, setBands] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    comments: '',
    bandId: ''
  })
  const [chartForm, setChartForm] = useState({ name: '', driveUrl: '' })
  const [recordingForm, setRecordingForm] = useState({ name: '', driveUrl: '', recordedAt: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    // Fetch bands
    fetch('/api/bands')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBands(data)
          // Auto-select first band if exists
          if (data.length > 0) {
            setFormData(prev => {
              if (prev.bandId) return prev // Already has a band selected
              return { ...prev, bandId: data[0].id }
            })
          }
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching bands:', error)
        setLoading(false)
      })
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // First, create the song
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create song')
      }

      const song = await response.json()

      // Then, create chart if provided
      if (chartForm.name && chartForm.driveUrl) {
        await fetch(`/api/songs/${song.id}/charts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chartForm)
        })
      }

      // Finally, create recording if provided
      if (recordingForm.name && recordingForm.driveUrl && recordingForm.recordedAt) {
        await fetch(`/api/songs/${song.id}/recordings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordingForm)
        })
      }

      router.push('/')
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h1 className="text-3xl font-bold mb-6 text-white">Add New Song</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Band *
              </label>
              <select
                required
                value={formData.bandId}
                onChange={(e) => setFormData({...formData, bandId: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select a band</option>
                {bands.map(band => (
                  <option key={band.id} value={band.id}>{band.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Song Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter song title"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artist
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({...formData, artist: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter artist name"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comments / Notes
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Any notes about this song?"
                disabled={isSubmitting}
              />
            </div>

            {/* Chart Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Chart (Optional)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chart Name
                  </label>
                  <input
                    type="text"
                    value={chartForm.name}
                    onChange={(e) => setChartForm({...chartForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Lead Sheet, Chord Chart"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Google Drive URL
                  </label>
                  <input
                    type="url"
                    value={chartForm.driveUrl}
                    onChange={(e) => setChartForm({...chartForm, driveUrl: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/file/d/..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Recording Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Recording (Optional)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recording Name
                  </label>
                  <input
                    type="text"
                    value={recordingForm.name}
                    onChange={(e) => setRecordingForm({...recordingForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Practice Session, Live Performance"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Google Drive URL
                  </label>
                  <input
                    type="url"
                    value={recordingForm.driveUrl}
                    onChange={(e) => setRecordingForm({...recordingForm, driveUrl: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://drive.google.com/file/d/..."
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recording Date
                  </label>
                  <input
                    type="date"
                    value={recordingForm.recordedAt}
                    onChange={(e) => setRecordingForm({...recordingForm, recordedAt: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition"
            >
              {isSubmitting ? 'Creating...' : 'Create Song'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

