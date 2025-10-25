const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkNewAudio() {
  try {
    console.log('Checking new audio files...\n');
    
    // Get all voices from database
    const voices = await prisma.voice.findMany({
      select: {
        id: true,
        audioUrl: true,
        createdAt: true,
        userFid: true,
        duration: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${voices.length} voices in database:\n`);
    
    const audioDir = path.join(__dirname, '../public/uploads/voices');
    const existingFiles = fs.readdirSync(audioDir);
    
    voices.forEach((voice, index) => {
      const fileName = voice.audioUrl.replace('/uploads/voices/', '');
      const fileExists = existingFiles.includes(fileName);
      const filePath = path.join(audioDir, fileName);
      
      console.log(`${index + 1}. Voice ID: ${voice.id}`);
      console.log(`   File: ${fileName}`);
      console.log(`   User: ${voice.userFid}`);
      console.log(`   Duration: ${voice.duration}s`);
      console.log(`   Created: ${voice.createdAt}`);
      console.log(`   File exists: ${fileExists ? '✅' : '❌'}`);
      
      if (fileExists) {
        const stats = fs.statSync(filePath);
        console.log(`   File size: ${stats.size} bytes`);
        console.log(`   Last modified: ${stats.mtime}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewAudio();
