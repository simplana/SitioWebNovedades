import { supabase } from '../lib/supabase';

export enum AuditEventType {
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_FAILED = 'auth_failed',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  DATA_ACCESSED = 'data_accessed',
  DATA_MODIFIED = 'data_modified',
  SECURITY_VIOLATION = 'security_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

export interface AuditLog {
  event_type: AuditEventType;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuditLogger {
  private async getClientInfo() {
    return {
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {};

    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'token', 'card', 'cvv', 'pin', 'secret', 'key'];

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  async log(event: AuditLog): Promise<void> {
    try {
      const clientInfo = await this.getClientInfo();
      const { data: { user } } = await supabase.auth.getUser();

      const logEntry = {
        event_type: event.event_type,
        user_id: event.user_id || user?.id,
        ip_address: event.ip_address,
        user_agent: event.user_agent || clientInfo.user_agent,
        metadata: this.sanitizeMetadata({
          ...event.metadata,
          ...clientInfo
        }),
        severity: event.severity,
        created_at: new Date().toISOString()
      };

      if (import.meta.env.DEV) {
        console.log('[AUDIT LOG]', logEntry);
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  async logAuthEvent(
    eventType: AuditEventType.AUTH_LOGIN | AuditEventType.AUTH_LOGOUT | AuditEventType.AUTH_FAILED,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: eventType,
      user_id: userId,
      metadata,
      severity: eventType === AuditEventType.AUTH_FAILED ? 'medium' : 'low'
    });
  }

  async logPaymentEvent(
    eventType: AuditEventType.PAYMENT_INITIATED | AuditEventType.PAYMENT_COMPLETED | AuditEventType.PAYMENT_FAILED,
    userId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: eventType,
      user_id: userId,
      metadata,
      severity: eventType === AuditEventType.PAYMENT_FAILED ? 'high' : 'medium'
    });
  }

  async logSecurityViolation(
    userId: string | undefined,
    violationType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.SECURITY_VIOLATION,
      user_id: userId,
      metadata: {
        violation_type: violationType,
        ...metadata
      },
      severity: 'critical'
    });
  }

  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<void> {
    await this.log({
      event_type: action === 'read' ? AuditEventType.DATA_ACCESSED : AuditEventType.DATA_MODIFIED,
      user_id: userId,
      metadata: {
        resource_type: resourceType,
        resource_id: resourceId,
        action
      },
      severity: 'low'
    });
  }
}

export const auditLogger = new AuditLogger();
