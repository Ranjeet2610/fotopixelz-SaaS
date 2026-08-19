# API Overview

Base path: `/api/v1`

## Health
- `GET /health`

## Module status endpoints (placeholder)
- `GET /auth/health`
- `GET /users/health`
- `GET /organizations/health`
- `GET /services/health`
- `GET /orders/health`
- `GET /uploads/health`
- `GET /assets/health`
- `GET /editing/health`
- `GET /ai/health`
- `GET /qa/health`
- `GET /revisions/health`
- `GET /pricing/health`
- `GET /payments/health`
- `GET /notifications/health`
- `GET /analytics/health`
- `GET /admin/health`
- `GET /workflow/health`
- `GET /audit-logs/health`

## Role/Permission Notes
- Auth middleware currently reads `x-user-id` and `x-user-role` headers as lightweight placeholders.
- Admin middleware allows `ADMIN` and `SUPER_ADMIN`.

## Next API Phases
1. Define request/response contracts per module.
2. Implement validators and error taxonomy.
3. Add transactional services and repository layer.
4. Integrate payments/storage/notifications/webhooks.
