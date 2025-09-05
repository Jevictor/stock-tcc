import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Product = Tables<'products'> & {
  categories?: { name: string } | null;
};

type Category = Tables<'categories'>;

const units = ["Unidade", "Kg", "Caixa", "Metro", "Litro"];

export const Products = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category_id: "",
    unit_measure: "",
    cost_price: "",
    sale_price: "",
    min_stock: "",
    max_stock: ""
  });

  // Load products and categories
  useEffect(() => {
    if (user) {
      loadProducts();
      loadCategories();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.categories?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const productData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        unit_measure: formData.unit_measure,
        cost_price: parseFloat(formData.cost_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        max_stock: parseInt(formData.max_stock) || 0,
        user_id: user.id
      };

      let error;

      if (editingProduct) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingProduct ? "Produto atualizado!" : "Produto cadastrado!",
        description: editingProduct ? "As alterações foram salvas com sucesso." : "Novo produto adicionado ao sistema."
      });

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro ao salvar produto",
        description: "Não foi possível salvar o produto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description || "",
      category_id: product.category_id || "",
      unit_measure: product.unit_measure,
      cost_price: product.cost_price?.toString() || "",
      sale_price: product.sale_price?.toString() || "",
      min_stock: product.min_stock?.toString() || "",
      max_stock: product.max_stock?.toString() || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Produto excluído!",
        description: "O produto foi removido do sistema."
      });

      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro ao excluir produto",
        description: "Não foi possível excluir o produto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      category_id: "",
      unit_measure: "",
      cost_price: "",
      sale_price: "",
      min_stock: "",
      max_stock: ""
    });
  };

  const getStatusBadge = (product: Product) => {
    const currentStock = product.current_stock || 0;
    const minStock = product.min_stock || 0;
    
    if (currentStock <= minStock) {
      return <Badge variant="destructive">Estoque Baixo</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Ativo</Badge>;
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
            <h1 className="text-3xl font-bold text-primary">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie o cadastro dos seus produtos
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Atualize as informações do produto." : "Preencha os dados do novo produto."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      placeholder="SKU001"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Nome do produto"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição do produto"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={formData.unit_measure} onValueChange={(value) => setFormData({...formData, unit_measure: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Preço de Custo</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellPrice">Preço de Venda</Label>
                    <Input
                      id="sellPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="0"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Estoque Máximo</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      placeholder="0"
                      value={formData.max_stock}
                      onChange={(e) => setFormData({...formData, max_stock: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-gradient-primary">
                  {editingProduct ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou categoria..."
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
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{product.categories?.name || 'Sem categoria'}</TableCell>
                      <TableCell>R$ {(product.sale_price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-semibold">{product.current_stock || 0}</p>
                          <p className="text-xs text-muted-foreground">
                            Min: {product.min_stock || 0}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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