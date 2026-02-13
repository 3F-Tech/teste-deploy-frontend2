import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Upload, Trash2, Save, Loader2, LogOut, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import logo from "@/assets/logo.jpg";

const ProfileEdit = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userPicUrl, setUserPicUrl] = useState<string | null>(null);
  const [newPicUrl, setNewPicUrl] = useState<string | null>(null);
  const [isManualUpload, setIsManualUpload] = useState(false);
  const [buName, setBuName] = useState<string>("");
  const [buPicUrl, setBuPicUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
  });

  // Estados para modal de senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Buscar foto atual do usuário
  useEffect(() => {
    const fetchUserPic = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`https://app.impulsecompany.com.br/webhook/getUserPicByEmailIUser?email=${encodeURIComponent(user.email)}`);
          if (response.ok) {
            const text = await response.text();
            if (text && text.trim()) {
              const data = JSON.parse(text);
              const picUrl = Array.isArray(data) 
                ? (data[0]?.link_picture || data[0]?.LINK_PIC || data[0]?.pic_url || data[0]?.url)
                : (data?.link_picture || data?.LINK_PIC || data?.pic_url || data?.url);
              if (picUrl) {
                setUserPicUrl(picUrl);
                setNewPicUrl(picUrl);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar foto do usuário:', error);
        }
      }
    };
    
    fetchUserPic();
  }, [user?.email]);

  // Buscar BU do usuário
  useEffect(() => {
    const fetchBU = async () => {
      if (user?.bu_id) {
        try {
          const response = await fetch(`https://app.impulsecompany.com.br/webhook/getBUUser?bu_id=${user.bu_id}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              setBuName(data[0].name || data[0].BU_NAME || "");
              setBuPicUrl(data[0].link_picture || null);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar BU:', error);
        }
      }
    };
    
    fetchBU();
  }, [user?.bu_id]);

  // Carregar dados do usuário no formulário
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        position: user.position || "",
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    // Validações
    if (!passwordData.currentPassword) {
      setPasswordError("Digite sua senha atual");
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError("Digite a nova senha");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/userChangePassword", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user?.id,
          old_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Senha alterada!",
          description: "Sua senha foi alterada com sucesso.",
        });
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao alterar senha");
      }
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      setPasswordError(error.message || "Erro ao alterar senha. Verifique sua senha atual.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewPicUrl(reader.result as string);
        setIsManualUpload(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewPicUrl(null);
    setIsManualUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateUser", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          name: formData.name,
          position: formData.position,
          link_picture: newPicUrl,
        }),
      });

      if (response.ok) {
        // Atualizar contexto de autenticação com os novos dados
        updateUser({
          name: formData.name,
          position: formData.position,
        });
        
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso.",
        });
        // Atualizar dados locais se necessário
        setUserPicUrl(newPicUrl);
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      adm: "Administrador",
      leader_top: "Líder Top",
      leader: "Líder",
      led: "Liderado",
    };
    return labels[role] || role;
  };

  const getBandColor = (band: string) => {
    const bandLower = band?.toLowerCase();
    switch (bandLower) {
      case 'branca':
        return { gradient: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)', text: '#374151' };
      case 'azul':
        return { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', text: '#ffffff' };
      case 'roxa':
        return { gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', text: '#ffffff' };
      case 'marrom':
        return { gradient: 'linear-gradient(135deg, #a16207 0%, #78350f 100%)', text: '#ffffff' };
      case 'preta':
        return { gradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)', text: '#ffffff' };
      default:
        return { gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)', text: '#ffffff' };
    }
  };

  const bandColors = getBandColor(user?.current_band || '');

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <header className="bg-primary text-primary-foreground py-4 px-3">
        <div className="px-[20%] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Meu Perfil</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/home"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-[20%] py-8">
        <div className="max-w-3xl mx-auto">
          {/* Card do Perfil com Faixa */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
            {/* Faixa colorida de fundo */}
            <div 
              className="h-24 w-full relative"
              style={{ background: bandColors.gradient }}
            >
              {/* Texto da faixa na extremidade direita */}
              {user?.current_band && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span 
                    className="text-lg font-bold uppercase tracking-wider opacity-90"
                    style={{ color: bandColors.text }}
                  >
                    Faixa {user.current_band.charAt(0).toUpperCase() + user.current_band.slice(1).toLowerCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Conteúdo do perfil */}
            <div className="px-8 pb-8">
              <div className="flex items-end gap-6 -mt-12">
                {/* Foto de perfil */}
                <div className="relative flex-shrink-0">
                  <div 
                    className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg"
                    style={{ background: newPicUrl ? 'transparent' : '#f3f4f6' }}
                  >
                    {newPicUrl ? (
                      <img 
                        src={newPicUrl} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-14 h-14 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Botões de ação da foto */}
                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                      title="Alterar foto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    {newPicUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Informações do usuário ao lado da foto */}
                <div className="flex-1 pt-14">
                  <h2 className="text-2xl font-bold text-foreground">{formData.name || "Usuário"}</h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-muted-foreground">
                    {user?.role && (
                      <span className="font-medium text-foreground/80">{getRoleLabel(user.role)}</span>
                    )}
                    {formData.position && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{formData.position}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{formData.email}</p>
                </div>

                {/* Empresa do usuário */}
                {buName && (
                  <div className="flex items-center gap-3 pt-14">
                    {buPicUrl && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shadow-sm flex-shrink-0">
                        <img 
                          src={buPicUrl} 
                          alt={buName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Empresa</p>
                      <p className="text-sm font-semibold text-foreground">{buName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulário de edição */}
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h3 className="text-lg font-semibold mb-6">Editar Informações</h3>
            
            <div className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Email (somente leitura) */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado
                </p>
              </div>

              {/* Cargo */}
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Seu cargo"
                  disabled={user?.role !== 'adm'}
                  className={user?.role !== 'adm' ? 'bg-muted' : ''}
                />
                {user?.role !== 'adm' && (
                  <p className="text-xs text-muted-foreground">
                    Apenas administradores podem alterar o cargo
                  </p>
                )}
              </div>

              {/* Botão Alterar Senha */}
              <div className="space-y-2">
                <Label>Senha</Label>
                <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Alterar Senha</DialogTitle>
                      <DialogDescription>
                        Digite sua senha atual e a nova senha para confirmar a alteração.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Senha Atual */}
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            placeholder="Digite sua senha atual"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Nova Senha */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="Digite a nova senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirmar Nova Senha */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Confirme a nova senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Mensagem de Erro */}
                      {passwordError && (
                        <p className="text-sm text-destructive">{passwordError}</p>
                      )}

                      {/* Botão Confirmar */}
                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="w-full"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Alterando...
                          </>
                        ) : (
                          "Confirmar Alteração"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Botão Salvar */}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileEdit;