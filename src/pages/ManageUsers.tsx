import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Eye, EyeOff, Check, AlertCircle, Users, UserCog, Trash2, Pencil, Search, User, CheckCircle, Loader2, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
  current_band?: string;
  is_active?: boolean;
  leader_id?: number | null;
  bu_id?: number | null;
  position?: string;
  leader_top?: boolean;
  link_picture?: string | null;
}

interface Business {
  id: number;
  name: string;
}

const USERS_WEBHOOK_URL = 'https://app.impulsecompany.com.br/webhook/getAllUsers';
const UPDATE_ROLE_WEBHOOK_URL = 'https://app.impulsecompany.com.br/webhook/changeRoleUser';
const UPDATE_USER_WEBHOOK_URL = 'https://app.impulsecompany.com.br/webhook/updateUser';
const GET_BUSINESS_URL = 'https://app.impulsecompany.com.br/webhook/getBusiness';
const GET_USER_PIC_URL = 'https://app.impulsecompany.com.br/webhook/getUserPicByEmail';

// Função para obter a cor da faixa
const getBandColor = (band?: string): string => {
  if (!band) return '#9ca3af'; // cinza padrão
  const bandLower = band.toLowerCase();
  switch (bandLower) {
    case 'branca': return '#FFFFFF';
    case 'azul': return '#3B82F6';
    case 'roxa': return '#8B5CF6';
    case 'marrom': return '#92400E';
    case 'preta': return '#1F2937';
    default: return '#9ca3af';
  }
};

// Função para verificar se a faixa é branca (precisa de borda)
const isWhiteBand = (band?: string): boolean => {
  return band?.toLowerCase() === 'branca';
};

const ManageUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  
  // Edit state
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    current_band: "",
    role: "",
    is_active: true,
    leader_id: "",
    bu_id: "",
    position: "",
    leader_top: false,
  });
  const [isEditLoading, setIsEditLoading] = useState(false);
  
  // Business state
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  // Delete confirmation state
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Peers state
  const [isPeersOpen, setIsPeersOpen] = useState(false);
  const [memberPeers, setMemberPeers] = useState<Record<number, number[]>>({});
  const [peersSearchQuery, setPeersSearchQuery] = useState("");
  const [selectedMemberForPeers, setSelectedMemberForPeers] = useState<SystemUser | null>(null);
  const [tempSelectedPeers, setTempSelectedPeers] = useState<number[]>([]);
  const [showOtherTeamsPeers, setShowOtherTeamsPeers] = useState(false);
  const [otherTeamsPeersSearch, setOtherTeamsPeersSearch] = useState("");
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [savingPeers, setSavingPeers] = useState(false);
  const [expandedPeersUserId, setExpandedPeersUserId] = useState<number | null>(null);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [peersTabSearchQuery, setPeersTabSearchQuery] = useState("");
  
  // Profile picture state for new user creation
  const [newUserPicUrl, setNewUserPicUrl] = useState<string | null>(null);
  const [loadingNewUserPic, setLoadingNewUserPic] = useState(false);
  const [isManualUpload, setIsManualUpload] = useState(false); // Rastreia se a foto foi upload manual
  const avatarUploadRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    current_band: "",
    bu_id: "",
    leader_id: "",
    position: "",
    leader_top: false,
  });

  const roles = [
    { value: "adm", label: "Administrador" },
    { value: "leader", label: "Líder" },
    { value: "employee", label: "Colaborador" },
  ];

  const allRoles = [
    { value: "adm", label: "Administrador" },
    { value: "leader", label: "Líder" },
    { value: "employee", label: "Colaborador" },
  ];

  const editableRoles = [
    { value: "leader", label: "Líder" },
    { value: "employee", label: "Colaborador" },
  ];

  const bandOptions = [
    { value: "branca", label: "Branca" },
    { value: "azul", label: "Azul" },
    { value: "roxa", label: "Roxa" },
    { value: "marrom", label: "Marrom" },
    { value: "preta", label: "Preta" },
  ];

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(USERS_WEBHOOK_URL);
      const data = await response.json();
      if (response.ok) {
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchBusinesses = async () => {
    setLoadingBusinesses(true);
    try {
      const response = await fetch(GET_BUSINESS_URL);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const mappedBusinesses = data.map((item: any) => ({
          id: item.json?.id || item.id,
          name: item.json?.name || item.name,
        }));
        setBusinesses(mappedBusinesses);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'adm') {
      fetchUsers();
      fetchBusinesses();
      fetchAllPeers();
    }
  }, [user?.role]);

  // Buscar todos os pares existentes
  const fetchAllPeers = async () => {
    setLoadingPeers(true);
    try {
      const response = await fetch('https://app.impulsecompany.com.br/webhook/getAllPeers');
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const peersMap: Record<number, number[]> = {};
          const peersArray = Array.isArray(data) ? data : (data?.peers || data?.data || []);
          peersArray.forEach((peer: { user_id: number; peer_user_id: number }) => {
            if (!peersMap[peer.user_id]) {
              peersMap[peer.user_id] = [];
            }
            peersMap[peer.user_id].push(peer.peer_user_id);
          });
          setMemberPeers(peersMap);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar pares:", error);
    } finally {
      setLoadingPeers(false);
    }
  };

  // Funções para gerenciar pares
  const openPeersSelection = (systemUser: SystemUser) => {
    setSelectedMemberForPeers(systemUser);
    setTempSelectedPeers(memberPeers[systemUser.id] || []);
    setPeersSearchQuery("");
  };

  const closePeersSelection = () => {
    setSelectedMemberForPeers(null);
    setTempSelectedPeers([]);
    setPeersSearchQuery("");
    setShowOtherTeamsPeers(false);
    setOtherTeamsPeersSearch("");
  };

  const getAvailablePeers = (excludeId: number) => {
    return users
      .filter(u => u.id !== excludeId)
      .filter(u => u.name.toLowerCase().includes(
        showOtherTeamsPeers ? otherTeamsPeersSearch.toLowerCase() : peersSearchQuery.toLowerCase()
      ))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleTempPeer = (peerId: number) => {
    setTempSelectedPeers(prev => {
      if (prev.includes(peerId)) {
        return prev.filter(id => id !== peerId);
      } else {
        return [...prev, peerId];
      }
    });
  };

  const applyPeersSelection = async () => {
    if (!selectedMemberForPeers) return;
    
    setSavingPeers(true);
    try {
      const response = await fetch('https://app.impulsecompany.com.br/webhook/changePeers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: selectedMemberForPeers.id, 
          peer_ids: tempSelectedPeers 
        })
      });
      
      if (response.ok) {
        setMemberPeers(prev => ({
          ...prev,
          [selectedMemberForPeers.id]: tempSelectedPeers
        }));
        toast.success(`Pares de ${selectedMemberForPeers.name} atualizados.`);
        setIsPeersOpen(false);
        closePeersSelection();
      } else {
        toast.error("Não foi possível salvar os pares.");
      }
    } catch (error) {
      console.error("Erro ao salvar pares:", error);
      toast.error("Erro ao salvar os pares.");
    } finally {
      setSavingPeers(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'adm': return 'Administrador';
      case 'leader': return 'Líder';
      case 'employee': return 'Colaborador';
      default: return role;
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const response = await fetch(UPDATE_ROLE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });

      if (response.ok) {
        toast.success('Função atualizada com sucesso!');
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        toast.error('Erro ao atualizar função');
      }
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar função');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEditClick = (systemUser: SystemUser) => {
    setEditingUser(systemUser);
    setEditFormData({
      name: systemUser.name,
      email: systemUser.email,
      password: "",
      current_band: systemUser.current_band || "",
      role: systemUser.role,
      is_active: systemUser.is_active ?? true,
      leader_id: systemUser.leader_id?.toString() || "",
      bu_id: systemUser.bu_id?.toString() || "",
      position: systemUser.position || "",
      leader_top: (systemUser as any).leader_top ?? false,
    });
  };

  const handleEditFormChange = (field: string, value: string | boolean) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsEditLoading(true);
    try {
      const response = await fetch(UPDATE_USER_WEBHOOK_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingUser.id,
          name: editFormData.name,
          email: editFormData.email,
          password: editFormData.password,
          current_band: editFormData.current_band,
          role: editFormData.role,
          is_active: editFormData.is_active,
          leader_id: editFormData.leader_id ? parseInt(editFormData.leader_id) : null,
          bu_id: editFormData.bu_id ? parseInt(editFormData.bu_id) : null,
          position: editFormData.position || null,
          leader_top: editFormData.leader_top,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário');
      }
      
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { 
              ...u, 
              name: editFormData.name,
              email: editFormData.email,
              current_band: editFormData.current_band,
              role: editFormData.role,
              is_active: editFormData.is_active,
              leader_id: editFormData.leader_id ? parseInt(editFormData.leader_id) : null,
              bu_id: editFormData.bu_id ? parseInt(editFormData.bu_id) : null,
              position: editFormData.position || undefined,
            } 
          : u
      ));
      
      toast.success('Usuário atualizado com sucesso!');
      setEditingUser(null);
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteClick = (systemUser: SystemUser) => {
    setUserToDelete(systemUser);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('https://app.impulsecompany.com.br/webhook/deleteUser', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userToDelete.id }),
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário');
      }
      
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast.success('Usuário excluído com sucesso!');
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setIsDeleting(false);
    }
  };

  // Contar quantos liderados cada líder tem
  const leaderMemberCount = users.reduce((acc, u) => {
    if (u.leader_id) {
      acc[u.leader_id] = (acc[u.leader_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filtrar líderes que ainda têm vagas (menos de 10 liderados)
  // Mas sempre incluir o líder atual do usuário sendo editado para não quebrar a edição
  const leaderUsers = users.filter(u => u.role === 'leader').filter(leader => {
    const memberCount = leaderMemberCount[leader.id] || 0;
    // Se o líder já tem 10+ membros, só mostra se for o líder atual do usuário sendo editado
    if (memberCount >= 10) {
      return editFormData.leader_id === leader.id.toString();
    }
    return true;
  });

  // Lista de líderes para criação de novo usuário (exclui líderes com 10+ membros)
  const availableLeadersForNewUser = users.filter(u => u.role === 'leader').filter(leader => {
    const memberCount = leaderMemberCount[leader.id] || 0;
    return memberCount < 10;
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch user profile picture by email
  const fetchUserPicByEmail = async (email: string) => {
    if (!email.trim() || !email.includes('@')) return;
    
    setLoadingNewUserPic(true);
    try {
      const response = await fetch(`${GET_USER_PIC_URL}?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      
      // Handle different response formats - API returns LINK_PIC
      const picUrl = Array.isArray(data) 
        ? (data[0]?.LINK_PIC || data[0]?.json?.LINK_PIC || data[0]?.pic_url || data[0]?.url)
        : (data?.LINK_PIC || data?.json?.LINK_PIC || data?.pic_url || data?.url);
      
      if (picUrl) {
        setNewUserPicUrl(picUrl);
      } else {
        setNewUserPicUrl(null);
      }
    } catch (error) {
      console.error('Erro ao buscar foto do usuário:', error);
      setNewUserPicUrl(null);
    } finally {
      setLoadingNewUserPic(false);
    }
  };

  const handleEmailBlur = () => {
    // Só busca foto pelo email se o usuário não fez upload manual
    if (formData.email.trim() && !isManualUpload) {
      fetchUserPicByEmail(formData.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.current_band || !formData.bu_id) {
      toast.error("Preencha todos os campos obrigatórios (nome, email, senha, cargo, faixa e empresa)");
      return;
    }

    setIsLoading(true);

    try {
      const createUserData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        current_band: formData.current_band,
        bu_id: parseInt(formData.bu_id),
        leader_id: formData.leader_id ? parseInt(formData.leader_id) : null,
        position: formData.position.trim() || null,
        leader_top: formData.leader_top,
        link_picture: newUserPicUrl || null,
      };

      const response = await fetch('https://app.impulsecompany.com.br/webhook/createNewUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createUserData),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (response.ok) {
        toast.success("Usuário criado com sucesso!");
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "",
          current_band: "",
          bu_id: "",
          leader_id: "",
          position: "",
          leader_top: false,
        });
        setNewUserPicUrl(null);
        setIsManualUpload(false);
        fetchUsers();
      } else {
        toast.error("Erro ao criar usuário");
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error("Erro ao criar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== "adm") {
    navigate("/home");
    return null;
  }

  // If editing a user, show the edit form
  if (editingUser) {
    return (
      <div className="min-h-screen bg-[#f8f8f8]">
        <header className="bg-primary text-primary-foreground py-4 px-3">
          <div className="px-[20%] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <h1 className="text-xl font-bold">Editar Usuário</h1>
                <p className="text-sm text-primary-foreground/80">Alterar informações de {editingUser.name}</p>
              </div>
            </div>
            <button
              onClick={() => setEditingUser(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          </div>
        </header>

        <main className="px-[20%] py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Editar Usuário</h2>
                  <p className="text-sm text-muted-foreground">Altere os dados do usuário abaixo</p>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome completo *</Label>
                    <Input
                      id="edit-name"
                      placeholder="Digite o nome"
                      value={editFormData.name}
                      onChange={(e) => handleEditFormChange("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">E-mail *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter)</Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showEditPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={editFormData.password}
                        onChange={(e) => handleEditFormChange("password", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Função *</Label>
                    <Select value={editFormData.role} onValueChange={(value) => handleEditFormChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        {allRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-band">Faixa</Label>
                    <Select value={editFormData.current_band} onValueChange={(value) => handleEditFormChange("current_band", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {bandOptions.map((band) => (
                          <SelectItem key={band.value} value={band.value}>
                            {band.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-leader">Líder</Label>
                    <Select 
                      value={editFormData.leader_id || "none"} 
                      onValueChange={(value) => handleEditFormChange("leader_id", value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o líder (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {leaderUsers.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id.toString()}>
                            {leader.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-bu">Empresa</Label>
                    <Select 
                      value={editFormData.bu_id} 
                      onValueChange={(value) => handleEditFormChange("bu_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id.toString()}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-position">Cargo</Label>
                    <Input
                      id="edit-position"
                      placeholder="Ex: Analista de Marketing"
                      value={editFormData.position}
                      onChange={(e) => handleEditFormChange("position", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                  <div>
                    <Label htmlFor="edit-active" className="text-base font-medium">Usuário Ativo</Label>
                    <p className="text-sm text-muted-foreground">Define se o usuário pode acessar o sistema</p>
                  </div>
                  <Switch
                    id="edit-active"
                    checked={editFormData.is_active}
                    onCheckedChange={(checked) => handleEditFormChange("is_active", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                  <div>
                    <Label htmlFor="edit-leader-top" className="text-base font-medium">Líder Topo</Label>
                    <p className="text-sm text-muted-foreground">Líder que não possui nenhum líder acima dele</p>
                  </div>
                  <Switch
                    id="edit-leader-top"
                    checked={editFormData.leader_top}
                    onCheckedChange={(checked) => handleEditFormChange("leader_top", checked)}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Campos marcados com * são obrigatórios</span>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isEditLoading}>
                    {isEditLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Salvar Alterações
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                    Excluindo...
                  </span>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <header className="bg-primary text-primary-foreground py-4 px-3">
        <div className="px-[20%] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-xl font-bold">Gerenciar Usuários</h1>
              <p className="text-sm text-primary-foreground/80">Criar e administrar usuários do sistema</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>
      </header>

      <main className="px-[20%] py-6">
        <Tabs defaultValue="users" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Gerenciar Usuários
            </TabsTrigger>
            <TabsTrigger value="peers" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Definir Pares
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Criar Usuário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Usuários do Sistema</h2>
                  <p className="text-sm text-muted-foreground">Edite ou exclua usuários cadastrados</p>
                </div>
              </div>

              {/* Barra de pesquisa */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar usuário por nome ou email..."
                  value={usersSearchQuery}
                  onChange={(e) => setUsersSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
              ) : (
                <div className="space-y-3">
                  {[...users]
                    .filter(u => 
                      u.name.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(usersSearchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                      const aIsLeader = a.role === 'leader';
                      const bIsLeader = b.role === 'leader';
                      if (aIsLeader && !bIsLeader) return -1;
                      if (!aIsLeader && bIsLeader) return 1;
                      return a.name.localeCompare(b.name, 'pt-BR');
                    })
                    .map((systemUser) => (
                      <div
                        key={systemUser.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar com foto de perfil */}
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                              {systemUser.link_picture ? (
                                <img 
                                  src={systemUser.link_picture} 
                                  alt={systemUser.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            {/* Indicador de faixa */}
                            <span 
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                                isWhiteBand(systemUser.current_band) ? 'border-gray-300' : 'border-background'
                              }`}
                              style={{ backgroundColor: getBandColor(systemUser.current_band) }}
                              title={`Faixa: ${systemUser.current_band || 'Não definida'}`}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{systemUser.name}</p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center flex-wrap gap-x-1 text-sm text-muted-foreground cursor-default">
                                    <span>{systemUser.email}</span>
                                    {systemUser.position && (
                                      <>
                                        <span className="flex-shrink-0">•</span>
                                        <span>{systemUser.position}</span>
                                      </>
                                    )}
                                    {systemUser.bu_id && businesses.find(b => b.id === systemUser.bu_id)?.name && (
                                      <>
                                        <span className="flex-shrink-0">•</span>
                                        <span>{businesses.find(b => b.id === systemUser.bu_id)?.name}</span>
                                      </>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start" className="max-w-xs">
                                  <p>{systemUser.email}</p>
                                  {systemUser.position && <p>Cargo: {systemUser.position}</p>}
                                  {systemUser.bu_id && businesses.find(b => b.id === systemUser.bu_id)?.name && (
                                    <p>BU: {businesses.find(b => b.id === systemUser.bu_id)?.name}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {systemUser.role !== 'adm' ? (
                            <Select
                              value={systemUser.role}
                              onValueChange={(value) => handleRoleChange(systemUser.id, value)}
                              disabled={updatingUserId === systemUser.id}
                            >
                              <SelectTrigger className="w-[140px]">
                                {updatingUserId === systemUser.id ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    Salvando...
                                  </span>
                                ) : (
                                  <SelectValue>
                                    {systemUser.role === 'leader' ? 'Líder' : 'Colaborador'}
                                  </SelectValue>
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {editableRoles.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                              Administrador
                            </span>
                          )}
                          <button
                            onClick={() => handleEditClick(systemUser)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Editar usuário"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(systemUser)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Criar Novo Usuário</h2>
                  <p className="text-sm text-muted-foreground">Preencha os dados para adicionar um novo usuário</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar preview */}
                <div className="flex justify-center mb-4">
                  <div className="relative group w-24 h-24">
                    <input
                      ref={avatarUploadRef}
                      type="file"
                      accept="image/*"
                      id="avatar-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewUserPicUrl(reader.result as string);
                            setIsManualUpload(true); // Marca como upload manual
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="w-24 h-24 rounded-full bg-muted border-2 border-input flex items-center justify-center overflow-hidden">
                      {loadingNewUserPic ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : newUserPicUrl ? (
                        <img 
                          src={newUserPicUrl} 
                          alt="Foto do usuário" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    {/* Upload overlay on hover when no photo */}
                    {!newUserPicUrl && !loadingNewUserPic && (
                      <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      >
                        <Upload className="w-6 h-6 text-white mb-1" />
                        <span className="text-xs text-white font-medium">Upload</span>
                      </label>
                    )}
                    {/* Trash overlay on hover when has photo */}
                    {newUserPicUrl && !loadingNewUserPic && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewUserPicUrl(null);
                          setIsManualUpload(false); // Volta a permitir busca por email
                          if (avatarUploadRef.current) avatarUploadRef.current.value = "";
                        }}
                        className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      >
                        <Trash2 className="w-8 h-8 text-white" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground -mt-2 mb-4">
                  A foto será buscada pelo e-mail ou faça upload manual
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      placeholder="Digite o nome"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={handleEmailBlur}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite a senha"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Função *</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="band">Faixa</Label>
                    <Select value={formData.current_band} onValueChange={(value) => handleInputChange("current_band", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {bandOptions.map((band) => (
                          <SelectItem key={band.value} value={band.value}>
                            {band.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leader">Líder</Label>
                    <Select 
                      value={formData.leader_id || "none"} 
                      onValueChange={(value) => handleInputChange("leader_id", value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o líder (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {availableLeadersForNewUser.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id.toString()}>
                            {leader.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bu">Empresa</Label>
                    <Select 
                      value={formData.bu_id} 
                      onValueChange={(value) => handleInputChange("bu_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id.toString()}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      placeholder="Ex: Analista de Marketing (opcional)"
                      value={formData.position}
                      onChange={(e) => handleInputChange("position", e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-y-0 pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="leader_top">Líder Topo</Label>
                      <p className="text-xs text-muted-foreground">Líder que não possui nenhum líder acima dele</p>
                    </div>
                    <Switch
                      id="leader_top"
                      checked={formData.leader_top}
                      onCheckedChange={(checked) => handleInputChange("leader_top", checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Campos marcados com * são obrigatórios</span>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Criar Usuário
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="peers">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Definir Pares dos Usuários</h2>
                  <p className="text-sm text-muted-foreground">Selecione um usuário para definir seus pares de avaliação</p>
                </div>
              </div>

              {/* Barra de pesquisa */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar usuário por nome..."
                  value={peersTabSearchQuery}
                  onChange={(e) => setPeersTabSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingUsers || loadingPeers ? (
                <div className="flex items-center justify-center py-8">
                  <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
              ) : (
                <div className="space-y-3">
                  {[...users]
                    .filter(u => u.role !== 'adm')
                    .filter(u => u.name.toLowerCase().includes(peersTabSearchQuery.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                    .map((systemUser) => (
                      <div key={systemUser.id} className="space-y-0">
                        <div
                          className={`flex items-center justify-between p-4 bg-muted/30 rounded-lg border transition-all ${
                            expandedPeersUserId === systemUser.id 
                              ? 'border-primary bg-primary/5 rounded-b-none' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <button
                            onClick={() => setExpandedPeersUserId(
                              expandedPeersUserId === systemUser.id ? null : systemUser.id
                            )}
                            className="flex items-center gap-3 flex-1"
                          >
                            {systemUser.link_picture ? (
                              <img src={systemUser.link_picture} alt={systemUser.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{systemUser.name}</p>
                                {systemUser.leader_top && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                    Define próprios pares
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{getRoleLabel(systemUser.role)}</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {(memberPeers[systemUser.id] || []).length} par(es)
                            </span>
                            <button
                              onClick={() => {
                                openPeersSelection(systemUser);
                                setIsPeersOpen(true);
                              }}
                              className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
                              title="Editar pares"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => setExpandedPeersUserId(
                                expandedPeersUserId === systemUser.id ? null : systemUser.id
                              )}
                              className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors"
                            >
                              {expandedPeersUserId === systemUser.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Seção de pares selecionados - expansível */}
                        {expandedPeersUserId === systemUser.id && (
                          <div className="p-4 bg-primary/5 rounded-b-lg border border-t-0 border-primary/20">
                            {(memberPeers[systemUser.id] || []).length > 0 ? (
                              <>
                                <p className="text-xs font-medium text-primary mb-3">Pares de {systemUser.name}:</p>
                                <div className="flex flex-wrap gap-2">
                                  {(memberPeers[systemUser.id] || []).map((peerId) => {
                                    const peerUser = users.find(u => u.id === peerId);
                                    const peerBuName = peerUser?.bu_id ? businesses.find(b => b.id === peerUser.bu_id)?.name : null;
                                    return peerUser ? (
                                      <span 
                                        key={peerId} 
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-card border border-border rounded-full text-xs font-medium text-foreground"
                                      >
                                        <div className="relative flex-shrink-0">
                                          {peerUser.link_picture ? (
                                            <img src={peerUser.link_picture} alt={peerUser.name} className="w-5 h-5 rounded-full object-cover" />
                                          ) : (
                                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                              <User className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                          )}
                                          <span 
                                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border ${
                                              isWhiteBand(peerUser.current_band) ? 'border-gray-300' : 'border-background'
                                            }`}
                                            style={{ backgroundColor: getBandColor(peerUser.current_band) }}
                                          />
                                        </div>
                                        <span>{peerUser.name}</span>
                                        {(peerUser.position || peerBuName) && (
                                          <span className="text-muted-foreground">
                                            ({[peerUser.position, peerBuName].filter(Boolean).join(' • ')})
                                          </span>
                                        )}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                Nenhum par definido. Clique no ícone de lápis para adicionar.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                  Excluindo...
                </span>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para Definir Pares */}
      <Dialog open={isPeersOpen} onOpenChange={(open) => {
        setIsPeersOpen(open);
        if (!open) closePeersSelection();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Selecionar Pares de {selectedMemberForPeers?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMemberForPeers && (
            <div className="space-y-4 py-4">
              {!showOtherTeamsPeers ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar pessoa..."
                      value={peersSearchQuery}
                      onChange={(e) => setPeersSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {getAvailablePeers(selectedMemberForPeers.id).length > 0 ? (
                      getAvailablePeers(selectedMemberForPeers.id).map((peer) => {
                        const isSelected = tempSelectedPeers.includes(peer.id);
                        return (
                          <button
                            key={peer.id}
                            onClick={() => toggleTempPeer(peer.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                              isSelected 
                                ? "bg-primary/10 border-2 border-primary" 
                                : "bg-card border border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                                isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                              }`}>
                                {peer.link_picture ? (
                                  <img src={peer.link_picture} alt={peer.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                  }`}>
                                    {isSelected ? (
                                      <CheckCircle className="w-5 h-5" />
                                    ) : (
                                      <User className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <span 
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                                  isWhiteBand(peer.current_band) ? 'border-gray-300' : 'border-background'
                                }`}
                                style={{ backgroundColor: getBandColor(peer.current_band) }}
                                title={`Faixa: ${peer.current_band || 'Não definida'}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{peer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[
                                  peer.position,
                                  getRoleLabel(peer.role),
                                  peer.bu_id ? businesses.find(b => b.id === peer.bu_id)?.name : null
                                ].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        {peersSearchQuery ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa disponível"}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={() => {
                        setShowOtherTeamsPeers(false);
                        setOtherTeamsPeersSearch("");
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5 rotate-[-90deg]" />
                      Voltar
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar..."
                      value={otherTeamsPeersSearch}
                      onChange={(e) => setOtherTeamsPeersSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {getAvailablePeers(selectedMemberForPeers.id).length > 0 ? (
                      getAvailablePeers(selectedMemberForPeers.id).map((peer) => {
                        const isSelected = tempSelectedPeers.includes(peer.id);
                        return (
                          <button
                            key={peer.id}
                            onClick={() => toggleTempPeer(peer.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                              isSelected 
                                ? "bg-primary/10 border-2 border-primary" 
                                : "bg-card border border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                                isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                              }`}>
                                {peer.link_picture ? (
                                  <img src={peer.link_picture} alt={peer.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                  }`}>
                                    {isSelected ? (
                                      <CheckCircle className="w-5 h-5" />
                                    ) : (
                                      <User className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <span 
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                                  isWhiteBand(peer.current_band) ? 'border-gray-300' : 'border-background'
                                }`}
                                style={{ backgroundColor: getBandColor(peer.current_band) }}
                                title={`Faixa: ${peer.current_band || 'Não definida'}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{peer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[
                                  peer.position,
                                  getRoleLabel(peer.role),
                                  peer.bu_id ? businesses.find(b => b.id === peer.bu_id)?.name : null
                                ].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground py-2 text-center">
                        {otherTeamsPeersSearch ? "Nenhuma pessoa encontrada" : "Nenhum usuário disponível"}
                      </p>
                    )}
                  </div>
                </>
              )}
              
              <div className="pt-3 border-t border-border space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  {tempSelectedPeers.length} par(es) selecionado(s) para {selectedMemberForPeers.name}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      closePeersSelection();
                      setIsPeersOpen(false);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={applyPeersSelection}
                    className="flex-1"
                    disabled={
                      savingPeers ||
                      (selectedMemberForPeers && 
                      JSON.stringify([...(memberPeers[selectedMemberForPeers.id] || [])].sort()) === 
                      JSON.stringify([...tempSelectedPeers].sort()))
                    }
                  >
                    {savingPeers ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsers;