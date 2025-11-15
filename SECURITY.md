# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email: security@novedadescatolicas.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Measures

### Authentication & Authorization
- Supabase Authentication with email/password
- Row Level Security (RLS) on all database tables
- Secure session management with automatic expiry
- Rate limiting on authentication endpoints

### Data Protection
- **NO CARDHOLDER DATA STORED** - All payment processing via Paguelo Fácil
- All data encrypted in transit (TLS 1.2+)
- All data encrypted at rest (Supabase managed)
- Comprehensive audit logging

### Application Security
- Content Security Policy (CSP) headers
- XSS protection via React and CSP
- SQL injection prevention via parameterized queries
- Input validation and sanitization
- CSRF protection
- Secure HTTP headers (HSTS, X-Frame-Options, etc.)

### Infrastructure Security
- HTTPS enforced for all connections
- Cloud infrastructure by certified providers
- Regular security updates and patches
- Automated vulnerability scanning

## PCI DSS Compliance

This application is PCI DSS compliant. See [PCI_DSS_COMPLIANCE.md](./PCI_DSS_COMPLIANCE.md) for full details.

**Key Points:**
- We do NOT store payment card data
- All payment processing handled by PCI DSS certified provider (Paguelo Fácil)
- Comprehensive security controls implemented
- Regular security audits and testing

## Security Best Practices for Developers

When contributing to this project:

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use utilities in `/src/utils/security.ts`
3. **Sanitize outputs** - Prevent XSS attacks
4. **Follow least privilege** - Only request necessary permissions
5. **Use audit logging** - Log security-relevant events
6. **Test security** - Include security tests in PRs
7. **Keep dependencies updated** - Run `npm audit` regularly

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Tools

### Built-in Security Utilities

```typescript
// Input sanitization
import { sanitizeInput, sanitizeEmail } from './utils/security';

// Rate limiting
import { rateLimiter } from './utils/security';

// Audit logging
import { auditLogger, AuditEventType } from './utils/auditLogger';

// Secure storage
import { secureStorage } from './utils/security';
```

### NPM Scripts

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities (automatic)
npm audit fix

# Update dependencies
npm update
```

## Security Updates

We regularly update dependencies and apply security patches. Check the [CHANGELOG](./CHANGELOG.md) for security-related updates.

## Compliance Certifications

- **PCI DSS SAQ A** - Qualified
- **HTTPS Everywhere** - Enforced
- **OWASP Top 10** - Mitigated

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI Security Standards](https://www.pcisecuritystandards.org/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)

---

Last Updated: November 2025
