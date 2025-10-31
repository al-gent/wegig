import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Replace with your actual Google user ID and email from when you logged in
  const user = await prisma.user.upsert({
    where: { email: '94gent@gamil.com' }, 
    update: {},
    create: {
      googleId: 'temp-google-id', // We'll update this later with real data
      email: '94gent@gamil.com', // PUT YOUR EMAIL HERE
      name: 'Adam Gent',
    },
  })

  const band = await prisma.band.create({
    data: {
      name: 'Test Band',
    },
  })

  await prisma.bandMember.create({
    data: {
      bandId: band.id,
      userId: user.id,
      role: 'admin',
    },
  })

  const song = await prisma.song.create({
    data: {
      bandId: band.id,
      title: 'Eyes of the World',
      artist: 'Grateful Dead (Garcia/Hunter)',
    },
  })

  await prisma.chart.create({
    data: {
      songId: song.id,
      uploadedByUserId: user.id,
      name: 'Eyes of the World - Main Chart',
      driveUrl: 'https://docs.google.com/document/d/18lnIaoeZPTk6s2tRnXLN1E69i-LMDyN7WSQ6ETkDTm4/edit',
    },
  })

  console.log('✅ Seeded:', { user, band, song })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })