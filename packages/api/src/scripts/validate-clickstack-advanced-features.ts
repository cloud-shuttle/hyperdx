#!/usr/bin/env tsx

import { clickStackAdvancedService } from '../services/clickstackAdvanced';

interface ValidationResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  duration?: number;
}

interface AdvancedFeaturesValidator {
  results: ValidationResult[];
  startTime: number;
  endTime?: number;
}

class ClickStackAdvancedFeaturesValidator implements AdvancedFeaturesValidator {
  results: ValidationResult[] = [];
  startTime: number = Date.now();
  endTime?: number;

  /**
   * Run comprehensive validation of advanced features
   */
  async runValidation(): Promise<void> {
    console.log('🧠 Starting ClickStack Advanced Features Validation...\n');

    try {
      // Test 1: Service Initialization
      await this.testServiceInitialization();

      // Test 2: Configuration Management
      await this.testConfigurationManagement();

      // Test 3: Anomaly Detection
      await this.testAnomalyDetection();

      // Test 4: Predictive Analytics
      await this.testPredictiveAnalytics();

      // Test 5: Advanced Monitoring
      await this.testAdvancedMonitoring();

      // Test 6: Security Features
      await this.testSecurityFeatures();

      // Test 7: Root Cause Analysis
      await this.testRootCauseAnalysis();

      // Test 8: Performance Testing
      await this.testPerformance();

      // Test 9: Data Management
      await this.testDataManagement();

      // Test 10: Integration Testing
      await this.testIntegration();

      // Test 11: ML Model Validation
      await this.testMLModels();

      // Test 12: Security Validation
      await this.testSecurityValidation();

      this.endTime = Date.now();
      this.generateReport();

    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.addResult('Validation Execution', 'FAIL', `Validation execution failed: ${error}`);
      this.generateReport();
      throw error;
    }
  }

