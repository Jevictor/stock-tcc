import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<'products'>;
type StockMovement = Tables<'stock_movements'> & {
  products?: { name: string } | null;
  suppliers?: { name: string } | null;
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeSuppliers: 0,
    stockValue: 0,
    lowStockAlerts: 0
  });
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id);

      if (productsError) throw productsError;

      // Load suppliers
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id);

      if (suppliersError) throw suppliersError;

      // Load recent stock movements
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products:product_id (name),
          suppliers:supplier_id (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (movementsError) throw movementsError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      const activeSuppliers = suppliers?.length || 0;
      const stockValue = products?.reduce((sum, product) => {
        const currentStock = product.current_stock || 0;
        const salePrice = product.sale_price || 0;
        return sum + (currentStock * salePrice);
      }, 0) || 0;

      // Find low stock products
      const lowStock = products?.filter(product => {
        const currentStock = product.current_stock || 0;
        const minStock = product.min_stock || 0;
        return currentStock <= minStock;
      }) || [];

      setStats({
        totalProducts,
        activeSuppliers,
        stockValue,
        lowStockAlerts: lowStock.length
      });

      setRecentMovements(movements || []);
      setLowStockProducts(lowStock.slice(0, 4));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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
          <Card className="shadow-card hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </CardTitle>
              <Package className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Produtos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fornecedores Ativos
              </CardTitle>
              <Truck className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeSuppliers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Fornecedores cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor do Estoque
              </CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.stockValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor total em estoque
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas de Estoque
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.lowStockAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Produtos com estoque baixo
              </p>
            </CardContent>
          </Card>
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
                {recentMovements.length > 0 ? (
                  recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          movement.movement_type === 'in' 
                            ? 'bg-success/20 text-success' 
                            : 'bg-warning/20 text-warning'
                        }`}>
                          {movement.movement_type === 'in' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-primary">{movement.products?.name || 'Produto não encontrado'}</p>
                          <p className="text-sm text-muted-foreground">
                            {movement.suppliers?.name || movement.reason || 'Sem fornecedor'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">{movement.quantity}</p>
                        <p className="text-sm text-muted-foreground">
                          {movement.movement_date ? new Date(movement.movement_date).toLocaleDateString('pt-BR') : 'Data não disponível'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma movimentação encontrada
                  </p>
                )}
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
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-primary">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Estoque mínimo: {product.min_stock || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">
                          {product.current_stock || 0}
                        </p>
                        <div className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                          Crítico
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Todos os produtos estão com estoque adequado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};