import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmailViaBrevo } from '@/lib/email'

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { to, subject, html, text, from } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'To and subject are required' },
        { status: 400 }
      )
    }

    const result = await sendEmailViaBrevo({
      to,
      subject,
      html,
      text,
      from
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to send email', details: errorMessage },
      { status: 500 }
    )
  }
}

