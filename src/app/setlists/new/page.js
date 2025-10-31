'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewSetlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [songs, setSongs] = useState([])
  const [bands, setBands] = useState([])
  const [selectedSongs, setSelectedSongs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [setlistForm, setSetlistForm] = useState({
    name: '',
    venue: '',
    notes: '',
    bandId: ''
  })

  useEffect(() => {
    // Only redirect if we're definitely unauthenticated
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }
    
    // Fetch data immediately - API will handle auth
    Promise.all([
      fetch('/api/songs').then(res => res.json()),
      fetch('/api/bands').then(res => res.json())
    ]).then(([songsData, bandsData]) => {
      if (Array.isArray(songsData)) {
        setSongs(songsData)
        // Auto-select first band if exists and not already set
        if (songsData.length > 0 && Array.isArray(bandsData) && bandsData.length > 0) {
          setSetlistForm(prev => {
            if (prev.bandId) return prev // Already has a band selected
            const firstSongBandId = songsData[0].bandId
            const matchingBand = bandsData.find(b => b.id === firstSongBandId)
            return matchingBand ? { ...prev, bandId: matchingBand.id } : prev
          })
        }
      }
      if (Array.isArray(bandsData)) {
        setBands(bandsData)
      }
      setLoading(false)
    }).catch(error => {
      console.error('Error fetching data:', error)
      setLoading(false)
    })
  }, [status, router])

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAddSong = (song) => {
    setSelectedSongs([...selectedSongs, song])
  }

  const handleRemoveSong = (index) => {
    setSelectedSongs(selectedSongs.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const newSongs = [...selectedSongs]
    const temp = newSongs[index]
    newSongs[index] = newSongs[index - 1]
    newSongs[index - 1] = temp
    setSelectedSongs(newSongs)
  }

  const handleMoveDown = (index) => {
    if (index === selectedSongs.length - 1) return
    const newSongs = [...selectedSongs]
    const temp = newSongs[index]
    newSongs[index] = newSongs[index + 1]
    newSongs[index + 1] = temp
    setSelectedSongs(newSongs)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    if (!setlistForm.bandId) {
      alert('Please select a band.')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bandId: setlistForm.bandId,
          name: setlistForm.name,
          venue: setlistForm.venue,
          notes: setlistForm.notes,
          songs: selectedSongs.map(s => s.id)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create setlist')
      }

      router.push('/')
    } catch (error) {
      console.error('Error creating setlist:', error)
      alert('Failed to create setlist')
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Create Setlist</h1>
          <Link
            href="/"
            className="text-blue-500 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Setlist Details */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Setlist Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Setlist Name *
                </label>
                <input
                  type="text"
                  required
                  value={setlistForm.name}
                  onChange={(e) => setSetlistForm({...setlistForm, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Friday Night Show"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Band *
                </label>
                <select
                  required
                  value={setlistForm.bandId}
                  onChange={(e) => setSetlistForm({...setlistForm, bandId: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a band</option>
                  {bands.map(band => (
                    <option key={band.id} value={band.id}>{band.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={setlistForm.venue}
                    onChange={(e) => setSetlistForm({...setlistForm, venue: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Venue name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={setlistForm.notes}
                    onChange={(e) => setSetlistForm({...setlistForm, notes: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any notes?"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Available Songs */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-white">Available Songs</h2>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Search songs..."
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSongs.map(song => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => handleAddSong(song)}
                    className="w-full text-left bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-3 transition text-white"
                  >
                    <div className="font-semibold">{song.title}</div>
                    {song.artist && <div className="text-sm text-gray-400">{song.artist}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Songs (Setlist) */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-white">
                Setlist ({selectedSongs.length} songs)
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedSongs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Add songs to build your setlist</p>
                ) : (
                  selectedSongs.map((song, index) => (
                    <div key={index} className="bg-gray-700 border border-gray-600 rounded p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          <span className="text-blue-400 mr-2">{index + 1}.</span>
                          {song.title}
                        </div>
                        {song.artist && <div className="text-sm text-gray-400">{song.artist}</div>}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-xs rounded transition"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedSongs.length - 1}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-xs rounded transition"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSong(index)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || selectedSongs.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded transition"
            >
              {submitting ? 'Creating...' : 'Create Setlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

