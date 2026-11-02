import { prisma } from '@replyspark/db';
import { LiveGoogleBusinessProfileClient } from '../apps/api/src/services/google/live.google.client.js';

import { ENV } from '../apps/api/src/config/env.js';

async function main() {
  console.log('process.cwd():', process.cwd());
  console.log('ENV.GOOGLE_CLIENT_ID:', ENV.GOOGLE_CLIENT_ID);
  console.log('process.env.GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('--- Checking Users and Google Connections ---');
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              googleConnections: true,
              locations: true
            }
          }
        }
      }
    }
  });

  for (const user of users) {
    console.log(`\nUser: ${user.email} (${user.displayName}) [ID: ${user.id}]`);
    for (const om of user.memberships) {
      console.log(`  Org: ${om.organization.name} [ID: ${om.organization.id}] (Role: ${om.role})`);
      console.log(`    Google Connections: ${om.organization.googleConnections.length}`);
      for (const gc of om.organization.googleConnections) {
        console.log(`      - Conn ID: ${gc.id}, Email: ${gc.accountEmail}, Name: ${gc.accountName}`);
        console.log(`        Status: ${gc.connectionStatus}, Scopes: ${gc.grantedScopes.join(', ')}`);
        console.log(`        Token Length: ${gc.encryptedRefreshToken?.length}`);
      }
      console.log(`    Business Locations: ${om.organization.locations.length}`);
      for (const loc of om.organization.locations) {
        console.log(`      - Loc ID: ${loc.id}, Name: ${loc.displayName}, Res: ${loc.googleLocationResourceName}`);
      }
    }
  }

  // Now let's test LiveGoogleBusinessProfileClient on the connection for tools@advaitlabs.com or any active connection!
  const liveConn = await prisma.googleConnection.findFirst({
    where: {
      accountEmail: 'tools@advaitlabs.com'
    }
  });

  if (!liveConn) {
    console.log('\nNo connection with accountEmail: tools@advaitlabs.com found.');
    return;
  }

  console.log('\n--- Testing Live GBP API with connection for tools@advaitlabs.com ---');
  const client = new LiveGoogleBusinessProfileClient();
  try {
    console.log('Calling client.getAccounts()...');
    const accounts = await client.getAccounts(liveConn.encryptedRefreshToken);
    console.log('✅ Accounts returned:', JSON.stringify(accounts, null, 2));

    for (const acc of accounts) {
      console.log(`\nCalling client.getLocations() for account: ${acc.name} (${acc.accountName})...`);
      try {
        const locations = await client.getLocations(liveConn.encryptedRefreshToken, acc.name);
        console.log(`✅ Locations for ${acc.name}:`, JSON.stringify(locations, null, 2));

        for (const loc of locations) {
          console.log(`\nCalling client.fetchReviews() for location: ${loc.name} (${loc.title})...`);
          try {
            // Test correct v4 reviews URL with accounts/{accountId}/locations/{locationId}/reviews
            const accessToken = await (client as any).getAccessToken(liveConn.encryptedRefreshToken);
            const reviewsUrl = `https://mybusiness.googleapis.com/v4/${acc.name}/${loc.name}/reviews`;
            console.log('Fetching:', reviewsUrl);
            const res = await fetch(reviewsUrl, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Reviews response:', JSON.stringify(data, null, 2));
          } catch (revErr: any) {
            console.error(`❌ Error fetching reviews for ${loc.name}:`, revErr.message || revErr);
          }
        }
      } catch (locErr: any) {
        console.error(`❌ Error fetching locations for ${acc.name}:`, locErr.message || locErr);
      }
    }
  } catch (accErr: any) {
    console.error('❌ Error fetching accounts:', accErr.message || accErr);
  }
}

main().finally(() => prisma.$disconnect());
