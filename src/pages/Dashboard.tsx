import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";

const stats = [
  {
    title: "Total de Produtos",
    value: "1,234",
    description: "+20% desde o mês passado",
    icon: Package,
    color: "text-accent"
  },
  {
    title: "Fornecedores Ativos",
    value: "89",
    description: "+5 novos este mês",
    icon: Truck,
    color: "text-success"
  },
  {
    title: "Valor do Estoque",
    value: "R$ 456.789",
    description: "+12% de valorização",
    icon: DollarSign,
    color: "text-primary"
  },
  {
    title: "Alertas de Estoque",
    value: "23",
    description: "Produtos com estoque baixo",
    icon: AlertTriangle,
    color: "text-warning"
  }
];

const recentMovements = [
  {
    type: "entrada",
    product: "Mouse Gamer RGB",
    quantity: 50,
    date: "2024-01-15",
    supplier: "TechParts Ltda"
  },
  {
    type: "saida",
    product: "Teclado Mecânico",
    quantity: 12,
    date: "2024-01-14",
    supplier: "Venda - Cliente XYZ"
  },
  {
    type: "entrada",
    product: "Monitor 24\"",
    quantity: 25,
    date: "2024-01-14",
    supplier: "Displays Pro"
  },
  {
    type: "saida",
    product: "Headset Wireless",
    quantity: 8,
    date: "2024-01-13",
    supplier: "Uso Interno"
  }
];

const lowStockProducts = [
  { name: "Cabo USB-C", current: 5, minimum: 20, status: "critical" },
  { name: "Adaptador HDMI", current: 12, minimum: 15, status: "warning" },
  { name: "Carregador Universal", current: 8, minimum: 25, status: "critical" },
  { name: "Mouse Pad", current: 18, minimum: 20, status: "warning" }
];

export const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu controle de estoque
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Movements */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Movimentações Recentes
              </CardTitle>
              <CardDescription>
                Últimas entradas e saídas do estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMovements.map((movement, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        movement.type === 'entrada' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {movement.type === 'entrada' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-primary">{movement.product}</p>
                        <p className="text-sm text-muted-foreground">{movement.supplier}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">{movement.quantity}</p>
                      <p className="text-sm text-muted-foreground">{movement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas de Estoque Baixo
              </CardTitle>
              <CardDescription>
                Produtos que precisam de reposição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-primary">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Estoque mínimo: {product.minimum}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        product.status === 'critical' ? 'text-destructive' : 'text-warning'
                      }`}>
                        {product.current}
                      </p>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        product.status === 'critical' 
                          ? 'bg-destructive/20 text-destructive' 
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {product.status === 'critical' ? 'Crítico' : 'Atenção'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};