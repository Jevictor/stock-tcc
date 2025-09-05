import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, TrendingUp, Calendar, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type StockMovement = Tables<'stock_movements'> & {
  products?: { name: string } | null;
  suppliers?: { name: string } | null;
};

type Product = Tables<'products'>;
type Supplier = Tables<'suppliers'>;

export const StockIn = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    movement_date: new Date().toISOString().split('T')[0],
    supplier_id: "",
    product_id: "",
    quantity: "",
    unit_price: "",
    notes: ""
  });

  const [stats, setStats] = useState({
    todayEntries: 0,
    monthValue: 0,
    monthProducts: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load stock movements (entries only)
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products:product_id (name),
          suppliers:supplier_id (name)
        `)
        .eq('user_id', user?.id)
        .eq('movement_type', 'in')
        .order('created_at', { ascending: false });

      if (movementsError) throw movementsError;

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id);

      if (productsError) throw productsError;

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id);

      if (suppliersError) throw suppliersError;

      setEntries(movements || []);
      setProducts(productsData || []);
      setSuppliers(suppliersData || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      const todayEntries = (movements || []).filter(m => 
        m.movement_date?.split('T')[0] === today
      ).length;

      const monthValue = (movements || []).filter(m => 
        m.movement_date?.slice(0, 7) === thisMonth
      ).reduce((sum, m) => sum + ((m.quantity || 0) * (m.unit_price || 0)), 0);

      const monthProducts = (movements || []).filter(m => 
        m.movement_date?.slice(0, 7) === thisMonth
      ).reduce((sum, m) => sum + (m.quantity || 0), 0);

      setStats({
        todayEntries,
        monthValue,
        monthProducts
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

  const filteredEntries = entries.filter(entry =>
    (entry.suppliers?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.products?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const movementData = {
        movement_date: formData.movement_date,
        supplier_id: formData.supplier_id || null,
        product_id: formData.product_id,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price) || 0,
        total_value: parseInt(formData.quantity) * (parseFloat(formData.unit_price) || 0),
        movement_type: 'in' as const,
        notes: formData.notes || null,
        user_id: user.id
      };

      const { error } = await supabase
        .from('stock_movements')
        .insert([movementData]);

      if (error) throw error;

      toast({
        title: "Entrada registrada!",
        description: "A entrada de estoque foi registrada com sucesso e o saldo foi atualizado."
      });

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Erro ao registrar entrada",
        description: "Não foi possível registrar a entrada. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      movement_date: new Date().toISOString().split('T')[0],
      supplier_id: "",
      product_id: "",
      quantity: "",
      unit_price: "",
      notes: ""
    });
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    return (quantity * unitPrice).toFixed(2);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Entrada de Estoque</h1>
            <p className="text-muted-foreground">
              Registre compras e reposições de produtos
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant">
                <Plus className="mr-2 h-4 w-4" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova entrada de produtos no estoque.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="movement_date">Data da Entrada</Label>
                    <Input
                      id="movement_date"
                      type="date"
                      value={formData.movement_date}
                      onChange={(e) => setFormData({...formData, movement_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Preço Unitário</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Total</Label>
                    <Input
                      readOnly
                      value={`R$ ${calculateTotal()}`}
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    placeholder="Observações sobre a entrada..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-gradient-primary" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Entrada
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Entradas Hoje
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.todayEntries}</div>
              <p className="text-xs text-muted-foreground">
                Registros de hoje
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total do Mês
              </CardTitle>
              <Package className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">R$ {stats.monthValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Em entradas este mês
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Produtos Recebidos
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.monthProducts}</div>
              <p className="text-xs text-muted-foreground">
                Unidades este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Entries List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Histórico de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por fornecedor, produto ou observações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.movement_date ? new Date(entry.movement_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{entry.suppliers?.name || 'Sem fornecedor'}</TableCell>
                      <TableCell>{entry.products?.name || 'Produto não encontrado'}</TableCell>
                      <TableCell className="text-center font-semibold">{entry.quantity}</TableCell>
                      <TableCell>R$ {(entry.unit_price || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">R$ {(entry.total_value || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{entry.notes || '-'}</TableCell>
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