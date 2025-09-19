# Sistema de Controle de Estoque

Um sistema completo de gestão de estoque desenvolvido com tecnologias modernas, permitindo controle eficiente de produtos, fornecedores, clientes e movimentações de estoque.

## 📋 Sobre o Projeto

O Sistema de Controle de Estoque é uma aplicação web completa que oferece:

- **Dashboard intuitivo** com indicadores em tempo real
- **Gestão de produtos** com controle de estoque mínimo/máximo
- **Controle de movimentações** (entradas e saídas)
- **Gestão de fornecedores e clientes**
- **Relatórios de estoque** com filtros avançados
- **Alertas de estoque baixo** automáticos
- **Sistema de autenticação** seguro
- **Interface responsiva** para desktop e mobile

### Funcionalidades Principais

#### 🏠 Dashboard
- Visão geral dos indicadores de estoque
- Total de produtos cadastrados
- Valor total do estoque (custo e venda)
- Alertas de produtos com estoque baixo
- Movimentações recentes
- Lista de produtos sem estoque

#### 📦 Gestão de Produtos
- Cadastro completo com código, nome, descrição
- Categorização de produtos
- Controle de preços (custo e venda)
- Definição de estoque mínimo e máximo
- Unidades de medida personalizáveis

#### 📊 Controle de Estoque
- **Entrada de produtos**: Compras de fornecedores
- **Saída de produtos**: Vendas, perdas, devoluções, transferências, uso interno, descarte
- Histórico completo de movimentações
- Atualização automática do estoque atual

#### 📈 Relatórios
- Consulta de produtos com filtros avançados
- Consulta de movimentações por tipo, fornecedor, cliente
- Histórico de movimentações por produto
- Filtros por período, fornecedor e tipo de movimento

#### 👥 Gestão de Relacionamentos
- **Fornecedores**: Cadastro completo com dados fiscais
- **Clientes**: Gestão de clientes com informações de contato
- **Categorias**: Organização dos produtos por categorias

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca para interface de usuário
- **TypeScript** - Linguagem com tipagem estática
- **Vite** - Build tool e servidor de desenvolvimento
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de interface reutilizáveis
- **React Router** - Roteamento de páginas
- **React Query** - Gerenciamento de estado servidor
- **Lucide React** - Ícones modernos

### Backend & Banco de Dados
- **Supabase** - Backend como serviço (BaaS)
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança em nível de linha
- **Real-time subscriptions** - Atualizações em tempo real

### Autenticação & Segurança
- **Supabase Auth** - Autenticação completa
- **JWT Tokens** - Tokens de autenticação seguros
- **RLS Policies** - Políticas de segurança no banco

## 🚀 Como Executar o Projeto

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- Conta no **Supabase**

### 1. Clone o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd sistema-controle-estoque
```

### 2. Instale as Dependências

```bash
npm install
# ou
yarn install
```

### 3. Configuração do Supabase

#### 3.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha:
   - **Nome do projeto**: sistema-controle-estoque
   - **Senha do banco**: (crie uma senha forte)
   - **Região**: South America (São Paulo) - ou a mais próxima
6. Aguarde a criação do projeto

#### 3.2. Obter Credenciais

No painel do Supabase, vá em **Settings > API** e copie:
- **Project URL**
- **anon public key**

#### 3.3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_project_url_aqui
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=seu_project_id_aqui
```

### 4. Configuração do Banco de Dados

Execute os seguintes comandos SQL no **SQL Editor** do Supabase (Settings > SQL Editor):

#### 4.1. Tabela de Perfis

```sql
-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);
```

#### 4.2. Tabela de Categorias

```sql
-- Criar tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Users can manage their own categories" 
ON public.categories FOR ALL 
USING (auth.uid() = user_id);
```

#### 4.3. Tabela de Produtos

```sql
-- Criar tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID,
  unit_measure TEXT NOT NULL,
  cost_price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Users can manage their own products" 
ON public.products FOR ALL 
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_code ON public.products(code);
CREATE INDEX idx_products_category_id ON public.products(category_id);
```

#### 4.4. Tabela de Fornecedores

