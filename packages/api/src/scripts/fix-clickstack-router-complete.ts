#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const routerPath = path.join(__dirname, '../routers/api/clickstack.ts');

function fixRouterFile(content: string): string {
  // Remove all validateRequest middleware blocks
  content = content.replace(
    /router\.(post|get|put|delete)\('([^']+)',\s*\/\/ validateRequest\(\{[^}]*\}\),\s*async/g,
    'router.$1(\'$2\', async'
  );
  
  // Fix any remaining validateRequest references
  content = content.replace(
    /\/\/ validateRequest\([^)]*\)/g,
    ''
  );
  
  // Fix duplicate teamIdStr declarations by removing them
  content = content.replace(
    /const teamIdStr = teamId\.toString\(\);\s*\n\s*const teamIdStr = teamId\.toString\(\);/g,
    'const teamIdStr = teamId.toString();'
  );
  
  // Fix any remaining syntax issues with extra commas
  content = content.replace(
    /,\s*\)/g,
    ')'
  );
  
  return content;
}

async function main(): Promise<void> {
  console.log('🔧 Fixing ClickStack router syntax errors...');
  
  if (!fs.existsSync(routerPath)) {
    console.error('❌ Router file not found:', routerPath);
    process.exit(1);
  }
  
  let content = fs.readFileSync(routerPath, 'utf-8');
  
  // Apply fixes
  content = fixRouterFile(content);
  
  // Write back
  fs.writeFileSync(routerPath, content);
  
  console.log('✅ Fixed ClickStack router syntax errors');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fixing ClickStack router:', error);
    process.exit(1);
  });
}

export { fixRouterFile };
