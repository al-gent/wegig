'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function BandDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [band, setBand] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetch(`/api/bands/${params.id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch band')
          }
          return res.json()
        })
        .then(data => {
          setBand(data)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error fetching band:', error)
          setLoading(false)
        })
    }
  }, [status, params.id])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!band) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-white">Band not found</p>
          <Link href="/bands" className="text-blue-500 hover:underline mt-4 inline-block">
            Back to Bands
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/bands" className="text-blue-500 hover:underline mb-4 inline-block">
            ← Back to Bands
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{band.name}</h1>
          <p className="text-gray-400">{band.members.length} members · {band.songs.length} songs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Songs Section */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Songs</h2>
                <Link
                  href={`/bands/${band.id}/songs/new`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition text-sm"
                >
                  Add Song
                </Link>
              </div>

              {band.songs.length === 0 ? (
                <p className="text-gray-400">No songs yet. Add your first song!</p>
              ) : (
                <div className="space-y-3">
                  {band.songs.map(song => (
                    <Link
                      key={song.id}
                      href={`/songs/${song.id}`}
                      className="block bg-gray-700 hover:bg-gray-650 rounded p-4 border border-gray-600 hover:border-blue-500 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{song.title}</h3>
                          {song.artist && <p className="text-gray-400 text-sm">{song.artist}</p>}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>{song._count.charts} chart{song._count.charts !== 1 ? 's' : ''}</div>
                          <div>{song._count.recordings} recording{song._count.recordings !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Setlists Section */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Setlists</h2>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition text-sm"
                  disabled
                >
                  Create Setlist (Coming Soon)
                </button>
              </div>

              {band.setlists.length === 0 ? (
                <p className="text-gray-400">No setlists yet.</p>
              ) : (
                <div className="space-y-3">
                  {band.setlists.map(setlist => (
                    <div
                      key={setlist.id}
                      className="bg-gray-700 rounded p-4 border border-gray-600"
                    >
                      <h3 className="text-lg font-semibold text-white">{setlist.name}</h3>
                      {setlist.date && (
                        <p className="text-gray-400 text-sm">
                          {new Date(setlist.date).toLocaleDateString()}
                        </p>
                      )}
                      {setlist.venue && <p className="text-gray-400 text-sm">{setlist.venue}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members Section */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Members</h2>
              <div className="space-y-3">
                {band.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {member.user.profilePictureUrl ? (
                        <img
                          src={member.user.profilePictureUrl}
                          alt={member.user.name || 'User'}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                          {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-gray-400 text-xs">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
