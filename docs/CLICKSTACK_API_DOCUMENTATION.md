# ClickStack API Documentation

## Overview

The ClickStack API provides comprehensive access to all ClickStack features including dashboard data, session replay, pattern recognition, anomaly detection, predictive analytics, and advanced security features. All endpoints are tenant-aware and require proper authentication.

## Base URL

```
https://api.hyperdx.com/clickstack
```

## Authentication

All ClickStack API endpoints require authentication using the standard HyperDX authentication mechanism:

```http
Authorization: Bearer <your-api-token>
```

## Common Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameters provided",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Health & Status Endpoints

### GET /health

Get ClickStack service health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "services": {
      "anomalyDetection": "healthy",
      "predictiveAnalytics": "healthy",
      "securityAnalysis": "healthy",
      "sessionReplay": "healthy",
      "patternRecognition": "healthy"
    },
    "lastCheck": "2024-01-15T10:30:00Z"
  }
}
```

### GET /features

Get available ClickStack features and their status.

**Response:**
```json
{
  "success": true,
  "data": {
    "features": {
      "anomalyDetection": {
        "enabled": true,
        "version": "1.0.0",
        "status": "active"
      },
      "predictiveAnalytics": {
        "enabled": true,
        "version": "1.0.0",
        "status": "active"
      },
      "sessionReplay": {
        "enabled": true,
        "version": "1.0.0",
        "status": "active"
      },
      "patternRecognition": {
        "enabled": true,
        "version": "1.0.0",
        "status": "active"
      },
      "securityAnalysis": {
        "enabled": true,
        "version": "1.0.0",
        "status": "active"
      }
    }
  }
}
```

## Dashboard Endpoints

### GET /dashboard/overview

Get ClickStack dashboard overview data.

**Query Parameters:**
- `timeRange` (string, optional): Time range filter (1h, 24h, 7d, 30d)
- `startTime` (string, optional): Start time in ISO format
- `endTime` (string, optional): End time in ISO format

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 1250,
    "uniqueUsers": 450,
    "avgSessionDuration": 180,
    "conversionRate": 0.15,
    "errorRate": 0.02,
    "engagementScore": 0.75,
    "topPages": [
      {
        "url": "/dashboard",
        "visits": 320,
        "avgTime": 240
      }
    ],
    "recentActivity": [
      {
        "type": "session",
        "description": "New user session started",
        "timestamp": "2024-01-15T10:25:00Z"
      }
    ]
  }
}
```

### GET /dashboard/metrics

Get ClickStack metrics data.

**Query Parameters:**
- `metricType` (string, optional): Type of metrics (session, pattern, anomaly, performance)
- `timeRange` (string, optional): Time range filter
- `startTime` (string, optional): Start time in ISO format
- `endTime` (string, optional): End time in ISO format

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionMetrics": {
      "totalSessions": 1250,
      "uniqueUsers": 450,
      "avgDuration": 180,
      "bounceRate": 0.25
    },
    "patternMetrics": {
      "totalPatterns": 45,
      "highConfidence": 12,
      "trendingPatterns": 8
    },
    "anomalyMetrics": {
      "totalAnomalies": 23,
      "criticalAnomalies": 3,
      "resolvedAnomalies": 18
    },
    "performanceMetrics": {
      "avgLoadTime": 1200,
      "avgResponseTime": 450,
      "errorRate": 0.02
    }
  }
}
```

### GET /dashboard/sessions

Get session list data.

**Query Parameters:**
- `search` (string, optional): Search term
- `status` (string, optional): Session status filter
- `device` (string, optional): Device type filter
- `sort` (string, optional): Sort field
- `order` (string, optional): Sort order (asc, desc)
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-123",
        "userId": "user-456",
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-15T10:05:00Z",
        "duration": 300,
        "pageViews": 8,
        "device": "desktop",
        "location": "US",
        "status": "completed"
      }
    ],
    "summary": {
      "totalSessions": 1250,
      "avgDuration": 180,
      "completionRate": 0.85
    }
  }
}
```

### GET /dashboard/patterns

Get pattern recognition data.

