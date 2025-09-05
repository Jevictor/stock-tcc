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

type StockReportItem = Tables<'products'> & {
  categories?: { name: string } | null;
  suppliers?: { name: string } | null;
  last_movement?: string | null;
};

export const StockReport = () => {
  const { user } = useAuth();
  const [stockData, setStockData] = useState<StockReportItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [supplierFilter, setSupplierFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    if (user) {
      loadStockData();
    }
  }, [user]);

  const loadStockData = async () => {
    try {
      setLoading(true);
      
      // Load products with related data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name)
        `)
        .eq('user_id', user?.id)
        .order('name');

      if (productsError) throw productsError;

      // Load suppliers separately
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('user_id', user?.id);

      if (suppliersError) throw suppliersError;

      // Get last movement date for each product
      const productsWithMovements = await Promise.all(
        (products || []).map(async (product) => {
          const { data: lastMovement } = await supabase
            .from('stock_movements')
            .select('movement_date')
            .eq('product_id', product.id)
            .eq('user_id', user?.id)
            .order('movement_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...product,
            last_movement: lastMovement?.movement_date || null
          };
        })
      );

      setStockData(productsWithMovements);

      // Extract unique categories and suppliers
      const uniqueCategories = [...new Set(productsWithMovements
        .map(p => p.categories?.name)
        .filter(Boolean))] as string[];
      
      const uniqueSuppliers = suppliersData?.map(s => s.name) || [];

      setCategories(['Todos', ...uniqueCategories]);
      setSuppliers(['Todos', ...uniqueSuppliers]);

    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductStatus = (product: StockReportItem) => {
    const currentStock = product.current_stock || 0;
    const minStock = product.min_stock || 0;
    
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock * 0.5) return 'critical';
    if (currentStock <= minStock) return 'low';
    return 'normal';
  };

  const filteredStock = stockData.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.categories?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "Todos" || item.categories?.name === categoryFilter;
    const matchesSupplier = supplierFilter === "Todos" || suppliers.includes(supplierFilter);
    
    const status = getProductStatus(item);
    const matchesStatus = statusFilter === "Todos" || status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  const getStatusBadge = (product: StockReportItem) => {
    const status = getProductStatus(product);
    
    switch (status) {
      case "out_of_stock":
        return <Badge variant="destructive">Sem Estoque</Badge>;
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "low":
        return <Badge className="bg-warning text-warning-foreground">Baixo</Badge>;
      default:
        return <Badge className="bg-success text-success-foreground">Normal</Badge>;
    }
  };

  const calculateSummary = () => {
    const totalProducts = stockData.length;
    const totalValue = stockData.reduce((sum, item) => {
      const currentStock = item.current_stock || 0;
      const costPrice = item.cost_price || 0;
      return sum + (currentStock * costPrice);
    }, 0);
    
    const lowStockCount = stockData.filter(item => {
      const status = getProductStatus(item);
      return status === "low" || status === "critical";
    }).length;
    
    const outOfStockCount = stockData.filter(item => getProductStatus(item) === "out_of_stock").length;
    
    return { totalProducts, totalValue, lowStockCount, outOfStockCount };
  };

  const summary = calculateSummary();

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
            Visualize saldos, alertas e relatórios de estoque
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
                Valor Total
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {summary.totalValue.toFixed(2)}
              </div>
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

        {/* Stock Report */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatório de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-5 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos Status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center text-sm text-muted-foreground">
                {filteredStock.length} produtos encontrados
              </div>
            </div>

            {/* Stock Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Mín/Máx</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Mov.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.categories?.name || 'Sem categoria'}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          getProductStatus(item) === 'out_of_stock' ? 'text-destructive' :
                          getProductStatus(item) === 'critical' ? 'text-destructive' :
                          getProductStatus(item) === 'low' ? 'text-warning' : 'text-primary'
                        }`}>
                          {item.current_stock || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {item.min_stock || 0}/{item.max_stock || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {(item.cost_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {((item.current_stock || 0) * (item.cost_price || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.last_movement ? new Date(item.last_movement).toLocaleDateString('pt-BR') : 'Nunca'}
                      </TableCell>
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