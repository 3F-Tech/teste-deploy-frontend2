import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Loader2, User, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpg";

interface FormData {
  email: string;
  password: string;
  name: string;
  surname: string;
  bu_id: number | null;
}

interface Business {
  id: number;
  name: string;
}

const WEBHOOK_URL = "https://app.impulsecompany.com.br/webhook/confirmLogin2";
const DECODE_TOKEN_URL = "https://app.impulsecompany.com.br/webhook/decodeToken";
const GET_BUSINESS_URL = "https://app.impulsecompany.com.br/webhook/getBusiness";
const SIGNUP_URL = "https://app.impulsecompany.com.br/webhook/createNewUser";
const GET_USER_PIC_URL = "https://app.impulsecompany.com.br/webhook/getUserPicByEmail";
const GET_USER_PIC_LOGIN_URL = "https://app.impulsecompany.com.br/webhook/getUserPicByEmailIUser";

export default function LoginScreen() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [userPicUrl, setUserPicUrl] = useState<string | null>(null);
  const [loadingPic, setLoadingPic] = useState(false);
  const [isManualUpload, setIsManualUpload] = useState(false); // Rastreia se a foto foi upload manual
  const signupAvatarRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
    surname: "",
    bu_id: null,
  });

  // Fetch businesses when switching to signup mode and clear pic when switching modes
  useEffect(() => {
    if (!isLogin) {
      fetchBusinesses();
    }
    // Clear user pic when switching between login/signup
    setUserPicUrl(null);
  }, [isLogin]);

  const fetchBusinesses = async () => {
    setLoadingBusinesses(true);
    try {
      const response = await fetch(GET_BUSINESS_URL);
      const data = await response.json();
      const businessList = Array.isArray(data) ? data : [data];
      // API returns data inside item.json, so extract it
      const mappedBusinesses = businessList.map((item: any) => ({
        id: item.json?.id || item.id,
        name: item.json?.name || item.name,
      }));
      setBusinesses(mappedBusinesses);
      // Set first business as default
      if (mappedBusinesses.length > 0) {
        setFormData((prev) => ({ ...prev, bu_id: mappedBusinesses[0].id }));
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      toast.error("Erro ao carregar empresas disponíveis");
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const fetchUserPicByEmail = async (email: string, forLogin: boolean = false) => {
    if (!email.trim() || !email.includes("@")) return;

    setLoadingPic(true);
    try {
      const url = forLogin ? GET_USER_PIC_LOGIN_URL : GET_USER_PIC_URL;
      const response = await fetch(`${url}?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      // Handle different response formats - API returns LINK_PIC or link_picture
      const picUrl = Array.isArray(data)
        ? data[0]?.LINK_PIC || data[0]?.link_picture || data[0]?.json?.LINK_PIC || data[0]?.pic_url || data[0]?.url
        : data?.LINK_PIC || data?.link_picture || data?.json?.LINK_PIC || data?.pic_url || data?.url;

      if (picUrl) {
        setUserPicUrl(picUrl);
      } else {
        setUserPicUrl(null);
      }
    } catch (error) {
      console.error("Erro ao buscar foto do usuário:", error);
      setUserPicUrl(null);
    } finally {
      setLoadingPic(false);
    }
  };

  const handleEmailBlur = () => {
    if (formData.email.trim()) {
      // Só busca pelo email se não tiver foto de upload manual
      if (!isManualUpload) {
        fetchUserPicByEmail(formData.email, isLogin);
      }
    } else {
      // Clear profile picture when email is empty
      setUserPicUrl(null);
      setIsManualUpload(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "bu_id" ? (value ? parseInt(value) : null) : value,
    });
  };

  const handleSignup = async () => {
    if (!formData.name.trim() || !formData.surname.trim()) {
      toast.error("Preencha nome e sobrenome");
      return;
    }
    if (!formData.bu_id) {
      toast.error("Selecione uma empresa");
      return;
    }
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("Preencha e-mail e senha");
      return;
    }

    setIsLoading(true);
    try {
      const signupData = {
        name: `${formData.name.trim()} ${formData.surname.trim()}`,
        email: formData.email.trim(),
        password: formData.password,
        bu_id: formData.bu_id,
        current_band: "",
        link_picture: userPicUrl || null,
      };

      const response = await fetch(SIGNUP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const text = await response.text();

      if (!text) {
        toast.error("Servidor não retornou dados. Tente novamente.");
        return;
      }

      const data = JSON.parse(text);

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (response.ok) {
        toast.success("Conta criada com sucesso! Faça login para continuar.");
        setIsLogin(true);
        setFormData({
          email: formData.email,
          password: "",
          name: "",
          surname: "",
          bu_id: null,
        });
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      toast.error("Erro de conexão. Verifique se o servidor está ativo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const text = await response.text();

      if (!text) {
        toast.error("Servidor não retornou dados. Tente novamente.");
        return;
      }

      const data = JSON.parse(text);

      if (data.error) {
        if (data.error === "user not found") {
          toast.error("Usuário não encontrado. Verifique seu e-mail.");
        } else if (data.error === "password wrong") {
          toast.error("Senha incorreta. Tente novamente.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (response.ok) {
        const loginData = Array.isArray(data) ? data[0] : data;
        const jwtToken = loginData?.token || data?.token;

        if (!jwtToken) {
          toast.error("Token não retornado pelo servidor.");
          return;
        }

        const decodeResponse = await fetch(DECODE_TOKEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: jwtToken }),
        });

        const decodeText = await decodeResponse.text();

        if (!decodeText) {
          toast.error("Erro ao decodificar token.");
          return;
        }

        const decodedData = JSON.parse(decodeText);
        const userData = Array.isArray(decodedData) ? decodedData[0] : decodedData;

        if (userData && userData.id) {
          setAuth(userData, jwtToken);
          toast.success(`Bem-vindo, ${userData.name || "usuário"}!`);
          navigate("/home");
        } else {
          toast.error("Erro ao obter dados do usuário.");
        }
      } else {
        toast.error("Credenciais inválidas");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("Erro de conexão. Verifique se o servidor está ativo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isLogin) {
      await handleLogin();
    } else {
      await handleSignup();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", name: "", surname: "", bu_id: null });
    setShowPassword(false);
    setUserPicUrl(null);
  };

  return (
    <div className="w-full min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[hsl(var(--hero-gradient-start))] via-[hsl(var(--hero-gradient-mid))] to-[hsl(var(--hero-gradient-end))] items-center justify-start p-12 pl-16 xl:pl-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-primary-foreground/10 rounded-full" />
        <div className="absolute top-32 right-32 w-16 h-16 border border-primary-foreground/10 rounded-full" />
        <div className="absolute bottom-20 right-40 w-24 h-24 border border-primary-foreground/10 rounded-full" />
        <div className="absolute bottom-40 left-1/2 w-px h-32 bg-primary-foreground/10" />
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary-foreground/20 rounded-full" />
        <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-primary-foreground/20 rounded-full" />

        <div className="text-primary-foreground relative z-10">
          <div className="w-12 h-0.5 bg-primary-foreground/40 mb-8" />
          <h1 className="text-7xl xl:text-8xl font-bold leading-tight tracking-tight">
            <span className="block">
              <span className="text-primary-foreground/60">F</span>é
            </span>
            <span className="block">
              <span className="text-primary-foreground/60">F</span>amília
            </span>
            <span className="block">
              <span className="text-primary-foreground/60">F</span>uturo
            </span>
          </h1>
          <div className="w-24 h-0.5 bg-primary-foreground/40 mt-8" />
        </div>
      </div>

      {/* Right side - Login/Signup form */}
      <div className="flex-1 bg-background flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo/Icon or User Avatar for login */}
          <div className="text-center mb-8">
            {isLogin && (userPicUrl || loadingPic) ? (
              <div className="flex justify-center mb-4">
                <div className="w-28 h-28 rounded-full bg-muted border-2 border-input flex items-center justify-center overflow-hidden">
                  {loadingPic ? (
                    <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                  ) : (
                    <img src={userPicUrl!} alt="Foto do usuário" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            ) : (
              <img src={logo} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-lg object-contain" />
            )}
            <h2 className="text-3xl font-bold text-foreground">{isLogin ? "Bem-vindo de volta" : "Junte-se a nós"}</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signup fields */}
            {!isLogin && (
              <>
                {/* Avatar upload */}
                <div className="flex justify-center mb-4">
                  <div className="relative group w-24 h-24">
                    <input
                      ref={signupAvatarRef}
                      type="file"
                      accept="image/*"
                      id="signup-avatar-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUserPicUrl(reader.result as string);
                            setIsManualUpload(true); // Marca como upload manual
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="w-24 h-24 rounded-full bg-muted border-2 border-input flex items-center justify-center overflow-hidden">
                      {loadingPic ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : userPicUrl ? (
                        <img src={userPicUrl} alt="Foto do usuário" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    {/* Upload overlay on hover when no photo */}
                    {!userPicUrl && !loadingPic && (
                      <label
                        htmlFor="signup-avatar-upload"
                        className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      >
                        <Upload className="w-6 h-6 text-white mb-1" />
                        <span className="text-xs text-white font-medium">Upload</span>
                      </label>
                    )}
                    {/* Trash overlay on hover when has photo */}
                    {userPicUrl && !loadingPic && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserPicUrl(null);
                          setIsManualUpload(false); // Volta a permitir busca por email
                          if (signupAvatarRef.current) signupAvatarRef.current.value = "";
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-card text-foreground outline-none focus:outline-none focus:border-primary transition-all duration-200"
                      placeholder="Seu nome"
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <label htmlFor="surname" className="block text-sm font-medium text-foreground mb-2">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      id="surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-card text-foreground outline-none focus:outline-none focus:border-primary transition-all duration-200"
                      placeholder="Seu sobrenome"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bu_id" className="block text-sm font-medium text-foreground mb-2">
                    Empresa
                  </label>
                  <select
                    id="bu_id"
                    name="bu_id"
                    value={formData.bu_id || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-card text-foreground outline-none focus:outline-none focus:border-primary transition-all duration-200"
                    required={!isLogin}
                    disabled={loadingBusinesses}
                  >
                    {loadingBusinesses ? (
                      <option value="">Carregando empresas...</option>
                    ) : (
                      businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Seu e-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleEmailBlur}
                className="w-full px-4 py-3 border border-input rounded-lg bg-card text-foreground outline-none focus:outline-none focus:border-primary transition-all duration-200"
                placeholder="Digite seu e-mail"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {isLogin ? "Senha" : "Criar nova senha"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-input rounded-lg bg-card text-foreground outline-none focus:outline-none focus:border-primary transition-all duration-200"
                  placeholder={isLogin ? "Digite sua senha" : "Crie uma senha segura"}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-end">
                <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (!isLogin && loadingBusinesses)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? "Entrando..." : "Criando conta..."}
                </>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar nova conta"
              )}
            </button>

            <div className="text-center">
              <span className="text-muted-foreground">{isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}</span>{" "}
              <button type="button" onClick={toggleMode} className="text-primary hover:text-primary/80 font-semibold">
                {isLogin ? "Cadastre-se" : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
