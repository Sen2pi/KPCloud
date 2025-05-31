# Arquitetura do Sistema

## Visão Geral
O sistema é composto por uma arquitetura cliente-servidor, com backend em Node.js e frontend em React. Utiliza MongoDB para armazenamento de dados, e sistema de armazenamento local ou em cloud.

## Diagrama de Componentes
```mermaid
graph TD
    A[Usuário] -->|Acesso via navegador| B[Frontend React]
    B -->|Requisições API| C[Backend Node.js]
    C -->|Dados| D[MongoDB]
    C -->|Armazenamento de ficheiros| E[Sistema de ficheiros local/cloud]
    D -->|Dados persistentes| D