**Query Parameters:**
- `search` (string, optional): Search term
- `type` (string, optional): Pattern type filter
- `severity` (string, optional): Severity filter
- `status` (string, optional): Status filter
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "patterns": [
      {
        "id": "pattern-123",
        "name": "Login Failure Pattern",
        "description": "Multiple failed login attempts",
        "confidence": 0.95,
        "severity": "high",
        "frequency": 15,
        "impact": 0.8,
        "tags": ["security", "authentication"],
        "recommendations": [
          "Implement rate limiting",
          "Add CAPTCHA verification"
        ]
      }
    ]
  }
}
```

### GET /dashboard/event-deltas

Get event delta analysis data.

**Query Parameters:**
- `search` (string, optional): Search term
- `type` (string, optional): Event type filter
- `severity` (string, optional): Severity filter
- `status` (string, optional): Status filter
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "eventDeltas": [
      {
        "id": "delta-123",
        "metricName": "response_time",
        "eventType": "performance",
        "baselineValue": 450,
        "currentValue": 1200,
        "deltaPercentage": 167,
        "severity": "high",
        "impact": {
          "sessions": 45,
          "users": 23,
          "revenue": 1200
        },
        "context": {
          "trend": "increasing",
          "seasonality": "none",
          "correlation": "database_queries"
        },
        "recommendations": [
          "Optimize database queries",
          "Add query caching"
        ]
      }
    ]
  }
}
```

## Session Replay Endpoints

### GET /sessions/{sessionId}

Get session details.

**Path Parameters:**
- `sessionId` (string, required): Session ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-123",
    "userId": "user-456",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T10:05:00Z",
    "duration": 300,
    "pageViews": 8,
    "device": "desktop",
    "location": "US",
    "status": "completed",
    "events": [
      {
        "id": "event-1",
        "type": "pageview",
        "timestamp": "2024-01-15T10:00:00Z",
        "data": {
          "url": "/dashboard",
          "title": "Dashboard"
        }
      }
    ]
  }
}
```

### GET /sessions/{sessionId}/replay

Get session replay data.

**Path Parameters:**
- `sessionId` (string, required): Session ID

**Query Parameters:**
- `includeMetadata` (boolean, optional): Include metadata (default: true)
- `includePerformance` (boolean, optional): Include performance data (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "userId": "user-456",
    "startTime": "2024-01-15T10:00:00Z",
    "duration": 300,
    "events": [
      {
        "id": "event-1",
        "type": "pageview",
        "timestamp": "2024-01-15T10:00:00Z",
        "data": {
          "url": "/dashboard",
          "title": "Dashboard",
          "viewport": {
            "width": 1920,
            "height": 1080
          }
        },
        "metadata": {
          "userAgent": "Mozilla/5.0...",
          "ipAddress": "192.168.1.1"
        }
      }
    ],
    "performance": {
      "avgLoadTime": 1200,
      "avgResponseTime": 450,
      "totalErrors": 0
    }
  }
}
```

### GET /sessions/{sessionId}/analytics

Get session analytics data.

**Path Parameters:**
- `sessionId` (string, required): Session ID

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEvents": 45,
      "sessionDuration": 300,
      "pageViews": 8,
      "interactions": 23
    },
    "performance": {
      "avgLoadTime": 1200,
      "avgResponseTime": 450,
      "totalErrors": 0,
      "errorRate": 0
    },
    "userBehavior": {
      "totalClicks": 15,
      "totalInputs": 8,
      "totalScrolls": 12,
      "avgTimeBetweenEvents": 6.7
    },
    "engagement": {
      "engagementScore": 0.75,
      "interactionRate": 0.51,
      "bounceRate": 0,
      "sessionDepth": 8
    }
  }
}
```

## Pattern Recognition Endpoints

### GET /patterns

Get pattern recognition data.

**Query Parameters:**
- `search` (string, optional): Search term
- `type` (string, optional): Pattern type filter
- `severity` (string, optional): Severity filter
- `confidence` (number, optional): Minimum confidence score
- `timeRange` (string, optional): Time range filter
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "patterns": [
      {
        "id": "pattern-123",
        "name": "Login Failure Pattern",
        "description": "Multiple failed login attempts",
        "type": "security",
        "confidence": 0.95,
        "severity": "high",
        "frequency": 15,
        "impact": 0.8,
        "tags": ["security", "authentication"],
        "recommendations": [
          "Implement rate limiting",
          "Add CAPTCHA verification"
        ],
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "totalPatterns": 45,
      "highConfidence": 12,
      "trendingPatterns": 8
    }
  }
}
```

### GET /patterns/{patternId}

Get specific pattern details.

