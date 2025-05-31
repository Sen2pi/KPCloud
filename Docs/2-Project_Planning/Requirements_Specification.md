# Especificação de Requisitos

## Funcionais
- Upload de ficheiros com estrutura de pastas
- Download de ficheiros
- Partilha de ficheiros via links
- Gestão de utilizadores (criação, edição, eliminação)
- Configuração de armazenamento
- Gestão de permissões (admin, utilizador)
- Interface responsiva

## Não Funcionais
- Segurança (autenticação JWT, SSL)
- Performance (resposta em < 2s)
- Escalabilidade
- Usabilidade

## Requisitos Técnicos
- Backend: Node.js, Express, MongoDB
- Frontend: React, Material-UI
- Autenticação: JWT
- API: RESTful
- Armazenamento: Sistema de ficheiros local ou cloud (S3, etc.)

## Restrições
- Compatibilidade com navegadores modernos
- Limite de tamanho de ficheiro: 50MB
- Sistema operativos suportados: Windows, Linux, MacOS
