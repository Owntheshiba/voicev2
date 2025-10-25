const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCleanDatabase() {
  try {
    console.log('Verifying database is clean...\n');
    
  // Check all tables
  const voiceCount = await prisma.voice.count();
  const likeCount = await prisma.voiceLike.count();
  const commentCount = await prisma.voiceComment.count();
  const viewCount = await prisma.voiceView.count();
  const notificationCount = await prisma.notification.count();
  const userCount = await prisma.user.count();
  const userPointsCount = await prisma.userPoints.count();
  
  console.log('📊 Database Status:');
  console.log(`- Voices: ${voiceCount}`);
  console.log(`- Voice Likes: ${likeCount}`);
  console.log(`- Voice Comments: ${commentCount}`);
  console.log(`- Voice Views: ${viewCount}`);
  console.log(`- Notifications: ${notificationCount}`);
  console.log(`- Users: ${userCount}`);
  console.log(`- User Points: ${userPointsCount}`);
  
  if (voiceCount === 0 && likeCount === 0 && commentCount === 0 && viewCount === 0) {
    console.log('\n✅ Database is completely clean! No audio records found.');
    console.log('🎉 Ready for fresh audio uploads.');
  } else {
    console.log('\n⚠️  Some audio-related records still exist.');
  }
  
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanDatabase();
