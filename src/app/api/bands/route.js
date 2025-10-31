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
      include: {
        band: {
          include: {
            _count: {
              select: {
                songs: true,
                members: true,
                setlists: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    const bands = bandMembers.map(bm => ({
      ...bm.band,
      memberRole: bm.role,
      joinedAt: bm.joinedAt
    }))

    return NextResponse.json(bands)
  } catch (error) {
    console.error('Error fetching bands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bands' },
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
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Band name is required' },
        { status: 400 }
      )
    }

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

    // Create band and add user as admin
    const band = await prisma.band.create({
      data: {
        name,
        members: {
          create: {
            userId: user.id,
            role: 'admin'
          }
        }
      },
      include: {
        members: true,
        _count: {
          select: {
            songs: true,
            members: true,
            setlists: true
          }
        }
      }
    })

    return NextResponse.json(band)
  } catch (error) {
    console.error('Error creating band:', error)
    return NextResponse.json(
      { error: 'Failed to create band' },
      { status: 500 }
    )
  }
}