**Path Parameters:**
- `patternId` (string, required): Pattern ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pattern-123",
    "name": "Login Failure Pattern",
    "description": "Multiple failed login attempts",
    "type": "security",
    "confidence": 0.95,
    "severity": "high",
    "frequency": 15,
    "impact": 0.8,
    "tags": ["security", "authentication"],
    "recommendations": [
      "Implement rate limiting",
      "Add CAPTCHA verification"
    ],
    "instances": [
      {
        "id": "instance-1",
        "timestamp": "2024-01-15T10:00:00Z",
        "userId": "user-456",
        "sessionId": "session-123",
        "details": "5 failed login attempts in 2 minutes"
      }
    ],
    "trends": {
      "frequency": "increasing",
      "confidence": "stable",
      "impact": "decreasing"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### GET /patterns/{patternId}/trends

Get pattern trends analysis.

**Path Parameters:**
- `patternId` (string, required): Pattern ID

**Query Parameters:**
- `timeRange` (string, optional): Time range filter (default: 7d)

**Response:**
```json
{
  "success": true,
  "data": {
    "patternId": "pattern-123",
    "timeRange": "7d",
    "trends": {
      "frequency": {
        "trend": "increasing",
        "change": 0.25,
        "data": [
          {
            "date": "2024-01-09",
            "value": 10
          }
        ]
      },
      "confidence": {
        "trend": "stable",
        "change": 0.02,
        "data": [
          {
            "date": "2024-01-09",
            "value": 0.95
          }
        ]
      },
      "impact": {
        "trend": "decreasing",
        "change": -0.15,
        "data": [
          {
            "date": "2024-01-09",
            "value": 0.8
          }
        ]
      }
    }
  }
}
```

## Anomaly Detection Endpoints

### GET /anomalies

Get anomaly detection data.

**Query Parameters:**
- `service` (string, optional): Service filter
- `metric` (string, optional): Metric filter
- `severity` (string, optional): Severity filter
- `timeRange` (string, optional): Time range filter
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "id": "anomaly-123",
        "timestamp": "2024-01-15T10:00:00Z",
        "service": "api",
        "metric": "response_time",
        "value": 1200,
        "baseline": 450,
        "anomalyScore": 0.95,
        "severity": "critical",
        "confidence": 0.92,
        "description": "API response time shows critical anomaly with score 0.95",
        "recommendations": [
          "Optimize database queries",
          "Check for system issues or attacks"
        ]
      }
    ]
  }
}
```

### GET /anomalies/{anomalyId}

Get specific anomaly details.

**Path Parameters:**
- `anomalyId` (string, required): Anomaly ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "anomaly-123",
    "timestamp": "2024-01-15T10:00:00Z",
    "service": "api",
    "metric": "response_time",
    "value": 1200,
    "baseline": 450,
    "anomalyScore": 0.95,
    "severity": "critical",
    "confidence": 0.92,
    "description": "API response time shows critical anomaly with score 0.95",
    "recommendations": [
      "Optimize database queries",
      "Check for system issues or attacks"
    ],
    "context": {
      "relatedAnomalies": ["anomaly-124", "anomaly-125"],
      "affectedUsers": 45,
      "affectedSessions": 23
    }
  }
}
```

## Predictive Analytics Endpoints

### GET /predictions

Get predictive analytics data.

**Query Parameters:**
- `service` (string, optional): Service filter
- `metric` (string, optional): Metric filter
- `impact` (string, optional): Impact filter
- `timeRange` (string, optional): Time range filter
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "id": "prediction-123",
        "timestamp": "2024-01-15T10:00:00Z",
        "service": "api",
        "metric": "cpu_usage",
        "currentValue": 65,
        "predictedValue": 85,
        "confidence": 0.92,
        "trend": "increasing",
        "timeframe": "24h",
        "impact": "high",
        "recommendations": [
          "Monitor CPU usage trends",
          "Prepare for potential scaling"
        ]
      }
    ]
  }
}
```

### GET /predictions/{predictionId}

Get specific prediction details.

**Path Parameters:**
- `predictionId` (string, required): Prediction ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prediction-123",
    "timestamp": "2024-01-15T10:00:00Z",
    "service": "api",
    "metric": "cpu_usage",
    "currentValue": 65,
    "predictedValue": 85,
    "confidence": 0.92,
    "trend": "increasing",
    "timeframe": "24h",
    "impact": "high",
    "recommendations": [
      "Monitor CPU usage trends",
      "Prepare for potential scaling"
    ],
    "model": {
      "type": "time_series",
      "version": "1.0.0",
      "accuracy": 0.89
    },
    "forecast": [
      {
        "timestamp": "2024-01-16T10:00:00Z",
        "value": 85,
        "confidence": 0.92
      }
    ]
  }
}
```

## Security Analysis Endpoints

### GET /security/threats

Get security threat data.

