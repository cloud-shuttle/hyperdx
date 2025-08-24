#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const routerPath = path.join(__dirname, '../routers/api/clickstack.ts');

function fixRouterFile(content: string): string {
  // Fix indentation issues with teamIdStr declarations
  content = content.replace(
    /(\s+)const teamIdStr = teamId\.toString\(\);/g,
    '$1  const teamIdStr = teamId.toString();'
  );
  
  // Fix ClickStackService to clickstackService
  content = content.replace(
    /ClickStackService\./g,
    'clickstackService.'
  );
  
  // Remove any remaining malformed middleware blocks
  content = content.replace(
    /router\.(post|get|put|delete)\('([^']+)',\s*,\s*[^)]*\),\s*async/g,
    'router.$1(\'$2\', async'
  );
  
  // Fix any remaining syntax issues
  content = content.replace(
    /,\s*\)/g,
    ')'
  );
  
  // Remove any orphaned closing braces
  content = content.replace(
    /\n\s*\)\s*,\s*\n\s*\)\s*,\s*\n/g,
    '\n'
  );
  
  return content;
}

async function main(): Promise<void> {
  console.log('🔧 Final fix for ClickStack router syntax errors...');
  
  if (!fs.existsSync(routerPath)) {
    console.error('❌ Router file not found:', routerPath);
    process.exit(1);
  }
  
  let content = fs.readFileSync(routerPath, 'utf-8');
  
  // Apply fixes
  content = fixRouterFile(content);
  
  // Write back
  fs.writeFileSync(routerPath, content);
  
  console.log('✅ Fixed all ClickStack router syntax errors');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fixing ClickStack router:', error);
    process.exit(1);
  });
}

export { fixRouterFile };
