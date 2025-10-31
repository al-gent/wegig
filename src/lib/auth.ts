import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        // Create or update user in database
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            profilePictureUrl: user.image,
            accessToken: account?.access_token,
            refreshToken: account?.refresh_token,
          },
          create: {
            email: user.email,
            googleId: account?.providerAccountId || '',
            name: user.name,
            profilePictureUrl: user.image,
            accessToken: account?.access_token,
            refreshToken: account?.refresh_token,
          }
        })
        return true
      } catch (error) {
        console.error('Error creating/updating user:', error)
        return false
      }
    },
    async jwt({ token, account }) {
      // Save access token on first sign in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      // Make access token available in session
      session.accessToken = token.accessToken as string
      return session
    }
  }
}
