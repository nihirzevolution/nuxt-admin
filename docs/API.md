# Native Admin — HTTP API reference

Base URL: your deployed origin, e.g. `https://example.com` or `http://localhost:3000`.  
All paths below are relative to the origin (Nitro serves them under `/api/...`).

---

## Response shape

**Success**

```json
{ "ok": true, "data": { } }
```

**Error**

```json
{
  "ok": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message",
    "details": { }
  }
}
```

`details` is only present when the server attaches extra context (e.g. `downloadUrl` for `WEB_STAFF_ONLY`).

---

## Authentication

Most routes require a valid JWT.

**Send the token using either:**

| Method | How |
|--------|-----|
| Cookie | `auth_token=<JWT>` (same-site browser requests) |
| Header | `Authorization: Bearer <JWT>` (typical for mobile / Postman) |

The server checks the user exists, is **active**, and the JWT is valid (see `server/api/auth/me.get.ts`).

**HTTP status (guards):**

- `401` — missing/invalid session, or inactive user  
- `403` — authenticated but not allowed for this route (e.g. not `super_admin` for `/api/roles`)

---

## Web vs mobile: `X-Auth-Client`

Used only for **`POST /api/auth/login`** and **`POST /api/auth/register`**.

| Header value | Behaviour |
|--------------|------------|
| `X-Auth-Client: app` | **Mobile / native app.** Login issues a token for **any** valid active user. Register returns a **token** after signup. |
| Omitted, or any value other than `app` (e.g. browser) | Treated as **`web`.** **Login** issues a token **only** for `admin` or `super_admin`. Other roles get `403` with code `WEB_STAFF_ONLY` (no token). **Register** creates a `user` but does **not** return a token (web is admin-only; end users are expected to use the app). |

> From the Nuxt site, the client sends `X-Auth-Client: web` via `app/composables/useApi.ts`. Your mobile app should send `X-Auth-Client: app` on login/register.

---

## Endpoints overview

| Method | Path | Auth / role |
|--------|------|----------------|
| GET | `/api/v1/health` | None |
| POST | `/api/auth/login` | None |
| POST | `/api/auth/register` | None |
| GET | `/api/auth/me` | JWT |
| GET | `/api/role-slugs` | JWT, `admin` or `super_admin` |
| GET | `/api/roles` | JWT, `super_admin` only |
| POST | `/api/roles` | JWT, `super_admin` only |
| GET | `/api/roles/:id` | JWT, `super_admin` only |
| PUT | `/api/roles/:id` | JWT, `super_admin` only |
| DELETE | `/api/roles/:id` | JWT, `super_admin` only |
| GET | `/api/users` | JWT, `admin` or `super_admin` |
| POST | `/api/users` | JWT, `admin` or `super_admin` |
| GET | `/api/users/:id` | JWT, `admin` or `super_admin` |
| PUT | `/api/users/:id` | JWT, `admin` or `super_admin` |
| DELETE | `/api/users/:id` | JWT, `admin` or `super_admin` |
| GET | `/api/shops` | JWT, `admin`, `super_admin`, or `shop_owner` |
| POST | `/api/shops` | JWT, `admin`, `super_admin`, or `shop_owner` |
| GET | `/api/shops/:id` | Same as above |
| PUT | `/api/shops/:id` | Same as above |
| DELETE | `/api/shops/:id` | Same as above |

---

## `GET /api/v1/health`

**Auth:** none  

**200** — `data`:

| Field | Type | Description |
|------|------|-------------|
| `status` | `"ok"` | Health flag |
| `service` | `string` | e.g. `nativeadmin` |
| `time` | `string` | ISO timestamp |

---

## `POST /api/auth/login`

**Auth:** none  

**Headers (optional):** `X-Auth-Client: app` | (web default)  

**Body (JSON):**

| Field | Type | Required |
|------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

**200** — `data`:

| Field | Type | Description |
|------|------|-------------|
| `token` | string | JWT (omitted in practice only if flow changes; for web non-staff you get an error, not 200) |
| `user` | object | `id`, `email`, `name`, `role` |

**400** — `VALIDATION_ERROR` — missing email/password  
**401** — `UNAUTHORIZED` — wrong credentials  
**403** — `WEB_STAFF_ONLY` (web client only, non `admin`/`super_admin`) — `error.details.downloadUrl` may contain app store / download URL from config  

---

## `POST /api/auth/register`

**Auth:** none  

**Headers (optional):** `X-Auth-Client: app`  

**Body (JSON):**

| Field | Type | Required |
|------|------|----------|
| `name` | string | yes |
| `email` | string | yes |
| `password` | string | yes (min 8 characters) |

Creates a user with role `user`.  

**201** — `data` (web vs app):

| Field | Web (`X-Auth-Client` not `app`) | App (`X-Auth-Client: app`) |
|--------|-----------------------------------|----------------------------|
| `token` | **Omitted** | Present |
| `user` | `{ id, name, email, role }` | same |
| `message` | string | string |
| `downloadUrl` | string (from `NUXT_PUBLIC_APP_DOWNLOAD_URL`) | string |

