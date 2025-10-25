const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function deleteMissingAudio() {
  try {
    console.log('Deleting missing audio files from database...\n');
    
    // Get all voices from database
    const voices = await prisma.voice.findMany({
      select: {
        id: true,
        audioUrl: true,
        createdAt: true,
        userFid: true,
      }
    });

    const audioDir = path.join(__dirname, '../public/uploads/voices');
    const existingFiles = fs.readdirSync(audioDir);
    
    let missingFiles = [];
    
    voices.forEach(voice => {
      const fileName = voice.audioUrl.replace('/uploads/voices/', '');
      
      if (!existingFiles.includes(fileName)) {
        missingFiles.push(voice);
      }
    });
    
    if (missingFiles.length > 0) {
      console.log(`Found ${missingFiles.length} missing audio files. Deleting from database...\n`);
      
      for (const voice of missingFiles) {
        console.log(`Deleting voice record: ${voice.audioUrl} (ID: ${voice.id})`);
        
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
        
        console.log(`✅ Deleted: ${voice.audioUrl}`);
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

deleteMissingAudio();
