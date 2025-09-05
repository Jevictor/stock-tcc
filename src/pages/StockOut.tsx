import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, TrendingDown, ShoppingCart, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type StockMovement = Tables<'stock_movements'> & {
  products?: { name: string } | null;
};

type Product = Tables<'products'>;

const exitTypes = ["Venda", "Uso Interno", "Devolução", "Perda", "Transferência"];

export const StockOut = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exits, setExits] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    movement_date: new Date().toISOString().split('T')[0],
    reason: "",
    product_id: "",
    quantity: "",
    unit_price: "",
    notes: ""
  });

  const [stats, setStats] = useState({
    todayExits: 0,
    monthSales: 0,
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

      // Load stock movements (exits only)
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products:product_id (name)
        `)
        .eq('user_id', user?.id)
        .eq('movement_type', 'out')
        .order('created_at', { ascending: false });

      if (movementsError) throw movementsError;

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id);

      if (productsError) throw productsError;

      setExits(movements || []);
      setProducts(productsData || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      const todayExits = (movements || []).filter(m => 
        m.movement_date?.split('T')[0] === today
      ).length;

      const monthSales = (movements || []).filter(m => 
        m.movement_date?.slice(0, 7) === thisMonth && m.reason === 'Venda'
      ).reduce((sum, m) => sum + ((m.quantity || 0) * (m.unit_price || 0)), 0);

      const monthProducts = (movements || []).filter(m => 
        m.movement_date?.slice(0, 7) === thisMonth
      ).reduce((sum, m) => sum + (m.quantity || 0), 0);

      setStats({
        todayExits,
        monthSales,
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

  const filteredExits = exits.filter(exit =>
    (exit.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exit.products?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exit.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const movementData = {
        movement_date: formData.movement_date,
        product_id: formData.product_id,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price) || 0,
        total_value: parseInt(formData.quantity) * (parseFloat(formData.unit_price) || 0),
        movement_type: 'out' as const,
        reason: formData.reason,
        notes: formData.notes || null,
        user_id: user.id
      };

      const { error } = await supabase
        .from('stock_movements')
        .insert([movementData]);

      if (error) throw error;

      toast({
        title: "Saída registrada!",
        description: "A saída de estoque foi registrada com sucesso e o saldo foi atualizado."
      });

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving exit:', error);
      toast({
        title: "Erro ao registrar saída",
        description: "Não foi possível registrar a saída. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      movement_date: new Date().toISOString().split('T')[0],
      reason: "",
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Venda":
        return <ShoppingCart className="h-4 w-4 text-success" />;
      case "Uso Interno":
        return <User className="h-4 w-4 text-accent" />;
      default:
        return <TrendingDown className="h-4 w-4 text-warning" />;
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Saída de Estoque</h1>
            <p className="text-muted-foreground">
              Registre vendas, uso interno e outras saídas
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant">
                <Plus className="mr-2 h-4 w-4" />
                Nova Saída
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Saída de Estoque</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova saída de produtos do estoque.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="movement_date">Data da Saída</Label>
                    <Input
                      id="movement_date"
                      type="date"
                      value={formData.movement_date}
                      onChange={(e) => setFormData({...formData, movement_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Saída</Label>
                    <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {exitTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
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
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Estoque: {product.current_stock || 0})
                        </SelectItem>
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
                  <Textarea
                    id="notes"
                    placeholder="Observações adicionais..."
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
                  Registrar Saída
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
                Saídas Hoje
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.todayExits}</div>
              <p className="text-xs text-muted-foreground">
                Registros de hoje
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas do Mês
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">R$ {stats.monthSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Em vendas este mês
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Produtos Saídos
              </CardTitle>
              <User className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.monthProducts}</div>
              <p className="text-xs text-muted-foreground">
                Unidades este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Exits List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Histórico de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por tipo, produto ou observações..."
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExits.map((exit) => (
                    <TableRow key={exit.id}>
                      <TableCell>
                        {exit.movement_date ? new Date(exit.movement_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(exit.reason || '')}
                          {exit.reason || 'Não informado'}
                        </div>
                      </TableCell>
                      <TableCell>{exit.products?.name || 'Produto não encontrado'}</TableCell>
                      <TableCell className="text-center font-semibold">{exit.quantity}</TableCell>
                      <TableCell className="font-semibold">R$ {(exit.total_value || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{exit.notes || '-'}</TableCell>
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