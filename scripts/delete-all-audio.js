const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllAudio() {
  try {
    console.log('Deleting all audio records from database...\n');
    
    // First, get count of all voices
    const totalVoices = await prisma.voice.count();
    console.log(`Found ${totalVoices} voice records in database.`);
    
    if (totalVoices === 0) {
      console.log('✅ No audio records found. Database is already clean.');
      return;
    }
    
    // Delete all related records first (to avoid foreign key constraints)
    console.log('Deleting related records...');
    
    // Delete voice likes
    const deletedLikes = await prisma.voiceLike.deleteMany({});
    console.log(`✅ Deleted ${deletedLikes.count} voice likes`);
    
    // Delete voice comments
    const deletedComments = await prisma.voiceComment.deleteMany({});
    console.log(`✅ Deleted ${deletedComments.count} voice comments`);
    
    // Delete voice views
    const deletedViews = await prisma.voiceView.deleteMany({});
    console.log(`✅ Deleted ${deletedViews.count} voice views`);
    
    // Delete notifications related to voices
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        voiceId: {
          not: null
        }
      }
    });
    console.log(`✅ Deleted ${deletedNotifications.count} voice-related notifications`);
    
    // Finally, delete all voices
    console.log('Deleting all voice records...');
    const deletedVoices = await prisma.voice.deleteMany({});
    console.log(`✅ Deleted ${deletedVoices.count} voice records`);
    
    console.log('\n🎉 All audio records have been successfully deleted from database!');
    console.log('Database is now clean and ready for fresh audio uploads.');
    
  } catch (error) {
    console.error('Error deleting audio records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllAudio();
