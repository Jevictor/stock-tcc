import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, BarChart3, AlertTriangle, Package, Filter, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Product = Tables<'products'> & {
  categories?: { name: string } | null;
  averageEntryPrice?: number;
  lastEntryPrice?: number;
  lastMovementDate?: string | null;
  entriesCount?: number;
};

type Category = Tables<'categories'>;
type Supplier = Tables<'suppliers'>;

export const StockReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);

      // Load products with categories
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name)
        `)
        .eq('user_id', user?.id);

      if (productsError) throw productsError;

      // Load stock movements for price analysis
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('user_id', user?.id)
        .eq('movement_type', 'in')
        .not('unit_price', 'is', null);

      if (movementsError) throw movementsError;

      // Calculate average entry prices and last entry prices
      const productsWithPriceInfo = (productsData || []).map(product => {
        const productMovements = (movementsData || []).filter(m => m.product_id === product.id);
        
        let averageEntryPrice = 0;
        let lastEntryPrice = 0;
        let lastMovementDate = null;
        
        if (productMovements.length > 0) {
          // Calculate weighted average (quantity * price) / total quantity
          const totalValue = productMovements.reduce((sum, m) => sum + ((m.quantity || 0) * (m.unit_price || 0)), 0);
          const totalQuantity = productMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);
          averageEntryPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
          
          // Get last entry price
          const sortedMovements = productMovements.sort((a, b) => 
            new Date(b.movement_date || '').getTime() - new Date(a.movement_date || '').getTime()
          );
          lastEntryPrice = sortedMovements[0]?.unit_price || 0;
          lastMovementDate = sortedMovements[0]?.movement_date;
        }

        return {
          ...product,
          averageEntryPrice,
          lastEntryPrice,
          lastMovementDate,
          entriesCount: productMovements.length
        };
      });

      setProducts(productsWithPriceInfo);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);

      if (categoriesError) throw categoriesError;

      setCategories(categoriesData || []);

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id);

      if (suppliersError) throw suppliersError;

      setSuppliers(suppliersData || []);

      // Calculate summary
      const totalProducts = productsWithPriceInfo.length;
      const totalValue = productsWithPriceInfo.reduce((sum, product) => {
        return sum + ((product.current_stock || 0) * (product.averageEntryPrice || product.cost_price || 0));
      }, 0);
      const lowStockCount = productsWithPriceInfo.filter(product => 
        (product.current_stock || 0) === 0
      ).length;
      const outOfStockCount = productsWithPriceInfo.filter(product => 
        (product.current_stock || 0) === 0
      ).length;

      setSummary({
        totalProducts,
        totalValue,
        lowStockCount,
        outOfStockCount
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da página.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.categories?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (product: Product) => {
    const currentStock = product.current_stock || 0;
    
    if (currentStock === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Em Estoque</Badge>;
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary">Consulta de Estoque</h1>
          <p className="text-muted-foreground">
            Visualize saldos, preços de entrada e relatórios detalhados
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalProducts}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total (Preço Médio)
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {summary.totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado no preço médio de entrada
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estoque Baixo
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{summary.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Produtos precisando reposição
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sem Estoque
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.outOfStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Produtos zerados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product Report */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatório Detalhado de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Preço Padrão</TableHead>
                    <TableHead>Preço Médio Entrada</TableHead>
                    <TableHead>Última Entrada</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{product.categories?.name || 'Sem categoria'}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {product.current_stock || 0} {product.unit_measure}
                      </TableCell>
                      <TableCell>R$ {(product.cost_price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <div>
                          <div>R$ {(product.averageEntryPrice || 0).toFixed(2)}</div>
                          {product.entriesCount && product.entriesCount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {product.entriesCount} entrada{product.entriesCount !== 1 ? 's' : ''}
                            </div>
                          )}
                          {!product.entriesCount || product.entriesCount === 0 && (
                            <div className="text-xs text-muted-foreground">Sem entradas</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>R$ {(product.lastEntryPrice || 0).toFixed(2)}</div>
                          {product.lastMovementDate && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(product.lastMovementDate).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {((product.current_stock || 0) * (product.averageEntryPrice || product.cost_price || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};