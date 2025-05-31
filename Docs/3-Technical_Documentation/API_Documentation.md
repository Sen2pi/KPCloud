# Documentação da API

## Autenticação
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

## Gestão de ficheiros
- GET /api/files
- POST /api/files/upload
- GET /api/files/:id/download
- DELETE /api/files/:id

## Gestão de pastas
- GET /api/folders
- POST /api/folders/create
- DELETE /api/folders/:id

## Configurações
- GET /api/settings
- PUT /api/settings
- POST /api/settings/api/test
- POST /api/settings/storage/validate
- GET /api/settings/storage/stats

## Utilizadores
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/profile-picture
- PUT /api/users/change-password
