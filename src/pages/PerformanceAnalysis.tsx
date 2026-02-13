import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, User, Users, TrendingUp, TrendingDown, Minus, Download, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import html2pdf from "html2pdf.js";

interface EvaluationCycle {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface ScoreData {
  id: number;
  user_id: number;
  final_competency: number;
  final_skill: number;
  final_attitude: number;
  final_result: number;
  final_overall_score: number;
  performance_classification: string;
  leader_id?: number;
}

interface BUScoreData {
  id: number;
  bu_id: number;
  competency: number;
  skill: number;
  attitude: number;
  result: number;
  overall_score: number;
  performance_classification?: string;
}

interface IndividualScore {
  competency_name?: string;
  skill_name?: string;
  attitude_name?: string;
  result_name?: string;
  name?: string;
  score?: number;
  average_score?: number;
  final_score?: number;

  // quando o webhook retorna o score consolidado do ciclo
  final_competency?: number;
  final_skill?: number;
  final_attitude?: number;
  final_result?: number;
  final_overall_score?: number;
  performance_classification?: string;
}

interface UserInfo {
  id: number;
  name: string;
  position?: string;
  role?: string; // líder ou colaborador
  current_band?: string; // cor da faixa
  link_picture?: string | null;
}

interface BUInfo {
  id: number;
  name: string;
  color_hex?: string;
  link_picture?: string;
  userCount?: number;
}

interface PreviousScores {
  competency: number | null;
  skill: number | null;
  attitude: number | null;
  result: number | null;
  overall: number | null;
}

const PerformanceAnalysis = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scoreId = searchParams.get("score_id");
  const cycleId = searchParams.get("cycle_id");
  const userIdParam = searchParams.get("user_id");
  const buIdParam = searchParams.get("bu_id");
  const fromView = searchParams.get("from"); // 'individual', 'team', 'bu', ou null (general)

  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [teamScoreData, setTeamScoreData] = useState<ScoreData | null>(null);
  const [buScoreData, setBuScoreData] = useState<BUScoreData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [buInfo, setBuInfo] = useState<BUInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [individualScores, setIndividualScores] = useState<IndividualScore[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [buClassificationDistribution, setBuClassificationDistribution] = useState<{name: string; value: number}[]>([]);
  const [teamClassificationDistribution, setTeamClassificationDistribution] = useState<{name: string; value: number}[]>([]);
  const [previousScores, setPreviousScores] = useState<PreviousScores | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // user_id pode vir do parâmetro direto ou do scoreData
  const effectiveUserId = userIdParam ? parseInt(userIdParam) : scoreData?.user_id;
  
  // Verifica se está visualizando como equipe ou BU
  const isTeamView = fromView === 'team';
  const isBUView = fromView === 'bu';
  
  // Usa scores do time quando for visualização de equipe
  const displayScoreData = isTeamView ? teamScoreData : scoreData;

  // Buscar relatório de equipe do banco de dados (apenas para líderes em visualização de equipe)
  const fetchTeamReport = async (leaderId: number, cycleIdParam?: number) => {
    setLoadingReport(true);
    try {
      const url = new URL("https://app.impulsecompany.com.br/webhook/getTeamReportByLeaderId");
      url.searchParams.set("leader_id", String(leaderId));
      if (typeof cycleIdParam === "number" && !Number.isNaN(cycleIdParam)) {
        url.searchParams.set("cycle_id", String(cycleIdParam));
      }
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        const report = Array.isArray(data) ? data[0] : data;
        const rawText = report?.text_report ?? (typeof report === "string" ? report : null);

        // Alguns registros vêm como JSON string do tipo: { "markdown": "# ..." }
        let reportText: string | null = typeof rawText === "string" ? rawText : null;
        if (reportText) {
          const trimmed = reportText.trim();
          if (trimmed.startsWith("{") && trimmed.includes('"markdown"')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (typeof parsed?.markdown === "string") {
                reportText = parsed.markdown;
              }
            } catch {
              // se não for JSON válido, mantém como texto
            }
          }
        }

        if (reportText && reportText.trim() !== "" && reportText !== "{}" && reportText !== "[]") {
          setAiAnalysis(reportText);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar relatório de equipe:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  // Buscar relatório individual do banco de dados
  const fetchIndividualReport = async (userId: number, cycleId?: number) => {
    setLoadingReport(true);
    try {
      const url = new URL("https://app.impulsecompany.com.br/webhook/getIndividualReportByUserId");
      url.searchParams.set("user_id", String(userId));
      if (typeof cycleId === "number" && !Number.isNaN(cycleId)) {
        url.searchParams.set("cycle_id", String(cycleId));
      }
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        const report = Array.isArray(data) ? data[0] : data;
        const rawText = report?.text_report ?? (typeof report === "string" ? report : null);

        let reportText: string | null = typeof rawText === "string" ? rawText : null;
        if (reportText) {
          const trimmed = reportText.trim();
          if (trimmed.startsWith("{") && trimmed.includes('"markdown"')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (typeof parsed?.markdown === "string") {
                reportText = parsed.markdown;
              }
            } catch {
              // se não for JSON válido, mantém como texto
            }
          }
        }

        if (reportText && reportText.trim() !== "" && reportText !== "{}" && reportText !== "[]") {
          setAiAnalysis(reportText);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar relatório individual:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  // Buscar relatório de BU do banco de dados
  const fetchBUReport = async (buId: number, cycleId?: number) => {
    setLoadingReport(true);
    try {
      const url = new URL("https://app.impulsecompany.com.br/webhook/getBUReportById");
      url.searchParams.set("bu_id", String(buId));
      if (typeof cycleId === "number" && !Number.isNaN(cycleId)) {
        url.searchParams.set("cycle_id", String(cycleId));
      }
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        const report = Array.isArray(data) ? data[0] : data;
        const rawText = report?.report || report?.text_report || report?.content || report?.text || (typeof report === "string" ? report : null);

        let reportText: string | null = typeof rawText === "string" ? rawText : null;
        if (reportText) {
          const trimmed = reportText.trim();
          if (trimmed.startsWith("{") && trimmed.includes('"markdown"')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (typeof parsed?.markdown === "string") {
                reportText = parsed.markdown;
              }
            } catch {
              // se não for JSON válido, mantém como texto
            }
          }
        }

        if (reportText && reportText.trim() !== "" && reportText !== "{}" && reportText !== "[]") {
          setAiAnalysis(reportText);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar relatório de BU:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  // Buscar scores e info de BU
  const fetchBUData = async (buId: number, cycleIdNum?: number) => {
    try {
      const [buResponse, scoresResponse, usersResponse, individualScoresResponse] = await Promise.all([
        fetch('https://app.impulsecompany.com.br/webhook/getAllBUs'),
        fetch(`https://app.impulsecompany.com.br/webhook/getBUsScores${cycleIdNum ? `?cycle_id=${cycleIdNum}` : ''}`),
        fetch('https://app.impulsecompany.com.br/webhook/getAllUsers'),
        fetch(`https://app.impulsecompany.com.br/webhook/getAllIndividualScores${cycleIdNum ? `?cycle_id=${cycleIdNum}` : ''}`)
      ]);

      let buUsers: any[] = [];
      
      if (buResponse.ok) {
        const data = await buResponse.json();
        const bus = Array.isArray(data) ? data : [data];
        const bu = bus.find((b: any) => b.id === buId);
        if (bu) {
          // Contar usuários da BU
          let userCount = 0;
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const users = Array.isArray(usersData) ? usersData : [usersData];
            buUsers = users.filter((u: any) => u.bu_id === buId && u.is_active);
            userCount = buUsers.length;
          }
          
          setBuInfo({
            id: bu.id,
            name: bu.name,
            color_hex: bu.color_hex,
            link_picture: bu.link_picture,
            userCount
          });
        }
      }

      if (scoresResponse.ok) {
        const data = await scoresResponse.json();
        const scores = Array.isArray(data) ? data : [data];
        const buScore = scores.find((s: any) => s.bu_id === buId);
        if (buScore) {
          setBuScoreData({
            id: buScore.id || 0,
            bu_id: buId,
            competency: buScore.competency_BU ?? buScore.general_competency ?? buScore.competency ?? 0,
            skill: buScore.skill_BU ?? buScore.general_skill ?? buScore.skill ?? 0,
            attitude: buScore.attitude_BU ?? buScore.general_attitude ?? buScore.attitude ?? 0,
            result: buScore.result_BU ?? buScore.general_result ?? buScore.result ?? 0,
            overall_score: buScore.overall_score_BU ?? buScore.general_overall_score ?? buScore.overall_score ?? 0,
            performance_classification: buScore.performance_classification || '',
          });
        }
      }

      // Calcular distribuição por classificação dos colaboradores da BU
      if (individualScoresResponse.ok && buUsers.length > 0) {
        const individualData = await individualScoresResponse.json();
        const allScores = Array.isArray(individualData) ? individualData : [individualData];
        
        // Filtrar scores dos usuários da BU
        const buUserIds = buUsers.map((u: any) => u.id);
        const buScores = allScores.filter((s: any) => buUserIds.includes(s.user_id));
        
        // Contar por classificação
        const classificationCounts: Record<string, number> = {};
        buScores.forEach((s: any) => {
          const classification = s.performance_classification || 'Não classificado';
          classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
        });
        
        // Converter para array ordenado
        const distribution = Object.entries(classificationCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        
        setBuClassificationDistribution(distribution);
      }
    } catch (error) {
      console.error("Erro ao buscar dados da BU:", error);
    }
  };

  // Buscar scores consolidados do time pelo leader_id
  const fetchTeamScores = async (leaderId: number, cycleIdNum?: number) => {
    try {
      // Montar URL com cycle_id se disponível
      const teamScoresUrl = new URL("https://app.impulsecompany.com.br/webhook/getTeamScoresByLeaderId");
      teamScoresUrl.searchParams.set("leader_id", String(leaderId));
      if (typeof cycleIdNum === "number" && !Number.isNaN(cycleIdNum)) {
        teamScoresUrl.searchParams.set("cycle_id", String(cycleIdNum));
      }
      
      // Buscar scores consolidados do time e scores individuais dos liderados em paralelo
      const [teamResponse, individualScoresResponse] = await Promise.all([
        fetch(teamScoresUrl.toString()),
        fetch(`https://app.impulsecompany.com.br/webhook/getAllIndividualScores${cycleIdNum ? `?cycle_id=${cycleIdNum}` : ''}`)
      ]);

      if (teamResponse.ok) {
        const data = await teamResponse.json();
        const teamScore = Array.isArray(data) ? data[0] : data;
        if (teamScore) {
          setTeamScoreData({
            id: teamScore.id || 0,
            user_id: leaderId,
            final_competency: teamScore.general_competency ?? 0,
            final_skill: teamScore.general_skill ?? 0,
            final_attitude: teamScore.general_attitude ?? 0,
            final_result: teamScore.general_result ?? 0,
            final_overall_score: teamScore.general_overall_score ?? 0,
            performance_classification: teamScore.performance_classification || '',
          });
        }
      }

      // Buscar liderados e calcular distribuição por classificação
      if (individualScoresResponse.ok) {
        const individualData = await individualScoresResponse.json();
        const allScores = Array.isArray(individualData) ? individualData : [individualData];
        
        // Filtrar scores dos liderados deste líder
        const teamMemberScores = allScores.filter((s: any) => s.leader_id === leaderId);
        
        // Contar por classificação
        const classificationCounts: Record<string, number> = {};
        teamMemberScores.forEach((s: any) => {
          const classification = s.performance_classification || 'Não classificado';
          classificationCounts[classification] = (classificationCounts[classification] || 0) + 1;
        });
        
        // Converter para array ordenado
        const distribution = Object.entries(classificationCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        
        setTeamClassificationDistribution(distribution);
      }
    } catch (error) {
      console.error("Erro ao buscar scores do time:", error);
    }
  };

  // Buscar scores individuais do webhook
  const fetchIndividualScores = async (userId: number, cycleId?: number) => {
    try {
      const url = new URL("https://app.impulsecompany.com.br/webhook/getIndividualScoresById");
      url.searchParams.set("user_id", String(userId));
      if (typeof cycleId === "number" && !Number.isNaN(cycleId)) {
        url.searchParams.set("cycle_id", String(cycleId));
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("getIndividualScoresById falhou:", res.status, errText);
        return;
      }

      const data = await res.json();
      const scores = Array.isArray(data) ? data : [data];
      setIndividualScores(scores);

      // Se o webhook devolveu o score consolidado do ciclo, salva também em scoreData
      const first = scores[0] as Partial<ScoreData> | undefined;
      if (first && typeof first.final_overall_score === "number") {
        setScoreData(first as ScoreData);
      }
    } catch (error) {
      console.error("Erro ao buscar scores individuais:", error);
    }
  };

  // Buscar ciclo anterior e scores anteriores para comparação
  const fetchPreviousCycleScores = async (currentCycleId: number, userId?: number, buId?: number, isTeam?: boolean) => {
    try {
      // Limpar scores anteriores antes de buscar
      setPreviousScores(null);
      
      // Buscar todos os ciclos
      const cyclesRes = await fetch("https://app.impulsecompany.com.br/webhook/getEvalutionCycles");
      if (!cyclesRes.ok) return;
      
      const cyclesData = await cyclesRes.json();
      const cycles: EvaluationCycle[] = Array.isArray(cyclesData) ? cyclesData : [cyclesData];
      
      // Ordenar ciclos por created_at (mais recente primeiro)
      const sortedCycles = cycles.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Encontrar o índice do ciclo atual
      const currentIndex = sortedCycles.findIndex(c => c.id === currentCycleId);
      if (currentIndex === -1 || currentIndex >= sortedCycles.length - 1) {
        // Ciclo atual não encontrado ou é o primeiro ciclo
        return;
      }
      
      // Pegar o ciclo anterior
      const previousCycle = sortedCycles[currentIndex + 1];
      
      // Helper para verificar se um score é válido (não nulo/undefined e maior que 0)
      const hasValidScore = (score: any): boolean => {
        return score !== null && score !== undefined && typeof score === 'number' && score > 0;
      };
      
      // Buscar scores do ciclo anterior baseado no tipo de visualização
      if (buId && isBUView) {
        // Buscar scores de BU do ciclo anterior
        const buScoresRes = await fetch(`https://app.impulsecompany.com.br/webhook/getBUsScores?cycle_id=${previousCycle.id}`);
        if (buScoresRes.ok) {
          const data = await buScoresRes.json();
          const scores = Array.isArray(data) ? data : [data];
          const prevBuScore = scores.find((s: any) => s.bu_id === buId);

          const competency = hasValidScore(prevBuScore?.competency_BU ?? prevBuScore?.general_competency ?? prevBuScore?.competency)
            ? (prevBuScore?.competency_BU ?? prevBuScore?.general_competency ?? prevBuScore?.competency)
            : null;
          const skill = hasValidScore(prevBuScore?.skill_BU ?? prevBuScore?.general_skill ?? prevBuScore?.skill)
            ? (prevBuScore?.skill_BU ?? prevBuScore?.general_skill ?? prevBuScore?.skill)
            : null;
          const attitude = hasValidScore(prevBuScore?.attitude_BU ?? prevBuScore?.general_attitude ?? prevBuScore?.attitude)
            ? (prevBuScore?.attitude_BU ?? prevBuScore?.general_attitude ?? prevBuScore?.attitude)
            : null;
          const result = hasValidScore(prevBuScore?.result_BU ?? prevBuScore?.general_result ?? prevBuScore?.result)
            ? (prevBuScore?.result_BU ?? prevBuScore?.general_result ?? prevBuScore?.result)
            : null;
          const overall = hasValidScore(prevBuScore?.overall_score_BU ?? prevBuScore?.general_overall_score ?? prevBuScore?.overall_score)
            ? (prevBuScore?.overall_score_BU ?? prevBuScore?.general_overall_score ?? prevBuScore?.overall_score)
            : null;

          const hasAny = [competency, skill, attitude, result, overall].some(v => typeof v === 'number');
          if (prevBuScore && hasAny) {
            setPreviousScores({ competency, skill, attitude, result, overall });
          }
        }
      } else if (userId && isTeam) {
        // Buscar scores de equipe do ciclo anterior
        const teamScoresRes = await fetch(`https://app.impulsecompany.com.br/webhook/getTeamScoresByLeaderId?leader_id=${userId}&cycle_id=${previousCycle.id}`);
        if (teamScoresRes.ok) {
          const data = await teamScoresRes.json();
          const teamScore = Array.isArray(data) ? data[0] : data;

          const competency = hasValidScore(teamScore?.general_competency) ? teamScore.general_competency : null;
          const skill = hasValidScore(teamScore?.general_skill) ? teamScore.general_skill : null;
          const attitude = hasValidScore(teamScore?.general_attitude) ? teamScore.general_attitude : null;
          const result = hasValidScore(teamScore?.general_result) ? teamScore.general_result : null;
          const overall = hasValidScore(teamScore?.general_overall_score) ? teamScore.general_overall_score : null;

          const hasAny = [competency, skill, attitude, result, overall].some(v => typeof v === 'number');
          if (teamScore && hasAny) {
            setPreviousScores({ competency, skill, attitude, result, overall });
          }
        }
      } else if (userId) {
        // Buscar scores individuais do ciclo anterior
        const individualScoresRes = await fetch(`https://app.impulsecompany.com.br/webhook/getIndividualScoresById?user_id=${userId}&cycle_id=${previousCycle.id}`);
        if (individualScoresRes.ok) {
          const data = await individualScoresRes.json();
          const scores = Array.isArray(data) ? data : [data];
          const first = scores[0];

          const competency = hasValidScore(first?.final_competency) ? first.final_competency : null;
          const skill = hasValidScore(first?.final_skill) ? first.final_skill : null;
          const attitude = hasValidScore(first?.final_attitude) ? first.final_attitude : null;
          const result = hasValidScore(first?.final_result) ? first.final_result : null;
          const overall = hasValidScore(first?.final_overall_score) ? first.final_overall_score : null;

          const hasAny = [competency, skill, attitude, result, overall].some(v => typeof v === 'number');
          if (first && hasAny) {
            setPreviousScores({ competency, skill, attitude, result, overall });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar scores do ciclo anterior:", error);
    }
  };

  // Componente para mostrar indicador de tendência
  const TrendIndicator = ({ current, previous }: { current: number; previous: number | null | undefined }) => {
    if (previous === undefined || previous === null) return null;

    const diff = current - previous;
    const threshold = 0.01; // Tolerância para considerar "igual"

    if (diff > threshold) {
      return (
        <span aria-label={`Subiu ${diff.toFixed(2)} em relação ao ciclo anterior`}>
          <ArrowUpRight className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
        </span>
      );
    }

    if (diff < -threshold) {
      return (
        <span aria-label={`Desceu ${Math.abs(diff).toFixed(2)} em relação ao ciclo anterior`}>
          <ArrowDownRight className="w-3.5 h-3.5 text-red-600" strokeWidth={2.5} />
        </span>
      );
    }

    return (
      <span aria-label="Manteve a mesma nota do ciclo anterior">
        <Minus className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
      </span>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const cycleIdNum = cycleId ? parseInt(cycleId) : undefined;

      // Se temos bu_id, buscar dados da BU
      if (buIdParam && isBUView) {
        try {
          await fetchBUData(parseInt(buIdParam), cycleIdNum);
          await fetchBUReport(parseInt(buIdParam), cycleIdNum);
          // Buscar scores do ciclo anterior para BU
          if (cycleIdNum) {
            await fetchPreviousCycleScores(cycleIdNum, undefined, parseInt(buIdParam), false);
          }
        } catch (error) {
          console.error("Erro ao buscar dados da BU:", error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Se temos user_id direto, buscar dados do usuário
      if (userIdParam) {
        try {
          const userRes = await fetch(`https://app.impulsecompany.com.br/webhook/getUser?user_id=${userIdParam}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            const user = Array.isArray(userData) ? userData[0] : userData;
            if (user) {
              setUserInfo({
                id: parseInt(userIdParam),
                name: user.name,
                position: user.position,
                role: user.role,
                current_band: user.current_band,
                link_picture: user.link_picture || null,
              });
            }
          }

          // Buscar scores individuais (user_id via query + cycle_id via query quando existir)
          await fetchIndividualScores(parseInt(userIdParam), cycleIdNum);
          
          // Se for visualização de equipe, buscar scores e relatório do time
          if (isTeamView) {
            await fetchTeamScores(parseInt(userIdParam), cycleIdNum);
            await fetchTeamReport(parseInt(userIdParam), cycleIdNum);
            // Buscar scores do ciclo anterior para equipe
            if (cycleIdNum) {
              await fetchPreviousCycleScores(cycleIdNum, parseInt(userIdParam), undefined, true);
            }
          } else {
            // Visualização individual - buscar relatório individual
            await fetchIndividualReport(parseInt(userIdParam), cycleIdNum);
            // Buscar scores do ciclo anterior para indivíduo
            if (cycleIdNum) {
              await fetchPreviousCycleScores(cycleIdNum, parseInt(userIdParam), undefined, false);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Se temos score_id, buscar pelo score
      if (!scoreId) {
        setLoading(false);
        return;
      }

      try {
        // Buscar dados do score
        const scoresUrl = cycleId 
          ? `https://app.impulsecompany.com.br/webhook/getAllIndividualScores?cycle_id=${cycleId}`
          : "https://app.impulsecompany.com.br/webhook/getAllIndividualScores";
        const scoresRes = await fetch(scoresUrl);
        if (scoresRes.ok) {
          const data = await scoresRes.json();
          const scores = Array.isArray(data) ? data : [data];
          const score = scores.find((s: ScoreData) => s.id === parseInt(scoreId));
          if (score) {
            setScoreData(score);

            // Buscar dados do usuário
            const userRes = await fetch(`https://app.impulsecompany.com.br/webhook/getUser?user_id=${score.user_id}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              const user = Array.isArray(userData) ? userData[0] : userData;
              if (user) {
                setUserInfo({
                  id: score.user_id,
                  name: user.name,
                  position: user.position,
                  role: user.role,
                  current_band: user.current_band,
                  link_picture: user.link_picture || null,
                });
              }
            }

            // Buscar scores individuais (user_id + cycle_id quando existir)
            await fetchIndividualScores(score.user_id, cycleIdNum);
            
            // Buscar relatório individual
            await fetchIndividualReport(score.user_id, cycleIdNum);
            
            // Buscar scores do ciclo anterior (sempre que tiver cycleIdNum)
            if (cycleIdNum) {
              await fetchPreviousCycleScores(cycleIdNum, score.user_id, undefined, isTeamView);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scoreId, userIdParam, buIdParam, cycleId, isBUView]);


  const getScoreIcon = (score: number) => {
    if (score >= 4) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 3) return <Minus className="w-4 h-4 text-amber-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getClassificationColor = (classification: string) => {
    if (classification?.includes('Excelência')) return 'bg-green-100 text-green-700 border-green-200';
    if (classification?.includes('Alta Performance') || classification?.includes('Alta')) return 'bg-green-100 text-green-700 border-green-200';
    if (classification?.includes('Evolução') || classification?.includes('Constante')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (classification?.includes('Atenção')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (classification?.includes('Zona Crítica') || classification?.includes('Risco') || classification?.includes('Crítico')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'leader': return 'Líder';
      case 'employee': return 'Colaborador';
      default: return role;
    }
  };

  // Calcula se a cor de fundo é clara (para usar ícone escuro) ou escura (para usar ícone claro)
  const isLightColor = (hexColor: string): boolean => {
    if (!hexColor) return false;
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Fórmula de luminância relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    
    setDownloadingPdf(true);
    try {
      const element = reportRef.current;
      const name = isBUView ? buInfo?.name : userInfo?.name;
      const fileName = `Relatorio_${(name || 'Desconhecido').replace(/\s+/g, '_')}.pdf`;
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Se não tem score nem user info nem bu info, mostrar erro
  if (!scoreData && !userInfo && !buInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Dados não encontrados</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  // Modo simplificado: só temos userInfo (sem scores ainda)
  const hasScores = scoreData !== null || buScoreData !== null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => {
              // Voltar para origem correta
              if (fromView === 'home') {
                navigate('/home');
              } else if (cycleId) {
                // individual, team, bu vindo do Report
                const view = fromView || 'general';
                navigate(`/report?cycle_id=${cycleId}&tab=results&view=${view}`);
              } else {
                navigate(-1);
              }
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Análise de Desempenho</h1>
              <p className="text-sm text-muted-foreground">Relatório detalhado com IA</p>
            </div>
          </div>
          {aiAnalysis && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          )}
        </div>

        <div ref={reportRef}>

        {/* Info Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {isBUView ? (
              buInfo?.link_picture ? (
                <img 
                  src={buInfo.link_picture} 
                  alt={buInfo?.name || ''} 
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: buInfo?.color_hex || '#6366f1' }}
                >
                  <Building2 className={`w-6 h-6 ${buInfo?.color_hex && isLightColor(buInfo.color_hex) ? 'text-gray-800' : 'text-white'}`} />
                </div>
              )
            ) : isTeamView ? (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            ) : userInfo?.link_picture ? (
              <img 
                src={userInfo.link_picture} 
                alt={userInfo?.name || ''} 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {isBUView 
                    ? (buInfo?.name || `BU #${buIdParam}`)
                    : isTeamView 
                      ? `Equipe de ${userInfo?.name || `Líder #${effectiveUserId}`}`
                      : (userInfo?.name || `Usuário #${effectiveUserId}`)}
                </h2>
                {!isTeamView && !isBUView && userInfo?.current_band && (
                  <span 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: userInfo.current_band }}
                    title="Faixa"
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {isBUView ? (
                  <span>Unidade de Negócio • {buInfo?.userCount || 0} colaborador{(buInfo?.userCount || 0) !== 1 ? 'es' : ''}</span>
                ) : isTeamView ? (
                  <span>Visão consolidada da equipe</span>
                ) : (
                  <>
                    {userInfo?.role && (
                      <span>{getRoleLabel(userInfo.role)}</span>
                    )}
                    {userInfo?.role && userInfo?.position && (
                      <span>•</span>
                    )}
                    {userInfo?.position && <span>{userInfo.position}</span>}
                  </>
                )}
              </div>
            </div>
            {(displayScoreData?.performance_classification || buScoreData?.performance_classification) && (
              <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium border ${getClassificationColor(isBUView ? (buScoreData?.performance_classification || '') : (displayScoreData?.performance_classification || ''))}`}>
                {isBUView ? buScoreData?.performance_classification : displayScoreData?.performance_classification}
              </span>
            )}
          </div>

          {/* Score Section */}
          {isBUView && buScoreData ? (
            <>
              {/* Overall Score */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-sm text-primary mb-1">Score Geral da BU</p>
                  {previousScores && (
                    <TrendIndicator current={buScoreData.overall_score || 0} previous={previousScores.overall} />
                  )}
                </div>
                <p className="text-3xl font-bold text-primary">
                  {buScoreData.overall_score?.toFixed(2) || '--'}
                </p>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-blue-600 mb-1">Competência</p>
                    {previousScores && (
                      <TrendIndicator current={buScoreData.competency || 0} previous={previousScores.competency} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {buScoreData.competency?.toFixed(2) || '--'}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-green-600 mb-1">Habilidade</p>
                    {previousScores && (
                      <TrendIndicator current={buScoreData.skill || 0} previous={previousScores.skill} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-700">
                    {buScoreData.skill?.toFixed(2) || '--'}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-amber-600 mb-1">Atitude</p>
                    {previousScores && (
                      <TrendIndicator current={buScoreData.attitude || 0} previous={previousScores.attitude} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-amber-700">
                    {buScoreData.attitude?.toFixed(2) || '--'}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-purple-600 mb-1">Resultado</p>
                    {previousScores && (
                      <TrendIndicator current={buScoreData.result || 0} previous={previousScores.result} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {buScoreData.result?.toFixed(2) || '--'}
                  </p>
                </div>
              </div>
            </>
          ) : displayScoreData ? (
            <>
              {/* Overall Score */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-sm text-primary mb-1">{isTeamView ? 'Score Geral da Equipe' : 'Score Geral'}</p>
                  {previousScores && (
                    <TrendIndicator current={displayScoreData.final_overall_score || 0} previous={previousScores.overall} />
                  )}
                </div>
                <p className="text-3xl font-bold text-primary">
                  {displayScoreData.final_overall_score?.toFixed(2) || '--'}
                </p>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-blue-600 mb-1">Competência</p>
                    {previousScores && (
                      <TrendIndicator current={displayScoreData.final_competency || 0} previous={previousScores.competency} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {displayScoreData.final_competency?.toFixed(2) || '--'}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-green-600 mb-1">Habilidade</p>
                    {previousScores && (
                      <TrendIndicator current={displayScoreData.final_skill || 0} previous={previousScores.skill} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-green-700">
                    {displayScoreData.final_skill?.toFixed(2) || '--'}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-amber-600 mb-1">Atitude</p>
                    {previousScores && (
                      <TrendIndicator current={displayScoreData.final_attitude || 0} previous={previousScores.attitude} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-amber-700">
                    {displayScoreData.final_attitude?.toFixed(2) || '--'}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-purple-600 mb-1">Resultado</p>
                    {previousScores && (
                      <TrendIndicator current={displayScoreData.final_result || 0} previous={previousScores.result} />
                    )}
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {displayScoreData.final_result?.toFixed(2) || '--'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Scores ainda não disponíveis para este ciclo
              </p>
            </div>
          )}
        </div>

        {/* AI Analysis Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Análise de IA</h3>
          </div>

          {loadingReport ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-muted-foreground">
                Carregando relatório...
              </div>
            </div>
          ) : !aiAnalysis ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Relatório não disponível {isBUView ? 'para esta BU' : 'para este usuário'}
              </p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer 
                content={aiAnalysis} 
                performanceClassification={isBUView ? buScoreData?.performance_classification : displayScoreData?.performance_classification}
                chartData={{
                  radar: isBUView && buScoreData
                    ? [
                        { name: "Competência", value: buScoreData.competency || 0 },
                        { name: "Habilidade", value: buScoreData.skill || 0 },
                        { name: "Atitude", value: buScoreData.attitude || 0 },
                        { name: "Resultado", value: buScoreData.result || 0 },
                        { name: "Score Final", value: buScoreData.overall_score || 0 },
                      ]
                    : displayScoreData
                    ? [
                        { name: "Competência", value: displayScoreData.final_competency || 0 },
                        { name: "Habilidade", value: displayScoreData.final_skill || 0 },
                        { name: "Atitude", value: displayScoreData.final_attitude || 0 },
                        { name: "Resultado", value: displayScoreData.final_result || 0 },
                        { name: "Score Final", value: displayScoreData.final_overall_score || 0 },
                      ]
                    : undefined,
                  bar: isBUView && buClassificationDistribution.length > 0
                    ? buClassificationDistribution
                    : isTeamView && teamClassificationDistribution.length > 0
                    ? teamClassificationDistribution
                    : displayScoreData
                    ? [
                        { name: "Competência", value: displayScoreData.final_competency || 0 },
                        { name: "Habilidade", value: displayScoreData.final_skill || 0 },
                        { name: "Atitude", value: displayScoreData.final_attitude || 0 },
                        { name: "Resultado", value: displayScoreData.final_result || 0 },
                      ]
                    : undefined,
                  gauge: isBUView && buScoreData
                    ? {
                        value: (buScoreData.overall_score / 5) * 100,
                        label: "Score da BU",
                      }
                    : displayScoreData
                    ? {
                        value: (displayScoreData.final_overall_score / 5) * 100,
                        label: isTeamView ? "Score da Equipe" : "Score Geral",
                      }
                    : undefined,
                }}
              />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalysis;
