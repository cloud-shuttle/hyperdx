#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class SessionReplaySystemValidator {
  private results: ValidationResult[] = [];
  private componentDir: string;

  constructor() {
    this.componentDir = path.join(__dirname, '..');
  }

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
    this.results.push({
      test,
      status,
      message,
      details
    });
  }

  private checkComponentFile(componentName: string) {
    const filePath = path.join(this.componentDir, `${componentName}.tsx`);
    
    if (!fs.existsSync(filePath)) {
      this.addResult(
        `${componentName} File Exists`,
        'FAIL',
        `Component file ${componentName}.tsx not found`,
        { expectedPath: filePath }
      );
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for proper export
    if (!content.includes(`export const ${componentName}`)) {
      this.addResult(
        `${componentName} Export`,
        'FAIL',
        `Component ${componentName} is not properly exported`,
        { content: content.substring(0, 200) }
      );
      return false;
    }

    // Check for React import
    if (!content.includes('import React')) {
      this.addResult(
        `${componentName} React Import`,
        'WARNING',
        `Component ${componentName} may not have React import`,
        { content: content.substring(0, 200) }
      );
    }

    // Check for TypeScript interfaces
    if (!content.includes('interface') && !content.includes('type')) {
      this.addResult(
        `${componentName} TypeScript`,
        'WARNING',
        `Component ${componentName} may not have TypeScript interfaces`,
        { content: content.substring(0, 200) }
      );
    }

    // Check for UI components import
    if (!content.includes('@/components/ui/')) {
      this.addResult(
        `${componentName} UI Components`,
        'WARNING',
        `Component ${componentName} may not be using shadcn/ui components`,
        { content: content.substring(0, 200) }
      );
    }

    this.addResult(
      `${componentName} Structure`,
      'PASS',
      `Component ${componentName} has proper structure and exports`
    );

    return true;
  }

  private checkComponentDependencies() {
    console.log('🔍 Checking Component Dependencies...');

    const components = [
      'SessionReplayPlayer',
      'SessionTimeline', 
      'SessionHeatmap',
      'SessionControls',
      'UserJourneyMap',
      'SessionAnalytics'
    ];

    let allComponentsExist = true;

    components.forEach(component => {
      if (!this.checkComponentFile(component)) {
        allComponentsExist = false;
      }
    });

    return allComponentsExist;
  }

  private checkComponentImports() {
    console.log('📦 Checking Component Imports...');

    const sessionReplayPlayerPath = path.join(this.componentDir, 'SessionReplayPlayer.tsx');
    
    if (fs.existsSync(sessionReplayPlayerPath)) {
      const content = fs.readFileSync(sessionReplayPlayerPath, 'utf-8');
      
      // Check for sub-component imports
      const subComponents = ['SessionTimeline', 'SessionHeatmap', 'SessionControls'];
      subComponents.forEach(component => {
        if (content.includes(`import { ${component} }`)) {
          this.addResult(
            `${component} Import in SessionReplayPlayer`,
            'PASS',
            `SessionReplayPlayer properly imports ${component}`
          );
        } else {
          this.addResult(
            `${component} Import in SessionReplayPlayer`,
            'FAIL',
            `SessionReplayPlayer does not import ${component}`
          );
        }
      });
    }
  }

  private checkTypeScriptTypes() {
    console.log('🔧 Checking TypeScript Types...');

    const components = [
      'SessionReplayPlayer',
      'SessionTimeline', 
      'SessionHeatmap',
      'SessionControls',
      'UserJourneyMap',
      'SessionAnalytics'
    ];

    components.forEach(component => {
      const filePath = path.join(this.componentDir, `${component}.tsx`);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for interface definitions
        if (content.includes('interface') || content.includes('type')) {
          this.addResult(
            `${component} TypeScript Types`,
            'PASS',
            `Component ${component} has TypeScript type definitions`
          );
        } else {
          this.addResult(
            `${component} TypeScript Types`,
            'WARNING',
            `Component ${component} may not have TypeScript type definitions`
          );
        }

        // Check for React.FC usage
        if (content.includes('React.FC<')) {
          this.addResult(
            `${component} React.FC Usage`,
            'PASS',
            `Component ${component} uses React.FC with proper typing`
          );
        } else {
          this.addResult(
            `${component} React.FC Usage`,
            'WARNING',
            `Component ${component} may not use React.FC with proper typing`
          );
        }
      }
    });
  }

  private checkUIComponents() {
    console.log('🎨 Checking UI Component Usage...');

    const components = [
      'SessionReplayPlayer',
      'SessionTimeline', 
      'SessionHeatmap',
      'SessionControls',
      'UserJourneyMap',
      'SessionAnalytics'
    ];

    components.forEach(component => {
      const filePath = path.join(this.componentDir, `${component}.tsx`);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for shadcn/ui components
        const uiComponents = ['Card', 'Button', 'Badge', 'Progress', 'Select', 'Input'];
        const foundComponents = uiComponents.filter(ui => content.includes(ui));
        
        if (foundComponents.length > 0) {
          this.addResult(
            `${component} UI Components`,
            'PASS',
            `Component ${component} uses shadcn/ui components: ${foundComponents.join(', ')}`
          );
        } else {
          this.addResult(
            `${component} UI Components`,
            'WARNING',
            `Component ${component} may not be using shadcn/ui components`
          );
        }

        // Check for Lucide React icons
        if (content.includes('lucide-react')) {
          this.addResult(
            `${component} Icons`,
            'PASS',
            `Component ${component} uses Lucide React icons`
          );
        } else {
          this.addResult(
            `${component} Icons`,
            'WARNING',
            `Component ${component} may not be using Lucide React icons`
          );
        }
      }
    });
  }

  private checkComponentFeatures() {
    console.log('✨ Checking Component Features...');

    // Check SessionReplayPlayer features
    const sessionReplayPlayerPath = path.join(this.componentDir, 'SessionReplayPlayer.tsx');
    if (fs.existsSync(sessionReplayPlayerPath)) {
      const content = fs.readFileSync(sessionReplayPlayerPath, 'utf-8');
      
      const features = [
        { name: 'Playback Controls', check: content.includes('isPlaying') && content.includes('setIsPlaying') },
        { name: 'Speed Control', check: content.includes('playbackSpeed') && content.includes('setPlaybackSpeed') },
        { name: 'Fullscreen Mode', check: content.includes('isFullscreen') && content.includes('setIsFullscreen') },
        { name: 'Event Navigation', check: content.includes('currentEventIndex') && content.includes('setCurrentEventIndex') },
        { name: 'API Integration', check: content.includes('fetch') && content.includes('/api/clickstack/sessions/') },
        { name: 'Error Handling', check: content.includes('error') && content.includes('setError') },
        { name: 'Loading States', check: content.includes('loading') && content.includes('setLoading') }
      ];

      features.forEach(feature => {
        if (feature.check) {
          this.addResult(
            `SessionReplayPlayer - ${feature.name}`,
            'PASS',
            `SessionReplayPlayer implements ${feature.name}`
          );
        } else {
          this.addResult(
            `SessionReplayPlayer - ${feature.name}`,
            'FAIL',
            `SessionReplayPlayer missing ${feature.name}`
          );
        }
      });
    }

    // Check SessionAnalytics features
    const sessionAnalyticsPath = path.join(this.componentDir, 'SessionAnalytics.tsx');
    if (fs.existsSync(sessionAnalyticsPath)) {
      const content = fs.readFileSync(sessionAnalyticsPath, 'utf-8');
      
      const features = [
        { name: 'Multi-dimensional Analytics', check: content.includes('selectedMetric') && content.includes('setSelectedMetric') },
        { name: 'Performance Metrics', check: content.includes('avgLoadTime') || content.includes('avgResponseTime') },
        { name: 'User Behavior Analysis', check: content.includes('totalClicks') || content.includes('totalInputs') },
        { name: 'Engagement Scoring', check: content.includes('engagementScore') || content.includes('interactionRate') },
        { name: 'Real-time Calculations', check: content.includes('useMemo') }
      ];

      features.forEach(feature => {
        if (feature.check) {
          this.addResult(
            `SessionAnalytics - ${feature.name}`,
            'PASS',
            `SessionAnalytics implements ${feature.name}`
          );
        } else {
          this.addResult(
            `SessionAnalytics - ${feature.name}`,
            'FAIL',
            `SessionAnalytics missing ${feature.name}`
          );
        }
      });
    }

    // Check UserJourneyMap features
    const userJourneyMapPath = path.join(this.componentDir, 'UserJourneyMap.tsx');
    if (fs.existsSync(userJourneyMapPath)) {
      const content = fs.readFileSync(userJourneyMapPath, 'utf-8');
      
      const features = [
        { name: 'Multiple View Modes', check: content.includes('viewMode') && content.includes('setViewMode') },
        { name: 'Journey Metrics', check: content.includes('totalDuration') || content.includes('conversionRate') },
        { name: 'Step Analysis', check: content.includes('JourneyStep') || content.includes('steps') },
        { name: 'Flow Visualization', check: content.includes('Flow View') || content.includes('Funnel View') }
      ];

      features.forEach(feature => {
        if (feature.check) {
          this.addResult(
            `UserJourneyMap - ${feature.name}`,
            'PASS',
            `UserJourneyMap implements ${feature.name}`
          );
        } else {
          this.addResult(
            `UserJourneyMap - ${feature.name}`,
            'FAIL',
            `UserJourneyMap missing ${feature.name}`
          );
        }
      });
    }
  }

  private checkFileStructure() {
    console.log('📁 Checking File Structure...');

    const expectedFiles = [
      'SessionReplayPlayer.tsx',
      'SessionTimeline.tsx',
      'SessionHeatmap.tsx',
      'SessionControls.tsx',
      'UserJourneyMap.tsx',
      'SessionAnalytics.tsx'
    ];

    const existingFiles = fs.readdirSync(this.componentDir).filter(file => file.endsWith('.tsx'));
    
    expectedFiles.forEach(file => {
      if (existingFiles.includes(file)) {
        this.addResult(
          `File Structure - ${file}`,
          'PASS',
          `Component file ${file} exists`
        );
      } else {
        this.addResult(
          `File Structure - ${file}`,
          'FAIL',
          `Component file ${file} missing`
        );
      }
    });

    // Check for test files
    const testDir = path.join(this.componentDir, '__tests__');
    if (fs.existsSync(testDir)) {
      const testFiles = fs.readdirSync(testDir);
      if (testFiles.length > 0) {
        this.addResult(
          'Test Files',
          'PASS',
          `Test directory exists with ${testFiles.length} test files`
        );
      } else {
        this.addResult(
          'Test Files',
          'WARNING',
          'Test directory exists but is empty'
        );
      }
    } else {
      this.addResult(
        'Test Files',
        'WARNING',
        'Test directory does not exist'
      );
    }
  }

  private generateReport() {
    console.log('\n📊 Session Replay System Validation Report');
    console.log('=' .repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   ⚠️  Warnings: ${warningTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`   ${index + 1}. ${statusIcon} ${result.test}`);
      console.log(`      ${result.message}`);
      if (result.details) {
        console.log(`      Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });

    console.log(`\n🎯 Recommendations:`);
    if (failedTests > 0) {
      console.log(`   • Fix ${failedTests} failing tests before deployment`);
    }
    if (warningTests > 0) {
      console.log(`   • Review ${warningTests} warnings for potential improvements`);
    }
    if (passedTests === totalTests) {
      console.log(`   • All tests passed! Ready for production deployment`);
    }

    console.log('\n' + '=' .repeat(60));

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: warningTests,
      successRate: (passedTests / totalTests) * 100,
      results: this.results
    };
  }

  async runValidation() {
    console.log('🚀 Starting Session Replay System Validation...\n');

    try {
      this.checkFileStructure();
      this.checkComponentDependencies();
      this.checkComponentImports();
      this.checkTypeScriptTypes();
      this.checkUIComponents();
      this.checkComponentFeatures();

      const report = this.generateReport();

      if (report.failed > 0) {
        throw new Error(`${report.failed} tests failed`);
      }

      console.log('🎉 Validation completed successfully!');
      return report;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.generateReport();
      throw error;
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new SessionReplaySystemValidator();
  validator.runValidation().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { SessionReplaySystemValidator };
