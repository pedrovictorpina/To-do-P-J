# 📝 To-Do API

API REST para gerenciamento de tarefas com compartilhamento entre usuários.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)

## ✨ Funcionalidades

- 🔐 **Autenticação** - Registro, login e gerenciamento de sessão via Supabase Auth
- ✅ **CRUD de Tarefas** - Criar, listar, atualizar e deletar to-dos
- 👥 **Compartilhamento** - Compartilhe tarefas com outros usuários (view/edit)
- 📄 **Documentação** - Swagger UI integrado em `/api-docs`
- 🔒 **Validação** - Schemas Zod para validação de dados

## 🛠️ Tecnologias

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **Validação:** Zod
- **Docs:** Swagger UI

## 🚀 Como Executar

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
```

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build && npm start
```

Acesse: http://localhost:3000

## 📚 Documentação da API

Acesse a documentação Swagger em: `/api-docs`

### Endpoints Principais

#### 🔐 Autenticação

| Método | Endpoint            | Descrição               |
| ------ | ------------------- | ----------------------- |
| POST   | `/api/auth/signup`  | Registrar usuário       |
| POST   | `/api/auth/signin`  | Login                   |
| POST   | `/api/auth/signout` | Logout                  |
| GET    | `/api/auth/me`      | Dados do usuário logado |
| POST   | `/api/auth/refresh` | Renovar token           |

#### ✅ Tarefas

| Método | Endpoint         | Descrição        |
| ------ | ---------------- | ---------------- |
| GET    | `/api/todos`     | Listar tarefas   |
| POST   | `/api/todos`     | Criar tarefa     |
| GET    | `/api/todos/:id` | Buscar tarefa    |
| PUT    | `/api/todos/:id` | Atualizar tarefa |
| DELETE | `/api/todos/:id` | Deletar tarefa   |

#### 👥 Compartilhamento

| Método | Endpoint                        | Descrição                     |
| ------ | ------------------------------- | ----------------------------- |
| GET    | `/api/todos/shared`             | Tarefas compartilhadas comigo |
| GET    | `/api/todos/:id/share`          | Listar compartilhamentos      |
| POST   | `/api/todos/:id/share`          | Compartilhar tarefa           |
| PATCH  | `/api/todos/:id/share/:shareId` | Atualizar permissão           |
| DELETE | `/api/todos/:id/share/:shareId` | Remover compartilhamento      |

## 🗄️ Schema do Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Tabela de perfis de usuário
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

-- Índices para performance
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todo_shares_shared_with ON todo_shares(shared_with_id);
CREATE INDEX idx_todo_shares_todo_id ON todo_shares(todo_id);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_shares ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
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

## 📦 Deploy na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pedrovictorpina/To-do-P-J)

1. Clique no botão acima ou importe diretamente no Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy! 🚀

## 📄 Licença

MIT © [Pedro Victor Pina](https://github.com/pedrovictorpina)