**400** — validation  
**409** — `EMAIL_IN_USE` — email already registered  

---

## `GET /api/auth/me`

**Auth:** JWT (cookie or Bearer)  

**200** — `data.user`: `id`, `email`, `name`, `role`  

**401** — no/invalid token, or user inactive  

---

## `GET /api/role-slugs`

**Auth:** JWT, role `admin` or `super_admin`  

Used to fill role dropdowns when creating/editing users. Returns **active** roles.  
`super_admin` is **omitted** from the list unless the current user is `super_admin`.  

**200** — `data`: `{ "items": [ { "slug", "name" }, ... ] }`  

**403** — not staff  

---

## Roles CRUD — `/api/roles*`

**Auth:** JWT, **`super_admin` only** (all methods below).  

### `GET /api/roles`

**Query:**

| Param | Description |
|-------|-------------|
| `page` | default `1` |
| `limit` | default `20`, max `100` |
| `active` | `1` or `true` to filter `isActive: true` |

**200** — paginated list: `items` (role objects with `id`, `name`, `slug`, `description`, `isSystem`, `isActive`, `createdAt`, `updatedAt`), `total`, `page`, `limit`  

### `POST /api/roles`

**Body (JSON):**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Display name |
| `slug` | no | Auto-derived from `name` if omitted |
| `description` | no | Text |

**201** — created role (same shape as list item)  

### `GET /api/roles/:id`

**200** — single role  
**404** — not found  

### `PUT /api/roles/:id`

**Body (JSON):** optional `name`, `slug`, `description`, `isActive`  

**200** — updated role  

### `DELETE /api/roles/:id`

**200** — e.g. `{ "deleted": true, "id": "..." }` (see controller)  

**403/404/409** — per business rules in `roles.controller`  

---

## Users CRUD — `/api/users*`

**Auth:** JWT, **`admin` or `super_admin`** for all routes below.  

**Visibility:** Users with role `super_admin` are only visible/editable to **`super_admin`**. A plain `admin` will not see them in lists and gets 404/403 for those IDs.  

### `GET /api/users`

**Query:**

| Param | Description |
|-------|-------------|
| `page` | default `1` |
| `limit` | default `10`, max `100` |
| `search` | optional, matches `name` / `email` (case-insensitive) |

**200** — `items` (`id`, `email`, `name`, `role`, `isActive`, `createdAt`, `updatedAt`), `total`, `page`, `limit`  

### `POST /api/users`

**Body (JSON):** `name`, `email`, `password` (min 8 chars), `role`, optional `isActive` (default true).  
Only `super_admin` can create or assign `super_admin` (enforced in controller).  

**201** — created user (no `password` in response)  

### `GET /api/users/:id` / `PUT` / `DELETE`

**PUT body:** optional `name`, `email`, `role`, `isActive`, `password` (if changing password, min 8 chars).  

**DELETE** — cannot delete self; last `super_admin` protected, etc. (see `users.controller`)  

**404** — for `admin` when target is a hidden `super_admin` user  

---

## Shops CRUD — `/api/shops*`

**Auth:** JWT, one of: **`admin`**, **`super_admin`**, **`shop_owner`**

- **`admin` / `super_admin`:** full list (optional `userId` filter), can assign any user as `userId` on create/update, can delete any shop.  
- **`shop_owner`:** only shops where `userId` is the current user; create forces owner to self; cannot reassign `userId` to someone else.  

### `GET /api/shops`

**Query:**

| Param | Description |
|-------|-------------|
| `page` | default `1` |
| `limit` | default `10`, max `100` |
| `search` | optional (name, address, phone, email, city, country) |
| `userId` | **staff only** — filter by owner user id |

**200** — `items` (shop + `ownerName` / `ownerEmail` for display), `total`, `page`, `limit`  

### `POST /api/shops`

**Body (JSON):**  
`name`, `address`, `phone` (required) — optional: `userId` (**required** for staff when creating for another user), `email`, `description`, `city`, `country`, `isActive`.  
For `shop_owner`, do not rely on `userId` in body; server sets the owner to the current user.  

**201** — created shop  

### `GET /api/shops/:id` / `PUT` / `DELETE`

**PUT:** partial updates; staff may change `userId`.  

**404/403** — if shop not found or not allowed for this role  

---

## Error codes (common)

| Code | Typical HTTP | Meaning |
|------|--------------|--------|
| `VALIDATION_ERROR` | 400 | Bad or missing body/query |
| `UNAUTHORIZED` | 401 | Invalid login or missing/invalid JWT |
| `WEB_STAFF_ONLY` | 403 | Web login attempted with non-staff user |
| `EMAIL_IN_USE` | 409 | Register duplicate email |
| `CONFIG` | 500 | e.g. DB not configured |
| (controller messages) | 4xx/5xx | Various business rules; `message` explains |

---

## Environment (server)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing/verifying JWTs |
| `NUXT_PUBLIC_APP_DOWNLOAD_URL` | Shown in app-only flows (public, optional) |

---

*Generated from the current `server/api` routes and guards. If you add new handlers, keep this file in sync.*
