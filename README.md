# 📝 To-Do API

API REST para gerenciamento de tarefas com compartilhamento entre usuários.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

## ✨ Funcionalidades

- 🔐 **Autenticação completa** - Registro, login, logout e refresh de tokens
- ✅ **CRUD de Tarefas** - Criar, listar, atualizar e deletar to-dos
- 👥 **Compartilhamento** - Compartilhe tarefas com permissões (view/edit)
- 📄 **Documentação Swagger** - Interface interativa em `/api-docs`
- 🔒 **Validação** - Schemas Zod para validação de dados
- � **Paginação e Filtros** - API otimizada para aplicações

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/pedrovictorpina/To-do-P-J.git
cd To-do-P-J

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

---

## 📚 Documentação da API

### 🌐 Swagger UI

Acesse a documentação interativa em: **`/api-docs`**

### 🔐 Autenticação

Todas as rotas (exceto signup/signin) requerem autenticação via cookie de sessão.

| Método | Endpoint            | Descrição        |
| ------ | ------------------- | ---------------- |
| `POST` | `/api/auth/signup`  | Criar conta      |
| `POST` | `/api/auth/signin`  | Fazer login      |
| `POST` | `/api/auth/signout` | Fazer logout     |
| `GET`  | `/api/auth/me`      | Dados do usuário |
| `POST` | `/api/auth/refresh` | Renovar token    |

#### Exemplo: Criar conta

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "name": "João Silva"
  }'
```

**Resposta (201):**

```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com"
  }
}
```

#### Exemplo: Login

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

---

### ✅ Tarefas

| Método   | Endpoint         | Descrição        |
| -------- | ---------------- | ---------------- |
| `GET`    | `/api/todos`     | Listar tarefas   |
| `POST`   | `/api/todos`     | Criar tarefa     |
| `GET`    | `/api/todos/:id` | Buscar tarefa    |
| `PUT`    | `/api/todos/:id` | Atualizar tarefa |
| `DELETE` | `/api/todos/:id` | Deletar tarefa   |

#### Query Parameters (GET /api/todos)

| Param       | Tipo    | Descrição                                |
| ----------- | ------- | ---------------------------------------- |
| `page`      | number  | Página (default: 1)                      |
| `limit`     | number  | Itens por página (default: 10, max: 100) |
| `completed` | boolean | Filtrar por status                       |
| `priority`  | string  | Filtrar por prioridade (low/medium/high) |

#### Exemplo: Criar tarefa

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Estudar Next.js",
    "description": "Criar API REST com documentação",
    "priority": "high",
    "due_date": "2025-01-20T10:00:00Z"
  }'
```

**Resposta (201):**

```json
{
  "data": {
    "id": "uuid-da-tarefa",
    "user_id": "uuid-do-usuario",
    "title": "Estudar Next.js",
    "description": "Criar API REST com documentação",
    "completed": false,
    "priority": "high",
    "due_date": "2025-01-20T10:00:00Z",
    "created_at": "2025-01-13T15:00:00Z",
    "updated_at": "2025-01-13T15:00:00Z"
  }
}
```

#### Exemplo: Listar tarefas com filtros

```bash
curl "http://localhost:3000/api/todos?page=1&limit=10&priority=high&completed=false" \
  -b cookies.txt
```

---

### 👥 Compartilhamento

| Método   | Endpoint                        | Descrição                     |
| -------- | ------------------------------- | ----------------------------- |
| `GET`    | `/api/todos/shared`             | Tarefas compartilhadas comigo |
| `GET`    | `/api/todos/:id/share`          | Listar compartilhamentos      |
| `POST`   | `/api/todos/:id/share`          | Compartilhar tarefa           |
| `PATCH`  | `/api/todos/:id/share/:shareId` | Atualizar permissão           |
| `DELETE` | `/api/todos/:id/share/:shareId` | Remover compartilhamento      |

#### Exemplo: Compartilhar tarefa

```bash
curl -X POST http://localhost:3000/api/todos/{id}/share \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "colega@exemplo.com",
    "permission": "edit"
  }'
```

**Permissões:**

- `view` - Apenas visualizar
- `edit` - Visualizar e editar

---

## 🗄️ Configuração do Banco de Dados

Execute o SQL abaixo no **Supabase SQL Editor**:

```sql
-- Tabela de perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de compartilhamentos
CREATE TABLE todo_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID REFERENCES todos ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  shared_with_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  permission TEXT CHECK (permission IN ('view', 'edit')) DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, shared_with_id)
);

-- Índices
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todo_shares_shared_with ON todo_shares(shared_with_id);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_shares ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON todos FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view shares" ON todo_shares FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);
CREATE POLICY "Owners can manage shares" ON todo_shares FOR ALL USING (auth.uid() = owner_id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 📦 Deploy na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pedrovictorpina/To-do-P-J)

### Passos:

1. Clique no botão acima ou importe via [vercel.com/new](https://vercel.com/new)
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy! 🚀

---

## 🛠️ Tecnologias

| Tecnologia                                    | Uso                            |
| --------------------------------------------- | ------------------------------ |
| [Next.js 15](https://nextjs.org/)             | Framework React com App Router |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática               |
| [Supabase](https://supabase.com/)             | Auth + PostgreSQL              |
| [Zod](https://zod.dev/)                       | Validação de schemas           |
| [Swagger UI](https://swagger.io/)             | Documentação interativa        |

---

## 📄 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Rotas de autenticação
│   │   ├── todos/         # Rotas de tarefas
│   │   └── docs/          # OpenAPI spec
│   └── api-docs/          # Swagger UI
├── lib/
│   ├── supabase/          # Clientes Supabase
│   └── validations/       # Schemas Zod
├── types/                 # Types TypeScript
└── middleware.ts          # Middleware de sessão
```

---

## 📄 Licença

MIT © [Pedro Victor Pina](https://github.com/pedrovictorpina)
