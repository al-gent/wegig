'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetlistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [setlist, setSetlist] = useState(null)
  const [allSongs, setAllSongs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewSongForm, setShowNewSongForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newSongData, setNewSongData] = useState({
    title: '',
    artist: '',
    comments: ''
  })

  const fetchSetlist = () => {
    fetch(`/api/setlists/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setSetlist(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching setlist:', error)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSetlist()
  }, [params.id])

  const fetchAllData = () => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllSongs(data)
        }
      })
      .catch(error => {
        console.error('Error fetching songs:', error)
      })
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const currentSongIds = setlist?.songs?.map(s => s.id) || []
  const filteredSongs = allSongs.filter(song => 
    !currentSongIds.includes(song.id) &&
    (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const handleAddSong = async (songId) => {
    if (!setlist) return
    setSubmitting(true)
    
    const newSongOrder = setlist.songs.length + 1
    const newSongIds = [...currentSongIds, songId]
    
    try {
      const response = await fetch(`/api/setlists/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: newSongIds })
      })

      if (!response.ok) {
        throw new Error('Failed to add song')
      }

      fetchSetlist()
    } catch (error) {
      console.error('Error adding song:', error)
      alert('Failed to add song')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveSong = async (songId) => {
    if (!setlist) return
    setSubmitting(true)
    
    const newSongIds = currentSongIds.filter(id => id !== songId)
    
    try {
      const response = await fetch(`/api/setlists/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: newSongIds })
      })

      if (!response.ok) {
        throw new Error('Failed to remove song')
      }

      fetchSetlist()
    } catch (error) {
      console.error('Error removing song:', error)
      alert('Failed to remove song')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoveUp = async (index) => {
    if (index === 0 || !setlist) return
    setSubmitting(true)
    
    const newSongIds = [...currentSongIds]
    const temp = newSongIds[index]
    newSongIds[index] = newSongIds[index - 1]
    newSongIds[index - 1] = temp
    
    try {
      const response = await fetch(`/api/setlists/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: newSongIds })
      })

      if (!response.ok) {
        throw new Error('Failed to reorder songs')
      }

      fetchSetlist()
    } catch (error) {
      console.error('Error reordering songs:', error)
      alert('Failed to reorder songs')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoveDown = async (index) => {
    if (!setlist || index === currentSongIds.length - 1) return
    setSubmitting(true)
    
    const newSongIds = [...currentSongIds]
    const temp = newSongIds[index]
    newSongIds[index] = newSongIds[index + 1]
    newSongIds[index + 1] = temp
    
    try {
      const response = await fetch(`/api/setlists/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: newSongIds })
      })

      if (!response.ok) {
        throw new Error('Failed to reorder songs')
      }

      fetchSetlist()
    } catch (error) {
      console.error('Error reordering songs:', error)
      alert('Failed to reorder songs')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateNewSong = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    if (!setlist?.band?.id) {
      alert('Setlist must have a band to add songs')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSongData,
          bandId: setlist.band.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create song')
      }

      const newSong = await response.json()
      
      // Refresh the songs list
      fetchAllData()
      
      // Add the new song to the setlist immediately
      const newSongIds = [...currentSongIds, newSong.id]
      
      const addResponse = await fetch(`/api/setlists/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: newSongIds })
      })

      if (!addResponse.ok) {
        throw new Error('Failed to add song to setlist')
      }

      fetchSetlist()
      
      // Reset form
      setNewSongData({ title: '', artist: '', comments: '' })
      setShowNewSongForm(false)
      setSubmitting(false)
    } catch (error) {
      console.error('Error creating song:', error)
      alert('Failed to create song')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 bg-gray-900 text-white min-h-screen">Loading...</div>
  if (!setlist) return <div className="p-8 bg-gray-900 text-white min-h-screen">Setlist not found</div>

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
        </div>

        {/* Setlist Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <h1 className="text-3xl font-bold mb-2 text-white">{setlist.name}</h1>
          <div className="space-y-1">
            {setlist.band && <p className="text-gray-300 text-lg">Band: {setlist.band.name}</p>}
            {setlist.venue && <p className="text-gray-300 text-lg">Venue: {setlist.venue}</p>}
            {setlist.date && (
              <p className="text-gray-300 text-sm">
                Date: {new Date(setlist.date).toLocaleDateString()}
              </p>
            )}
          </div>
          {setlist.notes && <p className="text-gray-400 mt-4">{setlist.notes}</p>}
        </div>

        {/* Songs Section with Edit Mode */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Songs ({setlist.songs?.length || 0})</h2>
          </div>
          
          {setlist.songs && setlist.songs.length > 0 ? (
            <div className="space-y-2">
              {setlist.songs.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center bg-gray-700 border border-gray-600 rounded p-4"
                >
                  <span className="text-blue-400 font-bold mr-4 text-lg">{index + 1}.</span>
                  <Link href={`/songs/${song.id}?setlistId=${params.id}`} className="flex-1">
                    <div className="font-semibold text-white">{song.title}</div>
                    {song.artist && <div className="text-sm text-gray-400">{song.artist}</div>}
                  </Link>
                  <div className="flex gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || submitting}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-xs rounded transition"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === currentSongIds.length - 1 || submitting}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-xs rounded transition"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSong(song.id)}
                      disabled={submitting}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition disabled:bg-gray-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No songs in this setlist.</p>
          )}
        </div>

        {/* Add Songs Panel */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-white">Add Songs</h3>
          
          {/* Create New Song Form */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowNewSongForm(!showNewSongForm)}
              className="text-blue-500 hover:underline text-sm mb-3"
            >
              {showNewSongForm ? '× Cancel' : '+ Create New Song'}
            </button>
            
            {showNewSongForm && (
              <form onSubmit={handleCreateNewSong} className="p-4 bg-gray-700 rounded border border-gray-600">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Song Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSongData.title}
                      onChange={(e) => setNewSongData({...newSongData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter song title"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Artist
                    </label>
                    <input
                      type="text"
                      value={newSongData.artist}
                      onChange={(e) => setNewSongData({...newSongData, artist: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter artist name"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={newSongData.comments}
                      onChange={(e) => setNewSongData({...newSongData, comments: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Any notes?"
                      disabled={submitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition text-sm"
                  >
                    {submitting ? 'Creating...' : 'Create & Add to Setlist'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Search songs..."
          />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSongs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {searchTerm ? 'No songs match your search.' : 'All songs are already in this setlist.'}
              </p>
            ) : (
              filteredSongs.map(song => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => handleAddSong(song.id)}
                  disabled={submitting}
                  className="w-full text-left bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-3 transition text-white disabled:bg-gray-800"
                >
                  <div className="font-semibold">{song.title}</div>
                  {song.artist && <div className="text-sm text-gray-400">{song.artist}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

