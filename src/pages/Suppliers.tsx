import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, Edit, Trash2, Truck, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Supplier = Tables<'suppliers'>;

export const Suppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cnpj_cpf: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: ""
  });

  useEffect(() => {
    if (user) {
      loadSuppliers();
    }
  }, [user]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast({
        title: "Erro ao carregar fornecedores",
        description: "Não foi possível carregar a lista de fornecedores.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.cnpj_cpf || '').includes(searchTerm) ||
    (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome/Razão Social é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.cnpj_cpf.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "CNPJ/CPF é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "E-mail é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Endereço é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.city.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Cidade é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.state.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Estado é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.zip_code.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "CEP é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      const supplierData = {
        name: formData.name.trim(),
        cnpj_cpf: formData.cnpj_cpf.trim(),
        email: formData.email.trim(),
        phone: formData.phone || null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        user_id: user.id
      };

      let error;

      if (editingSupplier) {
        // Update existing supplier
        const { error: updateError } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Create new supplier
        const { error: insertError } = await supabase
          .from('suppliers')
          .insert([supplierData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingSupplier ? "Fornecedor atualizado!" : "Fornecedor cadastrado!",
        description: editingSupplier ? "As alterações foram salvas com sucesso." : "Novo fornecedor adicionado ao sistema."
      });

      setIsDialogOpen(false);
      setEditingSupplier(null);
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Erro ao salvar fornecedor",
        description: "Não foi possível salvar o fornecedor. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      cnpj_cpf: supplier.cnpj_cpf || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      zip_code: supplier.zip_code || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Fornecedor excluído!",
        description: "O fornecedor foi removido do sistema."
      });

      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Erro ao excluir fornecedor",
        description: "Não foi possível excluir o fornecedor. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      cnpj_cpf: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: ""
    });
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
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Fornecedores</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie o cadastro dos seus fornecedores
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingSupplier(null);
              resetForm();
            }
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {editingSupplier ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {editingSupplier ? "Atualize as informações do fornecedor." : "Preencha os dados do novo fornecedor."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome/Razão Social *</Label>
                    <Input
                      id="name"
                      placeholder="Nome do fornecedor"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj_cpf">CNPJ/CPF *</Label>
                    <Input
                      id="cnpj_cpf"
                      placeholder="12.345.678/0001-90"
                      value={formData.cnpj_cpf}
                      onChange={(e) => setFormData({...formData, cnpj_cpf: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@fornecedor.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <Input
                    id="address"
                    placeholder="Rua, número, bairro"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      placeholder="SP"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">CEP *</Label>
                    <Input
                      id="zip_code"
                      placeholder="01234-567"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-gradient-primary w-full sm:w-auto" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSupplier ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Lista de Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ/CPF ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="border rounded-lg min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nome/Razão Social</TableHead>
                      <TableHead className="min-w-[150px]">CNPJ/CPF</TableHead>
                      <TableHead className="min-w-[200px]">Contatos</TableHead>
                      <TableHead className="min-w-[150px]">Localização</TableHead>
                      <TableHead className="min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="min-w-[200px]">
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Cadastrado em: {new Date(supplier.created_at || '').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm min-w-[150px]">{supplier.cnpj_cpf || '-'}</TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="space-y-1">
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {supplier.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          {supplier.city || supplier.state ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              <span>{supplier.city}{supplier.city && supplier.state ? ', ' : ''}{supplier.state}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              title="Excluir Fornecedor"
                              description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
                              confirmText="Excluir"
                              cancelText="Cancelar"
                              variant="destructive"
                              onConfirm={() => handleDelete(supplier)}
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
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-primary mb-1">{supplier.name}</h3>
                        <p className="text-sm font-mono text-muted-foreground mb-2">
                          {supplier.cnpj_cpf || 'Sem CNPJ/CPF'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cadastrado em: {new Date(supplier.created_at || '').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Excluir Fornecedor"
                          description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
                          confirmText="Excluir"
                          cancelText="Cancelar"
                          variant="destructive"
                          onConfirm={() => handleDelete(supplier)}
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
                    
                    <div className="space-y-2 text-sm">
                      {(supplier.phone || supplier.email) && (
                        <div>
                          <span className="text-muted-foreground">Contatos:</span>
                          <div className="mt-1 space-y-1">
                            {supplier.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {supplier.email}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {(supplier.city || supplier.state) && (
                        <div>
                          <span className="text-muted-foreground">Localização:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{supplier.city}{supplier.city && supplier.state ? ', ' : ''}{supplier.state}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar sua busca ou adicione um novo fornecedor.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};