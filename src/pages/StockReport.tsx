import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Package, TrendingDown, TrendingUp, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProductStock {
  id: string;
  name: string;
  code: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit_measure: string;
  category_id?: string;
  cost_price: number;
  sale_price: number;
  categories?: { name: string } | null;
  average_entry_price?: number;
}

interface StockMovement {
  id: string;
  product_id: string;
  supplier_id?: string;
  customer_id?: string;
  quantity: number;
  unit_price?: number;
  movement_type: string;
  movement_date: string;
  reason?: string;
  notes?: string;
  suppliers?: { name: string } | null;
  customers?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

export const StockReport = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (name)
      `)
      .order('name');

    if (error) {
      console.error('Erro ao carregar produtos:', error);
    } else {
      // Calculate average entry prices
      const productsWithAverage = await Promise.all(
        (data || []).map(async (product) => {
          const { data: movData } = await supabase
            .from('stock_movements')
            .select('quantity, unit_price')
            .eq('product_id', product.id)
            .eq('movement_type', 'in')
            .not('unit_price', 'is', null);
          
          let averagePrice = 0;
          if (movData && movData.length > 0) {
            const totalValue = movData.reduce((sum, mov) => 
              sum + ((mov.quantity || 0) * (mov.unit_price || 0)), 0);
            const totalQty = movData.reduce((sum, mov) => sum + (mov.quantity || 0), 0);
            averagePrice = totalQty > 0 ? totalValue / totalQty : 0;
          }
          
          return {
            ...product,
            average_entry_price: averagePrice
          };
        })
      );
      
      setProducts(productsWithAverage);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    setCategories(data || []);
  };

  const fetchSuppliers = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .order('name');
    
    setSuppliers(data || []);
  };

  const fetchMovements = async () => {
    if (!user || !selectedProduct) {
      setMovements([]);
      return;
    }

    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        suppliers (name),
        customers (name)
      `)
      .eq('product_id', selectedProduct)
      .order('movement_date', { ascending: false });

    const { data } = await query;
    setMovements(data as unknown as StockMovement[] || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, [user]);

  useEffect(() => {
    fetchMovements();
  }, [selectedProduct, user]);

  const filteredProducts = products.filter(product => {
    if (selectedCategory && product.category_id !== selectedCategory) return false;
    if (selectedSupplier) {
      // Note: This would need a more complex query to check supplier relationships
      // For now, we'll show all products if supplier filter is active
    }
    return true;
  });

  const getStockStatus = (product: ProductStock) => {
    if (product.current_stock <= 0) {
      return <Badge variant="destructive">Sem estoque</Badge>;
    }
    if (product.current_stock <= product.min_stock) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Estoque baixo</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
  };

  const totalStockValue = filteredProducts.reduce((total, product) => {
    return total + (product.current_stock * (product.average_entry_price || product.cost_price));
  }, 0);

  const lowStockCount = filteredProducts.filter(p => p.current_stock <= p.min_stock).length;
  const outOfStockCount = filteredProducts.filter(p => p.current_stock <= 0).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">Carregando relatório...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Consulta de Estoque
        </h1>
        <p className="text-muted-foreground">Relatórios e análise do estoque</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredProducts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {totalStockValue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-500" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Sem Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCategory === "" ? "all" : selectedCategory} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSupplier === "" ? "all" : selectedSupplier} onValueChange={(value) => setSelectedSupplier(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatório de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Produtos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.code}</p>
                      <p className="text-sm text-muted-foreground">
                        Categoria: {product.categories?.name || "Sem categoria"}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStockStatus(product)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Estoque Atual</p>
                      <p className="font-medium">{product.current_stock} {product.unit_measure}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preço Custo</p>
                      <p className="font-medium">R$ {product.cost_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preço Médio Entrada</p>
                      <p className="font-medium">R$ {(product.average_entry_price || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor Total</p>
                      <p className="font-medium">
                        R$ {(product.current_stock * (product.average_entry_price || product.cost_price)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Select 
                      value={selectedProduct === product.id ? product.id : ""} 
                      onValueChange={(value) => setSelectedProduct(value)}
                    >
                      <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Ver histórico de movimentações" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={product.id}>Ver movimentações</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de movimentações */}
      {selectedProduct && movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {movement.movement_type === 'in' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {movement.movement_type === 'in' ? 'Entrada' : 'Saída'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movement.quantity} unidades
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p>{new Date(movement.movement_date).toLocaleDateString('pt-BR')}</p>
                      {movement.unit_price && (
                        <p className="text-muted-foreground">R$ {movement.unit_price.toFixed(2)}/un</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>
                        {movement.movement_type === 'in' ? 'Fornecedor/Cliente:' : 'Fornecedor/Cliente:'}
                      </strong>{' '}
                      {movement.movement_type === 'in' 
                        ? (movement.suppliers?.name || "Não informado")
                        : (movement.customers?.name || "Não informado")
                      }
                    </p>
                    {movement.reason && <p><strong>Motivo:</strong> {movement.reason}</p>}
                    {movement.notes && <p><strong>Observações:</strong> {movement.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </DashboardLayout>
  );
};