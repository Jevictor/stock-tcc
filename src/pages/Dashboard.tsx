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
  const [products, setProducts] = useState<Product[]>([]);

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
      
      setProducts(products || []);

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

      // Find low stock products (current stock less than minimum but not zero)
      const lowStock = products?.filter(product => {
        const currentStock = product.current_stock || 0;
        const minStock = product.min_stock || 0;
        return currentStock > 0 && currentStock < minStock && minStock > 0;
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
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Visão geral do seu controle de estoque
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid gap-4 lg:grid-cols-3">
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
                  <div key={movement.id} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                      <div className={`p-2 rounded-full shrink-0 ${
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
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary truncate">{movement.products?.name || 'Produto não encontrado'}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {movement.suppliers?.name || movement.reason || 'Sem fornecedor'}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-medium text-primary text-sm">{movement.quantity}</span>
                          <span className="text-xs text-muted-foreground">
                            {movement.movement_date ? new Date(movement.movement_date).toLocaleDateString('pt-BR') : 'Data não disponível'}
                          </span>
                        </div>
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
                Estoque Baixo
              </CardTitle>
              <CardDescription>
                Produtos que precisam de reposição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Estoque atual: {product.current_stock || 0} {product.unit_measure}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Mínimo: {product.min_stock || 0} {product.unit_measure}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning whitespace-nowrap">
                          Baixo
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum produto com estoque baixo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock Alerts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Package className="h-5 w-5 text-destructive" />
                Sem Estoque
              </CardTitle>
              <CardDescription>
                Produtos que acabaram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products?.filter(product => (product.current_stock || 0) === 0).slice(0, 4).length > 0 ? (
                  products?.filter(product => (product.current_stock || 0) === 0).slice(0, 4).map((product) => (
                    <div key={product.id} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Código: {product.code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Unidade: {product.unit_measure}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-destructive">
                          0
                        </p>
                        <div className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive whitespace-nowrap">
                          Acabou
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum produto sem estoque
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