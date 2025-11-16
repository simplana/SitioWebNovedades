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

## Payment Integration Security

### Zero-Trust Payment Architecture

Our payment integration follows a zero-trust security model where **NO payment secrets are exposed to the frontend**.

**Architecture:**
```
Frontend (React)
  └─ Calls only Supabase Edge Functions
       ↓
Supabase Edge Functions (Secure Backend)
  ├─ paguelo-facil-create-payment
  ├─ paguelo-facil-get-status
  └─ paguelo-facil-webhook
       └─ Holds payment credentials (server-side only)
            ↓
Paguelo Fácil API (PCI DSS Level 1)
  └─ Processes all card data
```

### Security Guarantees

1. **No Secrets in Frontend**
   - Frontend bundle contains ZERO payment credentials
   - No `VITE_PAGUELO_FACIL_*` environment variables
   - No payment tokens in URLs or query parameters
   - All payment API calls proxy through secure backend

2. **Backend-Only Payment Processing**
   - Payment secrets stored only in Supabase Functions environment
   - All API calls to payment gateway originate from secure backend
   - Request validation and sanitization at backend layer
   - Comprehensive audit logging of all payment events

3. **Webhook Security**
   - Webhooks received exclusively by backend functions
   - Webhook signature validation (implemented in backend)
   - Sanitization of all webhook payloads before database storage
   - Frontend never receives raw webhook data

### Environment Variables Security

**Frontend Variables (VITE_*):**
- ✅ `VITE_SUPABASE_URL` - Public, safe to expose
- ✅ `VITE_SUPABASE_ANON_KEY` - Public, safe to expose (RLS protected)
- ❌ NO payment credentials allowed

**Backend Variables (Supabase Functions only):**
- `PAGUELO_FACIL_ACCESS_TOKEN` - Server-side only, never exposed
- `PAGUELO_FACIL_API_URL` - Server-side only
- Configured in: Supabase Dashboard > Edge Functions > Settings

### Payment Data Flow

1. Customer initiates checkout on frontend
2. Frontend calls Supabase Function with order details (NO card data)
3. Supabase Function uses server-side token to create payment with Paguelo Fácil
4. Payment URL returned to frontend (NO secrets included)
5. Customer redirected to Paguelo Fácil hosted checkout
6. Customer enters card data on PCI DSS compliant page
7. Payment processed by Paguelo Fácil
8. Webhook notification sent to Supabase Function (backend only)
9. Frontend receives payment status (sanitized, no sensitive data)

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
