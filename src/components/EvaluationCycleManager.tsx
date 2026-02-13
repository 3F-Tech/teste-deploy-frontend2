import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Play,
  Edit3,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FastForward,
  ChevronDown,
  ChevronUp,
  User,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";

interface EvaluationCycle {
  id: number;
  name?: string;
  status: "pending" | "going" | "analyzing_results" | "preliminary_results" | "results_released" | "finished";
  evaluation_deadline: string;
  planned_start_date: string;
  planned_end_date: string;
  created_at?: string;
  updated_at?: string;
  evaluations_completed?: number;
  evaluations_total?: number;
}

interface PendingUser {
  user_id: number;
  user_name: string;
  pending_count: number;
}

const getStatusLabel = (status: EvaluationCycle["status"]) => {
  switch (status) {
    case "pending":
      return "Pendente";
    case "going":
      return "Em Andamento";
    case "analyzing_results":
      return "Analisando Resultados";
    case "preliminary_results":
      return "Resultados Preliminares";
    case "results_released":
      return "Resultados Liberados";
    case "finished":
      return "Finalizado";
    default:
      return status;
  }
};

const getStatusColor = (status: EvaluationCycle["status"]) => {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-700 border-gray-400";
    case "going":
      return "bg-blue-900 text-blue-100 border-blue-800";
    case "analyzing_results":
      return "bg-yellow-100 text-yellow-700 border-yellow-400";
    case "preliminary_results":
      return "bg-purple-100 text-purple-700 border-purple-400";
    case "results_released":
      return "bg-green-100 text-green-700 border-green-400";
    case "finished":
      return "bg-red-100 text-red-700 border-red-400";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const isHighlightedStatus = (status: EvaluationCycle["status"]) => {
  return ["going", "analyzing_results", "preliminary_results", "results_released"].includes(status);
};

// Verifica se um ciclo está em fase de visualização de resultados
const isResultsViewingPhase = (status: EvaluationCycle["status"]) => {
  return ["results_released", "finished"].includes(status);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "--";
  // Parse date string without timezone conversion
  const parts = dateString.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return "--";
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "--";
  // Parse datetime string without timezone conversion
  const [datePart, timePart] = dateString.split("T");
  if (!datePart) return "--";
  const parts = datePart.split("-");
  if (parts.length !== 3) return "--";
  const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
  if (timePart) {
    const time = timePart.substring(0, 5); // HH:MM
    return `${formattedDate} às ${time}`;
  }
  return formattedDate;
};

const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  // Return date part only without timezone conversion
  return dateString.split("T")[0];
};

const formatDateTimeForInput = (dateString: string) => {
  if (!dateString) return "";
  // Return datetime without timezone conversion
  if (dateString.includes("T")) {
    return dateString.substring(0, 16); // YYYY-MM-DDTHH:MM
  }
  return dateString;
};

interface EvaluationCycleManagerProps {
  onCycleUpdate?: (deadline: string | null) => void;
}