**Query Parameters:**
- `threatType` (string, optional): Threat type filter
- `severity` (string, optional): Severity filter
- `status` (string, optional): Status filter
- `timeRange` (string, optional): Time range filter
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "threats": [
      {
        "id": "threat-123",
        "timestamp": "2024-01-15T10:00:00Z",
        "threatType": "authentication",
        "severity": "high",
        "source": "192.168.1.100",
        "target": "api-service",
        "description": "Suspicious authentication attempts detected",
        "riskScore": 0.85,
        "mitigation": [
          "Block IP",
          "Increase monitoring",
          "Review logs"
        ],
        "status": "detected"
      }
    ]
  }
}
```

### GET /security/behavior

Get behavioral analysis data.

**Query Parameters:**
- `behavior` (string, optional): Behavior type filter
- `riskScore` (number, optional): Minimum risk score
- `timeRange` (string, optional): Time range filter
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "behaviors": [
      {
        "id": "behavior-123",
        "timestamp": "2024-01-15T10:00:00Z",
        "userId": "user-456",
        "sessionId": "session-123",
        "behavior": "suspicious",
        "riskScore": 0.75,
        "patterns": [
          "Rapid page navigation",
          "Multiple failed logins"
        ],
        "anomalies": [
          "Unusual access patterns"
        ],
        "recommendations": [
          "Monitor user activity",
          "Review access logs"
        ]
      }
    ]
  }
}
```

## Configuration Endpoints

### GET /config

Get ClickStack configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "anomalyDetection": {
      "enabled": true,
      "algorithm": "isolation_forest",
      "sensitivity": 0.7,
      "windowSize": 60,
      "threshold": 0.8,
      "features": ["cpu", "memory", "response_time", "error_rate", "throughput"]
    },
    "predictiveAnalytics": {
      "enabled": true,
      "models": {
        "capacity": true,
        "performance": true,
        "security": true,
        "user_behavior": true
      },
      "forecastHorizon": 24,
      "confidenceLevel": 0.9,
      "retrainInterval": 168
    },
    "advancedMonitoring": {
      "enabled": true,
      "realTimeAnalysis": true,
      "patternRecognition": true,
      "correlationAnalysis": true,
      "rootCauseAnalysis": true,
      "predictiveMaintenance": true
    },
    "security": {
      "enabled": true,
      "threatDetection": true,
      "behavioralAnalysis": true,
      "riskScoring": true,
      "complianceMonitoring": true,
      "auditTrail": true
    }
  }
}
```

### PUT /config

Update ClickStack configuration.

**Request Body:**
```json
{
  "anomalyDetection": {
    "sensitivity": 0.8
  },
  "predictiveAnalytics": {
    "forecastHorizon": 48
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration updated successfully",
    "updatedFields": ["anomalyDetection.sensitivity", "predictiveAnalytics.forecastHorizon"]
  }
}
```

### GET /config/validate

Validate ClickStack configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "warnings": [],
    "errors": [],
    "recommendations": [
      "Consider increasing anomaly detection sensitivity for better detection"
    ]
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid parameters provided |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `RATE_LIMITED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## Rate Limits

- **Standard Endpoints**: 1000 requests per minute
- **Analytics Endpoints**: 100 requests per minute
- **Configuration Endpoints**: 10 requests per minute

## Pagination

For endpoints that support pagination, use the `limit` and `offset` parameters:

```http
GET /clickstack/dashboard/sessions?limit=20&offset=40
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": {
    "sessions": [...],
    "pagination": {
      "total": 1250,
      "limit": 20,
      "offset": 40,
      "hasMore": true
    }
  }
}
```

## Webhooks

ClickStack supports webhooks for real-time notifications. Configure webhooks to receive notifications for:

- Anomaly detection events
- Security threat detection
- Pattern recognition events
- Predictive analytics alerts

### Webhook Configuration

```json
{
  "url": "https://your-app.com/webhooks/clickstack",
  "events": ["anomaly", "threat", "pattern", "prediction"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload Example

```json
{
  "event": "anomaly_detected",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "anomalyId": "anomaly-123",
    "severity": "critical",
    "service": "api",
    "metric": "response_time"
  }
}
```

## SDK Integration

For easier integration, use the ClickStack SDK:

```javascript
import { ClickStackClient } from '@hyperdx/clickstack-sdk';

const client = new ClickStackClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.hyperdx.com'
});

// Get dashboard overview
const overview = await client.dashboard.getOverview({
  timeRange: '24h'
});

// Get session replay
const replay = await client.sessions.getReplay('session-123');

// Get anomalies
const anomalies = await client.anomalies.list({
  severity: 'critical',
  timeRange: '24h'
});
```

## Support

For API support and questions:

- **Documentation**: https://docs.hyperdx.com/clickstack
- **API Status**: https://status.hyperdx.com
- **Support Email**: api-support@hyperdx.com
- **Developer Community**: https://community.hyperdx.com
