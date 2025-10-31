import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all bands the user is a member of
    const bandMembers = await prisma.bandMember.findMany({
      where: { userId: user.id },
      select: { bandId: true }
    })

    const bandIds = bandMembers.map(bm => bm.bandId)

    const { id } = params

    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        band: {
          select: {
            id: true,
            name: true
          }
        },
        songs: {
          include: {
            song: true
          },
          orderBy: {
            songOrder: 'asc'
          }
        }
      }
    })

    if (!setlist) {
      return NextResponse.json(
        { error: 'Setlist not found' },
        { status: 404 }
      )
    }

    // Check if the setlist belongs to a band the user is a member of
    if (!bandIds.includes(setlist.bandId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Transform the data to flatten the songs array
    const transformedSetlist = {
      ...setlist,
      songs: setlist.songs.map(ss => ({
        ...ss.song,
        order: ss.songOrder
      }))
    }

    return NextResponse.json(transformedSetlist)
  } catch (error) {
    console.error('Error fetching setlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch setlist' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = params
    const { songIds } = await request.json()

    // Delete all existing setlist songs
    await prisma.setlistSong.deleteMany({
      where: { setlistId: id }
    })

    // Create new setlist songs in order
    await prisma.setlistSong.createMany({
      data: songIds.map((songId, index) => ({
        setlistId: id,
        songId,
        songOrder: index + 1
      }))
    })

    // Fetch and return updated setlist
    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        band: {
          select: {
            id: true,
            name: true
          }
        },
        songs: {
          include: {
            song: true
          },
          orderBy: {
            songOrder: 'asc'
          }
        }
      }
    })

    // Transform the data to flatten the songs array
    const transformedSetlist = {
      ...setlist,
      songs: setlist.songs.map(ss => ({
        ...ss.song,
        order: ss.songOrder
      }))
    }

    return NextResponse.json(transformedSetlist)
  } catch (error) {
    console.error('Error updating setlist:', error)
    return NextResponse.json(
      { error: 'Failed to update setlist' },
      { status: 500 }
    )
  }
}

