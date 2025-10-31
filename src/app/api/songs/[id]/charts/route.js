import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { id } = params
  const { name, driveUrl } = await request.json()

  if (!name || !driveUrl) {
    return NextResponse.json(
      { error: 'Name and Drive URL are required' },
      { status: 400 }
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

    // Verify song exists
    const song = await prisma.song.findUnique({
      where: { id }
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    // Create chart
    const chart = await prisma.chart.create({
      data: {
        songId: id,
        uploadedByUserId: user.id,
        name,
        driveUrl
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(chart)
  } catch (error) {
    console.error('Error creating chart:', error)
    return NextResponse.json(
      { error: 'Failed to create chart' },
      { status: 500 }
    )
  }
}
