#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const servicesDir = path.join(__dirname, '../services');
const serviceFiles = [
  'clickstack.ts',
  'clickstackDashboard.ts',
  'clickstackSearch.ts',
  'clickstackSession.ts',
  'clickstackPattern.ts',
  'clickstackEventDelta.ts',
  'clickstackAdvanced.ts',
  'clickstackProduction.ts',
  'clickstackDeployment.ts',
  'clickstackMonitoring.ts'
];

function fixClickHouseQueries(content: string): string {
  // Fix query calls from string to object format
  content = content.replace(
    /await this\.clickhouse\.query\(([^)]+)\)/g,
    'await this.clickhouse.query({\n          query: $1,\n          format: \'JSON\'\n        })'
  );
  
  // Fix client.query calls from string to object format
  content = content.replace(
    /await client\.query\(([^)]+)\)/g,
    'await client.query({\n        query: $1,\n        format: \'JSON\'\n      })'
  );
  
  // Fix result.rows access to result.json().data
  content = content.replace(/\.rows/g, '.json().data');
  
  // Fix result.rows.length to result.json().data.length
  content = content.replace(/\.rows\.length/g, '.json().data.length');
  
  // Fix result.rows[0] to result.json().data[0]
  content = content.replace(/\.rows\[0\]/g, '.json().data[0]');
  
  return content;
}

function fixTypeErrors(content: string): string {
  // Fix missing type definitions
  content = content.replace(
    /ClickStackSessionSearchResult/g,
    'ClickStackSearchResult'
  );
  
  content = content.replace(
    /ClickStackPatternSearchResult/g,
    'ClickStackSearchResult'
  );
  
  return content;
}

async function fixServiceFile(filePath: string): Promise<void> {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Apply fixes
  content = fixClickHouseQueries(content);
  content = fixTypeErrors(content);
  
  // Write back
  fs.writeFileSync(filePath, content);
  
  console.log(`✅ Fixed ${filePath}`);
}

async function main(): Promise<void> {
  console.log('🔧 Fixing ClickStack ClickHouse API usage...');
  
  for (const file of serviceFiles) {
    const filePath = path.join(servicesDir, file);
    if (fs.existsSync(filePath)) {
      await fixServiceFile(filePath);
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  }
  
  console.log('🎉 ClickStack ClickHouse API fixes completed!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fixing ClickStack services:', error);
    process.exit(1);
  });
}

export { fixClickHouseQueries, fixTypeErrors };
