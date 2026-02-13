import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LogOut,
  ClipboardList,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Search,
  X,
  Users,
  Trophy,
  Sparkles,
  Building2,
  FileBarChart,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface EvaluationFromAPI {
  id: number;
  evaluator_user_id: number;
  evaluated_user_id: number;
  evaluation_type: string;
  status?: string;
  evalution_cycle_id?: number;
  competency?: number;
  skill?: number;
  attitude?: number;
  result?: number;
  overall_score?: number;
  observation?: string;
}

interface UserInfo {
  id: number;
  name: string;
  position?: string;
  role?: string;
  current_band?: string;
  leader_id?: number | null;
  bu_id?: number | null;
  link_picture?: string | null;
}

const Report = () => {
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get("cycle_id");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados para a seção de Avaliações
  const [allEvaluations, setAllEvaluations] = useState<EvaluationFromAPI[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<number, UserInfo>>({});
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationFromAPI | null>(null);
  const [loadingUserEvaluations, setLoadingUserEvaluations] = useState<number | null>(null);
  const [userEvaluationsMap, setUserEvaluationsMap] = useState<Record<number, EvaluationFromAPI[]>>({});
  const [cycleName, setCycleName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allBUs, setAllBUs] = useState<Record<number, string>>({});
  const [buColors, setBuColors] = useState<Record<number, string>>({});
  const [buPictures, setBuPictures] = useState<Record<number, string>>({});
  const [buUserCounts, setBuUserCounts] = useState<Record<number, number>>({});
  const [loadingBUsData, setLoadingBUsData] = useState(true);

  // Estados para a seção de Resultados
  const [individualScores, setIndividualScores] = useState<any[]>([]);
  const [teamScores, setTeamScores] = useState<any[]>([]);
  const [buScores, setBuScores] = useState<any[]>([]);
  const [generalScores, setGeneralScores] = useState<any | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [loadedScoreViews, setLoadedScoreViews] = useState<Set<string>>(new Set());
  const [loadingScoreUsers, setLoadingScoreUsers] = useState(false);
  const [selectedScoreView, setSelectedScoreView] = useState<"general" | "individual" | "team" | "bu">(() => {
    const view = searchParams.get("view");
    return view === "individual" || view === "team" || view === "bu" ? view : "general";
  });
  const [activeTab, setActiveTab] = useState<"evaluations" | "results">(() => {
    const tab = searchParams.get("tab");
    return tab === "results" ? "results" : "evaluations";
  });
  const [expandedScoreId, setExpandedScoreId] = useState<number | string | null>(null);
  const [resultsSearchQuery, setResultsSearchQuery] = useState("");
  const [previousGeneralScores, setPreviousGeneralScores] = useState<any | null>(null);
  const [allCycles, setAllCycles] = useState<Array<{ id: number; name: string; created_at: string }>>([]);

  // Buscar nome do ciclo e todos os ciclos para comparação
  useEffect(() => {
    const fetchCyclesData = async () => {
      if (!cycleId) return;
      try {
        const response = await fetch("https://app.impulsecompany.com.br/webhook/getEvalutionCycles");
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const cycles = Array.isArray(data) ? data : [data];
            setAllCycles(cycles);
            const cycle = cycles.find((c: { id: number; name?: string }) => c.id === parseInt(cycleId));
            if (cycle?.name) {
              setCycleName(cycle.name);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar ciclos:", error);
      }
    };
    fetchCyclesData();
  }, [cycleId]);

  // Componente para mostrar indicador de tendência
  const TrendIndicator = ({ current, previous }: { current: number; previous: number | null | undefined }) => {
    if (previous === undefined || previous === null) return null;

    const diff = current - previous;
    const threshold = 0.01;

    if (diff > threshold) {
      return (
        <span className="inline-flex ml-1" aria-label={`Subiu ${diff.toFixed(2)}`}>
          <ArrowUpRight className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
        </span>
      );
    }

    if (diff < -threshold) {
      return (
        <span className="inline-flex ml-1" aria-label={`Desceu ${Math.abs(diff).toFixed(2)}`}>
          <ArrowDownRight className="w-3.5 h-3.5 text-red-600" strokeWidth={2.5} />
        </span>
      );
    }

    return (
      <span className="inline-flex ml-1" aria-label="Manteve a mesma nota">
        <Minus className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
      </span>
    );
  };

  // Buscar todas as BUs e contagem de usuários por BU
  useEffect(() => {
    const fetchAllBUsAndCounts = async () => {
      try {
        const [buResponse, usersResponse] = await Promise.all([
          fetch("https://app.impulsecompany.com.br/webhook/getAllBUs"),
          fetch("https://app.impulsecompany.com.br/webhook/getAllUsers"),
        ]);

        if (buResponse.ok) {
          const text = await buResponse.text();
          if (text) {
            const data = JSON.parse(text);
            const bus = Array.isArray(data) ? data : [data];
            const buMap: Record<number, string> = {};
            const colorMap: Record<number, string> = {};
            const pictureMap: Record<number, string> = {};
            bus.forEach((bu: { id: number; name: string; color_hex?: string; link_picture?: string }) => {
              buMap[bu.id] = bu.name;
              if (bu.color_hex) {
                colorMap[bu.id] = bu.color_hex;
              }
              if (bu.link_picture) {
                pictureMap[bu.id] = bu.link_picture;
              }
            });
            setAllBUs(buMap);
            setBuColors(colorMap);
            setBuPictures(pictureMap);
          }
        }

        if (usersResponse.ok) {
          const text = await usersResponse.text();
          if (text) {
            const data = JSON.parse(text);
            const users = Array.isArray(data) ? data : [data];
            const activeUsers = users.filter((u: any) => u.is_active);
            const counts: Record<number, number> = {};
            activeUsers.forEach((u: any) => {
              if (u.bu_id) {
                counts[u.bu_id] = (counts[u.bu_id] || 0) + 1;
              }
            });
            setBuUserCounts(counts);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar BUs:", error);
      } finally {
        setLoadingBUsData(false);
      }
    };
    fetchAllBUsAndCounts();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Função para baixar o relatório geral em PDF
  const handleDownloadGeneralReport = async () => {
    const element = document.getElementById("general-report-content");
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Relatorio_Geral_${cycleName || "Ciclo"}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  // Buscar todas as avaliações
  useEffect(() => {
    const fetchAllEvaluations = async () => {
      setLoadingEvaluations(true);
      try {
        const url = cycleId
          ? `https://app.impulsecompany.com.br/webhook/getAllEvalutions?cycle_id=${cycleId}`
          : "https://app.impulsecompany.com.br/webhook/getAllEvalutions";
        const response = await fetch(url, {
          method: "GET",
        });
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const evaluations = Array.isArray(data) ? data : [data];
            setAllEvaluations(evaluations);

            // Extrair IDs únicos de avaliadores
            const evaluatorIds = [...new Set(evaluations.map((e: EvaluationFromAPI) => e.evaluator_user_id))];

            // Buscar informações dos usuários
            const usersInfo: Record<number, UserInfo> = {};
            await Promise.all(
              evaluatorIds.map(async (id) => {
                try {
                  const userRes = await fetch(`https://app.impulsecompany.com.br/webhook/getUser?user_id=${id}`);
                  if (userRes.ok) {
                    const userData = await userRes.json();
                    const userInfo = Array.isArray(userData) ? userData[0] : userData;
                    if (userInfo) {
                      const leaderId =
                        userInfo.leader_id === undefined || userInfo.leader_id === null || userInfo.leader_id === ""
                          ? null
                          : Number(userInfo.leader_id);
                      const buId =
                        userInfo.bu_id === undefined || userInfo.bu_id === null || userInfo.bu_id === ""
                          ? null
                          : Number(userInfo.bu_id);
                      usersInfo[id as number] = {
                        id: id as number,
                        name: userInfo.name,
                        position: userInfo.position,
                        role: userInfo.role,
                        current_band: userInfo.current_band,
                        leader_id: Number.isFinite(leaderId as number) ? leaderId : null,
                        bu_id: Number.isFinite(buId as number) ? buId : null,
                        link_picture: userInfo.link_picture || null,
                      };
                    }
                  }
                } catch (err) {
                  console.error(`Erro ao buscar usuário ${id}:`, err);
                }
              }),
            );
            setUsersMap(usersInfo);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      } finally {
        setLoadingEvaluations(false);
      }
    };

    fetchAllEvaluations();
  }, [cycleId]);

  // Função para buscar scores individuais
  const fetchIndividualScores = async () => {
    if (loadedScoreViews.has("individual")) return;
    setLoadingScores(true);
    try {
      const url = cycleId
        ? `https://app.impulsecompany.com.br/webhook/getAllIndividualScores?cycle_id=${cycleId}`
        : "https://app.impulsecompany.com.br/webhook/getAllIndividualScores";

      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const scores = Array.isArray(data) ? data : [data];
          const filtered = cycleId ? scores.filter((s: any) => s.evalution_cycle_id === parseInt(cycleId)) : scores;
          setIndividualScores(filtered);
        }
      }
      setLoadedScoreViews((prev) => new Set(prev).add("individual"));
    } catch (error) {
      console.error("Erro ao buscar scores individuais:", error);
    } finally {
      setLoadingScores(false);
    }
  };

  // Função para buscar scores de equipes
  const fetchTeamScores = async () => {
    if (loadedScoreViews.has("team")) return;
    setLoadingScores(true);
    try {
      const url = cycleId
        ? `https://app.impulsecompany.com.br/webhook/getAllTeamScores?cycle_id=${cycleId}`
        : "https://app.impulsecompany.com.br/webhook/getAllTeamScores";
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          console.log("Resposta bruta getAllTeamScores:", data);
          const scores = Array.isArray(data) ? data : [data];
          const filtered = cycleId
            ? scores.filter((s: any) => s.cycle_id === parseInt(cycleId) || s.evalution_cycle_id === parseInt(cycleId))
            : scores;
          setTeamScores(filtered);
        }
      }
      setLoadedScoreViews((prev) => new Set(prev).add("team"));
    } catch (error) {
      console.error("Erro ao buscar scores de equipes:", error);
    } finally {
      setLoadingScores(false);
    }
  };

  // Função para buscar scores de BUs
  const fetchBuScores = async () => {
    if (loadedScoreViews.has("bu")) return;
    setLoadingScores(true);
    try {
      const url = cycleId
        ? `https://app.impulsecompany.com.br/webhook/getBUsScores?cycle_id=${cycleId}`
        : "https://app.impulsecompany.com.br/webhook/getBUsScores";
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          console.log("Resposta bruta getBUsScores:", data);
          const scores = Array.isArray(data) ? data : [data];
          const filtered = cycleId
            ? scores.filter((s: any) => s.cycle_id === parseInt(cycleId) || s.evalution_cycle_id === parseInt(cycleId))
            : scores;
          setBuScores(filtered);
        }
      }
      setLoadedScoreViews((prev) => new Set(prev).add("bu"));
    } catch (error) {
      console.error("Erro ao buscar scores de BUs:", error);
    } finally {
      setLoadingScores(false);
    }
  };

  // Função para buscar scores gerais
  const fetchGeneralScores = async () => {
    if (loadedScoreViews.has("general") || !cycleId) return;
    setLoadingScores(true);
    try {
      const response = await fetch(
        `https://app.impulsecompany.com.br/webhook/getGeneralScoresByCycle?cycle_id=${cycleId}`,
      );
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          // Se vier array, pegar o primeiro item
          const scores = Array.isArray(data) ? data[0] : data;
          setGeneralScores(scores);

          // Buscar scores do ciclo anterior para comparação
          await fetchPreviousCycleGeneralScores(parseInt(cycleId));
        }
      }
      setLoadedScoreViews((prev) => new Set(prev).add("general"));
    } catch (error) {
      console.error("Erro ao buscar scores gerais:", error);
    } finally {
      setLoadingScores(false);
    }
  };

  // Função para buscar scores gerais do ciclo anterior
  const fetchPreviousCycleGeneralScores = async (currentCycleId: number) => {
    try {
      if (allCycles.length === 0) return;

      // Ordenar ciclos por created_at (mais recente primeiro)
      const sortedCycles = [...allCycles].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      // Encontrar o índice do ciclo atual
      const currentIndex = sortedCycles.findIndex((c) => c.id === currentCycleId);
      if (currentIndex === -1 || currentIndex >= sortedCycles.length - 1) {
        // Ciclo atual não encontrado ou é o primeiro ciclo
        setPreviousGeneralScores(null);
        return;
      }

      // Pegar o ciclo anterior
      const previousCycle = sortedCycles[currentIndex + 1];

      const response = await fetch(
        `https://app.impulsecompany.com.br/webhook/getGeneralScoresByCycle?cycle_id=${previousCycle.id}`,
      );
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const scores = Array.isArray(data) ? data[0] : data;

          // Verificar se há scores válidos
          const hasValidScore = (score: any): boolean => {
            return score !== null && score !== undefined && typeof score === "number" && score > 0;
          };

          if (scores && hasValidScore(scores.general_overall_score)) {
            setPreviousGeneralScores(scores);
          } else {
            setPreviousGeneralScores(null);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar scores do ciclo anterior:", error);
      setPreviousGeneralScores(null);
    }
  };

  // Função para gerar bins do histograma baseado nos scores individuais
  const generateHistogramBins = (
    scores: any[],
  ): { range: string; count: number; minValue: number; maxValue: number }[] => {
    if (!scores || scores.length === 0) return [];

    // Extrair scores gerais válidos
    const overallScores = scores
      .map((s: any) => s.final_overall_score)
      .filter((score: number) => typeof score === "number" && !isNaN(score));

    if (overallScores.length === 0) return [];

    // Definir faixas de 0.2 em 0.2 (ex: 2.8-3.0, 3.0-3.2, etc.)
    const min = Math.floor(Math.min(...overallScores) * 5) / 5; // Arredondar para baixo para 0.2
    const max = Math.ceil(Math.max(...overallScores) * 5) / 5; // Arredondar para cima para 0.2

    const bins: { range: string; count: number; minValue: number; maxValue: number }[] = [];

    for (let start = min; start < max; start += 0.2) {
      const end = start + 0.2;
      const count = overallScores.filter((score: number) => score >= start && score < end).length;
      bins.push({
        range: `${start.toFixed(1)}-${end.toFixed(1)}`,
        count,
        minValue: start,
        maxValue: end,
      });
    }

    // Garantir que o último bin inclua o valor máximo
    if (bins.length > 0) {
      const lastBinMaxValue = bins[bins.length - 1].maxValue;
      const exactMaxScores = overallScores.filter((score: number) => score === lastBinMaxValue).length;
      if (exactMaxScores > 0) {
        bins[bins.length - 1].count += exactMaxScores;
      }
    }

    return bins.filter((bin) => bin.count > 0); // Remover bins vazios
  };

  // Carregar dados sob demanda quando a view muda
  useEffect(() => {
    if (activeTab !== "results") return;

    if (selectedScoreView === "general") {
      fetchGeneralScores();
      fetchIndividualScores(); // Para contar colaboradores
      fetchTeamScores(); // Para contar equipes
    }
    if (selectedScoreView === "individual") {
      fetchIndividualScores();
    }
    if (selectedScoreView === "team") {
      fetchTeamScores();
    }
    if (selectedScoreView === "bu") {
      fetchBuScores();
    }
  }, [selectedScoreView, activeTab, cycleId]);

  // Garantir que temos info (role/faixa) dos usuários exibidos nos scores
  useEffect(() => {
    const fetchMissingScoreUsers = async () => {
      const ids = new Set<number>();

      individualScores.forEach((s: any) => {
        if (typeof s?.user_id === "number") ids.add(s.user_id);
        if (typeof s?.leader_id === "number") ids.add(s.leader_id);
      });

      teamScores.forEach((s: any) => {
        if (typeof s?.leader_id === "number") ids.add(s.leader_id);
      });

      const missingIds = Array.from(ids).filter((id) => !usersMap[id]);
      if (missingIds.length === 0) {
        setLoadingScoreUsers(false);
        return;
      }

      setLoadingScoreUsers(true);

      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const userRes = await fetch(`https://app.impulsecompany.com.br/webhook/getUser?user_id=${id}`);
            if (!userRes.ok) return;
            const userData = await userRes.json();
            const userInfo = Array.isArray(userData) ? userData[0] : userData;
            if (!userInfo) return;

            const leaderId =
              userInfo.leader_id === undefined || userInfo.leader_id === null || userInfo.leader_id === ""
                ? null
                : Number(userInfo.leader_id);

            const buId =
              userInfo.bu_id === undefined || userInfo.bu_id === null || userInfo.bu_id === ""
                ? null
                : Number(userInfo.bu_id);

            setUsersMap((prev) => ({
              ...prev,
              [id]: {
                id,
                name: userInfo.name,
                position: userInfo.position,
                role: userInfo.role,
                current_band: userInfo.current_band,
                leader_id: Number.isFinite(leaderId as number) ? leaderId : null,
                bu_id: Number.isFinite(buId as number) ? buId : null,
                link_picture: userInfo.link_picture || null,
              },
            }));
          } catch (err) {
            console.error(`Erro ao buscar usuário ${id}:`, err);
          }
        }),
      );

      setLoadingScoreUsers(false);
    };

    if (individualScores.length > 0 || teamScores.length > 0) {
      fetchMissingScoreUsers();
    }
  }, [individualScores, teamScores]);

  // Agrupar avaliações por avaliador
  const evaluationsByEvaluator = allEvaluations.reduce(
    (acc, evaluation) => {
      const evaluatorId = evaluation.evaluator_user_id;
      if (!acc[evaluatorId]) {
        acc[evaluatorId] = [];
      }
      acc[evaluatorId].push(evaluation);
      return acc;
    },
    {} as Record<number, EvaluationFromAPI[]>,
  );

  const evaluatorIds = Object.keys(evaluationsByEvaluator).map(Number);

  // Filtrar avaliadores pela pesquisa
  const filteredEvaluatorIds = evaluatorIds
    .filter((evaluatorId) => {
      if (!searchQuery.trim()) return true;
      const userInfo = usersMap[evaluatorId];
      const searchLower = searchQuery.toLowerCase();
      return (
        userInfo?.name?.toLowerCase().includes(searchLower) || userInfo?.position?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const nameA = usersMap[a]?.name?.toLowerCase() || "";
      const nameB = usersMap[b]?.name?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    });

  // Buscar avaliações detalhadas de um usuário
  const handleExpandUser = async (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    // Se já temos as avaliações carregadas, não precisa buscar de novo
    if (userEvaluationsMap[userId]) {
      return;
    }

    setLoadingUserEvaluations(userId);
    try {
      // Usar as avaliações já carregadas
      const userEvals = evaluationsByEvaluator[userId] || [];

      // Buscar nomes dos avaliados
      const evaluatedIds = [...new Set(userEvals.map((e) => e.evaluated_user_id))];
      await Promise.all(
        evaluatedIds.map(async (id) => {
          if (!usersMap[id]) {
            try {
              const userRes = await fetch(`https://app.impulsecompany.com.br/webhook/getUser?user_id=${id}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                const userInfo = Array.isArray(userData) ? userData[0] : userData;
                if (userInfo) {
                  const leaderId =
                    userInfo.leader_id === undefined || userInfo.leader_id === null || userInfo.leader_id === ""
                      ? null
                      : Number(userInfo.leader_id);

                  const buId =
                    userInfo.bu_id === undefined || userInfo.bu_id === null || userInfo.bu_id === ""
                      ? null
                      : Number(userInfo.bu_id);

                  setUsersMap((prev) => ({
                    ...prev,
                    [id]: {
                      id,
                      name: userInfo.name,
                      position: userInfo.position,
                      role: userInfo.role,
                      current_band: userInfo.current_band,
                      leader_id: Number.isFinite(leaderId as number) ? leaderId : null,
                      bu_id: Number.isFinite(buId as number) ? buId : null,
                    },
                  }));
                }
              }
            } catch (err) {
              console.error(`Erro ao buscar usuário ${id}:`, err);
            }
          }
        }),
      );

      setUserEvaluationsMap((prev) => ({
        ...prev,
        [userId]: userEvals,
      }));
    } catch (error) {
      console.error("Erro ao carregar avaliações do usuário:", error);
    } finally {
      setLoadingUserEvaluations(null);
    }
  };

  const getEvaluationTypeLabel = (type: string) => {
    switch (type) {
      case "self":
        return "Autoavaliação";
      case "auto":
        return "Autoavaliação";
      case "leader":
        return "Avaliação de Líder";
      case "peer":
        return "Avaliação de Par";
      case "led":
        return "Avaliação de Liderado";
      default:
        return type;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case "leader":
        return "Líder";
      case "employee":
        return "Colaborador";
      default:
        return role;
    }
  };

  const getBandColor = (band: string) => {
    switch (band?.toLowerCase()) {
      case "branca":
        return "#FFFFFF";
      case "preta":
        return "#1a1a1a";
      case "roxa":
        return "#8B5CF6";
      case "azul":
        return "#3B82F6";
      case "marrom":
        return "#92400E";
      default:
        return "hsl(var(--primary))";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-3">
        <div className="px-[20%] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-xl font-bold">Relatório de Avaliações</h1>
              <p className="text-sm text-primary-foreground/80">
                {cycleName || (cycleId ? `Ciclo #${cycleId}` : "Todas as avaliações")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/home")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Voltar
            </Button>
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

      <main className="px-[20%] py-6">
        {/* Tabs para Avaliações e Resultados */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("evaluations")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "evaluations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Avaliações
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Resultados
          </button>
        </div>

        {/* Seção de Avaliações */}
        {activeTab === "evaluations" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Avaliadores
                <span className="text-xs font-normal text-muted-foreground">
                  ({filteredEvaluatorIds.length} de {evaluatorIds.length})
                </span>
              </h2>

              {/* Input de pesquisa */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar avaliador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {loadingEvaluations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando avaliações...</span>
              </div>
            ) : filteredEvaluatorIds.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {searchQuery ? "Nenhum avaliador encontrado" : "Nenhuma avaliação encontrada"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? `Nenhum resultado para "${searchQuery}"`
                    : "Quando houver avaliações realizadas, elas aparecerão aqui."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvaluatorIds.map((evaluatorId) => {
                  const userInfo = usersMap[evaluatorId];
                  const userEvaluations = evaluationsByEvaluator[evaluatorId] || [];
                  const isExpanded = expandedUserId === evaluatorId;
                  const isLoading = loadingUserEvaluations === evaluatorId;

                  return (
                    <div key={evaluatorId} className="bg-card border border-border rounded-lg overflow-hidden">
                      {/* Header do usuário */}
                      <button
                        onClick={() => handleExpandUser(evaluatorId)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {userInfo?.link_picture ? (
                              <img
                                src={userInfo.link_picture}
                                alt={userInfo?.name || `Usuário #${evaluatorId}`}
                                className="w-10 h-10 rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            {userInfo?.current_band && (
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                                  userInfo.current_band.toLowerCase() === "branca"
                                    ? "border-gray-300"
                                    : "border-background"
                                }`}
                                style={{ backgroundColor: getBandColor(userInfo.current_band) }}
                                title={`Faixa: ${userInfo.current_band}`}
                              />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">{userInfo?.name || `Usuário #${evaluatorId}`}</p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center flex-wrap gap-x-1 text-xs text-muted-foreground cursor-default">
                                    {userInfo?.position && <span>{userInfo.position}</span>}
                                    {userInfo?.role && (
                                      <>
                                        {userInfo?.position && <span className="flex-shrink-0">•</span>}
                                        <span>{getRoleLabel(userInfo.role)}</span>
                                      </>
                                    )}
                                    {userInfo?.bu_id && allBUs[userInfo.bu_id] && (
                                      <>
                                        {(userInfo?.position || userInfo?.role) && (
                                          <span className="flex-shrink-0">•</span>
                                        )}
                                        <span>{allBUs[userInfo.bu_id]}</span>
                                      </>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start" className="max-w-xs">
                                  {userInfo?.position && <p>Cargo: {userInfo.position}</p>}
                                  {userInfo?.role && <p>Função: {getRoleLabel(userInfo.role)}</p>}
                                  {userInfo?.bu_id && allBUs[userInfo.bu_id] && <p>BU: {allBUs[userInfo.bu_id]}</p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{userEvaluations.length} avaliação(ões)</span>
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Lista de avaliações do usuário */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                          {[...userEvaluations]
                            .sort((a, b) => {
                              // Ordenar por tipo: auto > led > peer
                              const typeOrder: Record<string, number> = { auto: 0, led: 1, peer: 2 };
                              const orderA = typeOrder[a.evaluation_type] ?? 3;
                              const orderB = typeOrder[b.evaluation_type] ?? 3;
                              if (orderA !== orderB) return orderA - orderB;
                              // Dentro do mesmo tipo, ordenar alfabeticamente pelo nome do avaliado
                              const nameA = usersMap[a.evaluated_user_id]?.name?.toLowerCase() || "";
                              const nameB = usersMap[b.evaluated_user_id]?.name?.toLowerCase() || "";
                              return nameA.localeCompare(nameB);
                            })
                            .map((evaluation) => {
                              const evaluatedUser = usersMap[evaluation.evaluated_user_id];
                              const evaluatorUser = usersMap[evaluation.evaluator_user_id];

                              // Verificar se é uma avaliação DO líder (avaliado é o líder do avaliador)
                              const isLeaderEvaluation =
                                Number(evaluatorUser?.leader_id ?? NaN) === Number(evaluation.evaluated_user_id);

                              const displayType =
                                isLeaderEvaluation && evaluation.evaluation_type === "peer"
                                  ? "Avaliação de Líder"
                                  : getEvaluationTypeLabel(evaluation.evaluation_type);
                              return (
                                <button
                                  key={evaluation.id}
                                  onClick={() => setSelectedEvaluation(evaluation)}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                    evaluation.status === "unrealized"
                                      ? "bg-red-50 border-red-200 hover:border-red-400"
                                      : "bg-card border-border hover:border-primary/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <div className="text-left">
                                      <p className="text-sm font-medium text-foreground">
                                        {evaluatedUser?.name || `Usuário #${evaluation.evaluated_user_id}`}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{displayType}</p>
                                    </div>
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      evaluation.status === "done"
                                        ? "bg-green-100 text-green-700"
                                        : evaluation.status === "unrealized"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {evaluation.status === "done"
                                      ? "Concluída"
                                      : evaluation.status === "unrealized"
                                        ? "Não realizada"
                                        : "Pendente"}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Seção de Resultados */}
        {activeTab === "results" && (
          <section>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4" />
              Resultados
            </h2>

            {/* Toggle entre visualizações */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex gap-2">
                <Button
                  variant={selectedScoreView === "general" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedScoreView("general")}
                  className="flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Geral
                </Button>
                <Button
                  variant={selectedScoreView === "individual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedScoreView("individual")}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Individual
                </Button>
                <Button
                  variant={selectedScoreView === "team" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedScoreView("team")}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Equipes
                </Button>
                <Button
                  variant={selectedScoreView === "bu" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedScoreView("bu")}
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  BUs
                </Button>
              </div>

              {/* Input de pesquisa - apenas para views não-geral */}
              {selectedScoreView !== "general" && (
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    value={resultsSearchQuery}
                    onChange={(e) => setResultsSearchQuery(e.target.value)}
                    className="pl-8 pr-7 h-8 text-sm"
                  />
                  {resultsSearchQuery && (
                    <button
                      onClick={() => setResultsSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {loadingScores || loadingScoreUsers ? (
              <div className="space-y-4">
                {/* Skeleton para visão geral */}
                {selectedScoreView === "general" && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <Skeleton className="h-24 w-full rounded-lg mb-4" />
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                    <Skeleton className="h-64 w-full rounded-lg" />
                  </div>
                )}

                {/* Skeleton para individual */}
                {selectedScoreView === "individual" && (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <div className="text-right space-y-1">
                              <Skeleton className="h-6 w-12" />
                              <Skeleton className="h-3 w-8" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skeleton para equipes */}
                {selectedScoreView === "team" && (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <div className="text-right space-y-1">
                              <Skeleton className="h-6 w-12" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skeleton para BUs */}
                {selectedScoreView === "bu" && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right space-y-1">
                              <Skeleton className="h-6 w-12" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Visão Geral */}
                {selectedScoreView === "general" && (
                  <div className="space-y-4">
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="bg-primary/10 rounded-lg p-4 text-center mb-4">
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-xs text-muted-foreground mb-1">Score Geral</p>
                          <TrendIndicator
                            current={generalScores?.general_overall_score || 0}
                            previous={previousGeneralScores?.general_overall_score}
                          />
                        </div>
                        <p className="text-3xl font-bold text-primary">
                          {generalScores?.general_overall_score?.toFixed(2) || "--"}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-xs text-blue-600 mb-1">Competência</p>
                            <TrendIndicator
                              current={generalScores?.general_competency || 0}
                              previous={previousGeneralScores?.general_competency}
                            />
                          </div>
                          <p className="text-xl font-bold text-blue-700">
                            {generalScores?.general_competency?.toFixed(2) || "--"}
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-xs text-green-600 mb-1">Habilidade</p>
                            <TrendIndicator
                              current={generalScores?.general_skill || 0}
                              previous={previousGeneralScores?.general_skill}
                            />
                          </div>
                          <p className="text-xl font-bold text-green-700">
                            {generalScores?.general_skill?.toFixed(2) || "--"}
                          </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-xs text-amber-600 mb-1">Atitude</p>
                            <TrendIndicator
                              current={generalScores?.general_attitude || 0}
                              previous={previousGeneralScores?.general_attitude}
                            />
                          </div>
                          <p className="text-xl font-bold text-amber-700">
                            {generalScores?.general_attitude?.toFixed(2) || "--"}
                          </p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-xs text-purple-600 mb-1">Resultado</p>
                            <TrendIndicator
                              current={generalScores?.general_result || 0}
                              previous={previousGeneralScores?.general_result}
                            />
                          </div>
                          <p className="text-xl font-bold text-purple-700">
                            {generalScores?.general_result?.toFixed(2) || "--"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{individualScores.length}</p>
                            <p className="text-xs text-muted-foreground">Colaboradores</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{teamScores.length}</p>
                            <p className="text-xs text-muted-foreground">Equipes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Relatório Geral */}
                    {generalScores?.text_report && (
                      <div className="bg-card border border-border rounded-lg p-6" id="general-report-content">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <FileBarChart className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground">Análise Geral</h3>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadGeneralReport}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Baixar PDF
                          </Button>
                        </div>
                        <MarkdownRenderer
                          content={generalScores.text_report}
                          isGeneralReport={true}
                          chartData={{
                            radar: [
                              { name: "Competência", value: generalScores.general_competency || 0 },
                              { name: "Habilidade", value: generalScores.general_skill || 0 },
                              { name: "Atitude", value: generalScores.general_attitude || 0 },
                              { name: "Resultado", value: generalScores.general_result || 0 },
                              { name: "Score Geral", value: generalScores.general_overall_score || 0 },
                            ],
                            bar: (() => {
                              // Calcular quantidade de cada classificação a partir dos individualScores
                              const classifications = {
                                "Zona Crítica": 0,
                                "Zona de Atenção": 0,
                                "Evolução Constante": 0,
                                "Alta Performance": 0,
                              };

                              individualScores.forEach((score) => {
                                const classification = score.classification || score.performance_classification;
                                if (classification) {
                                  const lower = classification.toLowerCase();
                                  if (
                                    lower.includes("crítica") ||
                                    lower.includes("critica") ||
                                    lower.includes("risco")
                                  ) {
                                    classifications["Zona Crítica"]++;
                                  } else if (lower.includes("atenção") || lower.includes("atencao")) {
                                    classifications["Zona de Atenção"]++;
                                  } else if (
                                    lower.includes("evolução") ||
                                    lower.includes("evolucao") ||
                                    lower.includes("constante")
                                  ) {
                                    classifications["Evolução Constante"]++;
                                  } else if (
                                    lower.includes("alta") ||
                                    lower.includes("excelência") ||
                                    lower.includes("excelencia")
                                  ) {
                                    classifications["Alta Performance"]++;
                                  }
                                }
                              });

                              return [
                                { name: "Zona Crítica", value: classifications["Zona Crítica"], color: "#ef4444" },
                                {
                                  name: "Zona de Atenção",
                                  value: classifications["Zona de Atenção"],
                                  color: "#f59e0b",
                                },
                                {
                                  name: "Evolução Constante",
                                  value: classifications["Evolução Constante"],
                                  color: "#3b82f6",
                                },
                                {
                                  name: "Alta Performance",
                                  value: classifications["Alta Performance"],
                                  color: "#22c55e",
                                },
                              ];
                            })(),
                            hist: generateHistogramBins(individualScores),
                            gauge: {
                              value: generalScores.general_overall_score || 0,
                              label: "Score Geral",
                            },
                            bands: [
                              { name: "Branca", value: generalScores.band_white_percentage || 42.31, color: "#94a3b8" },
                              { name: "Azul", value: generalScores.band_blue_percentage || 34.62, color: "#3b82f6" },
                              { name: "Preta", value: generalScores.band_black_percentage || 7.69, color: "#1e293b" },
                              { name: "Marrom", value: generalScores.band_brown_percentage || 7.69, color: "#78350f" },
                              { name: "Roxa", value: generalScores.band_purple_percentage || 7.69, color: "#7c3aed" },
                            ].filter((band) => band.value > 0),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Lista Individual */}
                {selectedScoreView === "individual" && (
                  <div className="space-y-2">
                    {individualScores.length === 0 ? (
                      <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-sm text-muted-foreground">Nenhum score individual encontrado</p>
                      </div>
                    ) : (
                      individualScores
                        .filter((score) => {
                          if (!resultsSearchQuery.trim()) return true;
                          const searchLower = resultsSearchQuery.toLowerCase();
                          const userName = usersMap[score.user_id]?.name?.toLowerCase() || "";
                          const userPosition = usersMap[score.user_id]?.position?.toLowerCase() || "";
                          const buName = usersMap[score.user_id]?.bu_id
                            ? allBUs[usersMap[score.user_id].bu_id!]?.toLowerCase() || ""
                            : "";
                          return (
                            userName.includes(searchLower) ||
                            userPosition.includes(searchLower) ||
                            buName.includes(searchLower)
                          );
                        })
                        .sort((a, b) => (b.final_overall_score || 0) - (a.final_overall_score || 0))
                        .map((score, index) => {
                          const isExpanded = expandedScoreId === score.id;
                          return (
                            <div
                              key={score.id || index}
                              className="bg-card border border-border rounded-lg overflow-hidden transition-all"
                            >
                              <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpandedScoreId(isExpanded ? null : score.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {/* Badge de ranking */}
                                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center z-10 shadow-sm">
                                      {index + 1}
                                    </span>
                                    {/* Avatar */}
                                    {usersMap[score.user_id]?.link_picture ? (
                                      <img
                                        src={usersMap[score.user_id].link_picture!}
                                        alt={usersMap[score.user_id]?.name || ""}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary" />
                                      </div>
                                    )}
                                    {/* Bolinha da faixa */}
                                    {usersMap[score.user_id]?.current_band && (
                                      <span
                                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                                          usersMap[score.user_id]?.current_band?.toLowerCase() === "branca"
                                            ? "border-gray-300"
                                            : "border-background"
                                        }`}
                                        style={{
                                          backgroundColor: getBandColor(usersMap[score.user_id]?.current_band || ""),
                                        }}
                                        title={`Faixa: ${usersMap[score.user_id]?.current_band}`}
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-foreground">
                                        {usersMap[score.user_id]?.name || `Usuário #${score.user_id}`}
                                      </p>
                                    </div>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground cursor-default">
                                            {usersMap[score.user_id]?.role && (
                                              <span>{getRoleLabel(usersMap[score.user_id].role!)}</span>
                                            )}
                                            {usersMap[score.user_id]?.role && usersMap[score.user_id]?.position && (
                                              <span className="flex-shrink-0">•</span>
                                            )}
                                            {usersMap[score.user_id]?.position && (
                                              <span>{usersMap[score.user_id].position}</span>
                                            )}
                                            {(usersMap[score.user_id]?.role || usersMap[score.user_id]?.position) &&
                                              usersMap[score.user_id]?.bu_id &&
                                              allBUs[usersMap[score.user_id].bu_id!] && (
                                                <span className="flex-shrink-0">•</span>
                                              )}
                                            {usersMap[score.user_id]?.bu_id &&
                                              allBUs[usersMap[score.user_id].bu_id!] && (
                                                <span>{allBUs[usersMap[score.user_id].bu_id!]}</span>
                                              )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" align="start" className="max-w-xs">
                                          {usersMap[score.user_id]?.role && (
                                            <p>Função: {getRoleLabel(usersMap[score.user_id].role!)}</p>
                                          )}
                                          {usersMap[score.user_id]?.position && (
                                            <p>Cargo: {usersMap[score.user_id].position}</p>
                                          )}
                                          {usersMap[score.user_id]?.bu_id && allBUs[usersMap[score.user_id].bu_id!] && (
                                            <p>BU: {allBUs[usersMap[score.user_id].bu_id!]}</p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {score.performance_classification && (
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        score.performance_classification.toLowerCase().includes("excelência") ||
                                        score.performance_classification.toLowerCase().includes("excelencia") ||
                                        score.performance_classification.toLowerCase().includes("alta performance") ||
                                        score.performance_classification.toLowerCase().includes("alta")
                                          ? "bg-green-100 text-green-700"
                                          : score.performance_classification.toLowerCase().includes("zona crítica") ||
                                              score.performance_classification.toLowerCase().includes("zona critica") ||
                                              score.performance_classification.toLowerCase().includes("risco") ||
                                              score.performance_classification.toLowerCase().includes("crítico") ||
                                              score.performance_classification.toLowerCase().includes("critico")
                                            ? "bg-red-100 text-red-700"
                                            : score.performance_classification.toLowerCase().includes("atenção") ||
                                                score.performance_classification.toLowerCase().includes("atencao")
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {score.performance_classification}
                                    </span>
                                  )}
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-primary">
                                      {score.final_overall_score?.toFixed(2) || "--"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Score</p>
                                  </div>
                                  <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-blue-600 mb-1">Competência</p>
                                      <p className="text-sm font-bold text-blue-700">
                                        {score.final_competency?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-green-600 mb-1">Habilidade</p>
                                      <p className="text-sm font-bold text-green-700">
                                        {score.final_skill?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-amber-600 mb-1">Atitude</p>
                                      <p className="text-sm font-bold text-amber-700">
                                        {score.final_attitude?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-purple-600 mb-1">Resultado</p>
                                      <p className="text-sm font-bold text-purple-700">
                                        {score.final_result?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                  </div>
                                  {score.leader_id && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <span>Líder: {usersMap[score.leader_id]?.name || `#${score.leader_id}`}</span>
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3 w-full gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/performance-analysis?user_id=${score.user_id}&cycle_id=${cycleId}&from=individual`,
                                      );
                                    }}
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    Ver Análise com IA
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {/* Lista de Equipes */}
                {selectedScoreView === "team" && (
                  <div className="space-y-2">
                    {teamScores.length === 0 ? (
                      <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-sm text-muted-foreground">Nenhum score de equipe encontrado</p>
                      </div>
                    ) : (
                      teamScores
                        .filter((score) => {
                          if (!resultsSearchQuery.trim()) return true;
                          const searchLower = resultsSearchQuery.toLowerCase();
                          const leaderName = usersMap[score.leader_id]?.name?.toLowerCase() || "";
                          const leaderPosition = usersMap[score.leader_id]?.position?.toLowerCase() || "";
                          const buName = usersMap[score.leader_id]?.bu_id
                            ? allBUs[usersMap[score.leader_id].bu_id!]?.toLowerCase() || ""
                            : "";
                          return (
                            leaderName.includes(searchLower) ||
                            leaderPosition.includes(searchLower) ||
                            buName.includes(searchLower)
                          );
                        })
                        .sort((a, b) => (b.general_overall_score || 0) - (a.general_overall_score || 0))
                        .map((score: any, index) => {
                          const leader = usersMap[score.leader_id];
                          const isExpanded = expandedScoreId === `team-${score.id}`;
                          return (
                            <div
                              key={score.id || index}
                              className="bg-card border border-border rounded-lg overflow-hidden transition-all"
                            >
                              <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpandedScoreId(isExpanded ? null : `team-${score.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {/* Badge de ranking */}
                                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center z-10 shadow-sm">
                                      {index + 1}
                                    </span>
                                    {/* Avatar */}
                                    {leader?.link_picture ? (
                                      <img
                                        src={leader.link_picture}
                                        alt={leader?.name || ""}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary" />
                                      </div>
                                    )}
                                    {/* Bolinha da faixa */}
                                    {leader?.current_band && (
                                      <span
                                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                                          leader?.current_band?.toLowerCase() === "branca"
                                            ? "border-gray-300"
                                            : "border-background"
                                        }`}
                                        style={{ backgroundColor: getBandColor(leader?.current_band || "") }}
                                        title={`Faixa: ${leader?.current_band}`}
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-foreground">
                                        Equipe de {leader?.name || `Líder #${score.leader_id}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      {leader?.role && <span>{getRoleLabel(leader.role)}</span>}
                                      {leader?.role && leader?.position && <span>•</span>}
                                      {leader?.position && <span>{leader.position}</span>}
                                      {(leader?.role || leader?.position) && score.quantity_led && <span>•</span>}
                                      {score.quantity_led && (
                                        <span>
                                          {score.quantity_led} liderado{score.quantity_led > 1 ? "s" : ""}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-primary">
                                      {score.general_overall_score?.toFixed(2) || "--"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Score</p>
                                  </div>
                                  <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-blue-600 mb-1">Competência</p>
                                      <p className="text-sm font-bold text-blue-700">
                                        {score.general_competency?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-green-600 mb-1">Habilidade</p>
                                      <p className="text-sm font-bold text-green-700">
                                        {score.general_skill?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-amber-600 mb-1">Atitude</p>
                                      <p className="text-sm font-bold text-amber-700">
                                        {score.general_attitude?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-purple-600 mb-1">Resultado</p>
                                      <p className="text-sm font-bold text-purple-700">
                                        {score.general_result?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3 w-full gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/performance-analysis?user_id=${score.leader_id}&cycle_id=${cycleId}&from=team`,
                                      );
                                    }}
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    Ver Análise com IA para Líder
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {/* Lista de BUs */}
                {selectedScoreView === "bu" && (
                  <div className="space-y-2">
                    {loadingScores || loadingBUsData ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                            <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                            <div className="flex-1">
                              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                              <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="text-right">
                              <div className="h-5 w-12 bg-muted rounded animate-pulse mb-1" />
                              <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : buScores.length === 0 ? (
                      <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-sm text-muted-foreground">Nenhum score de BU encontrado</p>
                      </div>
                    ) : (
                      buScores
                        .filter((score) => {
                          if (!resultsSearchQuery.trim()) return true;
                          const searchLower = resultsSearchQuery.toLowerCase();
                          const buName = allBUs[score.bu_id]?.toLowerCase() || "";
                          return buName.includes(searchLower);
                        })
                        .sort(
                          (a, b) =>
                            (b.overall_score_BU || b.general_overall_score || b.overall_score || 0) -
                            (a.overall_score_BU || a.general_overall_score || a.overall_score || 0),
                        )
                        .map((score: any, index) => {
                          const buName = allBUs[score.bu_id] || `BU #${score.bu_id}`;
                          const buColor = buColors[score.bu_id] || "hsl(var(--primary))";
                          const isExpanded = expandedScoreId === `bu-${score.id || score.bu_id}`;
                          const userCount = buUserCounts[score.bu_id] || 0;
                          // Mapear campos com sufixo _BU
                          const overallScore =
                            score.overall_score_BU ?? score.general_overall_score ?? score.overall_score;
                          const competency = score.competency_BU ?? score.general_competency ?? score.competency;
                          const skill = score.skill_BU ?? score.general_skill ?? score.skill;
                          const attitude = score.attitude_BU ?? score.general_attitude ?? score.attitude;
                          const result = score.result_BU ?? score.general_result ?? score.result;

                          // Determinar se a cor é escura para ajustar a cor do texto
                          const isColorDark = (hex: string) => {
                            const color = hex.replace("#", "");
                            const r = parseInt(color.substr(0, 2), 16);
                            const g = parseInt(color.substr(2, 2), 16);
                            const b = parseInt(color.substr(4, 2), 16);
                            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                            return luminance < 0.5;
                          };
                          const textColor = buColor.startsWith("#") && isColorDark(buColor) ? "white" : "#1a1a1a";

                          return (
                            <div
                              key={score.id || score.bu_id || index}
                              className="bg-card border border-border rounded-lg overflow-hidden transition-all"
                            >
                              <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpandedScoreId(isExpanded ? null : `bu-${score.id || score.bu_id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  {buPictures[score.bu_id] ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                      <img
                                        src={buPictures[score.bu_id]}
                                        alt={buName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: buColor,
                                        color: textColor,
                                      }}
                                    >
                                      <Building2 className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{
                                      backgroundColor: buColor,
                                      color: textColor,
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{buName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Unidade de Negócio • {userCount} colaborador{userCount !== 1 ? "es" : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {score.performance_classification && (
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        score.performance_classification.toLowerCase().includes("excelência") ||
                                        score.performance_classification.toLowerCase().includes("excelencia") ||
                                        score.performance_classification.toLowerCase().includes("alta performance") ||
                                        score.performance_classification.toLowerCase().includes("alta")
                                          ? "bg-green-100 text-green-700"
                                          : score.performance_classification.toLowerCase().includes("zona crítica") ||
                                              score.performance_classification.toLowerCase().includes("zona critica") ||
                                              score.performance_classification.toLowerCase().includes("risco") ||
                                              score.performance_classification.toLowerCase().includes("crítico") ||
                                              score.performance_classification.toLowerCase().includes("critico")
                                            ? "bg-red-100 text-red-700"
                                            : score.performance_classification.toLowerCase().includes("atenção") ||
                                                score.performance_classification.toLowerCase().includes("atencao")
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {score.performance_classification}
                                    </span>
                                  )}
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-primary">{overallScore?.toFixed(2) || "--"}</p>
                                    <p className="text-xs text-muted-foreground">Score</p>
                                  </div>
                                  <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-blue-600 mb-1">Competência</p>
                                      <p className="text-sm font-bold text-blue-700">
                                        {competency?.toFixed(2) || "--"}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-green-600 mb-1">Habilidade</p>
                                      <p className="text-sm font-bold text-green-700">{skill?.toFixed(2) || "--"}</p>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-amber-600 mb-1">Atitude</p>
                                      <p className="text-sm font-bold text-amber-700">{attitude?.toFixed(2) || "--"}</p>
                                    </div>
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                                      <p className="text-xs text-purple-600 mb-1">Resultado</p>
                                      <p className="text-sm font-bold text-purple-700">{result?.toFixed(2) || "--"}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3 w-full gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/performance-analysis?bu_id=${score.bu_id}&cycle_id=${cycleId}&from=bu`,
                                      );
                                    }}
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    Ver Análise com IA
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      {/* Dialog para ver detalhes da avaliação */}
      <Dialog open={!!selectedEvaluation} onOpenChange={() => setSelectedEvaluation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Avaliação
            </DialogTitle>
          </DialogHeader>

          {selectedEvaluation &&
            (() => {
              console.log("Avaliação selecionada:", selectedEvaluation);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Avaliador</p>
                      <p className="font-medium">
                        {usersMap[selectedEvaluation.evaluator_user_id]?.name ||
                          `#${selectedEvaluation.evaluator_user_id}`}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Avaliado</p>
                      <p className="font-medium">
                        {usersMap[selectedEvaluation.evaluated_user_id]?.name ||
                          `#${selectedEvaluation.evaluated_user_id}`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Tipo de Avaliação</p>
                    <p className="font-medium">
                      {(() => {
                        const evaluatorUser = usersMap[selectedEvaluation.evaluator_user_id];
                        const isLeaderEval =
                          Number(evaluatorUser?.leader_id ?? NaN) === Number(selectedEvaluation.evaluated_user_id);
                        return isLeaderEval && selectedEvaluation.evaluation_type === "peer"
                          ? "Avaliação de Líder"
                          : getEvaluationTypeLabel(selectedEvaluation.evaluation_type);
                      })()}
                    </p>
                  </div>

                  {/* Notas */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Notas</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 mb-1">Competência</p>
                        <p className="text-lg font-bold text-blue-700">
                          {selectedEvaluation.competency !== undefined && selectedEvaluation.competency !== null
                            ? selectedEvaluation.competency.toFixed(1)
                            : "--"}
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-600 mb-1">Habilidade</p>
                        <p className="text-lg font-bold text-green-700">
                          {selectedEvaluation.skill !== undefined && selectedEvaluation.skill !== null
                            ? selectedEvaluation.skill.toFixed(1)
                            : "--"}
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-amber-600 mb-1">Atitude</p>
                        <p className="text-lg font-bold text-amber-700">
                          {selectedEvaluation.attitude !== undefined && selectedEvaluation.attitude !== null
                            ? selectedEvaluation.attitude.toFixed(1)
                            : "--"}
                        </p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-purple-600 mb-1">Resultado</p>
                        <p className="text-lg font-bold text-purple-700">
                          {selectedEvaluation.result !== undefined && selectedEvaluation.result !== null
                            ? selectedEvaluation.result.toFixed(1)
                            : "--"}
                        </p>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="mt-3 bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-primary mb-1">Overall Score</p>
                      <p className="text-xl font-bold text-primary">
                        {selectedEvaluation.overall_score !== undefined && selectedEvaluation.overall_score !== null
                          ? selectedEvaluation.overall_score.toFixed(2)
                          : "--"}
                      </p>
                    </div>
                  </div>

                  {/* Observação */}
                  {selectedEvaluation.observation && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Observação</p>
                      <p className="text-sm">{selectedEvaluation.observation}</p>
                    </div>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Report;
