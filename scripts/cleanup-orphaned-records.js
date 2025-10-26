const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanupOrphanedRecords() {
  try {
    console.log('🧹 Cleaning up orphaned database records...\n');
    
    // Get all voices from database
    const voices = await prisma.voice.findMany({
      select: {
        id: true,
        audioUrl: true,
        userFid: true,
        createdAt: true,
      }
    });
    
    const uploadDir = path.join(__dirname, '../public/uploads/voices');
    let cleanedCount = 0;
    
    for (const voice of voices) {
      const fileName = voice.audioUrl.replace('/uploads/voices/', '');
      const filePath = path.join(uploadDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`🗑️ Cleaning up orphaned record: ${voice.id} -> ${fileName}`);
        
        // Delete related records first
        await prisma.voiceLike.deleteMany({
          where: { voiceId: voice.id }
        });
        
        await prisma.voiceComment.deleteMany({
          where: { voiceId: voice.id }
        });
        
        await prisma.voiceView.deleteMany({
          where: { voiceId: voice.id }
        });
        
        await prisma.notification.deleteMany({
          where: { voiceId: voice.id }
        });
        
        // Delete the voice record
        await prisma.voice.delete({
          where: { id: voice.id }
        });
        
        cleanedCount++;
        console.log(`✅ Cleaned up: ${voice.id}`);
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`🗑️ Removed ${cleanedCount} orphaned database records`);
    
    if (cleanedCount === 0) {
      console.log('✅ No orphaned records found - database is clean!');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedRecords();
