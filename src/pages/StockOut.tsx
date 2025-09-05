import { useState } from "react";
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
import { Plus, Search, TrendingDown, ShoppingCart, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockExits = [
  {
    id: "1",
    date: "2024-01-15",
    type: "Venda",
    customer: "Cliente ABC Ltda",
    product: "Mouse Gamer RGB",
    quantity: 12,
    unitPrice: 89.90,
    totalValue: 1078.80,
    document: "NF-5001"
  },
  {
    id: "2",
    date: "2024-01-14",
    type: "Uso Interno",
    customer: "Departamento TI",
    product: "Teclado Mecânico",
    quantity: 3,
    unitPrice: 199.90,
    totalValue: 599.70,
    document: "REQ-001"
  },
  {
    id: "3",
    date: "2024-01-13",
    type: "Venda",
    customer: "Empresa XYZ S/A",
    product: "Monitor 24\"",
    quantity: 5,
    unitPrice: 450.00,
    totalValue: 2250.00,
    document: "NF-5002"
  }
];

const exitTypes = ["Venda", "Uso Interno", "Devolução", "Perda", "Transferência"];
const mockProducts = ["Mouse Gamer RGB", "Teclado Mecânico", "Monitor 24\"", "Headset Wireless"];

export const StockOut = () => {
  const [exits] = useState(mockExits);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "",
    customer: "",
    product: "",
    quantity: "",
    unitPrice: "",
    document: "",
    notes: ""
  });

  const filteredExits = exits.filter(exit =>
    exit.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exit.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exit.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    toast({
      title: "Saída registrada!",
      description: "A saída de estoque foi registrada com sucesso e o saldo foi atualizado."
    });
    setIsDialogOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: "",
      customer: "",
      product: "",
      quantity: "",
      unitPrice: "",
      document: "",
      notes: ""
    });
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
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
                    <Label htmlFor="date">Data da Saída</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Saída</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
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
                  <Label htmlFor="customer">Cliente/Destino</Label>
                  <Input
                    id="customer"
                    placeholder="Nome do cliente ou departamento"
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select value={formData.product} onValueChange={(value) => setFormData({...formData, product: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProducts.map((product) => (
                        <SelectItem key={product} value={product}>{product}</SelectItem>
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
                    <Label htmlFor="unitPrice">Preço Unitário</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
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
                  <Label htmlFor="document">Documento</Label>
                  <Input
                    id="document"
                    placeholder="Número da NF, requisição, etc."
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                  />
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
                <Button onClick={handleSave} className="bg-gradient-primary">
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
              <div className="text-2xl font-bold text-primary">15</div>
              <p className="text-xs text-muted-foreground">
                +3 desde ontem
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
              <div className="text-2xl font-bold text-primary">R$ 45.320</div>
              <p className="text-xs text-muted-foreground">
                +22% desde o mês passado
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
              <div className="text-2xl font-bold text-primary">234</div>
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
                  placeholder="Buscar por cliente, produto ou tipo..."
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
                    <TableHead>Cliente/Destino</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Documento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExits.map((exit) => (
                    <TableRow key={exit.id}>
                      <TableCell>{exit.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(exit.type)}
                          {exit.type}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{exit.customer}</TableCell>
                      <TableCell>{exit.product}</TableCell>
                      <TableCell className="text-center font-semibold">{exit.quantity}</TableCell>
                      <TableCell className="font-semibold">R$ {exit.totalValue.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-sm">{exit.document}</TableCell>
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