import { useState } from "react";
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
import { Plus, Search, TrendingUp, Calendar, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockEntries = [
  {
    id: "1",
    date: "2024-01-15",
    supplier: "TechParts Ltda",
    product: "Mouse Gamer RGB",
    quantity: 50,
    unitPrice: 45.90,
    totalValue: 2295.00,
    invoice: "NF-001234"
  },
  {
    id: "2",
    date: "2024-01-14",
    supplier: "Displays Pro",
    product: "Monitor 24\"",
    quantity: 25,
    unitPrice: 280.00,
    totalValue: 7000.00,
    invoice: "NF-001235"
  },
  {
    id: "3",
    date: "2024-01-12",
    supplier: "ComponenteX",
    product: "Teclado Mecânico",
    quantity: 30,
    unitPrice: 120.00,
    totalValue: 3600.00,
    invoice: "NF-001236"
  }
];

const mockSuppliers = ["TechParts Ltda", "Displays Pro", "ComponenteX"];
const mockProducts = ["Mouse Gamer RGB", "Teclado Mecânico", "Monitor 24\"", "Headset Wireless"];

export const StockIn = () => {
  const [entries] = useState(mockEntries);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: "",
    product: "",
    quantity: "",
    unitPrice: "",
    invoice: "",
    notes: ""
  });

  const filteredEntries = entries.filter(entry =>
    entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.invoice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    toast({
      title: "Entrada registrada!",
      description: "A entrada de estoque foi registrada com sucesso e o saldo foi atualizado."
    });
    setIsDialogOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplier: "",
      product: "",
      quantity: "",
      unitPrice: "",
      invoice: "",
      notes: ""
    });
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return (quantity * unitPrice).toFixed(2);
  };

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
                    <Label htmlFor="date">Data da Entrada</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={formData.supplier} onValueChange={(value) => setFormData({...formData, supplier: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSuppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Label htmlFor="invoice">Número da Nota Fiscal</Label>
                  <Input
                    id="invoice"
                    placeholder="NF-001234"
                    value={formData.invoice}
                    onChange={(e) => setFormData({...formData, invoice: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-gradient-primary">
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
              <div className="text-2xl font-bold text-primary">8</div>
              <p className="text-xs text-muted-foreground">
                +2 desde ontem
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
              <div className="text-2xl font-bold text-primary">R$ 25.890</div>
              <p className="text-xs text-muted-foreground">
                +15% desde o mês passado
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
              <div className="text-2xl font-bold text-primary">456</div>
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
                  placeholder="Buscar por fornecedor, produto ou nota fiscal..."
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
                    <TableHead>NF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">{entry.supplier}</TableCell>
                      <TableCell>{entry.product}</TableCell>
                      <TableCell className="text-center font-semibold">{entry.quantity}</TableCell>
                      <TableCell>R$ {entry.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">R$ {entry.totalValue.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-sm">{entry.invoice}</TableCell>
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