export const EvaluationCycleManager = ({ onCycleUpdate }: EvaluationCycleManagerProps) => {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluationCount, setEvaluationCount] = useState<{ completed: number; total: number } | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [showPendingUsers, setShowPendingUsers] = useState(false);
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);
  const [isNextPhaseConfirmOpen, setIsNextPhaseConfirmOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Estados para o progresso de análise
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    individualCurrent: 0,
    teamCurrent: 0,
    buCurrent: 0,
    generalCurrent: 0,
    individualTotal: 0,
    teamTotal: 0,
    buTotal: 0,
    generalTotal: 1, // Relatório geral é sempre 1
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [totalBUs, setTotalBUs] = useState(0);

  // Refs para totais - garantem que o polling sempre tenha o valor atualizado
  const userCountRef = useRef(0);
  const teamCountRef = useRef(0);
  const buCountRef = useRef(0);

  const [editForm, setEditForm] = useState({
    name: "",
    evaluation_deadline: "",
    planned_start_date: "",
    planned_end_date: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchEvaluationCount = async (cycleId?: number) => {
    try {
      const url = cycleId
        ? `https://app.impulsecompany.com.br/webhook/getCountEvalution?cycle_id=${cycleId}`
        : "https://app.impulsecompany.com.br/webhook/getCountEvalution";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // O endpoint retorna um array de avaliações
        const evaluations = Array.isArray(data) ? data : [];
        const total = evaluations.length;
        const completed = evaluations.filter((e: { status: string }) => e.status !== "pending").length;
        setEvaluationCount({ completed, total });
      }
    } catch (error) {
      console.error("Erro ao buscar contagem de avaliações:", error);
    }
  };

  const fetchUserById = async (userId: number): Promise<string> => {
    try {
      const response = await fetch(`https://app.impulsecompany.com.br/webhook/getUser?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // API retorna um array, então pegamos o primeiro item
        const user = Array.isArray(data) ? data[0] : data;
        return user?.name || `Usuário #${userId}`;
      }
    } catch (error) {
      console.error(`Erro ao buscar usuário ${userId}:`, error);
    }
    return `Usuário #${userId}`;
  };

  const fetchPendingUsers = async (cycleId?: number) => {
    setLoadingPendingUsers(true);
    try {
      const url = cycleId
        ? `https://app.impulsecompany.com.br/webhook/getPendingEvalution?cycle_id=${cycleId}`
        : "https://app.impulsecompany.com.br/webhook/getPendingEvalution";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const pendingEvaluations = Array.isArray(data) ? data : [];

        // Agrupar por usuário e contar pendentes
        const userCountMap = new Map<number, number>();

        pendingEvaluations.forEach((evaluation: { evaluator_user_id: number; status: string }) => {
          if (evaluation.status === "pending") {
            const existing = userCountMap.get(evaluation.evaluator_user_id) || 0;
            userCountMap.set(evaluation.evaluator_user_id, existing + 1);
          }
        });

        // Buscar nomes dos usuários em paralelo
        const userIds = Array.from(userCountMap.keys());
        const userNames = await Promise.all(userIds.map((id) => fetchUserById(id)));

        const users: PendingUser[] = userIds
          .map((userId, index) => ({
            user_id: userId,
            user_name: userNames[index],
            pending_count: userCountMap.get(userId) || 0,
          }))
          .sort((a, b) => b.pending_count - a.pending_count);

        setPendingUsers(users);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários pendentes:", error);
    } finally {
      setLoadingPendingUsers(false);
    }
  };

  const handleTogglePendingUsers = (cycleId?: number) => {
    if (!showPendingUsers && pendingUsers.length === 0) {
      fetchPendingUsers(cycleId);
    }
    setShowPendingUsers(!showPendingUsers);
  };

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/getEvalutionCycles");
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const cyclesArray = Array.isArray(data) ? data : data?.cycles || data?.data || [];
          setCycles(cyclesArray);
        } else {
          setCycles([]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar ciclos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os ciclos de avaliação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  // Buscar contagem de avaliações quando ciclos forem carregados
  useEffect(() => {
    const activeCycle = cycles.find(
      (c) =>
        c.status === "going" ||
        c.status === "analyzing_results" ||
        c.status === "preliminary_results" ||
        c.status === "results_released",
    );
    if (activeCycle) {
      fetchEvaluationCount(activeCycle.id);
    }
  }, [cycles]);

  // Observar ciclos em analyzing_results e fazer polling automático
  useEffect(() => {
    const analyzingCycle = cycles.find((c) => c.status === "analyzing_results");

    if (!analyzingCycle) {
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Função para buscar totais e progresso
    const startPolling = async () => {
      let teamCount = 0;
      let userCount = 0;
      let buCount = 0;

      // Buscar totais usando SOMENTE getAllUsers (getAllLeaders estava falhando em alguns ambientes)
      try {
        const [usersResponse, busResponse] = await Promise.all([
          fetch("https://app.impulsecompany.com.br/webhook/getAllUsers"),
          fetch("https://app.impulsecompany.com.br/webhook/getAllBUs"),
        ]);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const users = Array.isArray(usersData) ? usersData : [];

          const activeUsers = users.filter((u: { is_active: boolean }) => u.is_active);
          userCount = activeUsers.length;

          // Tentativa 1: contar líderes por role/flag
          const leadersByRole = activeUsers.filter((u: any) => {
            const role = String(u?.role ?? "").toLowerCase();
            return role === "leader" || u?.leader_top === true;
          }).length;

          // Tentativa 2: deduzir times por leader_id (líderes únicos)
          const leaderIds = new Set<number>();
          activeUsers.forEach((u: any) => {
            const lid = Number(u?.leader_id);
            if (Number.isFinite(lid)) leaderIds.add(lid);
          });

          teamCount = leadersByRole > 0 ? leadersByRole : leaderIds.size;
        }

        if (busResponse.ok) {
          const busData = await busResponse.json();
          const bus = Array.isArray(busData) ? busData : [];
          buCount = bus.length;
        }
      } catch (error) {
        console.error("Erro ao buscar usuários/times/BUs:", error);
      }

      // Fallback: se não conseguiu carregar agora, reaproveitar o último total conhecido
      if (userCount === 0 && totalUsers > 0) userCount = totalUsers;
      if (teamCount === 0 && totalTeams > 0) teamCount = totalTeams;
      if (buCount === 0 && totalBUs > 0) buCount = totalBUs;

      // Atualizar refs e state
      userCountRef.current = userCount;
      teamCountRef.current = teamCount;
      buCountRef.current = buCount;
      setTotalUsers(userCount);
      setTotalTeams(teamCount);
      setTotalBUs(buCount);

      if (isMounted) {
        setAnalysisProgress({
          individualCurrent: 0,
          teamCurrent: 0,
          buCurrent: 0,
          generalCurrent: 0,
          individualTotal: userCount,
          teamTotal: teamCount,
          buTotal: buCount,
          generalTotal: 1,
        });
      }

      // Polling para verificar progresso
      const pollOnce = async () => {
        if (!isMounted) return false;

        try {
          // Fazer requests com tratamento individual de erro
          const [scoresRes, teamScoresRes, buScoresRes, generalScoresRes] = await Promise.all([
            fetch(
              `https://app.impulsecompany.com.br/webhook/getAllIndividualScores?cycle_id=${analyzingCycle.id}`,
            ).catch(() => null),
            fetch(`https://app.impulsecompany.com.br/webhook/getAllTeamScores?cycle_id=${analyzingCycle.id}`).catch(
              () => null,
            ),
            fetch(`https://app.impulsecompany.com.br/webhook/getBUsScores?cycle_id=${analyzingCycle.id}`).catch(
              () => null,
            ),
            fetch(
              `https://app.impulsecompany.com.br/webhook/getGeneralScoresByCycle?cycle_id=${analyzingCycle.id}`,
            ).catch(() => null),
          ]);

          let individualScoresCount = 0;
          let teamScoresCount = 0;
          let buScoresCount = 0;
          let generalScoresCount = 0;

          // Contar individuais - verificar se tem user_id válido
          if (scoresRes?.ok) {
            const scoresData = await scoresRes.json();
            const scores = Array.isArray(scoresData) ? scoresData : [];
            individualScoresCount = scores.filter((s: any) => s && typeof s.user_id === "number").length;
          }

          // Contar times - verificar se tem leader_id ou id válido E não é objeto vazio
          if (teamScoresRes?.ok) {
            const teamScoresData = await teamScoresRes.json();
            const teamScores = Array.isArray(teamScoresData) ? teamScoresData : [];
            teamScoresCount = teamScores.filter((s: any) => {
              if (!s || typeof s !== "object") return false;
              // Filtrar objetos vazios
              if (Object.keys(s).length === 0) return false;
              // Deve ter pelo menos leader_id ou id
              return typeof s.leader_id === "number" || typeof s.id === "number";
            }).length;
          }

          // Contar BUs - verificar se tem bu_id ou id válido E não é objeto vazio
          if (buScoresRes?.ok) {
            const buScoresData = await buScoresRes.json();
            const buScores = Array.isArray(buScoresData) ? buScoresData : [];
            buScoresCount = buScores.filter((s: any) => {
              if (!s || typeof s !== "object") return false;
              // Filtrar objetos vazios
              if (Object.keys(s).length === 0) return false;
              // Deve ter pelo menos bu_id ou id
              return typeof s.bu_id === "number" || typeof s.id === "number";
            }).length;
          }

          // Verificar relatório geral - a API retorna um array
          if (generalScoresRes?.ok) {
            const generalScoresData = await generalScoresRes.json();
            // Pode ser array ou objeto
            const data = Array.isArray(generalScoresData) ? generalScoresData[0] : generalScoresData;
            // Verificar se tem dados válidos (não é objeto vazio e tem text_report ou id)
            if (data && typeof data === "object" && Object.keys(data).length > 0) {
              if (data.text_report || typeof data.id === "number") {
                generalScoresCount = 1;
              }
            }
          }

          // Usar os totais das refs (podem ter sido atualizados)
          const currentUserTotal = userCountRef.current || userCount;
          const currentTeamTotal = teamCountRef.current || teamCount;
          const currentBUTotal = buCountRef.current || buCount;

          if (isMounted) {
            setAnalysisProgress({
              individualCurrent: individualScoresCount,
              teamCurrent: teamScoresCount,
              buCurrent: buScoresCount,
              generalCurrent: generalScoresCount,
              individualTotal: currentUserTotal,
              teamTotal: currentTeamTotal,
              buTotal: currentBUTotal,
              generalTotal: 1,
            });
          }

          // Se atingiu 100% em todos, finalizar
          const individualDone = currentUserTotal > 0 && individualScoresCount >= currentUserTotal;
          const teamDone = currentTeamTotal === 0 || teamScoresCount >= currentTeamTotal;
          const buDone = currentBUTotal === 0 || buScoresCount >= currentBUTotal;
          const generalDone = generalScoresCount >= 1;

          if (individualDone && teamDone && buDone && generalDone) {
            return true;
          }
        } catch (error) {
          console.error("Erro no polling:", error);
        }

        return false;
      };

      // Primeira leitura imediatamente
      const doneInitially = await pollOnce();
      if (doneInitially && isMounted) {
        toast({ title: "Sucesso", description: "Análise concluída! Todos os resultados foram processados." });
        setCycles((prev) =>
          prev.map((c) => (c.id === analyzingCycle.id ? { ...c, status: "preliminary_results" } : c)),
        );
        await fetchCycles();
        setIsAnalyzing(false);
        return;
      }

      // Continuar polling a cada 3 segundos
      pollInterval = setInterval(async () => {
        const done = await pollOnce();
        if (done && isMounted) {
          if (pollInterval) clearInterval(pollInterval);
          toast({ title: "Sucesso", description: "Análise concluída! Todos os resultados foram processados." });
          setCycles((prev) =>
            prev.map((c) => (c.id === analyzingCycle.id ? { ...c, status: "preliminary_results" } : c)),
          );
          await fetchCycles();
          setIsAnalyzing(false);
        }
      }, 3000);
    };

    startPolling();

    // Cleanup no unmount
    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [cycles.map((c) => c.id + c.status).join(",")]);

  const handleOpenEdit = (cycle: EvaluationCycle) => {
    setSelectedCycle(cycle);
    setEditForm({
      name: cycle.name || "",
      evaluation_deadline: formatDateTimeForInput(cycle.evaluation_deadline),
      planned_start_date: formatDateForInput(cycle.planned_start_date),
      planned_end_date: formatDateForInput(cycle.planned_end_date),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCycle = async () => {
    if (!selectedCycle) return;

    setIsUpdating(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/editCycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle_id: selectedCycle.id,
          name: editForm.name,
          evaluation_deadline: editForm.evaluation_deadline,
          planned_start_date: editForm.planned_start_date,
          planned_end_date: editForm.planned_end_date,
        }),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Ciclo atualizado com sucesso." });
        await fetchCycles();
        setIsEditDialogOpen(false);
        // Notificar Home sobre a atualização do deadline
        if (selectedCycle.status === "going" && onCycleUpdate) {
          onCycleUpdate(editForm.evaluation_deadline);
        }
      } else {
        toast({ title: "Erro", description: "Não foi possível atualizar o ciclo.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao atualizar ciclo:", error);
      toast({ title: "Erro", description: "Erro ao atualizar o ciclo.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenStartConfirm = (cycle: EvaluationCycle) => {
    setSelectedCycle(cycle);
    setIsStartConfirmOpen(true);
  };

  const handleOpenNextPhaseConfirm = (cycle: EvaluationCycle) => {
    setSelectedCycle(cycle);
    setIsNextPhaseConfirmOpen(true);
  };

  const handleOpenFinishConfirm = (cycle: EvaluationCycle) => {
    setSelectedCycle(cycle);
    setIsFinishConfirmOpen(true);
  };

  const handleFinishCycle = async () => {
    if (!selectedCycle) return;

    setIsFinishing(true);
    setIsFinishConfirmOpen(false);

    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/changeStatusCycleFinished", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle_id: selectedCycle.id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Ciclo finalizado com sucesso! Um novo ciclo foi criado." });
        setCycles((prev) => prev.map((c) => (c.id === selectedCycle.id ? { ...c, status: "finished" } : c)));
        await fetchCycles();
      } else {
        toast({ title: "Erro", description: "Não foi possível finalizar o ciclo.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao finalizar ciclo:", error);
      toast({ title: "Erro", description: "Erro ao finalizar o ciclo.", variant: "destructive" });
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAdvanceToNextPhase = async () => {
    if (!selectedCycle) return;

    setIsAdvancingPhase(true);
    setIsNextPhaseConfirmOpen(false);

    // Se estiver em preliminary_results, divulgar resultados
    if (selectedCycle.status === "preliminary_results") {
      try {
        const response = await fetch("https://app.impulsecompany.com.br/webhook/statusCycleResultsReleased", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
          body: JSON.stringify({
            cycle_id: selectedCycle.id,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          toast({
            title: "Sucesso",
            description: "Resultados divulgados! Todos os colaboradores podem visualizar seus resultados.",
          });
          // Atualiza o status localmente
          setCycles((prev) => prev.map((c) => (c.id === selectedCycle.id ? { ...c, status: "results_released" } : c)));
          await fetchCycles();
        } else {
          toast({ title: "Erro", description: "Não foi possível divulgar os resultados.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Erro ao divulgar resultados:", error);
        toast({ title: "Erro", description: "Erro ao divulgar os resultados.", variant: "destructive" });
      } finally {
        setIsAdvancingPhase(false);
      }
      return;
    }

    // Calcula o número de avaliações pendentes
    const pendingEvaluations = evaluationCount ? evaluationCount.total - evaluationCount.completed : 0;

    // 1. Atualiza o card IMEDIATAMENTE para mostrar a barra de progresso
    setCycles((prev) => prev.map((c) => (c.id === selectedCycle.id ? { ...c, status: "analyzing_results" } : c)));

    toast({
      title: "Iniciando análise",
      description: "Os relatórios estão sendo gerados. Acompanhe o progresso abaixo.",
    });

    // 2. Dispara o webhook em background (não bloqueia a UI)
    fetch("https://app.impulsecompany.com.br/webhook/phaseAnalyzingResults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cycle_id: selectedCycle.id,
        timestamp: new Date().toISOString(),
        pending_evaluations: pendingEvaluations,
      }),
    }).catch((error) => {
      console.error("Erro ao disparar webhook (em background):", error);
      // Não mostra erro ao usuário pois o polling vai verificar o status real
    });

    setIsAdvancingPhase(false);
    // O useEffect com polling vai cuidar de acompanhar o progresso automaticamente
  };

  const allEvaluationsCompleted =
    evaluationCount && evaluationCount.total > 0 && evaluationCount.completed === evaluationCount.total;

  const handleStartCycle = async () => {
    if (!selectedCycle) return;

    // Fechar o dialog e mostrar loading IMEDIATAMENTE
    setIsStartConfirmOpen(false);
    setIsStarting(true);

    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/initNewCycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle_id: selectedCycle.id,
          start_date: selectedCycle.planned_start_date,
        }),
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Ciclo iniciado com sucesso!" });
        await fetchCycles();
      } else {
        toast({ title: "Erro", description: "Não foi possível iniciar o ciclo.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao iniciar ciclo:", error);
      toast({ title: "Erro", description: "Erro ao iniciar o ciclo.", variant: "destructive" });
    } finally {
      setIsStarting(false);
    }
  };

  // Separar ciclos por categoria
  const pendingCycle = cycles.find((c) => c.status === "pending");
  const activeCycles = cycles.filter((c) => isHighlightedStatus(c.status));
  const finishedCycles = cycles.filter((c) => c.status === "finished");

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando ciclos...</span>
        </div>
      </div>
    );
  }

  // Loading overlay durante criação de avaliações
  if (isStarting) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Iniciando ciclo de avaliação...</p>
            <p className="text-xs text-muted-foreground">
              Criando avaliações para todos os usuários. Isso pode levar alguns segundos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Ciclos de Avaliação
        </h2>
        <button
          onClick={async () => {
            await fetchCycles();
            const activeCycle = cycles.find(
              (c) =>
                c.status === "going" ||
                c.status === "analyzing_results" ||
                c.status === "preliminary_results" ||
                c.status === "results_released",
            );
            if (activeCycle) {
              fetchEvaluationCount(activeCycle.id);
              if (showPendingUsers) {
                fetchPendingUsers(activeCycle.id);
              }
            }
          }}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Ciclos Ativos (em destaque) */}
      {activeCycles.length > 0 && (
        <div className="space-y-2">
          {activeCycles.map((cycle) => (
            <div key={cycle.id} className="bg-card border-2 border-primary/30 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground">{cycle.name || `Ciclo #${cycle.id}`}</h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium border ${getStatusColor(cycle.status)}`}
                  >
                    {getStatusLabel(cycle.status)}
                  </span>
                </div>
                {!["analyzing_results", "preliminary_results", "results_released"].includes(cycle.status) && (
                  <button
                    onClick={() => handleOpenEdit(cycle)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Editar deadline"
                  >
                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Início</span>
                  <p className="font-medium text-foreground">{formatDate(cycle.planned_start_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fim</span>
                  <p className="font-medium text-foreground">{formatDate(cycle.planned_end_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Deadline</span>
                  <p className="font-medium text-foreground">{formatDateTime(cycle.evaluation_deadline)}</p>
                </div>
                {!["analyzing_results", "preliminary_results"].includes(cycle.status) && (
                  <div>
                    <span className="text-muted-foreground">Avaliações</span>
                    <p className="font-medium text-foreground">
                      {evaluationCount ? `${evaluationCount.completed}/${evaluationCount.total}` : "--/--"}
                    </p>
                  </div>
                )}
              </div>

              {/* Barra de Progresso - esconde quando analyzing_results, preliminary_results ou results_released */}
              {!["analyzing_results", "preliminary_results", "results_released"].includes(cycle.status) &&
                evaluationCount &&
                evaluationCount.total > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso das avaliações</span>
                      <span className="font-medium text-foreground">
                        {Math.round((evaluationCount.completed / evaluationCount.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${(evaluationCount.completed / evaluationCount.total) * 100}%` }}
                      />
                    </div>

                    {/* Botão para ver usuários pendentes */}
                    {cycle.status === "going" && evaluationCount.completed < evaluationCount.total && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePendingUsers(cycle.id)}
                          className="w-full gap-2 text-amber-600 border-amber-300 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-400"
                        >
                          {loadingPendingUsers ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : showPendingUsers ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {showPendingUsers ? "Ocultar pendências" : "Ver usuários com avaliações pendentes"}
                        </Button>

                        {/* Lista de usuários pendentes */}
                        {showPendingUsers && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg max-h-48 overflow-y-auto">
                            {loadingPendingUsers ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                <span className="ml-2 text-sm text-amber-600">Carregando...</span>
                              </div>
                            ) : pendingUsers.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-amber-700 mb-2">
                                  {pendingUsers.length} usuário(s) com avaliações pendentes
                                </div>
                                {pendingUsers.map((user) => (
                                  <div
                                    key={user.user_id}
                                    className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-amber-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-amber-600" />
                                      <span className="text-sm text-foreground">{user.user_name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                      {user.pending_count} pendente{user.pending_count > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-amber-600 text-center py-2">
                                Nenhum usuário com avaliações pendentes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensagens quando todas avaliações concluídas */}
                    {evaluationCount.completed === evaluationCount.total && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Todas as avaliações foram realizadas!</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600">
                          <ArrowRight className="w-4 h-4" />
                          <span className="text-sm">Agora podemos ir para a próxima fase</span>
                        </div>
                      </div>
                    )}

                    {/* Botão Ir para próxima fase */}
                    <div className="mt-4">
                      <Button
                        onClick={() => handleOpenNextPhaseConfirm(cycle)}
                        className="w-full gap-2 text-white bg-blue-900 hover:bg-blue-800"
                      >
                        <FastForward className="w-4 h-4" />
                        Ir para próxima fase
                      </Button>
                    </div>
                  </div>
                )}

              {/* Barra de progresso de análise no card - só visível quando analyzing_results E isAnalyzing */}
              {cycle.status === "analyzing_results" && isAnalyzing && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full border-3 border-yellow-200 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-800">Processando Análises</h4>
                        <p className="text-xs text-yellow-600">
                          Gerando relatórios individuais, de time, de BUs e geral...
                        </p>
                      </div>
                    </div>

                    {/* Barra de Progresso Única */}
                    <div className="space-y-2">
                      <div className="w-full bg-yellow-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full transition-all duration-700 ease-out"
                          style={{
                            width: `${(() => {
                              const totalItems =
                                analysisProgress.individualTotal +
                                analysisProgress.teamTotal +
                                analysisProgress.buTotal +
                                analysisProgress.generalTotal;
                              const currentItems =
                                analysisProgress.individualCurrent +
                                analysisProgress.teamCurrent +
                                analysisProgress.buCurrent +
                                analysisProgress.generalCurrent;
                              return totalItems > 0 ? Math.min((currentItems / totalItems) * 100, 100) : 0;
                            })()}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        {(() => {
                          const totalItems =
                            analysisProgress.individualTotal +
                            analysisProgress.teamTotal +
                            analysisProgress.buTotal +
                            analysisProgress.generalTotal;
                          const currentItems =
                            analysisProgress.individualCurrent +
                            analysisProgress.teamCurrent +
                            analysisProgress.buCurrent +
                            analysisProgress.generalCurrent;

                          if (totalItems === 0) {
                            return (
                              <>
                                <span className="text-yellow-600">
                                  {currentItems} relatório(s) processado(s) • calculando total...
                                </span>
                                <span className="text-lg font-bold text-yellow-700">—</span>
                              </>
                            );
                          }

                          return (
                            <>
                              <span className="text-yellow-600">
                                {currentItems} de {totalItems} relatórios
                              </span>
                              <span className="text-lg font-bold text-yellow-700">
                                {Math.round((currentItems / totalItems) * 100)}%
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões quando preliminary_results */}
              {cycle.status === "preliminary_results" && (
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/report?cycle_id=${cycle.id}`)}
                    className="w-full gap-2 border-purple-400 text-purple-700 hover:border-purple-500 hover:bg-purple-100 hover:text-purple-800"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar Resultados Preliminares
                  </Button>
                  <Button
                    onClick={() => handleOpenNextPhaseConfirm(cycle)}
                    className="w-full gap-2 text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <FastForward className="w-4 h-4" />
                    Divulgar Resultados
                  </Button>
                </div>
              )}

              {/* Botões quando results_released */}
              {cycle.status === "results_released" && (
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/report?cycle_id=${cycle.id}`)}
                    className="w-full gap-2 border-green-400 text-green-700 hover:border-green-500 hover:bg-green-100 hover:text-green-800"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar Resultados
                  </Button>
                  <Button
                    onClick={() => handleOpenFinishConfirm(cycle)}
                    className="w-full gap-2 text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finalizar Ciclo
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Próximo Ciclo (Pendente) */}
      {pendingCycle && (
        <div className="bg-card border border-amber-300 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-foreground">{pendingCycle.name || `Ciclo #${pendingCycle.id}`}</h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium border ${getStatusColor(pendingCycle.status)}`}
              >
                {getStatusLabel(pendingCycle.status)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEdit(pendingCycle)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Editar datas"
              >
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
              <Button size="sm" onClick={() => handleOpenStartConfirm(pendingCycle)} className="gap-1">
                <Play className="w-3 h-3" />
                Iniciar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Início Previsto</span>
              <p className="font-medium text-foreground">{formatDate(pendingCycle.planned_start_date)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fim Previsto</span>
              <p className="font-medium text-foreground">{formatDate(pendingCycle.planned_end_date)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Deadline Avaliações</span>
              <p className="font-medium text-foreground">{formatDateTime(pendingCycle.evaluation_deadline)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ciclos Finalizados */}
      {finishedCycles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Ciclos Anteriores</h3>
          {finishedCycles.map((cycle) => (
            <div key={cycle.id} className="bg-card border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{cycle.name || `Ciclo #${cycle.id}`}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(cycle.planned_start_date)} - {formatDate(cycle.planned_end_date)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(cycle.status)}`}
                >
                  {getStatusLabel(cycle.status)}
                </span>
              </div>
              {/* Mostrar contagem de avaliações para os tops */}
              {evaluationCount && (
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium">{evaluationCount.completed}</span> avaliações realizadas
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/report?cycle_id=${cycle.id}`)}
                className="w-full gap-2 border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800"
              >
                <Eye className="w-4 h-4" />
                Visualizar Resultados
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {cycles.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhum ciclo encontrado</h3>
          <p className="text-xs text-muted-foreground">Quando houver ciclos de avaliação, eles aparecerão aqui.</p>
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCycle?.status === "pending" ? "Editar Datas do Ciclo" : "Editar Deadline do Ciclo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Mostrar campo de nome para ciclos pendentes */}
            {selectedCycle?.status === "pending" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cycle_name">Nome do Ciclo</Label>
                  <Input
                    id="cycle_name"
                    type="text"
                    placeholder="Ex: Ciclo 2025.1"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planned_start_date">Data de Início</Label>
                  <Input
                    id="planned_start_date"
                    type="date"
                    value={editForm.planned_start_date}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, planned_start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planned_end_date">Data de Fim</Label>
                  <Input
                    id="planned_end_date"
                    type="date"
                    value={editForm.planned_end_date}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, planned_end_date: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="evaluation_deadline">Deadline das Avaliações</Label>
              <Input
                id="evaluation_deadline"
                type="datetime-local"
                value={editForm.evaluation_deadline}
                onChange={(e) => setEditForm((prev) => ({ ...prev, evaluation_deadline: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCycle} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação para Iniciar */}
      <AlertDialog open={isStartConfirmOpen} onOpenChange={setIsStartConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Iniciar Ciclo de Avaliação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja iniciar o ciclo <strong>{selectedCycle?.name || `#${selectedCycle?.id}`}</strong>?
              <br />
              <br />
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Mudar o status do ciclo para "Em Andamento"</li>
                <li>Habilitar as avaliações para todos os colaboradores</li>
                <li>Notificar os participantes sobre o início do ciclo</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStarting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartCycle} disabled={isStarting}>
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Confirmar e Iniciar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de Confirmação para Próxima Fase */}
      <AlertDialog
        open={isNextPhaseConfirmOpen}
        onOpenChange={(open) => {
          // Não permitir fechar enquanto estiver avançando
          if (!open && isAdvancingPhase) return;
          setIsNextPhaseConfirmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedCycle?.status === "preliminary_results" ? (
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              ) : allEvaluationsCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              {selectedCycle?.status === "preliminary_results" ? "Divulgar Resultados" : "Ir para a Próxima Fase"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {selectedCycle?.status === "preliminary_results" ? (
                  <>
                    <p>
                      Ao divulgar os resultados, este ciclo de avaliação será <strong>finalizado</strong>.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      Todos os colaboradores poderão visualizar seus resultados. Esta ação não pode ser desfeita.
                    </p>
                    <p className="mt-2">Tem certeza que deseja continuar?</p>
                  </>
                ) : allEvaluationsCompleted ? (
                  <>
                    <p>Todas as avaliações foram concluídas!</p>
                    <p className="mt-2 text-muted-foreground">
                      A próxima fase é a <strong>Análise de Resultados</strong>, onde todos os dados das avaliações
                      serão processados e consolidados para gerar os relatórios finais.
                    </p>
                    <p className="mt-2">Deseja avançar para a fase de análise?</p>
                  </>
                ) : (
                  <>
                    <p className="text-amber-600 font-medium">⚠️ Atenção: Nem todas as avaliações foram realizadas!</p>
                    <p className="mt-2">
                      Atualmente <strong>{evaluationCount?.completed || 0}</strong> de{" "}
                      <strong>{evaluationCount?.total || 0}</strong> avaliações foram concluídas.
                    </p>
                    <p className="mt-2 text-destructive">
                      Ao avançar para a próxima fase, as avaliações pendentes serão fechadas e{" "}
                      <strong>não poderão mais ser realizadas</strong>.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      A próxima fase é a <strong>Análise de Resultados</strong>, onde todos os dados das avaliações
                      serão processados e consolidados para gerar os relatórios finais.
                    </p>
                    <p className="mt-2">Tem certeza que deseja continuar?</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAdvancingPhase}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAdvanceToNextPhase();
              }}
              disabled={isAdvancingPhase}
              className={
                selectedCycle?.status === "preliminary_results"
                  ? "bg-indigo-700 hover:bg-indigo-600 text-white"
                  : !allEvaluationsCompleted
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-blue-900 hover:bg-blue-800 text-white"
              }
            >
              {isAdvancingPhase ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {selectedCycle?.status === "preliminary_results" ? "Divulgando..." : "Avançando..."}
                </>
              ) : (
                <>
                  <FastForward className="w-4 h-4 mr-2" />
                  {selectedCycle?.status === "preliminary_results"
                    ? "Divulgar Resultados"
                    : allEvaluationsCompleted
                      ? "Confirmar e Avançar"
                      : "Avançar mesmo assim"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de Confirmação para Finalizar Ciclo */}
      <AlertDialog
        open={isFinishConfirmOpen}
        onOpenChange={(open) => {
          if (!open && isFinishing) return;
          setIsFinishConfirmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Finalizar Ciclo de Avaliação
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Tem certeza que deseja <strong>finalizar</strong> o ciclo{" "}
                  <strong>{selectedCycle?.name || `#${selectedCycle?.id}`}</strong>?
                </p>
                <p className="mt-2 text-muted-foreground">
                  Ao finalizar, o ciclo será arquivado e não poderá mais ser modificado. Os resultados permanecerão
                  acessíveis para consulta.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinishing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleFinishCycle();
              }}
              disabled={isFinishing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar e Finalizar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
