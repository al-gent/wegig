import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const bandId = searchParams.get('bandId')

    // Build where clause - only filter by specific band if it belongs to user
    let where = { bandId: { in: bandIds } }
    if (bandId && bandIds.includes(bandId)) {
      where.bandId = bandId
    }

    const setlists = await prisma.setlist.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to flatten the songs array
    const transformedSetlists = setlists.map(setlist => ({
      ...setlist,
      songs: setlist.songs.map(ss => ({
        ...ss.song,
        order: ss.songOrder
      }))
    }))

    return NextResponse.json(transformedSetlists)
  } catch (error) {
    console.error('Error fetching setlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch setlists' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { bandId, name, date, venue, notes, songs } = await request.json()

    if (!name || !bandId) {
      return NextResponse.json(
        { error: 'Name and bandId are required' },
        { status: 400 }
      )
    }

    // Create the setlist with songs
    const setlist = await prisma.setlist.create({
      data: {
        bandId,
        name,
        date: date ? new Date(date) : null,
        venue,
        notes,
        songs: {
          create: songs.map((songId, index) => ({
            songId,
            songOrder: index + 1
          }))
        }
      },
      include: {
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
    console.error('Error creating setlist:', error)
    return NextResponse.json(
      { error: 'Failed to create setlist' },
      { status: 500 }
    )
  }
}

