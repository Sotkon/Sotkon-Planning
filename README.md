@"
# 🚀 Planning App - Sistema de Gestão de Cargas

Sistema web moderno para gestão de cargas e planeamento logístico, desenvolvido com Next.js 15, TypeScript, Prisma ORM e SQL Server.

---

## 📋 **Índice**

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Deploy em Produção](#deploy-em-produção)
- [Troubleshooting](#troubleshooting)

---

## ✨ **Características**

- ✅ **Autenticação** - Sistema de login seguro com NextAuth.js
- ✅ **Dashboard** - Visão geral de estatísticas e acesso rápido
- ✅ **Gestão de Cargas** - CRUD completo (Create, Read, Update, Delete)
- ✅ **Filtros Avançados** - Por data, país, estado e pesquisa texto
- ✅ **Paginação** - Navegação eficiente entre registos
- ✅ **Export Excel** - Exportar lista filtrada para Excel (.xlsx)
- ✅ **Integração Primavera ERP** - Import automático de cargas
- ✅ **Multi-idioma base** - Preparado para PT, EN, FR, ES
- ✅ **Responsive** - Funciona em desktop, tablet e mobile

---

## 🔧 **Requisitos**

### **Sistema:**
- Windows Server 2016+ ou Windows 10/11
- SQL Server 2016+ (instância PLANNING)
- Node.js 18.x ou superior
- npm 9.x ou superior

### **Base de Dados:**
- SQL Server instância: \`localhost\PLANNING\` (porta 1433)
- Database: \`PlanningDB\`
- Autenticação: SQL Server Authentication
- User: \`sa\`
- Password: (configurar no .env)

---

## 📦 **Instalação**

### **1. Clonar Repositório:**

\`\`\`powershell
cd C:\Apps
git clone <URL_DO_REPOSITORIO> Sotkon-Planning
cd Sotkon-Planning
\`\`\`

### **2. Instalar Dependências:**

\`\`\`powershell
npm install
\`\`\`

### **3. Configurar Ambiente:**

Criar ficheiro \`.env\` na raiz do projeto:

\`\`\`env
# Database
DATABASE_URL=sqlserver://localhost:1433;database=PlanningDB;user=sa;password=SUA_PASSWORD_AQUI;trustServerCertificate=true

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=GERAR_STRING_ALEATORIA_32_CARACTERES_MINIMO

# Node
NODE_ENV=development
\`\`\`

**⚠️ IMPORTANTE:** Gerar \`NEXTAUTH_SECRET\` seguro:

\`\`\`powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))
\`\`\`

### **4. Gerar Prisma Client:**

\`\`\`powershell
npx prisma generate
\`\`\`

### **5. Verificar Ligação Base de Dados:**

\`\`\`powershell
npx prisma db pull
\`\`\`

---

## 🎯 **Scripts Disponíveis**

### **🔥 Desenvolvimento (Hot-Reload)**

\`\`\`powershell
.\dev.ps1
\`\`\`

**ou**

\`\`\`powershell
npm run dev
\`\`\`

- Inicia servidor desenvolvimento em \`http://localhost:3000\`
- Hot-reload automático ao alterar ficheiros
- Ideal para desenvolvimento e testes rápidos

---

### **🧪 Testar Build Produção**

\`\`\`powershell
.\test-prod.ps1
\`\`\`

- Gera Prisma Client
- Faz build optimizado Next.js
- Inicia servidor produção localmente
- Usa \`npm start\` (não standalone)
- **Use antes de fazer deploy para validar build**

---

### **🚀 Deploy Standalone (Produção)**

\`\`\`powershell
.\deploy.ps1
\`\`\`

**Passos executados:**
1. ✅ Gera Prisma Client
2. ✅ Build Next.js optimizado
3. ✅ Copia \`.env\` para standalone
4. ✅ Copia static assets (\`.next/static\`)
5. ✅ Copia public folder
6. ✅ Copia Prisma Client

**Output:** \`.next\standalone\` pronto para produção!

---

## ⚙️ **Configuração**

### **Variáveis de Ambiente (.env)**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| \`DATABASE_URL\` | Connection string SQL Server | \`sqlserver://localhost:1433;database=PlanningDB;user=sa;password=xxx;trustServerCertificate=true\` |
| \`NEXTAUTH_URL\` | URL base aplicação | \`http://localhost:3000\` ou \`https://planning.empresa.pt\` |
| \`NEXTAUTH_SECRET\` | Secret para encriptação JWT (min 32 chars) | \`abc123def456...\` |
| \`NODE_ENV\` | Ambiente | \`development\` ou \`production\` |

### **Portas:**
- **3000** - Aplicação web (padrão Next.js)
- **1433** - SQL Server (instância PLANNING)

---

## 📁 **Estrutura do Projeto**

\`\`\`
C:\Apps\Sotkon-Planning\
│
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Rotas protegidas
│   │   ├── cargas/               # Gestão de cargas
│   │   │   ├── page.tsx          # Lista cargas
│   │   │   └── novo/
│   │   │       └── page.tsx      # Criar/Editar carga
│   │   ├── dashboard/            # Home dashboard
│   │   └── layout.tsx            # Layout com Navbar
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth
│   │   ├── cargas/               # CRUD + Export + Primavera
│   │   ├── countries/            # Países
│   │   ├── estados/              # Estados
│   │   └── servicos/             # Serviços
│   │
│   ├── login/                    # Página login
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Estilos globais
│
├── components/                   # Componentes React
│   ├── cargas/                   # Componentes cargas
│   └── ui/                       # Componentes UI genéricos
│
├── lib/                          # Utilitários
│   ├── auth.ts                   # NextAuth config
│   └── prisma.ts                 # Prisma Client
│
├── prisma/                       # Prisma ORM
│   └── schema.prisma             # Schema base de dados
│
├── public/                       # Assets estáticos
│
├── .next/                        # Build output (ignorar)
│   └── standalone/               # Build produção standalone
│
├── .env                          # Variáveis ambiente (NÃO commit!)
├── .gitignore                    # Git ignore
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── next.config.js                # Next.js config
│
├── dev.ps1                       # Script desenvolvimento
├── test-prod.ps1                 # Script testar produção
├── deploy.ps1                    # Script deploy standalone
│
└── README.md                     # Este ficheiro
\`\`\`

---

## 🚀 **Deploy em Produção**

### **Método 1: NSSM (Windows Service) - Recomendado**

#### **1. Deploy standalone:**

\`\`\`powershell
.\deploy.ps1
\`\`\`

#### **2. Download NSSM:**

\`\`\`powershell
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "\$env:TEMP\nssm.zip"
Expand-Archive -Path "\$env:TEMP\nssm.zip" -DestinationPath "\$env:TEMP\nssm" -Force
Copy-Item "\$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" "C:\Apps\nssm.exe"
\`\`\`

#### **3. Instalar serviço:**

\`\`\`powershell
C:\Apps\nssm.exe install PlanningApp "C:\Program Files\nodejs\node.exe" "C:\Apps\Sotkon-Planning\.next\standalone\server.js"
\`\`\`

#### **4. Configurar variáveis ambiente:**

\`\`\`powershell
C:\Apps\nssm.exe set PlanningApp AppDirectory "C:\Apps\Sotkon-Planning\.next\standalone"
C:\Apps\nssm.exe set PlanningApp AppEnvironmentExtra DATABASE_URL=sqlserver://localhost:1433;database=PlanningDB;user=sa;password=admin123;trustServerCertificate=true NEXTAUTH_URL=http://localhost:3000 NEXTAUTH_SECRET=SEU_SECRET_AQUI NODE_ENV=production
\`\`\`

#### **5. Iniciar serviço:**

\`\`\`powershell
C:\Apps\nssm.exe start PlanningApp
\`\`\`

#### **Gestão do serviço:**

\`\`\`powershell
# Ver status
C:\Apps\nssm.exe status PlanningApp

# Parar
C:\Apps\nssm.exe stop PlanningApp

# Restart
C:\Apps\nssm.exe restart PlanningApp

# Remover serviço
C:\Apps\nssm.exe remove PlanningApp confirm
\`\`\`

---

### **🔧 Gestão do Serviço Windows**

Após configurar NSSM, usa o script `manage-service.ps1`:
```powershell
# Ver status
.\manage-service.ps1 status

# Iniciar serviço
.\manage-service.ps1 start

# Parar serviço
.\manage-service.ps1 stop

# Restart serviço
.\manage-service.ps1 restart

# Ver logs (últimas 30 linhas)
.\manage-service.ps1 logs

# Editar configuração (GUI)
.\manage-service.ps1 edit
```

**Logs do serviço:**

- **Output:** `C:\Apps\Sotkon-Planning\logs\output.log`
- **Errors:** `C:\Apps\Sotkon-Planning\logs\error.log`
```powershell
# Ver logs em tempo real
Get-Content C:\Apps\Sotkon-Planning\logs\output.log -Wait -Tail 20
```
---

### **Método 2: Cloudflare Tunnel (Acesso Externo)**

Para acesso via internet com HTTPS:

#### **1. Instalar Cloudflared:**

\`\`\`powershell
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "C:\cloudflared\cloudflared.exe"
\`\`\`

#### **2. Autenticar:**

\`\`\`powershell
C:\cloudflared\cloudflared.exe tunnel login
\`\`\`

#### **3. Criar tunnel:**

\`\`\`powershell
C:\cloudflared\cloudflared.exe tunnel create planning-app
\`\`\`

#### **4. Configurar (\`C:\cloudflared\config.yml\`):**

\`\`\`yaml
tunnel: <TUNNEL-ID>
credentials-file: C:\Users\Administrator\.cloudflared\<TUNNEL-ID>.json

ingress:
  - hostname: planning.empresa.pt
    service: http://localhost:3000
  - service: http_status:404
\`\`\`

#### **5. Criar DNS record:**

\`\`\`powershell
C:\cloudflared\cloudflared.exe tunnel route dns planning-app planning.empresa.pt
\`\`\`

#### **6. Instalar como serviço:**

\`\`\`powershell
C:\cloudflared\cloudflared.exe service install
Start-Service cloudflared
\`\`\`

---

## 🐛 **Troubleshooting**

### **Problema: Prisma não liga à BD**

\`\`\`powershell
# Testar ligação
sqlcmd -S localhost\PLANNING -U sa -P admin123 -Q "SELECT 1"

# Regenerar Prisma Client
Remove-Item -Recurse -Force node_modules\.prisma
npx prisma generate
\`\`\`

---

### **Problema: Build falha**

\`\`\`powershell
# Limpar cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules

# Reinstalar
npm install
npm run build
\`\`\`

---

### **Problema: Chunks JS 404 (ChunkLoadError)**

\`\`\`powershell
# Copiar static assets
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
Copy-Item -Recurse -Force public .next\standalone\public
\`\`\`

---

### **Problema: JWT_SESSION_ERROR (NextAuth)**

- Limpar cookies do browser (F12 → Application → Cookies → Clear)
- Verificar \`NEXTAUTH_SECRET\` é o mesmo entre desenvolvimento e produção
- Testar em modo incógnito

---

### **Problema: Porta 3000 já em uso**

\`\`\`powershell
# Ver processo na porta 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Get-Process -Id <PROCESS_ID>

# Matar processo
Stop-Process -Id <PROCESS_ID> -Force
\`\`\`

---

## 📊 **Tecnologias Utilizadas**

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 15.5.4 | Framework React (SSR, API Routes) |
| React | 18.x | UI Library |
| TypeScript | 5.x | Type safety |
| Prisma ORM | 6.17.1 | Database ORM |
| NextAuth.js | Latest | Autenticação |
| Tailwind CSS | 3.x | Styling |
| React Query | Latest | Data fetching/caching |
| ExcelJS | Latest | Export Excel |
| Lucide React | Latest | Ícones |
| SQL Server | 2016+ | Base de dados |

---

## 📝 **Notas de Desenvolvimento**

### **Alterar Schema BD:**

\`\`\`powershell
# 1. Editar prisma/schema.prisma
# 2. Pull schema da BD
npx prisma db pull

# 3. Gerar client
npx prisma generate

# 4. (Opcional) Push alterações para BD
npx prisma db push
\`\`\`

### **Adicionar Nova API Route:**

1. Criar ficheiro em \`app/api/<nome>/route.ts\`
2. Exportar funções \`GET\`, \`POST\`, \`PUT\`, \`DELETE\`
3. Usar Prisma Client para queries

### **Adicionar Nova Página:**

1. Criar ficheiro em \`app/(dashboard)/<nome>/page.tsx\`
2. Adicionar link na Navbar (\`components/Navbar.tsx\`)

---


## 🔄 **Workflow Git**

\`\`\`powershell
# Desenvolvimento
git checkout -b feature/nova-funcionalidade
# ... fazer alterações ...
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade

# Pull Request → Review → Merge → Deploy
\`\`\`

---
