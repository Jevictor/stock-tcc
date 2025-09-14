import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Package, TrendingDown, TrendingUp, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDateTimeLocal } from "@/lib/utils";

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
  categories?: {
    name: string;
  } | null;
  average_entry_price?: number;
  supplier_ids?: string[];
}

interface StockMovement {
  id: string;
  product_id: string;
  supplier_id?: string;
  customer_id?: string;
  quantity: number;
  movement_type: string;
  movement_date: string;
  unit_price?: number;
  reason?: string;
  notes?: string;
  products?: {
    name: string;
  } | null;
  suppliers?: {
    name: string;
  } | null;
  customers?: {
    name: string;
  } | null;
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedMovementType, setSelectedMovementType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Calcular preço médio de entrada para cada produto
      const productsWithAvgPrice = await Promise.all(
        (data || []).map(async (product) => {
          const { data: entriesData } = await supabase
            .from('stock_movements')
            .select('unit_price, quantity')
            .eq('product_id', product.id)
            .eq('movement_type', 'in')
            .not('unit_price', 'is', null);

          let averageEntryPrice = product.cost_price;
          if (entriesData && entriesData.length > 0) {
            const totalValue = entriesData.reduce((sum, entry) => sum + (entry.unit_price * entry.quantity), 0);
            const totalQuantity = entriesData.reduce((sum, entry) => sum + entry.quantity, 0);
            if (totalQuantity > 0) {
              averageEntryPrice = totalValue / totalQuantity;
            }
          }

          return {
            ...product,
            average_entry_price: averageEntryPrice
          };
        })
      );

      setProducts(productsWithAvgPrice);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSuppliers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchMovements = async () => {
    if (!user || !selectedProduct) return;
    
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (name),
          suppliers (name),
          customers (name)
        `)
        .eq('product_id', selectedProduct)
        .eq('user_id', user.id)
        .order('movement_date', { ascending: false });

      if (error) throw error;
      setMovements(data as unknown as StockMovement[] || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          await Promise.all([
            fetchProducts(),
            fetchCategories(), 
            fetchSuppliers()
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProduct) {
      fetchMovements();
    }
  }, [selectedProduct, user]);

  const filteredProducts = products.filter(product => {
    if (selectedCategory && selectedCategory !== "all" && product.category_id !== selectedCategory) return false;
    if (selectedSupplier && selectedSupplier !== "all") {
      // Filtrar por fornecedor usando as movimentações de entrada
      const hasSupplier = movements.some(movement => 
        movement.product_id === product.id &&
        movement.movement_type === 'in' &&
        movement.supplier_id === selectedSupplier
      );
      if (!hasSupplier) return false;
    }
    return true;
  });

  const filteredMovements = movements.filter(movement => {
    if (selectedMovementType && selectedMovementType !== "all" && movement.movement_type !== selectedMovementType) {
      return false;
    }
    return true;
  });

  const applyFilters = () => {
    setShowProducts(true);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedMovementType("all");
    setSelectedProduct("");
    setShowProducts(false);
  };

  const getStockStatus = (product: ProductStock) => {
    const currentStock = product.current_stock || 0;
    const minStock = product.min_stock || 0;
    
    if (currentStock <= 0) {
      return <Badge variant="destructive">Sem estoque</Badge>;
    }
    if (currentStock <= minStock && minStock > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Estoque baixo</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
  };

  const totalStockValueCost = filteredProducts.reduce((total, product) => {
    return total + (product.current_stock * (product.average_entry_price || product.cost_price));
  }, 0);

  const totalStockValueSale = filteredProducts.reduce((total, product) => {
    return total + (product.current_stock * (product.sale_price || 0));
  }, 0);

  const lowStockCount = filteredProducts.filter(p => p.current_stock <= p.min_stock && p.min_stock > 0).length;
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

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Fornecedor</label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os fornecedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os fornecedores</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Movimento</label>
                <Select value={selectedMovementType} onValueChange={setSelectedMovementType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="in">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Entrada
                      </div>
                    </SelectItem>
                    <SelectItem value="out">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        Saída
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Aplicar Filtros
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos - só exibir se showProducts for true */}
        {showProducts && (
          <>
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
                  <div className="text-2xl font-bold">{filteredProducts.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Valor Total (Custo)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalStockValueCost)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Valor Total (Venda)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalStockValueSale)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Estoque Baixo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
                </CardContent>
              </Card>
            </div>

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
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Estoque Atual</p>
                            <p className="font-medium">{product.current_stock} {product.unit_measure}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Preço Custo</p>
                            <p className="font-medium">{formatCurrency(product.cost_price)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Preço Venda</p>
                            <p className="font-medium">{formatCurrency(product.sale_price)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Preço Médio Entrada</p>
                            <p className="font-medium">{formatCurrency(product.average_entry_price || 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor Total (Custo)</p>
                            <p className="font-medium">
                              {formatCurrency(product.current_stock * (product.average_entry_price || product.cost_price))}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor Total (Venda)</p>
                            <p className="font-medium">
                              {formatCurrency(product.current_stock * product.sale_price)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Select 
                            value={selectedProduct === product.id ? product.id : undefined} 
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
          </>
        )}

        {/* Histórico de movimentações */}
        {selectedProduct && filteredMovements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMovements.map((movement) => (
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
                            {movement.quantity} {filteredProducts.find(p => p.id === movement.product_id)?.unit_measure || 'unidades'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p>{formatDateTimeLocal(movement.movement_date)}</p>
                        {movement.unit_price && (
                          <p className="text-muted-foreground">{formatCurrency(movement.unit_price)}/un</p>
                        )}
                      </div>
                    </div>
                    
                    {(movement.suppliers?.name || movement.customers?.name) && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          {movement.movement_type === 'in' ? 'Fornecedor' : 'Cliente'}: {movement.suppliers?.name || movement.customers?.name}
                        </p>
                      </div>
                    )}
                    
                    {movement.reason && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Motivo: {movement.reason}</p>
                      </div>
                    )}
                    
                    {movement.notes && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Observações: {movement.notes}</p>
                      </div>
                    )}
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