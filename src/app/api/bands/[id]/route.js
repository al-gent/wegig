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

  const { id } = params

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

    // Check if user is a member of this band
    const bandMember = await prisma.bandMember.findUnique({
      where: {
        bandId_userId: {
          bandId: id,
          userId: user.id
        }
      }
    })

    if (!bandMember) {
      return NextResponse.json(
        { error: 'Not a member of this band' },
        { status: 403 }
      )
    }

    // Get band details with all related data
    const band = await prisma.band.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePictureUrl: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
        songs: {
          include: {
            _count: {
              select: {
                charts: true,
                recordings: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        setlists: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    if (!band) {
      return NextResponse.json(
        { error: 'Band not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(band)
  } catch (error) {
    console.error('Error fetching band:', error)
    return NextResponse.json(
      { error: 'Failed to fetch band' },
      { status: 500 }
    )
  }
}