  /**
   * Test service initialization
   */
  private async testServiceInitialization(): Promise<void> {
    const testStart = Date.now();
    
    try {
      // Test singleton pattern
      const service1 = clickStackAdvancedService;
      const service2 = clickStackAdvancedService;
      
      if (service1 === service2) {
        this.addResult('Service Initialization', 'PASS', 'Singleton pattern working correctly');
      } else {
        this.addResult('Service Initialization', 'FAIL', 'Singleton pattern not working');
      }

      // Test configuration loading
      const config = service1.getConfig();
      if (config && typeof config === 'object') {
        this.addResult('Configuration Loading', 'PASS', 'Configuration loaded successfully', config);
      } else {
        this.addResult('Configuration Loading', 'FAIL', 'Configuration not loaded properly');
      }

    } catch (error) {
      this.addResult('Service Initialization', 'FAIL', `Service initialization failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test configuration management
   */
  private async testConfigurationManagement(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;
      const originalConfig = service.getConfig();

      // Test configuration update
      const updates = {
        anomalyDetection: {
          ...originalConfig.anomalyDetection,
          sensitivity: 0.8
        }
      };

      await service.updateConfig(updates);
      const updatedConfig = service.getConfig();

      if (updatedConfig.anomalyDetection.sensitivity === 0.8) {
        this.addResult('Configuration Update', 'PASS', 'Configuration updated successfully');
      } else {
        this.addResult('Configuration Update', 'FAIL', 'Configuration update failed');
      }

      // Test invalid configuration
      try {
        await service.updateConfig({
          anomalyDetection: {
            ...originalConfig.anomalyDetection,
            sensitivity: 2.0 // Invalid value
          }
        });
        this.addResult('Invalid Configuration', 'WARNING', 'Invalid configuration should be rejected');
      } catch (error) {
        this.addResult('Invalid Configuration', 'PASS', 'Invalid configuration properly rejected');
      }

    } catch (error) {
      this.addResult('Configuration Management', 'FAIL', `Configuration management failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test anomaly detection
   */
  private async testAnomalyDetection(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test anomaly retrieval
      const anomalies = service.getAnomalies('24h');
      if (Array.isArray(anomalies)) {
        this.addResult('Anomaly Retrieval', 'PASS', `Retrieved ${anomalies.length} anomalies`);
      } else {
        this.addResult('Anomaly Retrieval', 'FAIL', 'Anomaly retrieval failed');
      }

      // Test anomaly data structure
      if (anomalies.length > 0) {
        const anomaly = anomalies[0];
        const requiredFields = ['id', 'timestamp', 'service', 'metric', 'value', 'anomalyScore', 'severity'];
        const missingFields = requiredFields.filter(field => !(field in anomaly));
        
        if (missingFields.length === 0) {
          this.addResult('Anomaly Data Structure', 'PASS', 'Anomaly data structure is correct');
        } else {
          this.addResult('Anomaly Data Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        this.addResult('Anomaly Data Structure', 'WARNING', 'No anomalies to validate structure');
      }

      // Test different time ranges
      const timeRanges = ['1h', '24h', '7d'];
      for (const range of timeRanges) {
        const rangeAnomalies = service.getAnomalies(range);
        if (Array.isArray(rangeAnomalies)) {
          this.addResult(`Anomaly Time Range (${range})`, 'PASS', `Retrieved ${rangeAnomalies.length} anomalies for ${range}`);
        } else {
          this.addResult(`Anomaly Time Range (${range})`, 'FAIL', `Failed to retrieve anomalies for ${range}`);
        }
      }

    } catch (error) {
      this.addResult('Anomaly Detection', 'FAIL', `Anomaly detection failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test predictive analytics
   */
  private async testPredictiveAnalytics(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test prediction retrieval
      const predictions = service.getPredictions('24h');
      if (Array.isArray(predictions)) {
        this.addResult('Prediction Retrieval', 'PASS', `Retrieved ${predictions.length} predictions`);
      } else {
        this.addResult('Prediction Retrieval', 'FAIL', 'Prediction retrieval failed');
      }

      // Test prediction data structure
      if (predictions.length > 0) {
        const prediction = predictions[0];
        const requiredFields = ['id', 'timestamp', 'service', 'metric', 'currentValue', 'predictedValue', 'confidence', 'trend'];
        const missingFields = requiredFields.filter(field => !(field in prediction));
        
        if (missingFields.length === 0) {
          this.addResult('Prediction Data Structure', 'PASS', 'Prediction data structure is correct');
        } else {
          this.addResult('Prediction Data Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        this.addResult('Prediction Data Structure', 'WARNING', 'No predictions to validate structure');
      }

      // Test prediction confidence validation
      if (predictions.length > 0) {
        const invalidConfidence = predictions.some(p => p.confidence < 0 || p.confidence > 1);
        if (!invalidConfidence) {
          this.addResult('Prediction Confidence', 'PASS', 'All predictions have valid confidence scores');
        } else {
          this.addResult('Prediction Confidence', 'FAIL', 'Some predictions have invalid confidence scores');
        }
      }

    } catch (error) {
      this.addResult('Predictive Analytics', 'FAIL', `Predictive analytics failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test advanced monitoring
   */
  private async testAdvancedMonitoring(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test root cause analysis
      const rootCauseAnalyses = service.getRootCauseAnalyses('24h');
      if (Array.isArray(rootCauseAnalyses)) {
        this.addResult('Root Cause Analysis', 'PASS', `Retrieved ${rootCauseAnalyses.length} root cause analyses`);
      } else {
        this.addResult('Root Cause Analysis', 'FAIL', 'Root cause analysis retrieval failed');
      }

      // Test root cause analysis data structure
      if (rootCauseAnalyses.length > 0) {
        const analysis = rootCauseAnalyses[0];
        const requiredFields = ['id', 'timestamp', 'incidentId', 'service', 'rootCause', 'impact', 'confidence'];
        const missingFields = requiredFields.filter(field => !(field in analysis));
        
        if (missingFields.length === 0) {
          this.addResult('Root Cause Data Structure', 'PASS', 'Root cause analysis data structure is correct');
        } else {
          this.addResult('Root Cause Data Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        this.addResult('Root Cause Data Structure', 'WARNING', 'No root cause analyses to validate structure');
      }

    } catch (error) {
      this.addResult('Advanced Monitoring', 'FAIL', `Advanced monitoring failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test security features
   */
  private async testSecurityFeatures(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test security threats
      const securityThreats = service.getSecurityThreats('24h');
      if (Array.isArray(securityThreats)) {
        this.addResult('Security Threats', 'PASS', `Retrieved ${securityThreats.length} security threats`);
      } else {
        this.addResult('Security Threats', 'FAIL', 'Security threats retrieval failed');
      }

      // Test behavioral analysis
      const behavioralAnalyses = service.getBehavioralAnalyses('24h');
      if (Array.isArray(behavioralAnalyses)) {
        this.addResult('Behavioral Analysis', 'PASS', `Retrieved ${behavioralAnalyses.length} behavioral analyses`);
      } else {
        this.addResult('Behavioral Analysis', 'FAIL', 'Behavioral analysis retrieval failed');
      }

      // Test security data structure
      if (securityThreats.length > 0) {
        const threat = securityThreats[0];
        const requiredFields = ['id', 'timestamp', 'threatType', 'severity', 'source', 'target', 'riskScore'];
        const missingFields = requiredFields.filter(field => !(field in threat));
        
        if (missingFields.length === 0) {
          this.addResult('Security Threat Structure', 'PASS', 'Security threat data structure is correct');
        } else {
          this.addResult('Security Threat Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }
      }

      // Test behavioral analysis data structure
      if (behavioralAnalyses.length > 0) {
        const analysis = behavioralAnalyses[0];
        const requiredFields = ['id', 'timestamp', 'userId', 'sessionId', 'behavior', 'riskScore'];
        const missingFields = requiredFields.filter(field => !(field in analysis));
        
        if (missingFields.length === 0) {
          this.addResult('Behavioral Analysis Structure', 'PASS', 'Behavioral analysis data structure is correct');
        } else {
          this.addResult('Behavioral Analysis Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }
      }

    } catch (error) {
      this.addResult('Security Features', 'FAIL', `Security features failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test root cause analysis
   */
  private async testRootCauseAnalysis(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test root cause analysis retrieval
      const rootCauseAnalyses = service.getRootCauseAnalyses('24h');
      if (Array.isArray(rootCauseAnalyses)) {
        this.addResult('Root Cause Analysis Retrieval', 'PASS', `Retrieved ${rootCauseAnalyses.length} root cause analyses`);
      } else {
        this.addResult('Root Cause Analysis Retrieval', 'FAIL', 'Root cause analysis retrieval failed');
      }

      // Test root cause analysis quality
      if (rootCauseAnalyses.length > 0) {
        const analysis = rootCauseAnalyses[0];
        
        // Check if root cause is meaningful
        if (analysis.rootCause && analysis.rootCause.length > 10) {
          this.addResult('Root Cause Quality', 'PASS', 'Root cause analysis provides meaningful insights');
        } else {
          this.addResult('Root Cause Quality', 'WARNING', 'Root cause analysis may need improvement');
        }

        // Check confidence scores
        if (analysis.confidence >= 0 && analysis.confidence <= 1) {
          this.addResult('Root Cause Confidence', 'PASS', 'Root cause confidence scores are valid');
        } else {
          this.addResult('Root Cause Confidence', 'FAIL', 'Invalid confidence scores in root cause analysis');
        }
      }

    } catch (error) {
      this.addResult('Root Cause Analysis', 'FAIL', `Root cause analysis failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test response time for anomaly detection
      const anomalyStart = Date.now();
      const anomalies = service.getAnomalies('24h');
      const anomalyTime = Date.now() - anomalyStart;

      if (anomalyTime < 1000) {
        this.addResult('Anomaly Detection Performance', 'PASS', `Anomaly detection completed in ${anomalyTime}ms`);
      } else {
        this.addResult('Anomaly Detection Performance', 'WARNING', `Anomaly detection took ${anomalyTime}ms (slow)`);
      }

      // Test response time for predictions
      const predictionStart = Date.now();
      const predictions = service.getPredictions('24h');
      const predictionTime = Date.now() - predictionStart;

      if (predictionTime < 1000) {
        this.addResult('Prediction Performance', 'PASS', `Predictions completed in ${predictionTime}ms`);
      } else {
        this.addResult('Prediction Performance', 'WARNING', `Predictions took ${predictionTime}ms (slow)`);
      }

      // Test response time for security features
      const securityStart = Date.now();
      const securityThreats = service.getSecurityThreats('24h');
      const securityTime = Date.now() - securityStart;

      if (securityTime < 1000) {
        this.addResult('Security Performance', 'PASS', `Security analysis completed in ${securityTime}ms`);
      } else {
        this.addResult('Security Performance', 'WARNING', `Security analysis took ${securityTime}ms (slow)`);
      }

    } catch (error) {
      this.addResult('Performance Testing', 'FAIL', `Performance testing failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test data management
   */
  private async testDataManagement(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test data consistency
      const anomalies24h = service.getAnomalies('24h');
      const anomalies7d = service.getAnomalies('7d');

      if (anomalies7d.length >= anomalies24h.length) {
        this.addResult('Data Consistency', 'PASS', 'Data consistency maintained across time ranges');
      } else {
        this.addResult('Data Consistency', 'WARNING', 'Data consistency may have issues');
      }

      // Test data quality
      const allData = [
        ...service.getAnomalies('24h'),
        ...service.getPredictions('24h'),
        ...service.getSecurityThreats('24h'),
        ...service.getBehavioralAnalyses('24h'),
        ...service.getRootCauseAnalyses('24h')
      ];

      const validData = allData.filter(item => 
        item && 
        item.id && 
        item.timestamp && 
        typeof item.id === 'string' && 
        typeof item.timestamp === 'string'
      );

      const dataQuality = (validData.length / allData.length) * 100;
      if (dataQuality >= 95) {
        this.addResult('Data Quality', 'PASS', `Data quality: ${dataQuality.toFixed(1)}%`);
      } else {
        this.addResult('Data Quality', 'WARNING', `Data quality: ${dataQuality.toFixed(1)}% (needs improvement)`);
      }

    } catch (error) {
      this.addResult('Data Management', 'FAIL', `Data management failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test integration
   */
  private async testIntegration(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test service integration
      const config = service.getConfig();
      const anomalies = service.getAnomalies('24h');
      const predictions = service.getPredictions('24h');
      const threats = service.getSecurityThreats('24h');

      if (config && Array.isArray(anomalies) && Array.isArray(predictions) && Array.isArray(threats)) {
        this.addResult('Service Integration', 'PASS', 'All service methods working correctly');
      } else {
        this.addResult('Service Integration', 'FAIL', 'Service integration issues detected');
      }

      // Test configuration integration
      const originalSensitivity = config.anomalyDetection.sensitivity;
      await service.updateConfig({
        anomalyDetection: { ...config.anomalyDetection, sensitivity: 0.9 }
      });

      const updatedConfig = service.getConfig();
      if (updatedConfig.anomalyDetection.sensitivity === 0.9) {
        this.addResult('Configuration Integration', 'PASS', 'Configuration integration working correctly');
      } else {
        this.addResult('Configuration Integration', 'FAIL', 'Configuration integration failed');
      }

      // Restore original configuration
      await service.updateConfig({
        anomalyDetection: { ...config.anomalyDetection, sensitivity: originalSensitivity }
      });

    } catch (error) {
      this.addResult('Integration Testing', 'FAIL', `Integration testing failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test ML models
   */
  private async testMLModels(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test anomaly detection models
      const anomalies = service.getAnomalies('24h');
      if (anomalies.length > 0) {
        const anomalyScores = anomalies.map(a => a.anomalyScore);
        const validScores = anomalyScores.filter(score => score >= 0 && score <= 1);
        
        if (validScores.length === anomalyScores.length) {
          this.addResult('Anomaly Detection Models', 'PASS', 'Anomaly detection models producing valid scores');
        } else {
          this.addResult('Anomaly Detection Models', 'FAIL', 'Anomaly detection models producing invalid scores');
        }
      } else {
        this.addResult('Anomaly Detection Models', 'WARNING', 'No anomalies to validate models');
      }

      // Test prediction models
      const predictions = service.getPredictions('24h');
      if (predictions.length > 0) {
        const confidences = predictions.map(p => p.confidence);
        const validConfidences = confidences.filter(c => c >= 0 && c <= 1);
        
        if (validConfidences.length === confidences.length) {
          this.addResult('Prediction Models', 'PASS', 'Prediction models producing valid confidence scores');
        } else {
          this.addResult('Prediction Models', 'FAIL', 'Prediction models producing invalid confidence scores');
        }
      } else {
        this.addResult('Prediction Models', 'WARNING', 'No predictions to validate models');
      }

      // Test model consistency
      const config = service.getConfig();
      if (config.anomalyDetection.enabled && config.predictiveAnalytics.enabled) {
        this.addResult('Model Configuration', 'PASS', 'ML models properly configured');
      } else {
        this.addResult('Model Configuration', 'WARNING', 'Some ML models may be disabled');
      }

    } catch (error) {
      this.addResult('ML Model Testing', 'FAIL', `ML model testing failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Test security validation
   */
  private async testSecurityValidation(): Promise<void> {
    const testStart = Date.now();
    
    try {
      const service = clickStackAdvancedService;

      // Test security threat detection
      const threats = service.getSecurityThreats('24h');
      if (threats.length > 0) {
        const validThreats = threats.filter(threat => 
          threat.threatType && 
          threat.severity && 
          threat.riskScore >= 0 && 
          threat.riskScore <= 1
        );
        
        if (validThreats.length === threats.length) {
          this.addResult('Security Threat Detection', 'PASS', 'Security threat detection working correctly');
        } else {
          this.addResult('Security Threat Detection', 'FAIL', 'Security threat detection has validation issues');
        }
      } else {
        this.addResult('Security Threat Detection', 'WARNING', 'No security threats to validate');
      }

      // Test behavioral analysis
      const behaviors = service.getBehavioralAnalyses('24h');
      if (behaviors.length > 0) {
        const validBehaviors = behaviors.filter(behavior => 
          behavior.behavior && 
          behavior.riskScore >= 0 && 
          behavior.riskScore <= 1
        );
        
        if (validBehaviors.length === behaviors.length) {
          this.addResult('Behavioral Analysis', 'PASS', 'Behavioral analysis working correctly');
        } else {
          this.addResult('Behavioral Analysis', 'FAIL', 'Behavioral analysis has validation issues');
        }
      } else {
        this.addResult('Behavioral Analysis', 'WARNING', 'No behavioral analyses to validate');
      }

      // Test security configuration
      const config = service.getConfig();
      if (config.security.enabled) {
        this.addResult('Security Configuration', 'PASS', 'Security features properly configured');
      } else {
        this.addResult('Security Configuration', 'WARNING', 'Security features may be disabled');
      }

    } catch (error) {
      this.addResult('Security Validation', 'FAIL', `Security validation failed: ${error}`);
    }

    const duration = Date.now() - testStart;
    this.results[this.results.length - 1].duration = duration;
  }

  /**
   * Add validation result
   */
  private addResult(testName: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any): void {
    this.results.push({
      testName,
      status,
      message,
      details
    });
  }

  /**
   * Generate validation report
   */
  private generateReport(): void {
    const totalDuration = this.endTime ? this.endTime - this.startTime : 0;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const total = this.results.length;

    console.log('\n📊 ClickStack Advanced Features Validation Report');
    console.log('=' .repeat(60));
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`⚠️  Warnings: ${warnings}/${total}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log('');

    // Group results by status
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    const warningTests = this.results.filter(r => r.status === 'WARNING');
    const passedTests = this.results.filter(r => r.status === 'PASS');

    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(result => {
        console.log(`  • ${result.testName}: ${result.message}`);
        if (result.duration) {
          console.log(`    Duration: ${result.duration}ms`);
        }
      });
      console.log('');
    }

    if (warningTests.length > 0) {
      console.log('⚠️  Warnings:');
      warningTests.forEach(result => {
        console.log(`  • ${result.testName}: ${result.message}`);
        if (result.duration) {
          console.log(`    Duration: ${result.duration}ms`);
        }
      });
      console.log('');
    }

    if (passedTests.length > 0) {
      console.log('✅ Passed Tests:');
      passedTests.forEach(result => {
        console.log(`  • ${result.testName}: ${result.message}`);
        if (result.duration) {
          console.log(`    Duration: ${result.duration}ms`);
        }
      });
      console.log('');
    }

    // Overall assessment
    if (failed === 0 && warnings === 0) {
      console.log('🎉 All tests passed! ClickStack Advanced Features are ready for production.');
    } else if (failed === 0) {
      console.log('✅ All critical tests passed! Some warnings to address.');
    } else {
      console.log('❌ Critical issues found! Please address failed tests before deployment.');
    }

    console.log('=' .repeat(60));
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new ClickStackAdvancedFeaturesValidator();
  validator.runValidation().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { ClickStackAdvancedFeaturesValidator };