```sql
-- Criar tabela de fornecedores
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cnpj_cpf TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Users can manage their own suppliers" 
ON public.suppliers FOR ALL 
USING (auth.uid() = user_id);
```

#### 4.5. Tabela de Clientes

```sql
-- Criar tabela de clientes
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Users can manage their own customers" 
ON public.customers FOR ALL 
USING (auth.uid() = user_id);
```

#### 4.6. Tabela de Movimentações de Estoque

```sql
-- Criar tabela de movimentações de estoque
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  supplier_id UUID,
  customer_id UUID,
  movement_type TEXT NOT NULL, -- 'in' ou 'out'
  quantity INTEGER NOT NULL,
  unit_price NUMERIC,
  total_value NUMERIC,
  reason TEXT, -- motivo da movimentação
  notes TEXT,
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Users can manage their own stock movements" 
ON public.stock_movements FOR ALL 
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(movement_date);
```

#### 4.7. Funções e Triggers

```sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.products 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE public.products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar estoque automaticamente
CREATE TRIGGER update_stock_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 5. Configuração de Autenticação

No painel do Supabase, vá em **Authentication > Settings**:

1. **Site URL**: `http://localhost:8080`
2. **Redirect URLs**: 
   - `http://localhost:8080/**`
   - `https://seu-dominio.com/**` (para produção)

### 6. Executar o Projeto

```bash
npm run dev
# ou
yarn dev
```

O projeto estará disponível em: `http://localhost:8080`

## 📱 Como Usar o Sistema

### 1. Primeiro Acesso

1. Acesse `http://localhost:8080`
2. Clique em "Criar Conta"
3. Preencha seus dados e confirme o e-mail
4. Faça login no sistema

### 2. Configuração Inicial

1. **Categorias**: Cadastre as categorias dos seus produtos
2. **Fornecedores**: Adicione os fornecedores
3. **Produtos**: Cadastre seus produtos
4. **Clientes**: Registre seus clientes (se necessário)

### 3. Operações do Dia a Dia

#### Entrada de Produtos
1. Vá em "Entrada de Estoque"
2. Selecione o produto e fornecedor
3. Informe quantidade e preço
4. Confirme a entrada

#### Saída de Produtos
1. Vá em "Saída de Estoque"
2. Selecione o produto
3. Escolha o motivo (venda, perda, etc.)
4. Se for venda, selecione o cliente
5. Informe a quantidade
6. Confirme a saída

#### Consultar Estoque
1. Vá em "Consulta Estoque"
2. Use os filtros para encontrar informações específicas
3. Visualize o histórico de movimentações

## 🔧 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Componentes de layout
│   └── ui/             # Componentes de interface
├── hooks/              # Hooks customizados
├── integrations/       # Integrações externas
│   └── supabase/      # Configuração do Supabase
├── lib/               # Utilitários e helpers
├── pages/             # Páginas da aplicação
└── assets/            # Arquivos estáticos
```

## 🚀 Deploy para Produção

### 1. Build da Aplicação

```bash
npm run build
# ou
yarn build
```

### 2. Configurar Domínio no Supabase

No painel do Supabase, atualize:
- **Site URL**: `https://seu-dominio.com`
- **Redirect URLs**: `https://seu-dominio.com/**`

### 3. Deploy

O projeto pode ser hospedado em:
- **Vercel** (recomendado para projetos React)
- **Netlify**
- **Railway**
- Qualquer hosting que suporte aplicações Node.js

## 🔐 Segurança

O sistema implementa várias camadas de segurança:

- **Autenticação JWT** via Supabase Auth
- **Row Level Security (RLS)** no PostgreSQL
- **Políticas de acesso** granulares por usuário
- **Validação de dados** no frontend e backend
- **HTTPS** obrigatório em produção

## 📚 Recursos Adicionais

### Documentação das Tecnologias
- [React](https://reactjs.org/docs/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase](https://supabase.com/docs)
- [Vite](https://vitejs.dev/guide/)

### Suporte
- Crie issues no repositório para reportar bugs
- Consulte a documentação do Supabase para questões de backend
- Use o console do navegador para debug do frontend