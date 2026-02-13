import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Plus, Pencil, Trash2, Loader2, Search as SearchIcon, ChevronDown, ChevronUp, Users, ArrowRightLeft, Upload, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/logo.jpg";

interface BU {
  id: number;
  name: string;
  color_hex: string;
  is_active: boolean;
  link_picture?: string;
}

interface BUUser {
  id: number;
  name: string;
  email: string;
  role: string;
  position?: string;
  link_picture?: string | null;
  current_band?: string;
}

// Retorna a cor hex da faixa
const getBandColorHex = (band: string): string => {
  const colors: Record<string, string> = {
    branca: '#FFFFFF',
    azul: '#3B82F6',
    roxa: '#8B5CF6',
    marrom: '#92400E',
    preta: '#1F2937',
  };
  return colors[band?.toLowerCase()] || '#FFFFFF';
};

// Traduz os roles para português
const translateRole = (role: string): string => {
  const translations: Record<string, string> = {
    admin: "Administrador",
    leader: "Líder",
    user: "Colaborador",
    manager: "Gestor",
    employee: "Colaborador",
    hr: "RH",
    director: "Diretor",
  };
  return translations[role?.toLowerCase()] || role || "Colaborador";
};

// Calcula luminância relativa e retorna cor do texto (preto ou branco)
const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Fórmula de luminância relativa (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const ManageBUs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bus, setBUs] = useState<BU[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBU, setSelectedBU] = useState<BU | null>(null);
  const [buName, setBuName] = useState("");
  const [buColor, setBuColor] = useState("#000000");
  const [buIsActive, setBuIsActive] = useState(true);
  const [buImage, setBuImage] = useState<File | null>(null);
  const [buImagePreview, setBuImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Expand states
  const [expandedBUs, setExpandedBUs] = useState<Set<number>>(new Set());
  const [buUsers, setBuUsers] = useState<Record<number, BUUser[]>>({});
  const [loadingUsers, setLoadingUsers] = useState<Set<number>>(new Set());
  
  // Change BU states
  const [isChangeBUDialogOpen, setIsChangeBUDialogOpen] = useState(false);
  const [userToChangeBU, setUserToChangeBU] = useState<{ user: BUUser; currentBuId: number } | null>(null);
  const [newBuId, setNewBuId] = useState<string>("");
  const [changingBU, setChangingBU] = useState(false);

  useEffect(() => {
    fetchBUs();
  }, []);

  const fetchBUs = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://app.impulsecompany.com.br/webhook/getAllBUs");
      const data = await response.json();
      setBUs(data || []);
    } catch (error) {
      console.error("Erro ao buscar BUs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as BUs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!buName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da BU é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (buName.trim().length > 100) {
      toast({
        title: "Erro",
        description: "O nome da BU deve ter no máximo 100 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let imageBase64: string | undefined;
      
      // Se uma imagem foi selecionada, converter para base64
      if (buImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(buImage);
        });
      }

      const response = await fetch("https://app.impulsecompany.com.br/webhook/createBU", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: buName.trim(),
          color_hex: buColor,
          is_active: buIsActive,
          ...(imageBase64 && { link_picture: imageBase64 })
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "BU criada com sucesso!",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchBUs();
      } else {
        throw new Error("Falha ao criar BU");
      }
    } catch (error) {
      console.error("Erro ao criar BU:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a BU.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedBU || !buName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da BU é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (buName.trim().length > 100) {
      toast({
        title: "Erro",
        description: "O nome da BU deve ter no máximo 100 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let imageBase64: string | undefined;
      
      // Se uma nova imagem foi selecionada, converter para base64
      if (buImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(buImage);
        });
      }

      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateBU", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedBU.id, 
          name: buName.trim(),
          color_hex: buColor,
          is_active: buIsActive,
          ...(imageBase64 && { link_picture: imageBase64 })
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "BU atualizada com sucesso!",
        });
        setIsEditDialogOpen(false);
        setSelectedBU(null);
        resetForm();
        fetchBUs();
      } else {
        throw new Error("Falha ao atualizar BU");
      }
    } catch (error) {
      console.error("Erro ao atualizar BU:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a BU.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBU) return;

    setSaving(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/deleteBU", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bu_id: selectedBU.id }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "BU excluída com sucesso!",
        });
        setIsDeleteDialogOpen(false);
        setSelectedBU(null);
        fetchBUs();
      } else {
        throw new Error("Falha ao excluir BU");
      }
    } catch (error) {
      console.error("Erro ao excluir BU:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a BU.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBuName("");
    setBuColor("#000000");
    setBuIsActive(true);
    setBuImage(null);
    setBuImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBuImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setBuImage(null);
    setBuImagePreview(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (bu: BU) => {
    setSelectedBU(bu);
    setBuName(bu.name);
    setBuColor(bu.color_hex || "#000000");
    setBuIsActive(bu.is_active);
    setBuImage(null);
    setBuImagePreview(bu.link_picture || null);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (bu: BU) => {
    setSelectedBU(bu);
    setIsDeleteDialogOpen(true);
  };

  const toggleExpand = async (buId: number) => {
    const newExpanded = new Set(expandedBUs);
    
    if (newExpanded.has(buId)) {
      newExpanded.delete(buId);
    } else {
      newExpanded.add(buId);
      
      // Fetch users if not already loaded
      if (!buUsers[buId]) {
        setLoadingUsers(prev => new Set(prev).add(buId));
        try {
          const response = await fetch(`https://app.impulsecompany.com.br/webhook/getAllUsersByBU?bu_id=${buId}`);
          const data = await response.json();
          setBuUsers(prev => ({ ...prev, [buId]: data || [] }));
        } catch (error) {
          console.error("Erro ao buscar usuários da BU:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os usuários.",
            variant: "destructive",
          });
        } finally {
          setLoadingUsers(prev => {
            const next = new Set(prev);
            next.delete(buId);
            return next;
          });
        }
      }
    }
    
    setExpandedBUs(newExpanded);
  };

  const openChangeBUDialog = (user: BUUser, currentBuId: number) => {
    setUserToChangeBU({ user, currentBuId });
    setNewBuId("");
    setIsChangeBUDialogOpen(true);
  };

  const handleChangeBU = async () => {
    if (!userToChangeBU || !newBuId) {
      toast({
        title: "Erro",
        description: "Selecione uma BU de destino.",
        variant: "destructive",
      });
      return;
    }

    setChangingBU(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/changeUserBU", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userToChangeBU.user.id,
          bu_id: parseInt(newBuId),
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `${userToChangeBU.user.name} foi transferido para outra BU.`,
        });
        
        // Remove user from old BU list
        setBuUsers(prev => ({
          ...prev,
          [userToChangeBU.currentBuId]: prev[userToChangeBU.currentBuId]?.filter(
            u => u.id !== userToChangeBU.user.id
          ) || [],
        }));
        
        // Clear cache for new BU to force refresh
        const newBuIdNum = parseInt(newBuId);
        if (buUsers[newBuIdNum]) {
          setBuUsers(prev => {
            const next = { ...prev };
            delete next[newBuIdNum];
            return next;
          });
        }
        
        setIsChangeBUDialogOpen(false);
        setUserToChangeBU(null);
      } else {
        throw new Error("Falha ao trocar BU");
      }
    } catch (error) {
      console.error("Erro ao trocar BU:", error);
      toast({
        title: "Erro",
        description: "Não foi possível trocar a BU do usuário.",
        variant: "destructive",
      });
    } finally {
      setChangingBU(false);
    }
  };

  const filteredBUs = bus.filter((bu) =>
    bu.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-[20%] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-full" />
          <div>
            <h1 className="font-bold text-lg">Gerenciar BUs</h1>
            <p className="text-xs text-primary-foreground/70">Administração de Business Units</p>
          </div>
        </div>
        <Link
          to="/home"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <main className="px-[20%] py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Business Units</h2>
                <p className="text-sm text-muted-foreground">Gerencie as BUs do sistema</p>
              </div>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova BU
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar BU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* BU List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredBUs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "Nenhuma BU encontrada." : "Nenhuma BU cadastrada."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBUs.map((bu) => (
                  <Collapsible
                    key={bu.id}
                    open={expandedBUs.has(bu.id)}
                    onOpenChange={() => toggleExpand(bu.id)}
                  >
                    <div className="rounded-lg border bg-card overflow-hidden">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {bu.link_picture ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                              <img 
                                src={bu.link_picture} 
                                alt={bu.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: bu.color_hex || "#000000" }}
                            >
                              <Building2 
                                className="w-5 h-5" 
                                style={{ color: getContrastColor(bu.color_hex || "#000000") }}
                              />
                            </div>
                          )}
                          <span className="font-medium">{bu.name}</span>
                          <Badge variant={bu.is_active ? "default" : "secondary"}>
                            {bu.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver usuários"
                            >
                              {loadingUsers.has(bu.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : expandedBUs.has(bu.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(bu); }}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(bu); }}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CollapsibleContent>
                        <div className="border-t bg-muted/30 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Usuários ({buUsers[bu.id]?.filter(u => u && u.id && u.name).length || 0})
                            </span>
                          </div>
                          
                          {loadingUsers.has(bu.id) ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                          ) : !buUsers[bu.id] || buUsers[bu.id].filter(u => u && u.id && u.name).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum usuário nesta BU.
                            </p>
                          ) : (
                            <div className="grid gap-2">
                              {buUsers[bu.id]?.filter(u => u && u.id && u.name).map((buUser) => (
                                <div
                                  key={buUser.id}
                                  className="flex items-center gap-3 p-2 rounded-md bg-background border"
                                >
                                  <div className="relative">
                                    <Avatar className="w-8 h-8">
                                      {buUser.link_picture && (
                                        <AvatarImage src={buUser.link_picture} alt={buUser.name} className="object-cover" />
                                      )}
                                      <AvatarFallback className="text-xs">
                                        {buUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {buUser.current_band && (
                                      <span 
                                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${buUser.current_band?.toLowerCase() === 'branca' ? 'ring-1 ring-muted-foreground/30' : ''}`}
                                        style={{ backgroundColor: getBandColorHex(buUser.current_band) }}
                                        title={`Faixa ${buUser.current_band}`}
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{buUser.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {translateRole(buUser.role)}{buUser.position ? ` • ${buUser.position}` : ""}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openChangeBUDialog(buUser, bu.id)}
                                    title="Trocar de BU"
                                    className="h-8 w-8"
                                  >
                                    <ArrowRightLeft className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova BU</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome</Label>
              <Input
                id="create-name"
                placeholder="Nome da BU"
                value={buName}
                onChange={(e) => setBuName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-color">Cor da empresa</Label>
              <div className="flex items-center gap-3">
                <input
                  id="create-color"
                  type="color"
                  value={buColor}
                  onChange={(e) => setBuColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={buColor}
                  onChange={(e) => setBuColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-active">Ativa</Label>
              <Switch
                id="create-active"
                checked={buIsActive}
                onCheckedChange={setBuIsActive}
              />
            </div>
            
            {/* Upload de imagem */}
            <div className="space-y-2">
              <Label>Imagem da BU</Label>
              {buImagePreview ? (
                <div className="relative w-full">
                  <img
                    src={buImagePreview}
                    alt="Preview da BU"
                    className="w-full h-32 object-contain rounded-lg border bg-muted"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-6 h-6"
                    onClick={removeImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="create-image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                  <input
                    id="create-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar BU</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Nome da BU"
                value={buName}
                onChange={(e) => setBuName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Cor da empresa</Label>
              <div className="flex items-center gap-3">
                <input
                  id="edit-color"
                  type="color"
                  value={buColor}
                  onChange={(e) => setBuColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={buColor}
                  onChange={(e) => setBuColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Ativa</Label>
              <Switch
                id="edit-active"
                checked={buIsActive}
                onCheckedChange={setBuIsActive}
              />
            </div>
            
            {/* Upload de imagem */}
            <div className="space-y-2">
              <Label>Imagem da BU</Label>
              {buImagePreview ? (
                <div className="relative w-full">
                  <img
                    src={buImagePreview}
                    alt="Preview da BU"
                    className="w-full h-32 object-contain rounded-lg border bg-muted"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-6 h-6"
                    onClick={removeImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="edit-image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                  <input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir BU</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a BU "{selectedBU?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change BU Dialog */}
      <Dialog open={isChangeBUDialogOpen} onOpenChange={setIsChangeBUDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar BU do Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {userToChangeBU?.user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userToChangeBU?.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {translateRole(userToChangeBU?.user.role || "")}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Nova BU</Label>
              <Select value={newBuId} onValueChange={setNewBuId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a BU de destino" />
                </SelectTrigger>
                <SelectContent>
                  {bus
                    .filter(b => b.id !== userToChangeBU?.currentBuId && b.is_active)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: b.color_hex || "#000000" }}
                          />
                          {b.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeBUDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeBU} disabled={changingBU || !newBuId}>
              {changingBU && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageBUs;
