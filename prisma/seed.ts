import { PrismaClient } from '@prisma/client';
import { QUOTES } from '../src/lib/quotes';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with 30 hardcoded quotes...');
  
  // Check if quotes already exist
  const existingCount = await prisma.quote.count();
  
  if (existingCount > 0) {
    console.log(`⚠️  Database already has ${existingCount} quotes.`);
    console.log('   Skipping seed. Run `npx prisma migrate reset` to start fresh.');
    return;
  }
  
  // Seed all 30 quotes from QUOTES array
  let created = 0;
  for (const text of QUOTES) {
    await prisma.quote.create({
      data: {
        text,
        author: null, // Original quotes have no author
        active: true,
      },
    });
    created++;
    
    // Progress indicator
    if (created % 10 === 0) {
      console.log(`   Created ${created} quotes...`);
    }
  }
  
  console.log(`✅ Successfully seeded ${created} quotes`);
  
  // Display sample
  const samples = await prisma.quote.findMany({
    take: 3,
    select: { id: true, text: true },
  });
  
  console.log('\n📝 Sample quotes:');
  samples.forEach((q, i) => {
    const preview = q.text.length > 60 ? q.text.substring(0, 60) + '...' : q.text;
    console.log(`   ${i + 1}. ${preview}`);
  });
  
  console.log('\n💡 Next steps:');
  console.log('   - Run `npm run db:studio` to view data in Prisma Studio');
  console.log('   - Database is ready for admin CMS development');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
