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
    code: string;
    unit_measure: string;
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

interface Customer {
  id: string;
  name: string;
}

export const StockReport = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [selectedMovementType, setSelectedMovementType] = useState<string>("all");
  const [selectedExitReason, setSelectedExitReason] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [consultationType, setConsultationType] = useState<string>("products"); // "products" or "movements"

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

  const fetchCustomers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchMovementsBySupplier = async () => {
    if (!user || selectedSupplier === "all") return;
    
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (name, code, unit_measure),
          suppliers (name),
          customers (name)
        `)
        .eq('supplier_id', selectedSupplier)
        .eq('movement_type', 'in')
        .eq('user_id', user.id)
        .order('movement_date', { ascending: false });

      if (error) throw error;
      setMovements(data as unknown as StockMovement[] || []);
    } catch (error) {
      console.error('Error fetching movements by supplier:', error);
    }
  };

  const fetchAllMovements = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products (name, code, unit_measure),
          suppliers (name),
          customers (name)
        `)
        .eq('user_id', user.id);

      // Aplicar filtros
      if (selectedMovementType !== "all") {
        query = query.eq('movement_type', selectedMovementType);
      }
      
      if (selectedMovementType === "in" && selectedSupplier !== "all") {
        query = query.eq('supplier_id', selectedSupplier);
      }

      if (selectedMovementType === "out") {
        if (selectedExitReason !== "all") {
          query = query.eq('reason', selectedExitReason);
        }
        if (selectedExitReason === "Venda" && selectedCustomer !== "all") {
          query = query.eq('customer_id', selectedCustomer);
        }
      }

      query = query.order('movement_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setMovements(data as unknown as StockMovement[] || []);
    } catch (error) {
      console.error('Error fetching all movements:', error);
    }
  };

  const fetchMovements = async () => {
    if (!user || !selectedProduct) return;
    
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products (name),
          suppliers (name),
          customers (name)
        `)
        .eq('product_id', selectedProduct)
        .eq('user_id', user.id);

      query = query.order('movement_date', { ascending: false });

      const { data, error } = await query;

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
            fetchSuppliers(),
            fetchCustomers()
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
    } else {
      setMovements([]);
    }
  }, [selectedProduct, user]);

  // Resetar histórico quando mudar categoria
  useEffect(() => {
    setSelectedProduct("");
    setMovements([]);
  }, [selectedCategory]);

  const filteredProducts = products.filter(product => {
    if (selectedCategory && selectedCategory !== "all" && product.category_id !== selectedCategory) return false;
    return true;
  });

  // Filtrar produtos por fornecedor de forma assíncrona se necessário
  const getProductsWithSupplierMovements = async () => {
    if (selectedSupplier === "all") return filteredProducts;
    
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('product_id')
        .eq('supplier_id', selectedSupplier)
        .eq('movement_type', 'in')
        .eq('user_id', user?.id);

      if (error) throw error;
      
      const productIds = [...new Set(data?.map(m => m.product_id) || [])];
      return filteredProducts.filter(product => productIds.includes(product.id));
    } catch (error) {
      console.error('Error filtering products by supplier:', error);
      return filteredProducts;
    }
  };

  const filteredMovements = movements.filter(movement => {
    if (selectedMovementType && selectedMovementType !== "all" && movement.movement_type !== selectedMovementType) {
      return false;
    }
    return true;
  });

  const applyProductFilters = async () => {
    setConsultationType("products");
    setShowProducts(true);
    setShowMovements(false);
    setSelectedProduct("");
    setMovements([]);
  };

  const applyMovementFilters = async () => {
    setConsultationType("movements");
    setShowProducts(false);
    setShowMovements(true);
    setSelectedProduct("");
    
    if (selectedSupplier !== "all") {
      await fetchMovementsBySupplier();
    } else {
      await fetchAllMovements();
    }
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedMovementType("all");
    setSelectedExitReason("all");
    setSelectedCustomer("all");
    setSelectedProduct("");
    setMovements([]);
    setShowProducts(false);
    setShowMovements(false);
    setConsultationType("products");
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

  const [filteredProductsState, setFilteredProductsState] = useState<ProductStock[]>([]);

  useEffect(() => {
    const updateFilteredProducts = async () => {
      if (selectedSupplier !== "all" && consultationType === "products") {
        const productsWithSupplier = await getProductsWithSupplierMovements();
        setFilteredProductsState(productsWithSupplier);
      } else {
        setFilteredProductsState(filteredProducts);
      }
    };

    if (showProducts) {
      updateFilteredProducts();
    }
  }, [showProducts, selectedSupplier, selectedCategory, products]);

  const totalStockValueCost = filteredProductsState.reduce((total, product) => {
    return total + (product.current_stock * (product.average_entry_price || product.cost_price));
  }, 0);

  const totalStockValueSale = filteredProductsState.reduce((total, product) => {
    return total + (product.current_stock * (product.sale_price || 0));
  }, 0);

  const lowStockCount = filteredProductsState.filter(p => p.current_stock <= p.min_stock && p.min_stock > 0).length;
  const outOfStockCount = filteredProductsState.filter(p => p.current_stock <= 0).length;

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
        <div className="space-y-4">
          {/* Seção 1: Tipo de Consulta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Tipo de Consulta
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Escolha o tipo de relatório que deseja visualizar
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className={`cursor-pointer border-2 transition-colors ${consultationType === "products" ? "border-primary bg-primary/5" : "border-muted"}`} onClick={() => setConsultationType("products")}>
                  <CardContent className="p-4 text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Consulta de Produtos</h3>
                    <p className="text-sm text-muted-foreground">Visualizar estoque atual dos produtos</p>
                  </CardContent>
                </Card>
                <Card className={`cursor-pointer border-2 transition-colors ${consultationType === "movements" ? "border-primary bg-primary/5" : "border-muted"}`} onClick={() => setConsultationType("movements")}>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">Consulta de Movimentações</h3>
                    <p className="text-sm text-muted-foreground">Visualizar histórico de entradas e saídas</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Filtros de Produtos */}
          {consultationType === "products" && (
            <Card>
              <CardHeader>
                <CardTitle>Filtros para Produtos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure os filtros para buscar produtos em estoque
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
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
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os fornecedores</SelectItem>  
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSupplier !== "all" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        * Mostrará produtos que tiveram entrada deste fornecedor
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={applyProductFilters}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                  >
                    Consultar Produtos
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-6 py-3 border border-input rounded-md hover:bg-accent transition-colors font-medium"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção 3: Filtros de Movimentações */}
          {consultationType === "movements" && (
            <Card>
              <CardHeader>
                <CardTitle>Filtros para Movimentações</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure os filtros para buscar movimentações de estoque
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Movimento</label>
                    <Select value={selectedMovementType} onValueChange={(value) => {
                      setSelectedMovementType(value);
                      setSelectedExitReason("all");
                      setSelectedCustomer("all");
                      setSelectedSupplier("all");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
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

                  {/* Filtros para Entrada */}
                  {(selectedMovementType === "all" || selectedMovementType === "in") && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Fornecedor</label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os fornecedores</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedSupplier !== "all" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          * Mostrará movimentações de entrada deste fornecedor
                        </p>
                      )}
                    </div>
                  )}

                  {/* Filtros para Saída */}
                  {selectedMovementType === "out" && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Motivo de Saída</label>
                        <Select value={selectedExitReason} onValueChange={(value) => {
                          setSelectedExitReason(value);
                          if (value !== "Venda") {
                            setSelectedCustomer("all");
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o motivo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os motivos</SelectItem>
                            <SelectItem value="Venda">Venda</SelectItem>
                            <SelectItem value="Perda">Perda</SelectItem>
                            <SelectItem value="Devolução">Devolução</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                            <SelectItem value="Uso interno">Uso interno</SelectItem>
                            <SelectItem value="Descarte">Descarte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedExitReason === "Venda" && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Cliente</label>
                          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os clientes</SelectItem>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedCustomer !== "all" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              * Mostrará vendas para este cliente
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={applyMovementFilters}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                  >
                    Consultar Movimentações
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-6 py-3 border border-input rounded-md hover:bg-accent transition-colors font-medium"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Seção de Movimentações */}
        {showMovements && (
          <>
            {filteredMovements.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma movimentação encontrada</h3>
                    <p>Não foram encontradas movimentações com os filtros aplicados. Tente ajustar os critérios de busca.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Movimentações de Estoque ({filteredMovements.length})</CardTitle>
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
                                {movement.products?.name} - {movement.quantity} {movement.products?.unit_measure || 'unidades'}
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
          </>
        )}
        {showProducts && (
          <>
            {filteredProductsState.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                    <p>Não foram encontrados produtos com os filtros aplicados. Tente ajustar os critérios de busca.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
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
                  <div className="text-2xl font-bold">{filteredProductsState.length}</div>
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
                <CardTitle>Relatório de Produtos ({filteredProductsState.length})</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="space-y-3">
                    {filteredProductsState.map((product) => (
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
                            <SelectTrigger className="w-full sm:w-[280px]">
                              <SelectValue placeholder="Clique para ver histórico de movimentações" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={product.id}>
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4" />
                                  Ver histórico de movimentações
                                </div>
                              </SelectItem>
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
        </>
      )}

        {/* Histórico de movimentações */}
        {selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMovements.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma movimentação encontrada</h3>
                  <p>
                    {selectedSupplier !== "all" 
                      ? "Não há movimentações de entrada para este fornecedor." 
                      : "Não há movimentações para este produto."
                    }
                  </p>
                </div>
              ) : (
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
                              {movement.quantity} {filteredProductsState.find(p => p.id === movement.product_id)?.unit_measure || 'unidades'}
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
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};