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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/utils";

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
    current_stock: "",
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
        current_stock: parseInt(formData.current_stock) || 0,
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
      current_stock: product.current_stock?.toString() || "",
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
      current_stock: "",
      min_stock: "",
      max_stock: ""
    });
  };

  const getStatusBadge = (product: Product) => {
    const currentStock = product.current_stock || 0;
    const minStock = product.min_stock || 0;
    
    if (currentStock === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    if (currentStock < minStock && minStock > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Estoque Baixo</Badge>;
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Produtos</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie o cadastro dos seus produtos
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingProduct ? "Atualize as informações do produto." : "Preencha os dados do novo produto."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Estoque Atual</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    placeholder="0"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-gradient-primary w-full sm:w-auto">
                  {editingProduct ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
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

            {/* Desktop Table */}
            <div className="hidden lg:block border rounded-lg overflow-x-auto">
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
                      <TableCell>{formatCurrency(product.sale_price || 0)}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-semibold">{product.current_stock || 0}</p>
                          <p className="text-xs text-muted-foreground">unidades</p>
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
                          <ConfirmDialog
                            title="Excluir Produto"
                            description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
                            confirmText="Excluir"
                            cancelText="Cancelar"
                            variant="destructive"
                            onConfirm={() => handleDelete(product)}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          {getStatusBadge(product)}
                        </div>
                        <p className="text-sm font-mono text-muted-foreground">{product.code}</p>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Excluir Produto"
                          description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
                          confirmText="Excluir"
                          cancelText="Cancelar"
                          variant="destructive"
                          onConfirm={() => handleDelete(product)}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Categoria:</span>
                        <p className="font-medium">{product.categories?.name || 'Sem categoria'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço:</span>
                        <p className="font-medium">{formatCurrency(product.sale_price || 0)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estoque:</span>
                        <p className="font-semibold">{product.current_stock || 0} unidades</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar sua busca ou adicione um novo produto.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};