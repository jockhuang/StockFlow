# API Bruno Files

Bruno requests for the backend are stored in [doc/bruno](/Users/jock/Projects/warehouse/doc/bruno).

## Included requests

- `/actuator/health`
- `/actuator/info`
- `/api/auth/me`
- `/api/system/summary`
- `/api/inventory-items` `GET/POST/PUT/DELETE`
- `/api/categories` `GET/POST/PUT/DELETE`
- `/api/categories/options` `GET`
- `/api/users` `GET/POST/PUT/DELETE`
- `/api/roles` `GET/POST/PUT/DELETE`
- `/api/roles/options` `GET`
- `/api/resources` `GET/POST/PUT/DELETE`
- `/api/resources/options` `GET`

## Usage

1. Open the folder `/Users/jock/Projects/warehouse/doc/bruno` in Bruno.
2. Select the `local` environment.
3. Adjust `baseUrl`, `username`, and `password` in [local.bru](/Users/jock/Projects/warehouse/doc/bruno/environments/local.bru) if needed.

Secured API requests use Basic Auth with the environment variables.
