const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verifyUploadSystem() {
  try {
    console.log('🔍 Verifying upload system integrity...\n');
    
    // 1. Check if upload directory exists
    const uploadDir = path.join(__dirname, '../public/uploads/voices');
    console.log(`📁 Checking upload directory: ${uploadDir}`);
    
    if (!fs.existsSync(uploadDir)) {
      console.log('❌ Upload directory does not exist!');
      console.log('📝 Creating upload directory...');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Upload directory created');
    } else {
      console.log('✅ Upload directory exists');
    }
    
    // 2. Get all voices from database
    const voices = await prisma.voice.findMany({
      select: {
        id: true,
        audioUrl: true,
        userFid: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 Database has ${voices.length} voice records\n`);
    
    // 3. Get all files in upload directory
    const files = fs.readdirSync(uploadDir);
    console.log(`📁 Filesystem has ${files.length} audio files\n`);
    
    // 4. Check for orphaned database records (no corresponding file)
    console.log('🔍 Checking for orphaned database records...');
    let orphanedDbRecords = 0;
    let validDbRecords = 0;
    
    for (const voice of voices) {
      const fileName = voice.audioUrl.replace('/uploads/voices/', '');
      const filePath = path.join(uploadDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Orphaned DB record: ${voice.id} -> ${fileName} (file missing)`);
        orphanedDbRecords++;
      } else {
        validDbRecords++;
      }
    }
    
    // 5. Check for orphaned files (no corresponding database record)
    console.log('\n🔍 Checking for orphaned files...');
    let orphanedFiles = 0;
    let validFiles = 0;
    
    for (const file of files) {
      const dbRecord = voices.find(voice => 
        voice.audioUrl.includes(file)
      );
      
      if (!dbRecord) {
        console.log(`❌ Orphaned file: ${file} (no DB record)`);
        orphanedFiles++;
      } else {
        validFiles++;
      }
    }
    
    // 6. Summary
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('='.repeat(50));
    console.log(`📁 Upload Directory: ${uploadDir}`);
    console.log(`🗄️  Database Records: ${voices.length}`);
    console.log(`📄 Filesystem Files: ${files.length}`);
    console.log('');
    console.log(`✅ Valid DB Records: ${validDbRecords}`);
    console.log(`❌ Orphaned DB Records: ${orphanedDbRecords}`);
    console.log(`✅ Valid Files: ${validFiles}`);
    console.log(`❌ Orphaned Files: ${orphanedFiles}`);
    console.log('');
    
    if (orphanedDbRecords === 0 && orphanedFiles === 0) {
      console.log('🎉 UPLOAD SYSTEM IS HEALTHY!');
      console.log('✅ All database records have corresponding files');
      console.log('✅ All files have corresponding database records');
    } else {
      console.log('⚠️  UPLOAD SYSTEM HAS ISSUES:');
      if (orphanedDbRecords > 0) {
        console.log(`❌ ${orphanedDbRecords} database records without files`);
      }
      if (orphanedFiles > 0) {
        console.log(`❌ ${orphanedFiles} files without database records`);
      }
      console.log('\n💡 Consider running cleanup scripts to fix these issues');
    }
    
    // 7. Check file sizes
    console.log('\n📏 File Size Analysis:');
    let totalSize = 0;
    let validFileCount = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      validFileCount++;
      
      if (stats.size < 1024) {
        console.log(`⚠️  Small file detected: ${file} (${stats.size} bytes)`);
      }
    }
    
    const avgSize = validFileCount > 0 ? totalSize / validFileCount : 0;
    console.log(`📊 Total storage used: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Average file size: ${(avgSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Total files: ${validFileCount}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUploadSystem();
