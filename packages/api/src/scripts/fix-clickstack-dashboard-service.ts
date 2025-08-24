#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const servicePath = path.join(__dirname, '../services/clickstackDashboard.ts');

function fixDashboardServiceFile(content: string): string {
  // Fix all .json().data patterns to await and type cast
  content = content.replace(
    /const (\w+) = await this\.clickhouse\.query\(\{[\s\S]*?\}\);\s*const (\w+) = \1\.json\(\)\.data/g,
    (match, resultVar, dataVar) => {
      return match.replace(
        new RegExp(`const ${dataVar} = ${resultVar}\\.json\\(\\)\\.data`),
        `const ${dataVar} = await ${resultVar}.json() as any`
      );
    }
  );
  
  // Fix any remaining .json().data patterns
  content = content.replace(
    /\.json\(\)\.data/g,
    '.json() as any).data'
  );
  
  // Fix any remaining .json().data patterns that need await
  content = content.replace(
    /const (\w+) = (\w+)\.json\(\)\.data/g,
    'const $1 = await $2.json() as any).data'
  );
  
  return content;
}

async function main(): Promise<void> {
  console.log('🔧 Fixing ClickStack dashboard service async/await issues...');
  
  if (!fs.existsSync(servicePath)) {
    console.error('❌ Dashboard service file not found:', servicePath);
    process.exit(1);
  }
  
  let content = fs.readFileSync(servicePath, 'utf-8');
  
  // Apply fixes
  content = fixDashboardServiceFile(content);
  
  // Write back
  fs.writeFileSync(servicePath, content);
  
  console.log('✅ Fixed all ClickStack dashboard service async/await issues');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fixing ClickStack dashboard service:', error);
    process.exit(1);
  });
}

export { fixDashboardServiceFile };
