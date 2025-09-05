import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Shield,
  Zap,
  Clock,
  ArrowRight
} from "lucide-react";
import heroImage from "@/assets/hero-inventory.jpg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const features = [
  {
    icon: Package,
    title: "Gestão de Produtos",
    description: "Cadastre e organize seus produtos com códigos, categorias e controle de preços."
  },
  {
    icon: Truck,
    title: "Controle de Fornecedores",
    description: "Mantenha dados completos dos seus fornecedores e histórico de compras."
  },
  {
    icon: TrendingUp,
    title: "Entrada de Estoque",
    description: "Registre compras e reposições com controle automático de saldos."
  },
  {
    icon: TrendingDown,
    title: "Saída de Estoque",
    description: "Controle vendas e consumo interno com rastreabilidade completa."
  },
  {
    icon: BarChart3,
    title: "Relatórios Inteligentes",
    description: "Consulte saldos, alertas de estoque baixo e análises detalhadas."
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados protegidos com autenticação e backup automático."
  }
];

const benefits = [
  {
    icon: Zap,
    title: "Aumento da Eficiência",
    description: "Reduza tempo gasto em controles manuais e ganhe produtividade."
  },
  {
    icon: Clock,
    title: "Tempo Real",
    description: "Informações atualizadas instantaneamente para tomadas de decisão rápidas."
  }
];

export const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-elegant">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-primary">StockPro</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-primary">Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-primary lg:text-6xl">
                  Controle Total do Seu 
                  <span className="bg-gradient-primary bg-clip-text text-transparent"> Estoque</span>
                </h1>
                <p className="text-lg text-muted-foreground lg:text-xl">
                  Plataforma profissional para gestão inteligente de inventário. 
                  Controle produtos, fornecedores e movimentações com precisão e facilidade.
                </p>
              </div>
              
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="bg-gradient-primary shadow-elegant hover:shadow-strong transition-all">
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Fazer Login
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <img
                src={heroImage}
                alt="Sistema de Controle de Estoque"
                className="rounded-2xl shadow-strong"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-primary/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todas as ferramentas que você precisa para um controle profissional do seu estoque
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card shadow-card hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-secondary mb-4">
                    <feature.icon className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-primary">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Por que Escolher o StockPro?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transforme a gestão do seu estoque com tecnologia de ponta
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-primary">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-primary-foreground">
              Pronto para Revolucionar Seu Estoque?
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Junte-se a milhares de empresas que já otimizaram sua gestão de inventário
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="shadow-elegant">
                Começar Agora - É Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary">StockPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 StockPro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};