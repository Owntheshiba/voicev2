const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanupMissingAudio() {
  try {
    // Get all voices from database
    const voices = await prisma.voice.findMany({
      select: {
        id: true,
        audioUrl: true,
        createdAt: true,
        userFid: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Cleaning up missing audio files...\n');
    
    const audioDir = path.join(__dirname, '../public/uploads/voices');
    const existingFiles = fs.readdirSync(audioDir);
    
    let missingFiles = [];
    
    voices.forEach(voice => {
      const fileName = voice.audioUrl.replace('/uploads/voices/', '');
      
      if (!existingFiles.includes(fileName)) {
        missingFiles.push({
          id: voice.id,
          fileName: fileName,
          userFid: voice.userFid,
          createdAt: voice.createdAt
        });
      }
    });
    
    if (missingFiles.length > 0) {
      console.log(`Found ${missingFiles.length} missing audio files. Deleting from database...\n`);
      
      for (const file of missingFiles) {
        console.log(`Deleting voice record: ${file.fileName} (ID: ${file.id})`);
        
        // Delete related records first
        await prisma.voiceLike.deleteMany({
          where: { voiceId: file.id }
        });
        
        await prisma.voiceComment.deleteMany({
          where: { voiceId: file.id }
        });
        
        await prisma.voiceView.deleteMany({
          where: { voiceId: file.id }
        });
        
        await prisma.notification.deleteMany({
          where: { voiceId: file.id }
        });
        
        // Delete the voice record
        await prisma.voice.delete({
          where: { id: file.id }
        });
        
        console.log(`✅ Deleted: ${file.fileName}`);
      }
      
      console.log(`\n✅ Cleanup completed! Deleted ${missingFiles.length} missing audio records.`);
    } else {
      console.log('✅ No missing audio files found. Database is clean.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupMissingAudio();
