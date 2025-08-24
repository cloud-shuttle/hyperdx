#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../services/clickstackDashboard.ts');

async function fixClickStackSyntax() {
  console.log('🔧 Fixing ClickStack syntax errors...');

  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix all the malformed parentheses and missing await keywords
    const fixes = [
      // Fix return statements with missing await
      {
        pattern: /return result\.json\(\) as any\)\.data\.map/g,
        replacement: 'return (await result.json() as any).data.map'
      },
      // Fix any remaining malformed parentheses
      {
        pattern: /\.json\(\) as any\)\.data/g,
        replacement: '.json() as any).data'
      }
    ];

    // Apply fixes
    fixes.forEach(fix => {
      content = content.replace(fix.pattern, fix.replacement);
    });

    // Write the fixed content back
    fs.writeFileSync(filePath, content, 'utf8');

    console.log('✅ ClickStack syntax errors fixed successfully!');

  } catch (error) {
    console.error('❌ Failed to fix ClickStack syntax:', error);
    throw error;
  }
}

// Run fix if called directly
if (require.main === module) {
  fixClickStackSyntax()
    .then(() => {
      console.log('✅ Fix script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fix script failed:', error);
      process.exit(1);
    });
}

export { fixClickStackSyntax };
