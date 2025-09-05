import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { toast } from "@/hooks/use-toast";
import { TrendingDown, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  name: string;
  current_stock: number;
  unit_measure: string;
}

interface Customer {
  id: string;
  name: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  supplier_id?: string;
  customer_id?: string;
  quantity: number;
  movement_type: string;
  movement_date: string;
  reason?: string;
  notes?: string;
  products?: { name: string; unit_measure: string } | null;
  customers?: { name: string } | null;
}

export const StockOut = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    customer_id: "none",
    reason: "",
    notes: ""
  });

  const fetchProducts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, current_stock, unit_measure')
      .gt('current_stock', 0)
      .order('name');

    if (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
  };

  const fetchCustomers = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .order('name');

    if (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCustomers(data || []);
    }
  };

  const fetchMovements = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, unit_measure),
        customers (name)
      `)
      .eq('movement_type', 'out')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar movimentações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMovements(data as unknown as StockMovement[] || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchMovements();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedProduct = products.find(p => p.id === formData.product_id);
    const quantity = parseInt(formData.quantity);

    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Erro na validação",
        description: "Selecione um produto e quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    if (quantity > selectedProduct.current_stock) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${selectedProduct.current_stock} unidades disponíveis.`,
        variant: "destructive",
      });
      return;
    }

    const movementData = {
      product_id: formData.product_id,
      quantity: parseInt(formData.quantity),
      movement_type: 'out',
      movement_date: new Date().toISOString(),
      reason: formData.reason,
      notes: formData.notes || null,
      customer_id: formData.customer_id || null,
      user_id: user.id
    };

    const { error } = await supabase
      .from('stock_movements')
      .insert([movementData]);

    if (error) {
      toast({
        title: "Erro ao registrar saída",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saída registrada!",
        description: "A saída de estoque foi registrada com sucesso.",
      });
      
      setFormData({
        product_id: "",
        quantity: "",
        customer_id: "none",
        reason: "",
        notes: ""
      });
      
      fetchProducts();
      fetchMovements();
    }
  };

  const columns = [
    { 
      header: "Produto", 
      accessorKey: "products.name",
      cell: (row: StockMovement) => row.products?.name || "N/A"
    },
    { header: "Quantidade", accessorKey: "quantity" },
    { 
      header: "Unidade", 
      accessorKey: "products.unit_measure",
      cell: (row: StockMovement) => row.products?.unit_measure || "N/A"
    },
    { 
      header: "Cliente", 
      accessorKey: "customers.name",
      cell: (row: StockMovement) => row.customers?.name || "Não informado"
    },
    { header: "Motivo", accessorKey: "reason" },
    { 
      header: "Data", 
      accessorKey: "movement_date",
      cell: (row: StockMovement) => new Date(row.movement_date).toLocaleDateString('pt-BR')
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <TrendingDown className="h-8 w-8 text-destructive" />
            Saída de Estoque
          </h1>
          <p className="text-muted-foreground">Registre saídas de produtos do estoque</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de saída */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Nova Saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="product">Produto *</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Estoque: {product.current_stock} {product.unit_measure})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="customer">Cliente (Opcional)</Label>
                  <Select value={formData.customer_id === "" ? "none" : formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value === "none" ? "" : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum cliente</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Motivo da Saída *</Label>
                  <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Venda">Venda</SelectItem>
                      <SelectItem value="Perda">Perda</SelectItem>
                      <SelectItem value="Devolução">Devolução</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Uso interno">Uso interno</SelectItem>
                      <SelectItem value="Descarte">Descarte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Observações opcionais..."
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Registrar Saída
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de movimentações recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Saídas Recentes ({movements.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhuma saída registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movements.slice(0, 10).map((movement) => (
                  <div key={movement.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{movement.products?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {movement.quantity} {movement.products?.unit_measure}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{new Date(movement.movement_date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-muted-foreground">{movement.reason}</p>
                      </div>
                    </div>
                    {movement.customers?.name && (
                      <p className="text-sm text-muted-foreground">
                        Cliente: {movement.customers.name}
                      </p>
                    )}
                    {movement.notes && (
                      <p className="text-sm text-muted-foreground">{movement.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};