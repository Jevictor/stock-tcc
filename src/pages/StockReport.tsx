import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, BarChart3, AlertTriangle, Package, Filter } from "lucide-react";

const mockStockReport = [
  {
    id: "1",
    code: "MSE001",
    name: "Mouse Gamer RGB",
    category: "Periféricos",
    supplier: "TechParts Ltda",
    currentStock: 25,
    minStock: 10,
    maxStock: 100,
    avgCost: 45.90,
    totalValue: 1147.50,
    status: "normal",
    lastMovement: "2024-01-15"
  },
  {
    id: "2",
    code: "TEC002",
    name: "Teclado Mecânico",
    category: "Periféricos",
    supplier: "ComponenteX",
    currentStock: 8,
    minStock: 15,
    maxStock: 50,
    avgCost: 120.00,
    totalValue: 960.00,
    status: "low",
    lastMovement: "2024-01-14"
  },
  {
    id: "3",
    code: "MON003",
    name: "Monitor 24\"",
    category: "Monitores",
    supplier: "Displays Pro",
    currentStock: 12,
    minStock: 5,
    maxStock: 30,
    avgCost: 280.00,
    totalValue: 3360.00,
    status: "normal",
    lastMovement: "2024-01-13"
  },
  {
    id: "4",
    code: "CAB004",
    name: "Cabo USB-C",
    category: "Acessórios",
    supplier: "TechParts Ltda",
    currentStock: 3,
    minStock: 20,
    maxStock: 100,
    avgCost: 15.90,
    totalValue: 47.70,
    status: "critical",
    lastMovement: "2024-01-12"
  },
  {
    id: "5",
    code: "ADP005",
    name: "Adaptador HDMI",
    category: "Acessórios",
    supplier: "ComponenteX",
    currentStock: 0,
    minStock: 15,
    maxStock: 50,
    avgCost: 25.50,
    totalValue: 0.00,
    status: "out_of_stock",
    lastMovement: "2024-01-10"
  }
];

const categories = ["Todos", "Periféricos", "Monitores", "Acessórios", "Computadores"];
const suppliers = ["Todos", "TechParts Ltda", "ComponenteX", "Displays Pro"];
const statusFilters = ["Todos", "normal", "low", "critical", "out_of_stock"];

export const StockReport = () => {
  const [stockData] = useState(mockStockReport);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [supplierFilter, setSupplierFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filteredStock = stockData.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "Todos" || item.category === categoryFilter;
    const matchesSupplier = supplierFilter === "Todos" || item.supplier === supplierFilter;
    const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  const getStatusBadge = (status: string, current: number, min: number) => {
    switch (status) {
      case "out_of_stock":
        return <Badge variant="destructive">Sem Estoque</Badge>;
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "low":
        return <Badge className="bg-warning text-warning-foreground">Baixo</Badge>;
      default:
        return <Badge className="bg-success text-success-foreground">Normal</Badge>;
    }
  };

  const calculateSummary = () => {
    const totalProducts = stockData.length;
    const totalValue = stockData.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockCount = stockData.filter(item => item.status === "low" || item.status === "critical").length;
    const outOfStockCount = stockData.filter(item => item.status === "out_of_stock").length;
    
    return { totalProducts, totalValue, lowStockCount, outOfStockCount };
  };

  const summary = calculateSummary();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary">Consulta de Estoque</h1>
          <p className="text-muted-foreground">
            Visualize saldos, alertas e relatórios de estoque
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalProducts}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {summary.totalValue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estoque Baixo
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{summary.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Produtos precisando reposição
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sem Estoque
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.outOfStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Produtos zerados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Report */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatório de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-5 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos Status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center text-sm text-muted-foreground">
                {filteredStock.length} produtos encontrados
              </div>
            </div>

            {/* Stock Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Mín/Máx</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Mov.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-sm">{item.supplier}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          item.status === 'out_of_stock' ? 'text-destructive' :
                          item.status === 'critical' ? 'text-destructive' :
                          item.status === 'low' ? 'text-warning' : 'text-primary'
                        }`}>
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {item.minStock}/{item.maxStock}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {item.avgCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {item.totalValue.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status, item.currentStock, item.minStock)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.lastMovement}
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