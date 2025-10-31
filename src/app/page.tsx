'use client'

import { signIn, useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [songs, setSongs] = useState<any[]>([])
  const [setlists, setSetlists] = useState<any[]>([])
  const [bands, setBands] = useState<any[]>([])
  const [selectedBand, setSelectedBand] = useState('')
  const [loading, setLoading] = useState(true)
  const hoverTimerRef = useRef<any>(null)

  useEffect(() => {
    // Only redirect if we're definitely unauthenticated
    if (status === 'unauthenticated') {
      return
    }
    
    // Fetch data immediately - API will handle auth
    Promise.all([
      fetch('/api/songs').then(res => res.json()),
      fetch('/api/setlists').then(res => res.json()),
      fetch('/api/bands').then(res => res.json())
    ]).then(([songsData, setlistsData, bandsData]) => {
      if (Array.isArray(songsData)) {
        setSongs(songsData)
      }
      if (Array.isArray(setlistsData)) {
        setSetlists(setlistsData)
      }
      if (Array.isArray(bandsData)) {
        setBands(bandsData)
      }
      setLoading(false)
    }).catch(error => {
      console.error('Error fetching data:', error)
      setLoading(false)
    })
  }, [status])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearInterval(hoverTimerRef.current)
      }
    }
  }, [])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">weGig Setlist App</h1>
          <p className="text-gray-400 mb-8">Manage your band&apos;s songs, setlists, and more</p>
          <button
            onClick={() => signIn('google')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded transition"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  const filteredSongs = selectedBand ? songs.filter(song => song.bandId === selectedBand) : songs
  const filteredSetlists = selectedBand ? setlists.filter(setlist => setlist.band?.id === selectedBand) : setlists

  const handleHoverStart = () => {
    const sendEmail = async () => {
      try {
        const timestamp = new Date().toISOString()
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: session?.user?.email,
            subject: `HOVER DETECTED - ${timestamp}`,
            text: 'HOVER DETECTED - your team at weGig'
          })
        })
      } catch (error) {
        console.error('Error sending hover email:', error)
      }
    }
    
    // Send immediately, then every second
    sendEmail()
    hoverTimerRef.current = setInterval(sendEmail, 1000)
  }

  const handleHoverEnd = () => {
    if (hoverTimerRef.current) {
      clearInterval(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* User Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'User'} 
                className="w-12 h-12 rounded-full cursor-pointer"
                onMouseEnter={handleHoverStart}
                onMouseLeave={handleHoverEnd}
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-white">weGig</h1>
              {session?.user?.name && (
                <p className="text-gray-400 text-sm">{session.user.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bands Section - Horizontal */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Bands</h2>
            <Link
              href="/bands/new"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded transition text-sm"
            >
              Add Band
            </Link>
          </div>
          {bands.length === 0 ? (
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 text-center">
              <p className="text-gray-400 mb-4">No bands yet.</p>
              <Link
                href="/bands/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
              >
                Add Your First Band
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedBand('')}
                className={`px-4 py-2 rounded-lg border transition ${
                  selectedBand === ''
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                }`}
              >
                All Bands
              </button>
              {bands.map(band => (
                <button
                  key={band.id}
                  onClick={() => setSelectedBand(band.id)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    selectedBand === band.id
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {band.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Songs Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Songs</h2>
              <Link
                href="/songs/new"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded transition text-sm"
              >
                Add Song
              </Link>
            </div>
            {songs.length === 0 ? (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 text-center">
                <p className="text-gray-400 mb-4">No songs yet.</p>
                <Link
                  href="/songs/new"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Add Your First Song
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredSongs.map(song => (
                  <Link
                    key={song.id}
                    href={`/songs/${song.id}`}
                    className="block bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 hover:border-blue-500 transition"
                  >
                    <h3 className="text-xl font-bold text-white mb-1">{song.title}</h3>
                    {song.artist && <p className="text-gray-300">{song.artist}</p>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Setlists Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Setlists</h2>
              <Link
                href="/setlists/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded transition text-sm"
              >
                Create Setlist
              </Link>
            </div>
            {setlists.length === 0 ? (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 text-center">
                <p className="text-gray-400 mb-4">No setlists yet.</p>
                <Link
                  href="/setlists/new"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Create Your First Setlist
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredSetlists.map(setlist => (
                  <Link
                    key={setlist.id}
                    href={`/setlists/${setlist.id}`}
                    className="block bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700 hover:border-blue-500 transition"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">{setlist.name}</h3>
                    <div className="flex flex-wrap items-center text-sm text-gray-400 gap-x-2">
                      <span>{setlist.songs?.length || 0} songs</span>
                      {setlist.band && (
                        <>
                          <span>•</span>
                          <span>{setlist.band.name}</span>
                        </>
                      )}
                      {setlist.venue && (
                        <>
                          <span>•</span>
                          <span>{setlist.venue}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}