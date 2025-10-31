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

    // Get all songs from the user's bands
    const songs = await prisma.song.findMany({
      where: {
        bandId: {
          in: bandIds
        }
      },
      include: {
        band: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error fetching songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
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
    const { bandId, title, artist, comments } = await request.json()

    const song = await prisma.song.create({
      data: {
        bandId,
        title,
        artist,
        comments
      },
      include: {
        band: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(song)
  } catch (error) {
    console.error('Error creating song:', error)
    return NextResponse.json(
      { error: 'Failed to create song' },
      { status: 500 }
    )
  }
}