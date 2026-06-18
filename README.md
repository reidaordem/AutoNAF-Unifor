#  NAFAuto

Sistema desenvolvido para automatizar o registro de atendimentos do Núcleo de Apoio Fiscal (NAF), reduzindo o trabalho manual de preenchimento de formulários e facilitando a geração de relatórios.

O projeto integra processamento de planilhas, armazenamento de dados, automação web e geração de documentos em um único fluxo.

---

##  Objetivo

O objetivo do sistema é automatizar atividades repetitivas realizadas pelos integrantes do NAF, permitindo:

- Importação de atendimentos através de planilhas
- Armazenamento estruturado dos dados
- Preenchimento automático de formulários
- Geração de relatórios em PDF
- Consulta e gerenciamento de atendimentos

---

##  Funcionalidades

###  Importação de Dados

- Upload de planilhas Excel
- Leitura e processamento dos registros
- Validação dos dados recebidos

###  Automação de Formulários

- Preenchimento automático de Google Forms
- Processamento em lote de atendimentos
- Automação utilizando Puppeteer

###  Gerenciamento de Atendimentos

- Cadastro e consulta de atendimentos
- Armazenamento em banco de dados MongoDB
- Organização centralizada das informações

###  Relatórios

- Geração automática de relatórios em PDF
- Consolidação dos dados processados

###  Autenticação

- Sistema de login
- Controle de acesso por usuários

---

##  Arquitetura

```text
NAFAuto
│
├── frontend/
│   ├── React
│   ├── Vite
│   └── Axios
│
├── backend/
│   ├── Express
│   ├── MongoDB
│   ├── Mongoose
│   ├── Puppeteer
│   ├── PDFKit
│   └── JWT
│
└── Banco de Dados
    └── MongoDB
```

---

##  Tecnologias Utilizadas

### Frontend

- React
- Vite
- Axios
- XLSX

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Bcrypt

### Automação

- Puppeteer
- Puppeteer Extra
- Puppeteer Stealth Plugin

### Relatórios

- PDFKit

### Controle de Versão

- Git
- GitHub

---

##  Fluxo da Aplicação

1. Usuário realiza login.
2. Planilha de atendimentos é enviada para o sistema.
3. Os dados são processados e armazenados.
4. O sistema executa a automação dos formulários.
5. Os resultados são registrados.
6. Relatórios em PDF podem ser gerados automaticamente.

---

##  Conceitos Aplicados

Durante o desenvolvimento foram aplicados conhecimentos de:

- Desenvolvimento Full Stack
- APIs REST
- Automação Web
- Manipulação de Planilhas
- Persistência de Dados
- MongoDB
- Autenticação JWT
- Arquitetura Cliente-Servidor
- Processamento de Dados
- Geração de Relatórios
- Engenharia de Software

---

##  Contexto

Projeto desenvolvido para apoiar as atividades do Núcleo de Apoio Fiscal (NAF), buscando reduzir atividades repetitivas e aumentar a eficiência operacional através da automação.

---

##  Resultados

- Redução de trabalho manual
- Maior velocidade no processamento de atendimentos
- Menor incidência de erros de preenchimento
- Centralização dos dados
- Geração automatizada de relatórios

---

##  Autor

**Emanuel Alves Melo**

GitHub: https://github.com/reidaordem

LinkedIn: https://www.linkedin.com/
