import { prisma } from './index.js';

async function main() {
  console.log('🧹 Cleaning any mock / dummy seed data from database...');

  // 1. Delete mock reviews
  const deletedReviews = await prisma.review.deleteMany({
    where: {
      googleReviewResourceName: {
        startsWith: 'reviews/rev-mock-'
      }
    }
  });

  // 2. Delete mock locations
  const deletedLocations = await prisma.businessLocation.deleteMany({
    where: {
      OR: [
        { googleLocationResourceName: { startsWith: 'locations/loc-' } },
        { googleAccountResourceName: 'accounts/acc-spark-group-001' }
      ]
    }
  });

  // 3. Delete mock Google connections
  const deletedConnections = await prisma.googleConnection.deleteMany({
    where: {
      OR: [
        { googleSubjectId: { startsWith: 'google-sub-mock-' } },
        { googleSubjectId: { startsWith: 'mock-sub-' } },
        { encryptedRefreshToken: { startsWith: 'enc_mock_' } }
      ]
    }
  });

  // 4. Delete demo organization ("Spark Hospitality Group") if it has no real locations
  const demoOrgs = await prisma.organization.findMany({
    where: { name: 'Spark Hospitality Group' },
    include: { locations: true }
  });

  for (const org of demoOrgs) {
    if (org.locations.length === 0) {
      await prisma.organization.delete({ where: { id: org.id } });
    }
  }

  console.log(
    `✅ Dummy data removed (Reviews: ${deletedReviews.count}, Locations: ${deletedLocations.count}, Mock Connections: ${deletedConnections.count}).`
  );
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
