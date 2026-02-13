import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  UserCheck,
  Crown,
  FileText,
  PieChart,
  Radar,
  LogOut,
  UserPlus,
  ClipboardList,
  Users,
  Loader2,
  Plus,
  Search,
  X,
  UserMinus,
  ChevronDown,
  ChevronUp,
  Link2,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Download,
  Building2,
  Settings,
  BarChart3,
  BellRing,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import html2pdf from "html2pdf.js";
import logo from "@/assets/logo.jpg";
import { EvaluationCycleManager } from "@/components/EvaluationCycleManager";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Phone } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const charLabels: Record<string, string> = {
  competencia: "C",
  habilidade: "H",
  atitude: "A",
  resultado: "R",
};

const charFullLabels: Record<string, string> = {
  competencia: "Competência",
  habilidade: "Habilidade",
  atitude: "Atitude",
  resultado: "Resultado",
};

const charHexColors: Record<string, string> = {
  competencia: "#1F4FD8",
  habilidade: "#2FAE61",
  atitude: "#F59E0B",
  resultado: "#7C3AED",
};

interface GaugeChartProps {
  value: number | null;
  maxValue: number;
  color: string;
  label: string;
  fullLabel: string;
  isBest?: boolean;
  isWorst?: boolean;
}

const GaugeChart = ({ value, maxValue, color, label, fullLabel, isBest, isWorst }: GaugeChartProps) => {
  const hasData = value !== null;
  const targetPercentage = hasData ? ((value - 1) / (maxValue - 1)) * 100 : 0;
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    if (!hasData) return;

    // Reset and animate
    setAnimatedPercentage(0);
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercentage(targetPercentage * easeOutCubic);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, hasData, targetPercentage]);

  const angle = (animatedPercentage / 100) * 180;

  return (
    <div
      className={`group bg-card rounded p-2 relative flex flex-col justify-center ${isBest ? "ring-2 ring-green-500" : isWorst ? "ring-2 ring-destructive" : "border border-border"}`}
    >
      {isBest && <TrendingUp className="absolute top-1 right-1 w-3 h-3 text-green-500" />}
      {isWorst && <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-destructive" />}

      {/* Tooltip para Ponto Forte */}
      {isBest && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Ponto Forte
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-green-500"></div>
        </div>
      )}

      {/* Tooltip para Área de Desenvolvimento */}
      {isWorst && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-destructive text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Área de Desenvolvimento
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-destructive"></div>
        </div>
      )}

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 60" className="w-full max-w-[100px]">
          <path d="M 8 55 A 42 42 0 0 1 92 55" fill="none" stroke="#d1d5db" strokeWidth="12" strokeLinecap="butt" />
          {hasData && (
            <path
              d="M 8 55 A 42 42 0 0 1 92 55"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="butt"
              strokeDasharray={`${(angle / 180) * 131.95} 131.95`}
            />
          )}
          <text x="50" y="52" textAnchor="middle" fontSize="18" fontWeight="bold" fill={hasData ? color : "#9ca3af"}>
            {label}
          </text>
        </svg>

        <div className="text-center">
          <span className="font-bold text-base" style={{ color: hasData ? color : "#9ca3af" }}>
            {hasData ? value.toFixed(2) : "--"}
          </span>
          <p className="text-muted-foreground text-[9px]">{fullLabel}</p>
        </div>
      </div>
    </div>
  );
};

const ScoreGauge = ({ value }: { value: number | null }) => {
  const hasData = value !== null;
  const targetPercentage = hasData ? ((value - 1) / (5 - 1)) * 100 : 0;
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    if (!hasData) return;

    // Reset and animate
    setAnimatedPercentage(0);
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercentage(targetPercentage * easeOutCubic);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, hasData, targetPercentage]);

  const angle = (animatedPercentage / 100) * 180;

  return (
    <svg viewBox="0 0 100 60" className="w-full max-w-[140px]">
      <path d="M 8 55 A 42 42 0 0 1 92 55" fill="none" stroke="#d1d5db" strokeWidth="12" strokeLinecap="butt" />
      {hasData && (
        <path
          d="M 8 55 A 42 42 0 0 1 92 55"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="12"
          strokeLinecap="butt"
          strokeDasharray={`${(angle / 180) * 131.95} 131.95`}
        />
      )}
    </svg>
  );
};

const EmptyRadarChart = () => {
  const radarData = [
    { key: "competencia", label: "Competência" },
    { key: "habilidade", label: "Habilidade" },
    { key: "atitude", label: "Atitude" },
    { key: "resultado", label: "Resultado" },
    { key: "score", label: "Score Final" },
  ];

  const numPoints = radarData.length;
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 100;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = (value / 5) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = maxRadius + 35;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full max-h-[350px]">
      {gridLevels.map((level) => (
        <circle
          key={level}
          cx={centerX}
          cy={centerY}
          r={(level / 5) * maxRadius}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
        />
      ))}

      {radarData.map((_, i) => {
        const point = getPoint(i, 5);
        return <line key={i} x1={centerX} y1={centerY} x2={point.x} y2={point.y} stroke="#d1d5db" strokeWidth="1" />;
      })}

      {gridLevels.map((level) => (
        <text key={level} x={centerX + (level / 5) * maxRadius + 5} y={centerY - 3} fontSize="9" fill="#9ca3af">
          {level}
        </text>
      ))}

      {radarData.map((d, i) => {
        const labelPoint = getLabelPoint(i);
        return (
          <text
            key={`label-${d.key}`}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="#9ca3af"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

interface FilledRadarChartProps {
  competencia: number;
  habilidade: number;
  atitude: number;
  resultado: number;
  score: number;
}

const FilledRadarChart = ({ competencia, habilidade, atitude, resultado, score }: FilledRadarChartProps) => {
  const radarData = [
    { key: "competencia", label: "Competência", value: competencia },
    { key: "habilidade", label: "Habilidade", value: habilidade },
    { key: "atitude", label: "Atitude", value: atitude },
    { key: "resultado", label: "Resultado", value: resultado },
    { key: "score", label: "Score Final", value: score },
  ];

  const numPoints = radarData.length;
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 100;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = (value / 5) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = maxRadius + 35;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const gridLevels = [1, 2, 3, 4, 5];

  // Criar path para a área preenchida
  const dataPoints = radarData.map((d, i) => getPoint(i, d.value));
  const pathData = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full max-h-[350px]">
      {/* Grid circles */}
      {gridLevels.map((level) => (
        <circle
          key={level}
          cx={centerX}
          cy={centerY}
          r={(level / 5) * maxRadius}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {radarData.map((_, i) => {
        const point = getPoint(i, 5);
        return <line key={i} x1={centerX} y1={centerY} x2={point.x} y2={point.y} stroke="#d1d5db" strokeWidth="1" />;
      })}

      {/* Grid level labels */}
      {gridLevels.map((level) => (
        <text key={level} x={centerX + (level / 5) * maxRadius + 5} y={centerY - 3} fontSize="9" fill="#9ca3af">
          {level}
        </text>
      ))}

      {/* Filled area */}
      <path d={pathData} fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />
      ))}

      {/* Labels */}
      {radarData.map((d, i) => {
        const labelPoint = getLabelPoint(i);
        return (
          <text
            key={`label-${d.key}`}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="#374151"
            fontWeight="500"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

interface TeamMember {
  id: number;
  name: string;
  role?: string;
  position?: string;
  current_band?: string;
  leader_id?: number | null;
  bu_id?: number;
  link_picture?: string | null;
  char?: { competencia: number; habilidade: number; atitude: number; resultado: number };
}

interface TeamGroup {
  leader: TeamMember;
  members: TeamMember[];
}

const getBandColor = (band?: string) => {
  if (!band) return "bg-gray-400";
  const bandLower = band.toLowerCase();
  if (bandLower === "branca") return "bg-gray-200 border border-gray-400";
  if (bandLower === "azul") return "bg-blue-500";
  if (bandLower === "roxa") return "bg-purple-600";
  if (bandLower === "marrom") return "bg-amber-800";
  if (bandLower === "preta") return "bg-gray-900";
  return "bg-gray-400";
};

// Função para obter a cor hex da faixa (para uso com style)
const getBandColorHex = (band?: string): string => {
  if (!band) return "#9ca3af"; // cinza padrão
  const bandLower = band.toLowerCase();
  switch (bandLower) {
    case "branca":
      return "#FFFFFF";
    case "azul":
      return "#3B82F6";
    case "roxa":
      return "#8B5CF6";
    case "marrom":
      return "#92400E";
    case "preta":
      return "#1F2937";
    default:
      return "#9ca3af";
  }
};

const getBandOrder = (band?: string): number => {
  if (!band) return 99;
  const bandLower = band.toLowerCase();
  if (bandLower === "preta") return 1;
  if (bandLower === "marrom") return 2;
  if (bandLower === "roxa") return 3;
  if (bandLower === "azul") return 4;
  if (bandLower === "branca") return 5;
  return 99;
};

const sortTeamMembers = (members: TeamMember[]) => {
  return [...members].sort((a, b) => {
    const bandOrderA = getBandOrder(a.current_band);
    const bandOrderB = getBandOrder(b.current_band);
    if (bandOrderA !== bandOrderB) return bandOrderA - bandOrderB;
    return a.name.localeCompare(b.name);
  });
};

const getRoleLabel = (role?: string): string => {
  if (!role) return "Colaborador";
  const roleLower = role.toLowerCase();
  if (roleLower === "leader") return "Líder";
  if (roleLower === "employee") return "Colaborador";
  if (roleLower === "adm") return "Administrador";
  return role;
};

const getClassification = (score: number) => {
  if (score > 4.5) return { label: "Alta Performance", color: "bg-green-500", textColor: "text-green-600" };
  if (score > 3.5) return { label: "Evolução Constante", color: "bg-blue-500", textColor: "text-blue-600" };
  if (score > 2.5) return { label: "Zona de Atenção", color: "bg-amber-500", textColor: "text-amber-600" };
  return { label: "Zona Crítica", color: "bg-red-500", textColor: "text-red-600" };
};

const getMemberScore = (char: { competencia: number; habilidade: number; atitude: number; resultado: number }) => {
  return ((char.competencia + char.habilidade + char.atitude + char.resultado) / 4).toFixed(2);
};

const getTeamAverage = (teamMembers: TeamMember[]) => {
  const membersWithChar = teamMembers.filter((m) => m.char);
  if (membersWithChar.length === 0) {
    return { competencia: 0, habilidade: 0, atitude: 0, resultado: 0, overall: 0 };
  }
  const totals = { competencia: 0, habilidade: 0, atitude: 0, resultado: 0 };
  membersWithChar.forEach((member) => {
    if (member.char) {
      totals.competencia += member.char.competencia;
      totals.habilidade += member.char.habilidade;
      totals.atitude += member.char.atitude;
      totals.resultado += member.char.resultado;
    }
  });
  const count = membersWithChar.length;
  return {
    competencia: totals.competencia / count,
    habilidade: totals.habilidade / count,
    atitude: totals.atitude / count,
    resultado: totals.resultado / count,
    overall: (totals.competencia + totals.habilidade + totals.atitude + totals.resultado) / (count * 4),
  };
};

const getTeamClassificationCounts = (teamMembers: TeamMember[]) => {
  const counts = { alta: 0, evolucao: 0, atencao: 0, critica: 0 };
  teamMembers.forEach((member) => {
    if (member.char) {
      const score =
        (member.char.competencia + member.char.habilidade + member.char.atitude + member.char.resultado) / 4;
      if (score > 4.5) counts.alta++;
      else if (score > 3.5) counts.evolucao++;
      else if (score > 2.5) counts.atencao++;
      else counts.critica++;
    }
  });
  return counts;
};

// Função para calcular dias restantes e cor do deadline
const getDeadlineInfo = (deadlineString: string | null) => {
  if (!deadlineString) return null;

  const deadline = new Date(deadlineString);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Formatar data
  const parts = deadlineString.split("T")[0].split("-");
  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : "--";

  let colorClass = "text-muted-foreground bg-muted";
  if (diffDays <= 2) {
    colorClass = "text-red-600 bg-red-50";
  } else if (diffDays === 3) {
    colorClass = "text-orange-600 bg-orange-50";
  } else if (diffDays === 4) {
    colorClass = "text-yellow-600 bg-yellow-50";
  }

  return { formattedDate, diffDays, colorClass };
};

// Interface para avaliações do webhook
interface EvaluationFromAPI {
  id: number;
  evaluator_user_id: number;
  evaluated_user_id: number;
  evaluation_type: string;
  status?: string;
  evalution_cycle_id?: number;
}

// Interface para ciclos de avaliação
interface EvaluationCycle {
  id: number;
  name: string;
  status: string;
  start_date?: string;
  evaluation_deadline?: string;
  created_at?: string;
}

const Home = () => {
  const [chartType, setChartType] = useState<"gauge" | "radar">("gauge");
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [allCycles, setAllCycles] = useState<EvaluationCycle[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<TeamMember[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);
  const [allTeams, setAllTeams] = useState<TeamGroup[]>([]);
  const [loadingAllTeams, setLoadingAllTeams] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [noLeadUsers, setNoLeadUsers] = useState<TeamMember[]>([]);
  const [isAdminAddDialogOpen, setIsAdminAddDialogOpen] = useState(false);
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<TeamGroup | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminMemberToRemove, setAdminMemberToRemove] = useState<{ member: TeamMember; team: TeamGroup } | null>(null);
  const [isAdminRemoving, setIsAdminRemoving] = useState(false);
  const [isAdminAdding, setIsAdminAdding] = useState<number | null>(null);
  const [isSelectTeamDialogOpen, setIsSelectTeamDialogOpen] = useState(false);
  const [selectedUserForTeam, setSelectedUserForTeam] = useState<TeamMember | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  // Estados para avaliações
  const [userEvaluations, setUserEvaluations] = useState<EvaluationFromAPI[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [evaluatedUsersNames, setEvaluatedUsersNames] = useState<
    Record<number, { name: string; position?: string; bu_id?: number }>
  >({});
  const [currentCycleDeadline, setCurrentCycleDeadline] = useState<string | null>(null);
  const [currentCycleId, setCurrentCycleId] = useState<number | null>(null);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [isPreliminaryResults, setIsPreliminaryResults] = useState(false);
  const [loadingCycleStatus, setLoadingCycleStatus] = useState(true);

  // Estados para scores individuais do usuário
  const [userScores, setUserScores] = useState<{
    final_competency: number | null;
    final_skill: number | null;
    final_attitude: number | null;
    final_result: number | null;
    final_overall_score: number | null;
    performance_classification: string | null;
  } | null>(null);
  const [loadingUserScores, setLoadingUserScores] = useState(false);

  // Estados para scores de equipe (para líderes)
  const [teamScores, setTeamScores] = useState<{
    final_competency: number | null;
    final_skill: number | null;
    final_attitude: number | null;
    final_result: number | null;
    final_overall_score: number | null;
  } | null>(null);
  const [loadingTeamScores, setLoadingTeamScores] = useState(false);

  // Estado para modal de notas da equipe
  const [isTeamNotesOpen, setIsTeamNotesOpen] = useState(false);
  const [teamMemberScores, setTeamMemberScores] = useState<
    Array<{
      id: number;
      name: string;
      position?: string;
      current_band?: string;
      role?: string;
      bu_id?: number;
      link_picture?: string | null;
      competency: number | null;
      skill: number | null;
      attitude: number | null;
      result: number | null;
      overall_score: number | null;
      classification?: string;
    }>
  >([]);
  const [loadingTeamMemberScores, setLoadingTeamMemberScores] = useState(false);
  const [isTeamRadarOpen, setIsTeamRadarOpen] = useState(false);
  const [teamChartType, setTeamChartType] = useState<"gauge" | "radar">("gauge");

  // Estados para Definir Pares
  const [isPeersOpen, setIsPeersOpen] = useState(false);
  const [memberPeers, setMemberPeers] = useState<Record<number, number[]>>({});
  const [peersSearchQuery, setPeersSearchQuery] = useState("");
  const [selectedMemberForPeers, setSelectedMemberForPeers] = useState<TeamMember | null>(null);
  const [tempSelectedPeers, setTempSelectedPeers] = useState<number[]>([]);
  const [showOtherTeamsPeers, setShowOtherTeamsPeers] = useState(false);
  const [allUsersForPeers, setAllUsersForPeers] = useState<TeamMember[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [loadingAllUsersForPeers, setLoadingAllUsersForPeers] = useState(false);
  const [otherTeamsPeersSearch, setOtherTeamsPeersSearch] = useState("");
  const [isOwnPeersDialogOpen, setIsOwnPeersDialogOpen] = useState(false);
  const [ownPeers, setOwnPeers] = useState<number[]>([]);
  const [tempOwnPeers, setTempOwnPeers] = useState<number[]>([]);
  const [savingOwnPeers, setSavingOwnPeers] = useState(false);
  const [ownPeersSearchQuery, setOwnPeersSearchQuery] = useState("");
  const [isTeamStatsOpen, setIsTeamStatsOpen] = useState(false);

  // Estados para PDI com o CEO
  const [isPDICEODialogOpen, setIsPDICEODialogOpen] = useState(false);
  const [isPDIUserDialogOpen, setIsPDIUserDialogOpen] = useState(false);
  const [pdiCEODeadline, setPdiCEODeadline] = useState("");
  const [pdiCEOActiveToggle, setPdiCEOActiveToggle] = useState(false);
  const [creatingPDICycle, setCreatingPDICycle] = useState(false);
  const [pdiUserPhone, setPdiUserPhone] = useState("");
  const [pdiUserMessage, setPdiUserMessage] = useState("");
  const [registeringPDI, setRegisteringPDI] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  const [currentPDICycle, setCurrentPDICycle] = useState<{
    id: number;
    status: string;
    registration_deadline: string;
    ceo_user: number;
  } | null>(null);
  const [userPDIRegistered, setUserPDIRegistered] = useState(false);
  const [loadingPDICycle, setLoadingPDICycle] = useState(true);
  const [updatingPDIStatus, setUpdatingPDIStatus] = useState(false);

  // Estados para Dialog de Notificações (PDI Users)
  const [isPDINotificationsOpen, setIsPDINotificationsOpen] = useState(false);
  const [pdiCycles, setPdiCycles] = useState<
    Array<{
      id: number;
      status: string;
      registration_deadline: string;
      ceo_user: number;
    }>
  >([]);
  const [selectedPDICycleForView, setSelectedPDICycleForView] = useState<number | null>(null);
  const [pdiUsers, setPdiUsers] = useState<
    Array<{
      id: number;
      user_id: number;
      pdi_cycle: number;
      phone: string;
      done: boolean;
      user_name?: string;
      user_email?: string;
      user_position?: string;
      user_role?: string;
      user_band?: string;
      user_bu_id?: number;
      user_picture?: string | null;
    }>
  >([]);
  const [loadingPDIUsers, setLoadingPDIUsers] = useState(false);
  const [updatingPDIUserDone, setUpdatingPDIUserDone] = useState<number | null>(null);
  const [pendingPDINotDoneCount, setPendingPDINotDoneCount] = useState(0);

  const [buName, setBuName] = useState<string>("");
  const [allBUs, setAllBUs] = useState<Record<number, string>>({});
  const [buColors, setBuColors] = useState<Record<number, string>>({});
  const [userPicUrl, setUserPicUrl] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Buscar nome da BU do usuário e todas as BUs
  useEffect(() => {
    const fetchBU = async () => {
      if (user?.bu_id) {
        try {
          const response = await fetch(`https://app.impulsecompany.com.br/webhook/getBUUser?bu_id=${user.bu_id}`);
          if (response.ok) {
            const data = await response.json();
            const bu = Array.isArray(data) ? data[0] : data;
            if (bu?.name) {
              setBuName(bu.name);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar BU:", error);
        }
      }
    };

    const fetchAllBUs = async () => {
      try {
        const response = await fetch("https://app.impulsecompany.com.br/webhook/getAllBUs");
        if (response.ok) {
          const data = await response.json();
          const busArray = Array.isArray(data) ? data : data?.data || [];
          const busMap: Record<number, string> = {};
          const colorsMap: Record<number, string> = {};
          busArray.forEach((bu: { id: number; name: string; color_hex?: string }) => {
            if (bu.id && bu.name) {
              busMap[bu.id] = bu.name;
              if (bu.color_hex) {
                colorsMap[bu.id] = bu.color_hex;
              }
            }
          });
          setAllBUs(busMap);
          setBuColors(colorsMap);
        }
      } catch (error) {
        console.error("Erro ao buscar todas as BUs:", error);
      }
    };

    fetchBU();
    fetchAllBUs();
  }, [user?.bu_id]);

  // Buscar foto do usuário logado
  useEffect(() => {
    const fetchUserPic = async () => {
      if (user?.email) {
        const url = `https://app.impulsecompany.com.br/webhook/getUserPicByEmailIUser?email=${encodeURIComponent(user.email)}`;
        try {
          const response = await fetch(url);
          const text = await response.text();

          if (response.ok && text && text.trim()) {
            const data = JSON.parse(text);
            const picUrl = Array.isArray(data)
              ? data[0]?.link_picture || data[0]?.LINK_PIC || data[0]?.pic_url || data[0]?.url
              : data?.link_picture || data?.LINK_PIC || data?.pic_url || data?.url;
            if (picUrl) setUserPicUrl(picUrl);
          }
        } catch (error) {
          console.error("Erro ao buscar foto do usuário:", error);
        }
      }
    };

    fetchUserPic();
  }, [user?.email]);

  // Verificar se o usuário é líder, admin ou leader_top
  const isAdmin = user?.role === "adm";
  const isLeaderTop = user?.leader_top === true;
  const isLeader = user?.role === "leader";

  // Verificar se o ciclo selecionado está finalizado (para mostrar resultados)
  const selectedCycle = allCycles.find((c) => c.id.toString() === selectedCycleId);
  const isSelectedCycleFinished = selectedCycle?.status === "finished" || selectedCycle?.status === "completed";
  // Mostrar resultados se: ciclo finalizado OU resultados já divulgados no ciclo ativo
  const shouldShowResults = isSelectedCycleFinished || resultsPublished;

  // Estado e ref para download de PDF
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!user || !currentCycleId) return;

    setDownloadingPdf(true);
    try {
      // Buscar relatório do banco de dados
      const response = await fetch(
        `https://app.impulsecompany.com.br/webhook/getIndividualReportByUserId?user_id=${user.id}`,
      );

      if (!response.ok) {
        toast({
          title: "Erro",
          description: "Não foi possível buscar o relatório.",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      const report = Array.isArray(data) ? data[0] : data;
      const reportText = report?.text_report;

      if (!reportText) {
        toast({
          title: "Relatório não disponível",
          description: "O relatório ainda não foi gerado para este usuário.",
          variant: "destructive",
        });
        return;
      }

      // Criar elemento temporário para o PDF
      const tempDiv = document.createElement("div");
      tempDiv.style.padding = "20px";
      tempDiv.style.fontFamily = "system-ui, -apple-system, sans-serif";
      tempDiv.style.color = "#1a1a1a";
      tempDiv.style.backgroundColor = "#ffffff";
      tempDiv.style.maxWidth = "800px";

      // Converter markdown para HTML básico
      const htmlContent = reportText
        .replace(
          /^### (.+)$/gm,
          '<h3 style="font-size: 16px; font-weight: 600; margin: 20px 0 10px 0; color: #1a1a1a;">$1</h3>',
        )
        .replace(
          /^## (.+)$/gm,
          '<h2 style="font-size: 18px; font-weight: 700; margin: 24px 0 12px 0; color: #1a1a1a;">$1</h2>',
        )
        .replace(
          /^# (.+)$/gm,
          '<h1 style="font-size: 22px; font-weight: 700; margin: 28px 0 14px 0; color: #1a1a1a;">$1</h1>',
        )
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^- (.+)$/gm, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>')
        .replace(/^\* (.+)$/gm, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>')
        .replace(/\[{radar}\]/gi, "")
        .replace(/\[{\/radar}\]/gi, "")
        .replace(/\[{gauge}\]/gi, "")
        .replace(/\[{\/gauge}\]/gi, "")
        .replace(/\[{bar}\]/gi, "")
        .replace(/\[{\/bar}\]/gi, "")
        .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">')
        .replace(/\n\n/g, '</p><p style="margin: 10px 0; line-height: 1.6;">')
        .replace(/\n/g, "<br>");

      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5;">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: #1a1a1a;">Relatório de Desempenho</h1>
          <p style="font-size: 16px; color: #666; margin: 0;">${user.name}</p>
          <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
        <div style="line-height: 1.6;">
          <p style="margin: 10px 0;">${htmlContent}</p>
        </div>
      `;

      document.body.appendChild(tempDiv);

      const fileName = `Relatorio_${user.name.replace(/\s+/g, "_")}.pdf`;

      const opt = {
        margin: [15, 15, 15, 15],
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(tempDiv).save();

      document.body.removeChild(tempDiv);

      toast({
        title: "PDF gerado",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Buscar avaliações do usuário
  // Função para buscar nome do usuário por ID
  const fetchUserData = async (userId: number): Promise<{ name: string; position?: string; bu_id?: number } | null> => {
    try {
      const response = await fetch(`https://app.impulsecompany.com.br/webhook/getUser?user_id=${userId}`);
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const userData = Array.isArray(data) ? data[0] : data;
          return userData?.name ? { name: userData.name, position: userData.position, bu_id: userData.bu_id } : null;
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar usuário ${userId}:`, error);
    }
    return null;
  };

  // 2. Buscar avaliações do usuário (PRIORIDADE MÁXIMA - logo após ciclos)
  useEffect(() => {
    let isMounted = true;
    const fetchUserEvaluations = async () => {
      if (!user?.id || !selectedCycleId) return;

      setLoadingEvaluations(true);
      try {
        const response = await fetch(
          `https://app.impulsecompany.com.br/webhook/getAllEvalutionsByUser?user_id=${user.id}&cycle_id=${selectedCycleId}`,
          {
            method: "GET",
          },
        );
        if (response.ok && isMounted) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const evaluationsArray: EvaluationFromAPI[] = Array.isArray(data)
              ? data
              : data?.evaluations || data?.data || [];
            setUserEvaluations(evaluationsArray);

            // Buscar nomes e cargos dos avaliados
            const uniqueEvaluatedIds = [...new Set(evaluationsArray.map((e) => e.evaluated_user_id))];
            const namesMap: Record<number, { name: string; position?: string }> = {};

            await Promise.all(
              uniqueEvaluatedIds.map(async (id) => {
                if (id !== user.id) {
                  // Não precisa buscar o próprio nome
                  const userData = await fetchUserData(id);
                  if (userData && isMounted) {
                    namesMap[id] = userData;
                  }
                }
              }),
            );

            if (isMounted) setEvaluatedUsersNames(namesMap);
          } else {
            setUserEvaluations([]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      } finally {
        if (isMounted) setLoadingEvaluations(false);
      }
    };

    fetchUserEvaluations();
    return () => {
      isMounted = false; // 5. Ao sair da página, "desligamos" o efeito
    };
  }, [user?.id, selectedCycleId]);

  useEffect(() => {
    const fetchAllCycles = async () => {
      try {
        const response = await fetch("https://app.impulsecompany.com.br/webhook/getEvalutionCycles");
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const cyclesArray: EvaluationCycle[] = Array.isArray(data) ? data : data?.cycles || data?.data || [];

            // ERRO ANTERIOR: sortedCycles = [...cycles].sort(...)
            // CORREÇÃO: Usar cyclesArray que é onde os dados realmente estão
            const sortedCycles = [...cyclesArray].sort((a, b) => b.id - a.id);

            setAllCycles(sortedCycles);

            // O resto da lógica deve usar o primeiro item do sortedCycles (o mais recente)
            const activeCycle = sortedCycles.length > 0 ? sortedCycles[0] : null;

            if (activeCycle) {
              // Só mostra o prazo se o ciclo estiver em 'going'
              if (activeCycle.status === "going" && activeCycle.evaluation_deadline) {
                setCurrentCycleDeadline(activeCycle.evaluation_deadline);
              } else {
                setCurrentCycleDeadline(null);
              }
              if (activeCycle.id) {
                setCurrentCycleId(activeCycle.id);
                // Selecionar o ciclo atual por padrão
                setSelectedCycleId(activeCycle.id.toString());
              }
              // Verifica se os resultados foram divulgados (results_released)
              setResultsPublished(activeCycle.status === "results_released");
              // Verifica se estamos em resultados preliminares
              setIsPreliminaryResults(activeCycle.status === "preliminary_results");
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar ciclos:", error);
      } finally {
        setLoadingCycleStatus(false);
      }
    };

    fetchAllCycles();
  }, []);

  // Buscar ciclo PDI CEO ativo e verificar inscrição do usuário
  useEffect(() => {
    const fetchPDICycle = async () => {
      setLoadingPDICycle(true);
      try {
        const response = await fetch("https://app.impulsecompany.com.br/webhook/getPDICycles");
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const cycles = Array.isArray(data) ? data : data?.cycles || data?.data || [];

            // ALTERAÇÃO: Ordena por ID decrescente e pega o primeiro (o mais recente criado)
            // Isso ignora o filtro de "closed", permitindo que o ciclo apareça para gestão
            const latestCycle = [...cycles].sort((a, b) => b.id - a.id)[0];

            if (latestCycle) {
              setCurrentPDICycle({
                id: latestCycle.id,
                status: latestCycle.status,
                registration_deadline: latestCycle.registration_deadline || latestCycle.timestamp,
                ceo_user: latestCycle.ceo_user,
              });

              if (user?.id) {
                try {
                  const regResponse = await fetch(
                    `https://app.impulsecompany.com.br/webhook/getUserPDIRegistration?user_id=${user.id}&pdi_cycle=${latestCycle.id}`,
                  );
                  if (regResponse.ok) {
                    const regText = await regResponse.text();
                    if (regText) {
                      const regData = JSON.parse(regText);
                      const registration = Array.isArray(regData) ? regData[0] : regData;
                      setUserPDIRegistered(!!registration?.id);
                    }
                  }
                } catch (error) {
                  console.error("Erro ao verificar inscrição PDI:", error);
                }
              }
            } else {
              setCurrentPDICycle(null);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar ciclo PDI CEO:", error);
      } finally {
        setLoadingPDICycle(false);
      }
    };

    fetchPDICycle();
  }, [user?.id]);

  // Carregar badge do sino (quantidade de inscritos com done=false) ao entrar na Home do user top
  // Carregar badge do sino (quantidade de inscritos com done=false)
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (user?.leader_top !== true) return;

      try {
        const cyclesResponse = await fetch("https://app.impulsecompany.com.br/webhook/getPDICycles");
        if (!cyclesResponse.ok) {
          setPendingPDINotDoneCount(0);
          return;
        }

        const cyclesText = await cyclesResponse.text();
        const cyclesData = cyclesText ? JSON.parse(cyclesText) : [];
        const cycles = Array.isArray(cyclesData) ? cyclesData : cyclesData?.cycles || cyclesData?.data || [];

        if (cycles.length === 0) {
          setPendingPDINotDoneCount(0);
          return;
        }

        // ALTERAÇÃO: Pega sempre o ciclo mais recente pelo ID maior, ignorando o status "closed"
        const latestCycle = [...cycles].sort((a, b) => b.id - a.id)[0];

        if (!latestCycle?.id) {
          setPendingPDINotDoneCount(0);
          return;
        }

        const usersResponse = await fetch(
          `https://app.impulsecompany.com.br/webhook/getPDIUsers?pdi_id=${latestCycle.id}`,
        );

        if (!usersResponse.ok) {
          setPendingPDINotDoneCount(0);
          return;
        }

        const usersText = await usersResponse.text();
        const usersData = usersText ? JSON.parse(usersText) : [];
        const users = Array.isArray(usersData) ? usersData : usersData?.users || usersData?.data || [];

        // Filtro de segurança: garante que o usuário existe, tem ID e não está concluído
        const countNotDone = users.filter((u: any) => u && u.user_id && (u?.done ?? false) === false).length;

        setPendingPDINotDoneCount(countNotDone);
      } catch (error) {
        console.error("Erro ao buscar badge do PDI:", error);
        setPendingPDINotDoneCount(0);
      }
    };

    fetchPendingCount();
  }, [user?.leader_top]);

  // Handler para criar novo ciclo PDI CEO

  const handleCreatePDICycle = async () => {
    if (!user?.id || !pdiCEODeadline) {
      toast({
        title: "Erro",
        description: "Preencha a data limite para inscrição.",
        variant: "destructive",
      });
      return;
    }

    setCreatingPDICycle(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/createNewCyclePDICEO", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ceo_user: user.id,
          timestamp: pdiCEODeadline,
          status: pdiCEOActiveToggle ? "registration_open" : "pending",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCycle = Array.isArray(data) ? data[0] : data;
        setCurrentPDICycle({
          id: newCycle.id,
          status: pdiCEOActiveToggle ? "registration_open" : "pending",
          registration_deadline: pdiCEODeadline,
          ceo_user: user.id,
        });
        toast({
          title: "Sucesso",
          description: "Ciclo de PDI com o CEO criado com sucesso!",
        });
        setIsPDICEODialogOpen(false);
        setPdiCEODeadline("");
        setPdiCEOActiveToggle(false);
      } else {
        throw new Error("Falha ao criar ciclo");
      }
    } catch (error) {
      console.error("Erro ao criar ciclo PDI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o ciclo de PDI.",
        variant: "destructive",
      });
    } finally {
      setCreatingPDICycle(false);
    }
  };

  // Handler para usuário se inscrever no PDI
  const handleRegisterPDI = async () => {
    if (!user?.id || !currentPDICycle?.id || !pdiUserPhone.trim()) {
      toast({
        title: "Erro",
        description: "Preencha seu telefone para se inscrever.",
        variant: "destructive",
      });
      return;
    }

    setRegisteringPDI(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/createUserPDI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          pdi_cycle: currentPDICycle.id,
          phone: pdiUserPhone.trim(),
          motive: pdiUserMessage.trim(),
        }),
      });

      if (response.ok) {
        setUserPDIRegistered(true);
        toast({
          title: "Inscrição confirmada!",
          description: "Você foi inscrito no PDI com o CEO com sucesso.",
        });
        setIsPDIUserDialogOpen(false);
        setPdiUserPhone("");
      } else {
        const errorData = await response.json();
        if (errorData?.message?.includes("already") || errorData?.error?.includes("already")) {
          setUserPDIRegistered(true);
          toast({
            title: "Já inscrito",
            description: "Você já está inscrito neste ciclo de PDI.",
          });
          setIsPDIUserDialogOpen(false);
        } else {
          throw new Error("Falha ao inscrever");
        }
      }
    } catch (error) {
      console.error("Erro ao inscrever no PDI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a inscrição.",
        variant: "destructive",
      });
    } finally {
      setRegisteringPDI(false);
    }
  };

  // Handler para CEO alterar status do ciclo PDI
  const handleUpdatePDIStatus = async (newStatus: "registration_open" | "closed") => {
    if (!currentPDICycle?.id) return;

    setUpdatingPDIStatus(true);
    try {
      const endpoint =
        newStatus === "registration_open"
          ? "https://app.impulsecompany.com.br/webhook/defineOpenRegistrationPDI"
          : "https://app.impulsecompany.com.br/webhook/defineClosedPDI";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentPDICycle.id }),
      });

      if (response.ok) {
        setCurrentPDICycle((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast({
          title: "Status atualizado",
          description: newStatus === "registration_open" ? "Inscrições abertas para o PDI!" : "Ciclo de PDI encerrado.",
        });
      } else {
        throw new Error("Falha ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status PDI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do ciclo.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPDIStatus(false);
    }
  };

  // Verificar se deadline do PDI passou
  const isPDIDeadlinePassed = currentPDICycle?.registration_deadline
    ? (() => {
        const d = new Date(currentPDICycle.registration_deadline);
        const now = new Date();
        const deadlineDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999);

        return deadlineDate < now;
      })()
    : false;
  // Formatar deadline do PDI
  const formatPDIDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  };
  // Handler para abrir o dialog de notificações (listar usuários PDI)
  const handleOpenPDINotifications = async () => {
    setIsPDINotificationsOpen(true);
    setLoadingPDIUsers(true);

    try {
      // Buscar todos os ciclos PDI
      const cyclesResponse = await fetch("https://app.impulsecompany.com.br/webhook/getPDICycles");

      if (cyclesResponse.ok) {
        const cyclesText = await cyclesResponse.text();
        if (cyclesText) {
          const cyclesData = JSON.parse(cyclesText);
          const cycles = Array.isArray(cyclesData) ? cyclesData : cyclesData?.cycles || cyclesData?.data || [];

          // 1. Ordena os ciclos do maior ID para o menor
          const sortedCycles = [...cycles].sort((a, b) => b.id - a.id);
          setPdiCycles(sortedCycles);

          // 2. ALTERAÇÃO AQUI: Seleciona sempre o primeiro do array ordenado (maior ID)
          const latestCycle = sortedCycles[0];

          if (latestCycle) {
            setSelectedPDICycleForView(latestCycle.id);
            await fetchPDIUsersForCycle(latestCycle.id);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar ciclos PDI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoadingPDIUsers(false);
    }
  };

  // Função para buscar usuários de um ciclo PDI específico
  const fetchPDIUsersForCycle = async (pdiCycleId: number) => {
    setLoadingPDIUsers(true);
    try {
      const response = await fetch(`https://app.impulsecompany.com.br/webhook/getPDIUsers?pdi_id=${pdiCycleId}`);
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const users = Array.isArray(data) ? data : data?.users || data?.data || [];

          // Buscar dados adicionais de cada usuário
          const usersWithDetails = await Promise.all(
            users.map(
              async (pdiUser: { id: number; user_id: number; pdi_cycle: number; phone: string; done?: boolean }) => {
                try {
                  const userResponse = await fetch(
                    `https://app.impulsecompany.com.br/webhook/getUser?user_id=${pdiUser.user_id}`,
                  );
                  if (userResponse.ok) {
                    const userText = await userResponse.text();
                    if (userText) {
                      const userData = JSON.parse(userText);
                      const userInfo = Array.isArray(userData) ? userData[0] : userData;

                      // Buscar foto do usuário
                      let userPicture = null;
                      if (userInfo?.email) {
                        try {
                          const picResponse = await fetch(
                            `https://app.impulsecompany.com.br/webhook/getUserPicByEmailIUser?email=${encodeURIComponent(userInfo.email)}`,
                          );
                          if (picResponse.ok) {
                            const picText = await picResponse.text();
                            if (picText) {
                              const picData = JSON.parse(picText);
                              userPicture = Array.isArray(picData)
                                ? picData[0]?.link_picture || picData[0]?.LINK_PIC
                                : picData?.link_picture || picData?.LINK_PIC;
                            }
                          }
                        } catch {
                          // Ignora erro de foto
                        }
                      }

                      return {
                        ...pdiUser,
                        done: pdiUser.done ?? false,
                        user_name: userInfo?.name,
                        user_email: userInfo?.email,
                        user_position: userInfo?.position,
                        user_role: userInfo?.role,
                        user_band: userInfo?.current_band,
                        user_bu_id: userInfo?.bu_id,
                        user_picture: userPicture,
                      };
                    }
                  }
                  return { ...pdiUser, done: pdiUser.done ?? false };
                } catch {
                  return { ...pdiUser, done: pdiUser.done ?? false };
                }
              },
            ),
          );

          setPdiUsers(usersWithDetails);
        } else {
          setPdiUsers([]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar usuários PDI:", error);
      setPdiUsers([]);
    } finally {
      setLoadingPDIUsers(false);
    }
  };

  // Handler para alterar o ciclo selecionado na visualização
  const handleChangePDICycleView = async (cycleId: string) => {
    const id = parseInt(cycleId);
    setSelectedPDICycleForView(id);
    await fetchPDIUsersForCycle(id);
  };

  // Handler para marcar/desmarcar PDI como done
  const handleTogglePDIUserDone = async (pdiUserId: number, currentDone: boolean) => {
    setUpdatingPDIUserDone(pdiUserId);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/changeUserPDIDone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Envia o que está na tela agora, para o back transformar no oposto
        body: JSON.stringify({ id: pdiUserId, done: currentDone }),
      });

      if (response.ok) {
        // Se o back inverteu lá, nós invertemos aqui no estado local para refletir a mudança
        setPdiUsers((prev) => prev.map((u) => (u.id === pdiUserId ? { ...u, done: !currentDone } : u)));
      } else {
        throw new Error("Falha ao atualizar");
      }
    } catch (error) {
      console.error("Erro ao atualizar status PDI:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPDIUserDone(null);
    }
  };

  useEffect(() => {
    const fetchUserScores = async () => {
      if (!user?.id || !selectedCycleId) return;

      setLoadingUserScores(true);
      try {
        const response = await fetch(
          `https://app.impulsecompany.com.br/webhook/getIndividualScoresById?user_id=${user.id}&cycle_id=${selectedCycleId}`,
        );
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const scoreData = Array.isArray(data) ? data[0] : data;
            if (scoreData) {
              setUserScores({
                final_competency: scoreData.final_competency ?? null,
                final_skill: scoreData.final_skill ?? null,
                final_attitude: scoreData.final_attitude ?? null,
                final_result: scoreData.final_result ?? null,
                final_overall_score: scoreData.final_overall_score ?? null,
                performance_classification: scoreData.performance_classification ?? null,
              });
            } else {
              setUserScores(null);
            }
          } else {
            setUserScores(null);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar scores individuais:", error);
      } finally {
        setLoadingUserScores(false);
      }
    };

    fetchUserScores();
  }, [user?.id, selectedCycleId]);

  // 3b. Buscar scores de equipe (para líderes - junto com scores individuais)
  useEffect(() => {
    const fetchTeamScores = async () => {
      if (!user?.id || !selectedCycleId || !isLeader) return;

      setLoadingTeamScores(true);
      try {
        const url = `https://app.impulsecompany.com.br/webhook/getTeamScoresByLeaderId?leader_id=${user.id}&cycle_id=${selectedCycleId}`;
        const response = await fetch(url);
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const scoreData = Array.isArray(data) ? data[0] : data;
            if (scoreData) {
              setTeamScores({
                // Webhook retorna campos "general_*" (não "final_*")
                final_competency: scoreData.general_competency ?? null,
                final_skill: scoreData.general_skill ?? null,
                final_attitude: scoreData.general_attitude ?? null,
                final_result: scoreData.general_result ?? null,
                final_overall_score: scoreData.general_overall_score ?? null,
              });
            } else {
              setTeamScores(null);
            }
          } else {
            setTeamScores(null);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar scores de equipe:", error);
      } finally {
        setLoadingTeamScores(false);
      }
    };

    fetchTeamScores();
  }, [user?.id, selectedCycleId, isLeader]);

  // Função para buscar notas individuais de todos os membros da equipe
  const fetchTeamMemberScores = async () => {
    if (!user?.id || !selectedCycleId || teamMembers.length === 0) return;

    setLoadingTeamMemberScores(true);
    try {
      const scoresPromises = teamMembers.map(async (member) => {
        try {
          const response = await fetch(
            `https://app.impulsecompany.com.br/webhook/getIndividualScoresById?user_id=${member.id}&cycle_id=${selectedCycleId}`,
          );
          if (response.ok) {
            const text = await response.text();
            if (text) {
              const data = JSON.parse(text);
              const scoreData = Array.isArray(data) ? data[0] : data;
              return {
                id: member.id,
                name: member.name,
                position: member.position,
                current_band: member.current_band,
                role: member.role,
                bu_id: member.bu_id,
                link_picture: member.link_picture,
                competency: scoreData?.final_competency ?? null,
                skill: scoreData?.final_skill ?? null,
                attitude: scoreData?.final_attitude ?? null,
                result: scoreData?.final_result ?? null,
                overall_score: scoreData?.final_overall_score ?? null,
                classification: scoreData?.performance_classification ?? undefined,
              };
            }
          }
          return {
            id: member.id,
            name: member.name,
            position: member.position,
            current_band: member.current_band,
            role: member.role,
            bu_id: member.bu_id,
            link_picture: member.link_picture,
            competency: null,
            skill: null,
            attitude: null,
            result: null,
            overall_score: null,
          };
        } catch {
          return {
            id: member.id,
            name: member.name,
            position: member.position,
            current_band: member.current_band,
            role: member.role,
            bu_id: member.bu_id,
            link_picture: member.link_picture,
            competency: null,
            skill: null,
            attitude: null,
            result: null,
            overall_score: null,
          };
        }
      });

      const scores = await Promise.all(scoresPromises);
      // Ordenar por score geral (maior primeiro)
      scores.sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
      setTeamMemberScores(scores);
    } catch (error) {
      console.error("Erro ao buscar notas dos membros:", error);
    } finally {
      setLoadingTeamMemberScores(false);
    }
  };

  // 4. Buscar equipe (liderados - após scores)
  useEffect(() => {
    const fetchLedUsers = async () => {
      if (!isLeader || isAdmin || !user?.id) return;

      setLoadingTeam(true);
      try {
        const response = await fetch(`https://app.impulsecompany.com.br/webhook/getLedUsers?leader_id=${user.id}`);
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            const membersArray = Array.isArray(data) ? data : data?.users || data?.members || data?.data || [];
            setTeamMembers(Array.isArray(membersArray) ? membersArray : []);
          } else {
            setTeamMembers([]);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar liderados:", error);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchLedUsers();
  }, [isLeader, isAdmin, user?.id]);

  // Buscar todos os pares existentes
  const fetchAllPeers = async () => {
    setLoadingPeers(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/getAllPeers");
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          // Organizar pares por user_id
          const peersMap: Record<number, number[]> = {};
          const peersArray = Array.isArray(data) ? data : data?.peers || data?.data || [];
          peersArray.forEach((peer: { user_id: number; peer_user_id: number }) => {
            if (!peersMap[peer.user_id]) {
              peersMap[peer.user_id] = [];
            }
            // Evitar duplicados
            if (!peersMap[peer.user_id].includes(peer.peer_user_id)) {
              peersMap[peer.user_id].push(peer.peer_user_id);
            }
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

  useEffect(() => {
    if ((isLeader && !isAdmin) || isAdmin) {
      fetchAllPeers();
    }
  }, [isLeader, isAdmin]);

  // Buscar todas as equipes se for admin
  const fetchAllTeams = async () => {
    if (!isAdmin) return;

    setLoadingAllTeams(true);
    try {
      // 1. Buscar todos os usuários
      const allUsersResponse = await fetch("https://app.impulsecompany.com.br/webhook/getAllUsers");
      if (!allUsersResponse.ok) {
        console.error("Erro ao buscar todos os usuários");
        return;
      }

      const allUsersText = await allUsersResponse.text();
      if (!allUsersText) {
        setAllTeams([]);
        return;
      }

      const allUsersData = JSON.parse(allUsersText);
      const allUsers: TeamMember[] = Array.isArray(allUsersData)
        ? allUsersData
        : allUsersData?.users || allUsersData?.data || [];

      // 2. Filtrar apenas os líderes
      const leaders = allUsers.filter((u) => u.role === "leader");

      // 3. Para cada líder, buscar seus liderados
      const teamsPromises = leaders.map(async (leader) => {
        try {
          const ledResponse = await fetch(
            `https://app.impulsecompany.com.br/webhook/getLedUsers?leader_id=${leader.id}`,
          );
          if (ledResponse.ok) {
            const ledText = await ledResponse.text();
            if (ledText) {
              const ledData = JSON.parse(ledText);
              const members: TeamMember[] = Array.isArray(ledData) ? ledData : ledData?.users || ledData?.data || [];
              return { leader, members };
            }
          }
          return { leader, members: [] };
        } catch {
          return { leader, members: [] };
        }
      });

      const teams = await Promise.all(teamsPromises);

      // Ordenar por nome do líder
      teams.sort((a, b) => a.leader.name.localeCompare(b.leader.name));

      setAllTeams(teams);

      // 4. Buscar usuários sem equipe
      const noLeadResponse = await fetch("https://app.impulsecompany.com.br/webhook/getNoLedUsers");
      if (noLeadResponse.ok) {
        const noLeadText = await noLeadResponse.text();
        if (noLeadText) {
          const noLeadData = JSON.parse(noLeadText);
          const noLeadArray: TeamMember[] = Array.isArray(noLeadData)
            ? noLeadData
            : noLeadData?.users || noLeadData?.data || [];
          setNoLeadUsers(noLeadArray);
        } else {
          setNoLeadUsers([]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar equipes:", error);
    } finally {
      setLoadingAllTeams(false);
    }
  };

  useEffect(() => {
    fetchAllTeams();
  }, [isAdmin]);

  // Buscar usuários disponíveis (sem líder)
  const fetchAvailableUsers = async () => {
    setLoadingAvailable(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/getNoLedUsers");
      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data) ? data : data?.users || data?.members || data?.data || [];
        setAvailableUsers(Array.isArray(usersArray) ? usersArray : []);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários disponíveis:", error);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleOpenAddMember = () => {
    setIsAddMemberOpen(true);
    setSearchQuery("");
    fetchAvailableUsers();
  };

  const filteredAvailableUsers = availableUsers.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddMember = async (memberId: number) => {
    if (!user?.id) return;

    // Validação de limite máximo de 10 membros
    if (teamMembers.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Uma equipe pode ter no máximo 10 membros.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(memberId);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateLeaderId", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: memberId, leader_id: user.id }),
      });

      if (response.ok) {
        const addedUser = availableUsers.find((u) => u.id === memberId);
        if (addedUser) {
          setTeamMembers((prev) => [...prev, addedUser]);
          setAvailableUsers((prev) => prev.filter((u) => u.id !== memberId));
        }
        toast({ title: "Sucesso", description: "Membro adicionado à equipe." });
      } else {
        toast({ title: "Erro", description: "Não foi possível adicionar o membro.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast({ title: "Erro", description: "Erro ao adicionar membro.", variant: "destructive" });
    } finally {
      setIsAdding(null);
    }
  };

  // Funções para Definir Pares - membros da equipe + pares já selecionados
  const getAllCompanyPeople = (excludeId: number) => {
    // Combinar membros da equipe com pares já selecionados (que podem ser de outras equipes)
    const selectedPeerIds = tempSelectedPeers;
    const selectedPeersFromAllUsers = allUsersForPeers.filter((u) => selectedPeerIds.includes(u.id));

    // Combinar equipe + pares selecionados (sem duplicados)
    const combinedPeople = [...teamMembers];
    selectedPeersFromAllUsers.forEach((peer) => {
      if (!combinedPeople.some((m) => m.id === peer.id)) {
        combinedPeople.push(peer);
      }
    });

    return combinedPeople
      .filter((m) => m.id !== excludeId)
      .filter((p) => p.name.toLowerCase().includes(peersSearchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const openPeersSelection = (member: TeamMember) => {
    setSelectedMemberForPeers(member);
    setTempSelectedPeers(memberPeers[member.id] || []);
    setPeersSearchQuery("");
    // Carregar todos os usuários para mostrar pares já selecionados que podem ser de outras equipes
    fetchAllUsersForPeers();
  };

  const closePeersSelection = () => {
    setSelectedMemberForPeers(null);
    setTempSelectedPeers([]);
    setPeersSearchQuery("");
    setShowOtherTeamsPeers(false);
    setOtherTeamsPeersSearch("");
  };

  const fetchAllUsersForPeers = async () => {
    if (allUsersForPeers.length > 0) return; // Já carregou

    setLoadingAllUsersForPeers(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/getAllUsers");
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const usersArray: TeamMember[] = Array.isArray(data) ? data : data?.users || data?.data || [];
          setAllUsersForPeers(usersArray);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoadingAllUsersForPeers(false);
    }
  };

  const getOtherTeamsUsers = (excludeId: number) => {
    // Filtra usuários de outras equipes (não da equipe atual) + usuários sem equipe
    const teamMemberIds = teamMembers.map((m) => m.id);

    // Combina usuários de todas as equipes com usuários sem equipe
    const combinedUsers = [...allUsersForPeers];

    // Adiciona noLeadUsers que não estão já em allUsersForPeers
    noLeadUsers.forEach((u) => {
      if (!combinedUsers.some((cu) => cu.id === u.id)) {
        combinedUsers.push(u);
      }
    });

    return combinedUsers
      .filter((u) => u.id !== excludeId && !teamMemberIds.includes(u.id))
      .filter((u) => u.name.toLowerCase().includes(otherTeamsPeersSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleTempPeer = (peerId: number) => {
    setTempSelectedPeers((prev) => {
      if (prev.includes(peerId)) {
        return prev.filter((id) => id !== peerId);
      } else {
        return [...prev, peerId];
      }
    });
  };

  const applyPeersSelection = async () => {
    if (selectedMemberForPeers) {
      try {
        const response = await fetch("https://app.impulsecompany.com.br/webhook/changePeers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedMemberForPeers.id,
            peer_ids: tempSelectedPeers,
          }),
        });

        if (response.ok) {
          setMemberPeers((prev) => ({
            ...prev,
            [selectedMemberForPeers.id]: tempSelectedPeers,
          }));
          closePeersSelection();
          toast({ title: "Sucesso", description: `Pares de ${selectedMemberForPeers.name} atualizados.` });
        } else {
          toast({ title: "Erro", description: "Não foi possível salvar os pares.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Erro ao salvar pares:", error);
        toast({ title: "Erro", description: "Erro ao salvar os pares.", variant: "destructive" });
      }
    }
  };

  // Funções para leader_top definir seus próprios pares
  const openOwnPeersDialog = async () => {
    if (!user?.id) return;
    setIsOwnPeersDialogOpen(true);
    setOwnPeersSearchQuery("");

    // Carregar todos os usuários se ainda não carregou
    if (allUsersForPeers.length === 0) {
      await fetchAllUsersForPeers();
    }

    // Buscar pares atuais do leader_top
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/getAllPeers");
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          const peersArray = Array.isArray(data) ? data : data?.peers || data?.data || [];
          const myPeers = peersArray
            .filter((p: { user_id: number }) => p.user_id === user.id)
            .map((p: { peer_user_id: number }) => p.peer_user_id);
          setOwnPeers(myPeers);
          setTempOwnPeers(myPeers);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar pares:", error);
    }
  };

  const toggleOwnPeer = (peerId: number) => {
    setTempOwnPeers((prev) => {
      if (prev.includes(peerId)) {
        return prev.filter((id) => id !== peerId);
      } else {
        return [...prev, peerId];
      }
    });
  };

  const applyOwnPeersSelection = async () => {
    if (!user?.id) return;

    setSavingOwnPeers(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/changePeers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          peer_ids: tempOwnPeers,
        }),
      });

      if (response.ok) {
        setOwnPeers(tempOwnPeers);
        setIsOwnPeersDialogOpen(false);
        toast({ title: "Sucesso", description: "Seus pares foram atualizados." });
      } else {
        toast({ title: "Erro", description: "Não foi possível salvar os pares.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao salvar pares:", error);
      toast({ title: "Erro", description: "Erro ao salvar os pares.", variant: "destructive" });
    } finally {
      setSavingOwnPeers(false);
    }
  };

  const getAvailableOwnPeers = () => {
    return allUsersForPeers
      .filter((u) => u.id !== user?.id)
      .filter((u) => u.name.toLowerCase().includes(ownPeersSearchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Funções do Admin para gerenciar equipes
  const handleAdminOpenAddDialog = (team: TeamGroup) => {
    setSelectedTeamForAdd(team);
    setAdminSearchQuery("");
    setIsAdminAddDialogOpen(true);
  };

  const handleAdminAddMember = async (memberId: number) => {
    if (!selectedTeamForAdd) return;

    // Validação de limite máximo de 10 membros
    if (selectedTeamForAdd.members.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Uma equipe pode ter no máximo 10 membros.",
        variant: "destructive",
      });
      return;
    }

    setIsAdminAdding(memberId);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateLeaderId", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: memberId, leader_id: selectedTeamForAdd.leader.id }),
      });

      if (response.ok) {
        // Encontrar o membro na lista de usuários sem equipe
        const memberToAdd = noLeadUsers.find((u) => u.id === memberId);

        if (memberToAdd) {
          // Adicionar membro à equipe no estado local
          setAllTeams((prevTeams) =>
            prevTeams.map((team) => {
              if (team.leader.id === selectedTeamForAdd.leader.id) {
                return {
                  ...team,
                  members: [...team.members, { ...memberToAdd, leader_id: selectedTeamForAdd.leader.id }].sort((a, b) =>
                    a.name.localeCompare(b.name),
                  ),
                };
              }
              return team;
            }),
          );

          // Remover da lista de usuários sem equipe
          setNoLeadUsers((prev) => prev.filter((u) => u.id !== memberId));
        }

        toast({ title: "Sucesso", description: "Membro adicionado à equipe." });
        setIsAdminAddDialogOpen(false);
      } else {
        toast({ title: "Erro", description: "Não foi possível adicionar o membro.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast({ title: "Erro", description: "Erro ao adicionar membro.", variant: "destructive" });
    } finally {
      setIsAdminAdding(null);
    }
  };

  const handleAdminRemoveMember = async () => {
    if (!adminMemberToRemove) return;

    setIsAdminRemoving(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateLeaderId", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: adminMemberToRemove.member.id, leader_id: null }),
      });

      if (response.ok) {
        // Atualizar estado local sem recarregar tudo
        const removedMember = adminMemberToRemove.member;
        const teamLeaderId = adminMemberToRemove.team.leader.id;

        // Remover membro da equipe no estado local
        setAllTeams((prevTeams) =>
          prevTeams.map((team) => {
            if (team.leader.id === teamLeaderId) {
              return {
                ...team,
                members: team.members.filter((m) => m.id !== removedMember.id),
              };
            }
            return team;
          }),
        );

        // Adicionar o membro à lista de usuários sem equipe
        setNoLeadUsers((prev) =>
          [...prev, { ...removedMember, leader_id: null }].sort((a, b) => a.name.localeCompare(b.name)),
        );

        toast({ title: "Sucesso", description: "Membro removido da equipe." });
      } else {
        toast({ title: "Erro", description: "Não foi possível remover o membro.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast({ title: "Erro", description: "Erro ao remover membro.", variant: "destructive" });
    } finally {
      setIsAdminRemoving(false);
      setAdminMemberToRemove(null);
    }
  };

  const filteredNoLeadUsers = noLeadUsers.filter((u) => u.name.toLowerCase().includes(adminSearchQuery.toLowerCase()));

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateLeaderId", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: memberToRemove.id, leader_id: null }),
      });

      if (response.ok) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
        toast({ title: "Sucesso", description: "Membro removido da equipe." });
      } else {
        toast({ title: "Erro", description: "Não foi possível remover o membro.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast({ title: "Erro", description: "Erro ao remover membro.", variant: "destructive" });
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  // Função para abrir dialog de seleção de equipe para um usuário sem equipe
  const handleOpenSelectTeamDialog = (member: TeamMember) => {
    setSelectedUserForTeam(member);
    setTeamSearchQuery("");
    setIsSelectTeamDialogOpen(true);
  };

  // Função para adicionar usuário a uma equipe selecionada
  const handleAddUserToTeam = async (team: TeamGroup) => {
    if (!selectedUserForTeam) return;

    setIsAdminAdding(selectedUserForTeam.id);
    try {
      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateLeaderId", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUserForTeam.id, leader_id: team.leader.id }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `${selectedUserForTeam.name} adicionado à equipe de ${team.leader.name}.`,
        });
        await fetchAllTeams();
        setIsSelectTeamDialogOpen(false);
        setSelectedUserForTeam(null);
      } else {
        toast({ title: "Erro", description: "Não foi possível adicionar à equipe.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao adicionar à equipe:", error);
      toast({ title: "Erro", description: "Erro ao adicionar à equipe.", variant: "destructive" });
    } finally {
      setIsAdminAdding(null);
    }
  };

  // Filtrar equipes disponíveis (menos de 10 membros)
  const availableTeamsForAdd = allTeams.filter(
    (team) => team.members.length < 10 && team.leader.name.toLowerCase().includes(teamSearchQuery.toLowerCase()),
  );

  const handleLogout = () => {
    // Limpa manualmente o localStorage antes de chamar logout para garantir
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    logout();
    navigate("/", { replace: true });
  };

  // Dados de avaliação do usuário (dos scores individuais)
  const evaluationData = {
    competencia: userScores?.final_competency ?? null,
    habilidade: userScores?.final_skill ?? null,
    atitude: userScores?.final_attitude ?? null,
    resultado: userScores?.final_result ?? null,
  };

  // Calcular maior e menor nota
  const getBestAndWorst = () => {
    const entries = Object.entries(evaluationData).filter(([_, v]) => v !== null) as [string, number][];
    if (entries.length === 0) return { best: null, worst: null };

    let best = entries[0];
    let worst = entries[0];

    entries.forEach(([key, value]) => {
      if (value > best[1]) best = [key, value];
      if (value < worst[1]) worst = [key, value];
    });

    return { best: best[0], worst: worst[0] };
  };

  const { best, worst } = getBestAndWorst();

  // Mapear tipos de avaliação para ícones e labels
  const getEvaluationIcon = (type: string, evaluatedUserId?: number): React.ElementType => {
    const t = type?.toLowerCase();

    // Se é peer mas o avaliado é o líder do usuário, mostrar ícone de coroa
    if ((t === "peer" || t === "par") && evaluatedUserId && user?.leader_id === evaluatedUserId) {
      return Crown;
    }

    switch (t) {
      case "self":
      case "auto":
      case "autoavaliacao":
        return UserCheck;
      case "leader":
      case "lider":
        return Crown;
      case "peer":
      case "par":
        return Users;
      case "led":
      case "subordinate":
      case "liderado":
        return User;
      default:
        return User;
    }
  };

  const getEvaluationLabel = (type: string, evaluatedUserId?: number): string | undefined => {
    const t = type?.toLowerCase();

    // Se é peer e o avaliado é o líder do usuário logado, mostrar "líder"
    if ((t === "peer" || t === "par") && evaluatedUserId && user?.leader_id === evaluatedUserId) {
      return "líder";
    }

    switch (t) {
      case "self":
      case "auto":
      case "autoavaliacao":
        return undefined;
      case "leader":
      case "lider":
        return "líder";
      case "peer":
      case "par":
        return "par";
      case "led":
      case "subordinate":
      case "liderado":
        return "liderado";
      default:
        return type;
    }
  };

  const getEvaluationName = (evaluation: EvaluationFromAPI): string => {
    const type = evaluation.evaluation_type?.toLowerCase();
    if (type === "auto" || type === "self" || type === "autoavaliacao") {
      return "Autoavaliação";
    }
    const evaluatedData = evaluatedUsersNames[evaluation.evaluated_user_id];
    return evaluatedData?.name ? `Avaliação para ${evaluatedData.name}` : `Carregando...`;
  };

  // Montar o label completo com tipo + cargo
  const getFullLabel = (type: string, evaluatedUserId: number): string | undefined => {
    const typeLabel = getEvaluationLabel(type, evaluatedUserId);
    const evaluatedData = evaluatedUsersNames[evaluatedUserId];
    const position = evaluatedData?.position;

    if (typeLabel && position) {
      return `${typeLabel} • ${position}`;
    }
    return typeLabel || position;
  };

  // Mapear todas as avaliações (incluindo as feitas) - avaliadas primeiro
  // Filtrar objetos vazios que a API pode retornar
  const allEvaluations = userEvaluations
    .filter((e) => e && e.id && e.evaluated_user_id) // Filtrar avaliações válidas
    .map((e) => ({
      id: e.id,
      name: getEvaluationName(e),
      type: e.evaluation_type,
      icon: getEvaluationIcon(e.evaluation_type, e.evaluated_user_id),
      label: getFullLabel(e.evaluation_type, e.evaluated_user_id),
      evaluated_id: e.evaluated_user_id,
      status: e.status,
      isDone: e.status === "done" || e.status === "completed",
    }))
    .sort((a, b) => {
      // Ordem de prioridade: auto/self (1), líder (2), led (3), peer (4)
      const getTypeOrder = (type: string, evaluatedId: number) => {
        const t = type?.toLowerCase();
        if (t === "auto" || t === "self" || t === "autoavaliacao") return 1;
        // Se é peer mas o avaliado é o líder do usuário, prioridade 2
        if ((t === "peer" || t === "par") && user?.leader_id === evaluatedId) return 2;
        if (t === "led" || t === "liderado") return 3;
        if (t === "peer" || t === "par") return 4;
        return 99;
      };
      const orderA = getTypeOrder(a.type, a.evaluated_id);
      const orderB = getTypeOrder(b.type, b.evaluated_id);

      // Primeiro ordena por tipo
      if (orderA !== orderB) return orderA - orderB;

      // Dentro do mesmo tipo, ordena alfabeticamente pelo nome
      return a.name.localeCompare(b.name, "pt-BR");
    });

  const pendingCount = allEvaluations.filter((e) => !e.isDone).length;
  const doneCount = allEvaluations.filter((e) => e.isDone).length;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <header className="bg-primary text-primary-foreground py-4 px-3">
        <div className="px-[20%] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Foto de perfil do usuário */}
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden border-2 border-primary-foreground/30">
              {userPicUrl ? (
                <img src={userPicUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary-foreground/70" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Olá, {user?.name || "Usuário"}!</h1>
                {user?.current_band && !isAdmin && (
                  <span
                    className="inline-flex items-center text-xs font-medium h-5"
                    style={{
                      background:
                        user.current_band.toLowerCase() === "branca"
                          ? "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)"
                          : user.current_band.toLowerCase() === "azul"
                            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                            : user.current_band.toLowerCase() === "roxa"
                              ? "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                              : user.current_band.toLowerCase() === "marrom"
                                ? "linear-gradient(135deg, #a16207 0%, #78350f 100%)"
                                : user.current_band.toLowerCase() === "preta"
                                  ? "linear-gradient(135deg, #374151 0%, #111827 100%)"
                                  : "#9ca3af",
                      color: user.current_band.toLowerCase() === "branca" ? "#374151" : "#ffffff",
                      clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)",
                      padding: "0 16px 0 14px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    {user.current_band.charAt(0).toUpperCase() + user.current_band.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-primary-foreground/80">
                {user?.role && <span className="capitalize">{getRoleLabel(user.role)}</span>}
                {user?.position && (
                  <>
                    <span className="text-primary-foreground/50">•</span>
                    <span>{user.position}</span>
                  </>
                )}
                {buName && (
                  <>
                    <span className="text-primary-foreground/50">•</span>
                    <span>{buName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "adm" && (
              <>
                <Link
                  to="/manage-users"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
                  title="Gerenciar Usuários"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Usuários</span>
                </Link>
                <Link
                  to="/manage-bus"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
                  title="Gerenciar BUs"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">BUs</span>
                </Link>
              </>
            )}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
              title="Editar Perfil"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
            {user?.leader_top === true && (
              <button
                onClick={handleOpenPDINotifications}
                className="flex items-center px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium relative"
                title="Inscritos no PDI"
              >
                <BellRing className="w-4 h-5" />
                {(() => {
                  // Filtramos pdiUsers para contar apenas quem tem user_id REAL
                  const validPdiUsers = pdiUsers.filter((u) => u && u.user_id);

                  const countNotDone =
                    validPdiUsers.length > 0 ? validPdiUsers.filter((u) => !u.done).length : pendingPDINotDoneCount;
                  if (countNotDone <= 0) return null;

                  return (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {countNotDone}
                    </span>
                  );
                })()}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-[20%] py-4">
        {/* Seção de Ciclos de Avaliação - apenas para leader_top */}
        {isLeaderTop && (
          <section className="mb-6">
            <EvaluationCycleManager onCycleUpdate={(deadline) => setCurrentCycleDeadline(deadline)} />
          </section>
        )}

        {/* Conteúdo para Admin - Lista de Equipes */}
        {isAdmin ? (
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Todas as Equipes
              <span className="text-xs font-normal text-muted-foreground">({allTeams.length} equipes)</span>
            </h2>

            {loadingAllTeams ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando equipes...</span>
              </div>
            ) : allTeams.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">Nenhuma equipe encontrada</h3>
                <p className="text-xs text-muted-foreground">
                  Quando houver equipes cadastradas, elas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Equipe "Sem equipe" */}
                {noLeadUsers.length > 0 && (
                  <div className="bg-card border border-amber-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedTeamId(expandedTeamId === -1 ? null : -1)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-sm text-foreground">Sem equipe</h3>
                          <span className="text-xs text-amber-600">
                            {noLeadUsers.length}{" "}
                            {noLeadUsers.length === 1 ? "pessoa disponível" : "pessoas disponíveis"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedTeamId === -1 ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {expandedTeamId === -1 && (
                      <div className="border-t border-border bg-muted/10 p-4">
                        <p className="text-xs text-muted-foreground mb-3">
                          Estes usuários podem ser adicionados a qualquer equipe.
                        </p>
                        <div className="space-y-2">
                          {sortTeamMembers(noLeadUsers).map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                            >
                              {member.link_picture ? (
                                <img
                                  src={member.link_picture}
                                  alt={member.name}
                                  className="w-9 h-9 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-amber-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-medium text-sm text-foreground">{member.name}</h4>
                                  <div
                                    className={`w-2 h-2 rounded-full ${getBandColor(member.current_band)}`}
                                    title={member.current_band || "Sem faixa"}
                                  />
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-muted-foreground cursor-default block">
                                        {getRoleLabel(member.role)}
                                        {member.bu_id && allBUs[member.bu_id] && ` • ${allBUs[member.bu_id]}`}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" align="start" className="max-w-xs">
                                      <p>Função: {getRoleLabel(member.role)}</p>
                                      {member.bu_id && allBUs[member.bu_id] && <p>BU: {allBUs[member.bu_id]}</p>}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <button
                                onClick={() => handleOpenSelectTeamDialog(member)}
                                className="w-7 h-7 flex items-center justify-center bg-white border border-primary/50 rounded-md hover:bg-primary/10 hover:border-primary transition-all"
                                title="Adicionar a uma equipe"
                              >
                                <Plus className="w-4 h-4 text-primary" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Equipes existentes */}
                {allTeams.map((team) => {
                  const isExpanded = expandedTeamId === team.leader.id;

                  return (
                    <div key={team.leader.id} className="bg-card border border-border rounded-lg overflow-hidden">
                      {/* Header do card - Líder */}
                      <button
                        onClick={() => setExpandedTeamId(isExpanded ? null : team.leader.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {team.leader.link_picture ? (
                            <img
                              src={team.leader.link_picture}
                              alt={team.leader.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Crown className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-medium text-sm text-foreground">Equipe de {team.leader.name}</h3>
                              <div
                                className={`w-2 h-2 rounded-full ${getBandColor(team.leader.current_band)}`}
                                title={team.leader.current_band || "Sem faixa"}
                              />
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground cursor-default block">
                                    {team.members.length} {team.members.length === 1 ? "membro" : "membros"}
                                    {team.leader.bu_id &&
                                      allBUs[team.leader.bu_id] &&
                                      ` • ${allBUs[team.leader.bu_id]}`}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start" className="max-w-xs">
                                  <p>
                                    {team.members.length} {team.members.length === 1 ? "membro" : "membros"}
                                  </p>
                                  {team.leader.bu_id && allBUs[team.leader.bu_id] && (
                                    <p>BU: {allBUs[team.leader.bu_id]}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Lista de membros - expandível */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/10 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground">Membros da equipe</span>
                            {noLeadUsers.length > 0 && (
                              <button
                                onClick={() => handleAdminOpenAddDialog(team)}
                                className="w-7 h-7 flex items-center justify-center bg-white border border-primary/50 rounded-md hover:bg-primary/10 hover:border-primary transition-all"
                                title="Adicionar membro"
                              >
                                <Plus className="w-4 h-4 text-primary" />
                              </button>
                            )}
                          </div>
                          {team.members.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">Nenhum membro nesta equipe</p>
                          ) : (
                            <div className="space-y-2">
                              {sortTeamMembers(team.members).map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                                >
                                  {member.link_picture ? (
                                    <img
                                      src={member.link_picture}
                                      alt={member.name}
                                      className="w-9 h-9 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="font-medium text-sm text-foreground">{member.name}</h4>
                                      <div
                                        className={`w-2 h-2 rounded-full ${getBandColor(member.current_band)}`}
                                        title={member.current_band || "Sem faixa"}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {getRoleLabel(member.role)}
                                      {member.bu_id && allBUs[member.bu_id] && ` • ${allBUs[member.bu_id]}`}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setAdminMemberToRemove({ member, team })}
                                    className="w-7 h-7 flex items-center justify-center bg-white border border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 transition-all"
                                    title="Remover da equipe"
                                  >
                                    <UserMinus className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Seletor de ciclo de avaliação - apenas para não admin */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-6 w-full">
              {/* Select à Esquerda */}
              <div className="w-full md:w-80">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Selecione um ciclo de avaliação
                </label>
                <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                  <SelectTrigger className="w-full bg-muted/50 border-0 ring-0 focus:ring-0 focus:ring-offset-0 hover:bg-muted transition-colors">
                    <SelectValue placeholder="Selecione um ciclo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {allCycles.map((cycle) => {
                      const isActive = cycle.id === currentCycleId;
                      const isFinished = cycle.status === "finished" || cycle.status === "completed";
                      return (
                        <SelectItem key={cycle.id} value={cycle.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className={isActive ? "font-semibold" : "font-medium"}>{cycle.name}</span>
                            {isActive && (
                              <span className="text-xs text-white bg-primary px-2 py-0.5 rounded-full">Atual</span>
                            )}
                            {isFinished && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                Finalizado
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão de PDI Alinhado à Direita */}
              {/* Para CEO/leader_top: gerenciar ciclos PDI */}
              {isLeaderTop ? (
                <div className="flex flex-col items-center justify-center w-full md:w-auto gap-2">
                  {/* Se não há ciclo ativo ou ciclo está closed, mostrar botão criar */}
                  {!currentPDICycle || currentPDICycle.status === "closed" ? (
                    <Button
                      variant="default"
                      className="gap-2 px-6 py-2.5 h-auto rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={() => setIsPDICEODialogOpen(true)}
                    >
                      <Crown className="w-4 h-4" />
                      <span className="font-semibold text-sm">Novo ciclo de PDI com o CEO</span>
                    </Button>
                  ) : (
                    <>
                      {/* Mostrar status atual e ações disponíveis */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                          <Crown className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            PDI {currentPDICycle.status === "pending" ? "Aguardando" : "Inscrições Abertas"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Prazo: {formatPDIDeadline(currentPDICycle.registration_deadline)}
                        </span>
                        {/* Botões de ação para mudar status */}
                        <div className="flex gap-2 mt-1">
                          {currentPDICycle.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleUpdatePDIStatus("registration_open")}
                              disabled={updatingPDIStatus}
                            >
                              {updatingPDIStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : "Abrir Inscrições"}
                            </Button>
                          )}
                          {currentPDICycle.status === "registration_open" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => handleUpdatePDIStatus("closed")}
                              disabled={updatingPDIStatus}
                            >
                              {updatingPDIStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : "Encerrar Ciclo"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Para usuários normais: inscrever-se no PDI */
                <>
                  {/* Só mostrar se há ciclo ativo e não está closed */}
                  {currentPDICycle && currentPDICycle.status !== "closed" && (
                    <>
                      {/* Se deadline passou e usuário não está inscrito, esconder tudo */}
                      {isPDIDeadlinePassed && !userPDIRegistered ? null : (
                        <div className="flex flex-col items-center justify-center w-full md:w-auto">
                          {userPDIRegistered ? (
                            <Button
                              variant="secondary"
                              className="gap-2 px-6 py-2.5 h-auto rounded-lg cursor-default"
                              disabled
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-sm text-green-600">Já inscrito no PDI!</span>
                            </Button>
                          ) : currentPDICycle.status === "registration_open" ? (
                            <Button
                              variant="default"
                              className="gap-2 px-6 py-2.5 h-auto rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                              onClick={() => setIsPDIUserDialogOpen(true)}
                            >
                              <Crown className="w-4 h-4" />
                              <span className="font-semibold text-sm">Inscrição para PDI com o CEO</span>
                            </Button>
                          ) : currentPDICycle.status === "pending" ? ( // Alterado aqui: de else para else if (pending)
                            <Button
                              variant="outline"
                              className="gap-2 px-6 py-2.5 h-auto rounded-lg cursor-default"
                              disabled
                            >
                              <Crown className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-sm text-muted-foreground">PDI em breve</span>
                            </Button>
                          ) : null}{" "}
                          {/* Se não for nenhum dos acima (ex: status desconhecido), não renderiza nada */}
                          {/* Prazo: só mostra se não estiver inscrito e se houver data, independente de ser pending ou open */}
                          {!userPDIRegistered &&
                            currentPDICycle.registration_deadline &&
                            (currentPDICycle.status === "registration_open" ||
                              currentPDICycle.status === "pending") && (
                              <span className="text-[10px] tracking-wider text-muted-foreground mt-1.5">
                                Prazo: {formatPDIDeadline(currentPDICycle.registration_deadline)}
                              </span>
                            )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Dashboard da última avaliação - só mostra se leader_top ou resultados divulgados/ciclo finalizado ou (leader_top em preliminary_results) */}
            {isLeaderTop || shouldShowResults || (isLeaderTop && isPreliminaryResults) ? (
              <>
                <section className="mb-6" ref={dashboardRef}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Sua Avaliação Individual
                    </h2>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setChartType("gauge")}
                        className={`p-1.5 rounded ${chartType === "gauge" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                        title="Gráfico de semicírculo"
                      >
                        <PieChart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setChartType("radar")}
                        className={`p-1.5 rounded ${chartType === "radar" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                        title="Gráfico de teia"
                      >
                        <Radar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {chartType === "gauge" ? (
                    <div className="flex gap-2">
                      {/* 4 gráficos à esquerda */}
                      <div className="grid grid-cols-2 gap-1.5 flex-shrink-0" style={{ width: "65%" }}>
                        {Object.entries(evaluationData).map(([key, value]) => (
                          <GaugeChart
                            key={key}
                            value={value}
                            maxValue={5}
                            color={charHexColors[key]}
                            label={charLabels[key]}
                            fullLabel={charFullLabels[key]}
                            isBest={best === key}
                            isWorst={worst === key}
                          />
                        ))}
                      </div>

                      {/* Score Final à direita */}
                      <div className="flex-1 bg-card border border-border rounded p-3 flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground mb-1">Score Final</p>
                        <ScoreGauge value={userScores?.final_overall_score ?? null} />
                        <p
                          className={`text-3xl font-bold -mt-1 ${userScores?.final_overall_score ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {userScores?.final_overall_score?.toFixed(2) ?? "--"}
                        </p>
                        {userScores?.performance_classification ? (
                          <div
                            className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                              userScores.performance_classification.toLowerCase().includes("excelência") ||
                              userScores.performance_classification.toLowerCase().includes("excelencia") ||
                              userScores.performance_classification.toLowerCase().includes("alta performance") ||
                              userScores.performance_classification.toLowerCase().includes("alta")
                                ? "bg-green-100 text-green-700"
                                : userScores.performance_classification.toLowerCase().includes("zona crítica") ||
                                    userScores.performance_classification.toLowerCase().includes("zona critica") ||
                                    userScores.performance_classification.toLowerCase().includes("risco") ||
                                    userScores.performance_classification.toLowerCase().includes("crítico") ||
                                    userScores.performance_classification.toLowerCase().includes("critico")
                                  ? "bg-red-100 text-red-700"
                                  : userScores.performance_classification.toLowerCase().includes("atenção") ||
                                      userScores.performance_classification.toLowerCase().includes("atencao")
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {userScores.performance_classification}
                          </div>
                        ) : (
                          <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            Sem dados
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded p-4 relative">
                      <div className="flex items-center justify-center">
                        {userScores?.final_overall_score ? (
                          <FilledRadarChart
                            competencia={userScores.final_competency || 0}
                            habilidade={userScores.final_skill || 0}
                            atitude={userScores.final_attitude || 0}
                            resultado={userScores.final_result || 0}
                            score={userScores.final_overall_score || 0}
                          />
                        ) : (
                          <EmptyRadarChart />
                        )}
                      </div>

                      {/* Floating card - Score ou Sem dados */}
                      <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${userScores?.final_overall_score ? "bg-primary" : "bg-muted"}`}
                          />
                          <div className="text-center">
                            <p
                              className={`text-xs font-semibold ${userScores?.final_overall_score ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {userScores?.final_overall_score?.toFixed(2) ?? "--"}
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground">
                              {userScores?.performance_classification ?? "Sem dados"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Floating card - Ponto Forte */}
                      {best && evaluationData[best as keyof typeof evaluationData] !== null && (
                        <div className="absolute top-14 left-3 bg-card/95 backdrop-blur-sm border border-green-500/50 rounded-lg p-2 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Ponto Forte</p>
                              <p className="text-sm font-semibold text-green-600">
                                {charFullLabels[best]} (
                                {evaluationData[best as keyof typeof evaluationData]?.toFixed(1)})
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Floating card - Área de Desenvolvimento */}
                      {worst && evaluationData[worst as keyof typeof evaluationData] !== null && (
                        <div className="absolute bottom-3 right-3 bg-card/95 backdrop-blur-sm border border-destructive/50 rounded-lg p-2 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Área de Desenvolvimento</p>
                              <p className="text-sm font-semibold text-destructive">
                                {charFullLabels[worst]} (
                                {evaluationData[worst as keyof typeof evaluationData]?.toFixed(1)})
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() =>
                        user &&
                        selectedCycleId &&
                        navigate(`/performance-analysis?user_id=${user.id}&cycle_id=${selectedCycleId}&from=home`)
                      }
                      disabled={!user || !selectedCycleId}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium bg-card border border-border rounded transition-colors ${
                        user && selectedCycleId ? "hover:bg-muted/50 cursor-pointer" : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-foreground" />
                      <span className="text-foreground">Visualizar relatório</span>
                    </button>
                  </div>
                </section>

                {/* Dashboard de equipe - apenas para líderes */}
                {isLeader && (shouldShowResults || isPreliminaryResults) && (
                  <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Avaliação da sua Equipe
                      </h2>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setTeamChartType("gauge")}
                          className={`p-1.5 rounded ${teamChartType === "gauge" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                          title="Gráfico de semicírculo"
                        >
                          <PieChart className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTeamChartType("radar")}
                          className={`p-1.5 rounded ${teamChartType === "radar" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                          title="Gráfico de teia"
                        >
                          <Radar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {loadingTeamScores ? (
                      <div className="flex gap-2">
                        <div className="grid grid-cols-2 gap-1.5 flex-shrink-0" style={{ width: "65%" }}>
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-card border border-border rounded p-3">
                              <Skeleton className="h-3 w-20 mb-2" />
                              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
                              <Skeleton className="h-4 w-12 mx-auto" />
                            </div>
                          ))}
                        </div>
                        <div className="flex-1 bg-card border border-border rounded p-3 flex flex-col items-center justify-center">
                          <Skeleton className="h-3 w-16 mb-2" />
                          <Skeleton className="h-20 w-20 rounded-full mb-2" />
                          <Skeleton className="h-6 w-12" />
                        </div>
                      </div>
                    ) : teamScores ? (
                      <>
                        {teamChartType === "gauge" ? (
                          <div className="flex gap-2">
                            {/* 4 gráficos à esquerda */}
                            <div className="grid grid-cols-2 gap-1.5 flex-shrink-0" style={{ width: "65%" }}>
                              {(["competencia", "habilidade", "atitude", "resultado"] as const).map((key) => {
                                const valueMap = {
                                  competencia: teamScores.final_competency,
                                  habilidade: teamScores.final_skill,
                                  atitude: teamScores.final_attitude,
                                  resultado: teamScores.final_result,
                                };
                                return (
                                  <GaugeChart
                                    key={key}
                                    value={valueMap[key]}
                                    maxValue={5}
                                    color={charHexColors[key]}
                                    label={charLabels[key]}
                                    fullLabel={charFullLabels[key]}
                                    isBest={false}
                                    isWorst={false}
                                  />
                                );
                              })}
                            </div>

                            {/* Score Final à direita */}
                            <div className="flex-1 bg-card border border-border rounded p-3 flex flex-col items-center justify-center">
                              <p className="text-xs text-muted-foreground mb-1">Score da Equipe</p>
                              <ScoreGauge value={teamScores.final_overall_score ?? null} />
                              <p
                                className={`text-3xl font-bold -mt-1 ${teamScores.final_overall_score ? "text-primary" : "text-muted-foreground"}`}
                              >
                                {teamScores.final_overall_score?.toFixed(2) ?? "--"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-card border border-border rounded p-4 relative">
                            <div className="flex items-center justify-center">
                              <FilledRadarChart
                                competencia={teamScores.final_competency || 0}
                                habilidade={teamScores.final_skill || 0}
                                atitude={teamScores.final_attitude || 0}
                                resultado={teamScores.final_result || 0}
                                score={teamScores.final_overall_score || 0}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-2 mt-3">
                          <button
                            onClick={() =>
                              user &&
                              selectedCycleId &&
                              navigate(`/performance-analysis?user_id=${user.id}&cycle_id=${selectedCycleId}&from=team`)
                            }
                            disabled={!user || !selectedCycleId}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium bg-card border border-border rounded transition-colors ${
                              user && selectedCycleId
                                ? "hover:bg-muted/50 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <FileText className="w-4 h-4 text-foreground" />
                            <span className="text-foreground">Visualizar relatório da equipe</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!isTeamNotesOpen) {
                                fetchTeamMemberScores();
                              }
                              setIsTeamNotesOpen(!isTeamNotesOpen);
                            }}
                            disabled={teamMembers.length === 0}
                            className={`flex-1 relative flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium bg-card border border-border rounded transition-colors ${
                              teamMembers.length > 0
                                ? "hover:bg-muted/50 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <Users className="w-4 h-4 text-foreground" />
                            <span className="text-foreground">Ver notas individuais da equipe</span>
                            {isTeamNotesOpen ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground absolute right-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-4" />
                            )}
                          </button>

                          {/* Lista expandida de notas */}
                          {isTeamNotesOpen && (
                            <div className="bg-card border border-border rounded-lg overflow-hidden">
                              {loadingTeamMemberScores ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  <span className="ml-2 text-sm text-muted-foreground">Carregando notas...</span>
                                </div>
                              ) : teamMemberScores.length === 0 ? (
                                <div className="text-center py-6">
                                  <p className="text-sm text-muted-foreground">Nenhum membro na equipe</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-border">
                                  {teamMemberScores.map((member) => (
                                    <div key={member.id} className="p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          {member.link_picture ? (
                                            <img
                                              src={member.link_picture}
                                              alt={member.name}
                                              className="w-8 h-8 rounded-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                              <User className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                          )}
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <p className="text-sm font-medium text-foreground">{member.name}</p>
                                              {member.current_band && (
                                                <span
                                                  className={`w-2.5 h-2.5 rounded-full ${getBandColor(member.current_band)}`}
                                                />
                                              )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                              {[
                                                member.position,
                                                member.role ? getRoleLabel(member.role) : null,
                                                member.bu_id ? allBUs[member.bu_id] : null,
                                              ]
                                                .filter(Boolean)
                                                .join(" • ")}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Classification + Score Geral */}
                                        <div className="flex items-center gap-3">
                                          {member.classification && (
                                            <span
                                              className={`text-[9px] px-2 py-1 rounded-full ${
                                                member.classification.toLowerCase().includes("excelência") ||
                                                member.classification.toLowerCase().includes("alta")
                                                  ? "bg-green-100 text-green-700"
                                                  : member.classification.toLowerCase().includes("evolução") ||
                                                      member.classification.toLowerCase().includes("constante")
                                                    ? "bg-blue-100 text-blue-700"
                                                    : member.classification.toLowerCase().includes("atenção")
                                                      ? "bg-amber-100 text-amber-700"
                                                      : member.classification.toLowerCase().includes("crítica") ||
                                                          member.classification.toLowerCase().includes("risco")
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-muted text-muted-foreground"
                                              }`}
                                            >
                                              {member.classification}
                                            </span>
                                          )}
                                          <p
                                            className={`text-lg font-semibold ${member.overall_score ? "text-foreground" : "text-muted-foreground"}`}
                                          >
                                            {member.overall_score?.toFixed(2) ?? "--"}
                                          </p>
                                        </div>
                                      </div>

                                      {/* CHAR Scores */}
                                      <div className="grid grid-cols-4 gap-1.5">
                                        <div className="bg-blue-50 rounded px-2 py-1 text-center">
                                          <p className="text-[9px] text-blue-600 font-medium">C</p>
                                          <p
                                            className={`text-sm font-bold ${member.competency ? "text-blue-700" : "text-muted-foreground"}`}
                                          >
                                            {member.competency?.toFixed(2) ?? "--"}
                                          </p>
                                        </div>
                                        <div className="bg-green-50 rounded px-2 py-1 text-center">
                                          <p className="text-[9px] text-green-600 font-medium">H</p>
                                          <p
                                            className={`text-sm font-bold ${member.skill ? "text-green-700" : "text-muted-foreground"}`}
                                          >
                                            {member.skill?.toFixed(2) ?? "--"}
                                          </p>
                                        </div>
                                        <div className="bg-amber-50 rounded px-2 py-1 text-center">
                                          <p className="text-[9px] text-amber-600 font-medium">A</p>
                                          <p
                                            className={`text-sm font-bold ${member.attitude ? "text-amber-700" : "text-muted-foreground"}`}
                                          >
                                            {member.attitude?.toFixed(2) ?? "--"}
                                          </p>
                                        </div>
                                        <div className="bg-purple-50 rounded px-2 py-1 text-center">
                                          <p className="text-[9px] text-purple-600 font-medium">R</p>
                                          <p
                                            className={`text-sm font-bold ${member.result ? "text-purple-700" : "text-muted-foreground"}`}
                                          >
                                            {member.result?.toFixed(2) ?? "--"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="bg-card border border-border rounded-lg p-6 text-center">
                        <p className="text-sm text-muted-foreground">Nenhum dado de equipe disponível</p>
                      </div>
                    )}
                  </section>
                )}
              </>
            ) : loadingCycleStatus ? (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-48" />
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="grid grid-cols-2 gap-1.5 flex-shrink-0" style={{ width: "65%" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-card border border-border rounded p-3">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-card border border-border rounded p-3 flex flex-col items-center justify-center">
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-20 w-20 rounded-full mb-2" />
                    <Skeleton className="h-6 w-12 mb-2" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </section>
            ) : (
              <section className="mb-6">
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Resultados ainda não divulgados</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Os resultados da sua avaliação C.H.A.R serão exibidos aqui assim que forem divulgados pela
                    liderança.
                  </p>
                </div>
              </section>
            )}

            {/* Avaliações pendentes */}
            <section className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Avaliações</h2>
                {currentCycleDeadline &&
                  (() => {
                    const deadlineInfo = getDeadlineInfo(currentCycleDeadline);
                    if (!deadlineInfo) return null;
                    return (
                      <span className={`text-xs px-2 py-1 rounded-full ${deadlineInfo.colorClass}`}>
                        Prazo: {deadlineInfo.formattedDate}
                      </span>
                    );
                  })()}
              </div>

              {loadingEvaluations ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando avaliações...</span>
                  </div>
                </div>
              ) : allEvaluations.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <ClipboardList className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Nenhuma avaliação encontrada</h3>
                  <p className="text-xs text-muted-foreground">
                    Quando houver avaliações para você realizar, elas aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allEvaluations.map((evaluation) => {
                    const Icon = evaluation.icon;
                    const isDone = evaluation.isDone;
                    const isUnrealized = evaluation.status === "unrealized"; // Nova condição

                    if (isDone) {
                      return (
                        <div
                          key={evaluation.id}
                          className="flex items-center justify-between py-3 px-4 bg-card border border-green-200 rounded opacity-75"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{evaluation.name}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {evaluation.label && <span>{evaluation.label}</span>}
                                {evaluation.label &&
                                  evaluation.type?.toLowerCase() !== "auto" &&
                                  evaluation.type?.toLowerCase() !== "self" &&
                                  evaluatedUsersNames[evaluation.evaluated_id]?.bu_id &&
                                  allBUs[evaluatedUsersNames[evaluation.evaluated_id].bu_id!] && <span>•</span>}
                                {evaluation.type?.toLowerCase() !== "auto" &&
                                  evaluation.type?.toLowerCase() !== "self" &&
                                  evaluatedUsersNames[evaluation.evaluated_id]?.bu_id &&
                                  allBUs[evaluatedUsersNames[evaluation.evaluated_id].bu_id!] && (
                                    <span>{allBUs[evaluatedUsersNames[evaluation.evaluated_id].bu_id!]}</span>
                                  )}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Avaliado</span>
                        </div>
                      );
                    }

                    // Renderização para Avaliações Não Realizadas (Vermelho e Não Clicável)
                    if (isUnrealized) {
                      return (
                        <div
                          key={evaluation.id}
                          className="flex items-center justify-between py-3 px-4 bg-red-50/50 border border-red-200 rounded cursor-not-allowed opacity-80"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <X className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-900">{evaluation.name}</p>
                              <div className="flex items-center gap-1 text-xs text-red-700/70">
                                {evaluation.label && <span>{evaluation.label}</span>}
                                {/* Mantendo a lógica de BU se necessário, mas com cores adaptadas */}
                                {evaluation.label && evaluatedUsersNames[evaluation.evaluated_id]?.bu_id && (
                                  <span>•</span>
                                )}
                                {evaluatedUsersNames[evaluation.evaluated_id]?.bu_id && (
                                  <span>{allBUs[evaluatedUsersNames[evaluation.evaluated_id].bu_id!]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full font-medium">
                            Não Realizada
                          </span>
                        </div>
                      );
                    }

                    // Renderização padrão para Pendentes (Botão Clicável)
                    return (
                      <button
                        key={evaluation.id}
                        type="button"
                        onClick={() => {
                          navigate(
                            `/evaluation-form?id=${evaluation.id}&evaluated=${evaluation.evaluated_id}&type=${evaluation.type}&name=${encodeURIComponent(
                              evaluatedUsersNames[evaluation.evaluated_id]?.name || "",
                            )}&label=${encodeURIComponent(evaluation.label || "")}`,
                          );
                        }}
                        className="w-full text-left flex items-center justify-between py-3 px-4 bg-card border border-border rounded hover:border-primary hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{evaluation.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {evaluation.label && <span>{evaluation.label}</span>}
                              {evaluation.label &&
                                evaluation.type?.toLowerCase() !== "auto" &&
                                evaluation.type?.toLowerCase() !== "self" &&
                                evaluatedUsersNames[evaluation.evaluated_id]?.bu_id &&
                                allBUs[evaluatedUsersNames[evaluation.evaluated_id].bu_id!] && <span>•</span>}
                              {evaluation.type?.toLowerCase() !== "auto" &&
                                evaluation.type?.toLowerCase() !== "self" &&
                                evaluatedUsersNames[evaluation.evaluated_id]?.bu_id &&
                                allBUs[evaluatedUsersNames[evaluation.evaluated_id].bu_id!] && (
                                  <span>{allBUs[evaluatedUsersNames[evaluation.evaluated_id].bu_id!]}</span>
                                )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pendente</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Seção Minha Equipe - apenas para líderes (não admin) */}
            {isLeader && (
              <section className="mt-6 bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Minha Equipe
                    <span className="text-xs font-normal text-muted-foreground">({teamMembers.length}/10)</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    {teamMembers.length > 0 && teamMembers.some((m) => m.char) && (
                      <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                        <span className="text-xs text-muted-foreground">Média da equipe:</span>
                        <span className="text-sm font-bold text-primary">
                          {getTeamAverage(teamMembers).overall.toFixed(2)}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${getClassification(getTeamAverage(teamMembers).overall).color}`}
                        />
                      </div>
                    )}
                    {/* Botão de Estatísticas da Equipe */}
                    {teamMembers.length > 0 && (
                      <button
                        onClick={() => setIsTeamStatsOpen(true)}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-800 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
                        title="Estatísticas da equipe"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-800" />
                      </button>
                    )}
                    {/* Botão Definir Meus Próprios Pares - apenas para leader_top */}
                    {isLeaderTop && (
                      <button
                        onClick={openOwnPeersDialog}
                        className="h-7 flex items-center gap-1.5 px-2 bg-white border border-gray-800 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
                        title="Definir meus próprios pares"
                      >
                        <Link2 className="w-4 h-4 text-gray-800" />
                        <span className="text-xs text-gray-800 font-medium">Definir próprios pares</span>
                      </button>
                    )}
                    {/* Botão Definir Pares da equipe */}
                    {teamMembers.length > 0 && (
                      <button
                        onClick={() => setIsPeersOpen(true)}
                        className="flex items-center gap-1.5 px-2 h-7 bg-white border border-gray-800 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
                        title="Definir Pares da Equipe"
                      >
                        <Link2 className="w-4 h-4 text-gray-800" />
                        <span className="text-xs text-gray-800 font-medium">Definir pares da equipe</span>
                      </button>
                    )}
                    {teamMembers.length < 10 && (
                      <button
                        onClick={handleOpenAddMember}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-800 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all"
                        title="Adicionar membro"
                      >
                        <UserPlus className="w-4 h-4 text-gray-800" />
                      </button>
                    )}
                  </div>
                </div>

                {loadingTeam ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando equipe...</span>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Nenhum liderado encontrado</h3>
                    <p className="text-xs text-muted-foreground">Quando você tiver liderados, eles aparecerão aqui.</p>
                  </div>
                ) : (
                  <>
                    {/* Classificação da equipe - só mostra se houver dados CHAR */}
                    {teamMembers.some((m) => m.char) && (
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-green-600">
                            {getTeamClassificationCounts(teamMembers).alta}
                          </div>
                          <div className="text-[10px] text-green-700 font-medium">Alta Performance</div>
                          <div className="text-[9px] text-green-600/70">{"> 4.5"}</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {getTeamClassificationCounts(teamMembers).evolucao}
                          </div>
                          <div className="text-[10px] text-blue-700 font-medium">Evolução Constante</div>
                          <div className="text-[9px] text-blue-600/70">{"3.5 - 4.5"}</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-amber-600">
                            {getTeamClassificationCounts(teamMembers).atencao}
                          </div>
                          <div className="text-[10px] text-amber-700 font-medium">Zona de Atenção</div>
                          <div className="text-[9px] text-amber-600/70">{"2.5 - 3.5"}</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-red-600">
                            {getTeamClassificationCounts(teamMembers).critica}
                          </div>
                          <div className="text-[10px] text-red-700 font-medium">Zona Crítica</div>
                          <div className="text-[9px] text-red-600/70">{"< 2.5"}</div>
                        </div>
                      </div>
                    )}

                    {/* Lista de membros */}
                    <div className="space-y-2">
                      {sortTeamMembers(teamMembers).map((member) => {
                        const hasChar = member.char;
                        const score = hasChar ? parseFloat(getMemberScore(member.char!)) : null;
                        const classification = score !== null ? getClassification(score) : null;

                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all"
                          >
                            <div className="relative">
                              {member.link_picture ? (
                                <img
                                  src={member.link_picture}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${member.current_band?.toLowerCase() === "branca" ? "border-gray-300" : "border-background"}`}
                                style={{ backgroundColor: getBandColorHex(member.current_band) }}
                                title={`Faixa: ${member.current_band || "Não definida"}`}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm text-foreground">{member.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {getRoleLabel(member.role)}
                                {member.position && ` • ${member.position}`}
                                {member.bu_id && allBUs[member.bu_id] && ` • ${allBUs[member.bu_id]}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {hasChar ? (
                                <>
                                  <div className="flex gap-1.5 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                      C: {member.char!.competencia.toFixed(1)}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                      H: {member.char!.habilidade.toFixed(1)}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                      A: {member.char!.atitude.toFixed(1)}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                      R: {member.char!.resultado.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
                                    <div className={`w-2 h-2 rounded-full ${classification!.color}`} />
                                    <span className="text-sm font-semibold text-foreground">{score!.toFixed(2)}</span>
                                  </div>
                                </>
                              ) : null}
                              <button
                                onClick={() => setMemberToRemove(member)}
                                className="w-7 h-7 flex items-center justify-center bg-white border border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 transition-all"
                                title="Remover da equipe"
                              >
                                <UserMinus className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Média CHAR da equipe */}
                    {teamMembers.some((m) => m.char) && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">Média CHAR da Equipe</span>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                              C: {getTeamAverage(teamMembers).competencia.toFixed(2)}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                              H: {getTeamAverage(teamMembers).habilidade.toFixed(2)}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                              A: {getTeamAverage(teamMembers).atitude.toFixed(2)}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                              R: {getTeamAverage(teamMembers).resultado.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}

        {/* Dialog para adicionar membro */}
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar à Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pessoa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {sortTeamMembers(filteredAvailableUsers).map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {person.link_picture ? (
                          <img
                            src={person.link_picture}
                            alt={person.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-foreground">{person.name}</p>
                            <div
                              className={`w-2 h-2 rounded-full ${getBandColor(person.current_band)}`}
                              title={person.current_band || "Sem faixa"}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{getRoleLabel(person.role)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(person.id)}
                        disabled={isAdding === person.id}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-border rounded-md hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                        title="Adicionar à equipe"
                      >
                        {isAdding === person.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="w-4 h-4 text-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para Definir Pares */}
        <Dialog
          open={isPeersOpen}
          onOpenChange={(open) => {
            setIsPeersOpen(open);
            if (!open) closePeersSelection();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedMemberForPeers
                  ? `Selecionar Pares de ${selectedMemberForPeers.name}`
                  : "Definir Pares dos Liderados"}
              </DialogTitle>
            </DialogHeader>

            {/* Tela de seleção de liderado */}
            {!selectedMemberForPeers ? (
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Adicione membros à equipe primeiro</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Selecione um liderado para definir seus pares:</p>
                    {teamMembers
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((member) => (
                        <button
                          key={member.id}
                          onClick={() => openPeersSelection(member)}
                          className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {member.link_picture ? (
                              <img
                                src={member.link_picture}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div className="text-left">
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{getRoleLabel(member.role)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {(memberPeers[member.id] || []).length} par(es)
                            </span>
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              /* Tela de seleção de pares */
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
                      {(() => {
                        const people = getAllCompanyPeople(selectedMemberForPeers.id);
                        if (people.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground py-2">
                              {peersSearchQuery ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa disponível"}
                            </p>
                          );
                        }

                        const selected = people.filter((p) => tempSelectedPeers.includes(p.id));
                        const notSelected = people.filter((p) => !tempSelectedPeers.includes(p.id));

                        const renderPeerButton = (peer: TeamMember) => {
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
                              {peer.link_picture && !isSelected ? (
                                <img
                                  src={peer.link_picture}
                                  alt={peer.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <User className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{peer.name}</p>
                                <p className="text-xs text-muted-foreground">{getRoleLabel(peer.role)}</p>
                              </div>
                            </button>
                          );
                        };

                        return (
                          <>
                            {/* Selecionados (pares) */}
                            {selected.map(renderPeerButton)}

                            {/* Separador discreto */}
                            {selected.length > 0 && notSelected.length > 0 && (
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 border-t border-border/50" />
                                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                                  Equipe
                                </span>
                                <div className="flex-1 border-t border-border/50" />
                              </div>
                            )}

                            {/* Não selecionados (equipe) */}
                            {notSelected.map(renderPeerButton)}
                          </>
                        );
                      })()}
                    </div>

                    {/* Botão para adicionar pares de outras equipes */}
                    <button
                      onClick={() => {
                        setShowOtherTeamsPeers(true);
                        fetchAllUsersForPeers();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-muted/50 hover:bg-muted rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Adicionar pares de outras equipes
                    </button>
                  </>
                ) : (
                  <>
                    {/* Header com botão voltar */}
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
                      <span className="text-xs text-muted-foreground">|</span>
                      <span className="text-xs font-medium text-foreground">Pares de outras equipes</span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar em outras equipes..."
                        value={otherTeamsPeersSearch}
                        onChange={(e) => setOtherTeamsPeersSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {loadingAllUsersForPeers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {getOtherTeamsUsers(selectedMemberForPeers.id).length > 0 ? (
                          getOtherTeamsUsers(selectedMemberForPeers.id).map((peer) => {
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
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <User className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{peer.name}</p>
                                  <p className="text-xs text-muted-foreground">{getRoleLabel(peer.role)}</p>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground py-2 text-center">
                            {otherTeamsPeersSearch ? "Nenhuma pessoa encontrada" : "Nenhum usuário disponível"}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="pt-3 border-t border-border space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    {tempSelectedPeers.length} par(es) selecionado(s) para {selectedMemberForPeers.name}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={closePeersSelection} className="flex-1">
                      Voltar
                    </Button>
                    <Button
                      onClick={applyPeersSelection}
                      className="flex-1"
                      disabled={
                        selectedMemberForPeers &&
                        JSON.stringify([...(memberPeers[selectedMemberForPeers.id] || [])].sort()) ===
                          JSON.stringify([...tempSelectedPeers].sort())
                      }
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AlertDialog para confirmar remoção */}
        <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover da equipe</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{memberToRemove?.name}</strong> da sua equipe? Esta ação pode ser
                desfeita adicionando o membro novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                disabled={isRemoving}
                className="bg-red-500 hover:bg-red-600"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Removendo...
                  </>
                ) : (
                  "Remover"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog para admin adicionar membro à equipe */}
        <Dialog open={isAdminAddDialogOpen} onOpenChange={setIsAdminAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar à Equipe de {selectedTeamForAdd?.leader.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pessoa..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filteredNoLeadUsers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    {adminSearchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário sem equipe disponível"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {sortTeamMembers(filteredNoLeadUsers).map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {person.link_picture ? (
                          <img
                            src={person.link_picture}
                            alt={person.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-amber-600" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-foreground">{person.name}</p>
                            <div
                              className={`w-2 h-2 rounded-full ${getBandColor(person.current_band)}`}
                              title={person.current_band || "Sem faixa"}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{getRoleLabel(person.role)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdminAddMember(person.id)}
                        disabled={isAdminAdding === person.id}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-border rounded-md hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                        title="Adicionar à equipe"
                      >
                        {isAdminAdding === person.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="w-4 h-4 text-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* AlertDialog para admin confirmar remoção */}
        <AlertDialog open={!!adminMemberToRemove} onOpenChange={(open) => !open && setAdminMemberToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover da equipe</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{adminMemberToRemove?.member.name}</strong> da equipe de{" "}
                <strong>{adminMemberToRemove?.team.leader.name}</strong>? O usuário ficará disponível para ser
                adicionado a outra equipe.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isAdminRemoving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAdminRemoveMember}
                disabled={isAdminRemoving}
                className="bg-red-500 hover:bg-red-600"
              >
                {isAdminRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Removendo...
                  </>
                ) : (
                  "Remover"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog para selecionar equipe para usuário sem equipe */}
        <Dialog open={isSelectTeamDialogOpen} onOpenChange={setIsSelectTeamDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar {selectedUserForTeam?.name} a uma equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar equipe..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {availableTeamsForAdd.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    {teamSearchQuery
                      ? "Nenhuma equipe encontrada"
                      : "Nenhuma equipe disponível (todas estão com 10 membros)"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableTeamsForAdd.map((team) => (
                    <div
                      key={team.leader.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {team.leader.link_picture ? (
                          <img
                            src={team.leader.link_picture}
                            alt={team.leader.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Crown className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-foreground">Equipe de {team.leader.name}</p>
                            <div
                              className={`w-2 h-2 rounded-full ${getBandColor(team.leader.current_band)}`}
                              title={team.leader.current_band || "Sem faixa"}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{team.members.length}/10 membros</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddUserToTeam(team)}
                        disabled={isAdminAdding === selectedUserForTeam?.id}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-border rounded-md hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                        title="Adicionar a esta equipe"
                      >
                        {isAdminAdding === selectedUserForTeam?.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="w-4 h-4 text-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para leader_top definir seus próprios pares */}
        <Dialog open={isOwnPeersDialogOpen} onOpenChange={setIsOwnPeersDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Definir meus próprios pares</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pessoa..."
                  value={ownPeersSearchQuery}
                  onChange={(e) => setOwnPeersSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadingAllUsersForPeers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {(() => {
                    const allPeers = getAvailableOwnPeers();
                    const teamMemberIds = teamMembers.map((m) => m.id);

                    // Separar em: pares selecionados, minha equipe, outros
                    const selectedPeers = allPeers.filter((p) => tempOwnPeers.includes(p.id));
                    const myTeamNotSelected = allPeers.filter(
                      (p) => !tempOwnPeers.includes(p.id) && teamMemberIds.includes(p.id),
                    );
                    const othersNotSelected = allPeers.filter(
                      (p) => !tempOwnPeers.includes(p.id) && !teamMemberIds.includes(p.id),
                    );

                    const renderPeerButton = (peer: (typeof allPeers)[0], isSelected: boolean) => (
                      <button
                        key={peer.id}
                        onClick={() => toggleOwnPeer(peer.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isSelected
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-card border border-border hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{peer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {peer.role === "leader" ? "Líder" : "Colaborador"}
                          </p>
                        </div>
                      </button>
                    );

                    return (
                      <>
                        {/* Pares selecionados */}
                        {selectedPeers.length > 0 && (
                          <>
                            <p className="text-xs font-medium text-primary px-1">Meus Pares</p>
                            {selectedPeers.map((p) => renderPeerButton(p, true))}
                          </>
                        )}

                        {/* Minha equipe */}
                        {myTeamNotSelected.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 py-2">
                              <div className="flex-1 border-t border-border" />
                              <span className="text-xs text-muted-foreground">Minha Equipe</span>
                              <div className="flex-1 border-t border-border" />
                            </div>
                            {myTeamNotSelected.map((p) => renderPeerButton(p, false))}
                          </>
                        )}

                        {/* Outros usuários */}
                        {othersNotSelected.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 py-2">
                              <div className="flex-1 border-t border-border" />
                              <span className="text-xs text-muted-foreground">Outros</span>
                              <div className="flex-1 border-t border-border" />
                            </div>
                            {othersNotSelected.map((p) => renderPeerButton(p, false))}
                          </>
                        )}

                        {allPeers.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2 text-center">
                            {ownPeersSearchQuery ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa disponível"}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="pt-3 border-t border-border space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  {tempOwnPeers.length} par(es) selecionado(s)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsOwnPeersDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={applyOwnPeersSelection}
                    className="flex-1"
                    disabled={
                      savingOwnPeers ||
                      JSON.stringify([...ownPeers].sort()) === JSON.stringify([...tempOwnPeers].sort())
                    }
                  >
                    {savingOwnPeers ? (
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
          </DialogContent>
        </Dialog>

        {/* Dialog de Estatísticas da Equipe */}
        <Dialog open={isTeamStatsOpen} onOpenChange={setIsTeamStatsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estatísticas da Equipe
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Por Empresa/BU */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Por Empresa
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const buData: Record<number, { name: string; count: number; color: string }> = {};
                    teamMembers.forEach((m) => {
                      const buId = m.bu_id || 0;
                      const buName = buId && allBUs[buId] ? allBUs[buId] : "Não definida";
                      const buColor = buId && buColors[buId] ? buColors[buId] : "#9ca3af";
                      if (!buData[buId]) {
                        buData[buId] = { name: buName, count: 0, color: buColor };
                      }
                      buData[buId].count++;
                    });
                    const entries = Object.values(buData).sort((a, b) => b.count - a.count);
                    const maxCount = Math.max(...entries.map((e) => e.count), 1);

                    return entries.map(({ name, count, color }) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-24">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-muted-foreground truncate" title={name}>
                            {name}
                          </span>
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-6 text-right">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Por Faixa */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-muted-foreground" />
                  Por Faixa
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const bandCounts: Record<string, { count: number; color: string }> = {};
                    const bandColors: Record<string, string> = {
                      branca: "#e5e5e5",
                      amarela: "#facc15",
                      laranja: "#fb923c",
                      verde: "#22c55e",
                      azul: "#3b82f6",
                      roxa: "#a855f7",
                      marrom: "#78350f",
                      preta: "#171717",
                    };
                    teamMembers.forEach((m) => {
                      const band = m.current_band?.toLowerCase() || "não definida";
                      const displayBand = m.current_band || "Não definida";
                      if (!bandCounts[displayBand]) {
                        bandCounts[displayBand] = { count: 0, color: bandColors[band] || "#9ca3af" };
                      }
                      bandCounts[displayBand].count++;
                    });
                    const entries = Object.entries(bandCounts).sort((a, b) => b[1].count - a[1].count);
                    const maxCount = Math.max(...Object.values(bandCounts).map((b) => b.count), 1);

                    return entries.map(([name, { count, color }]) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-24">
                          <span
                            className={`w-3 h-3 rounded-full ${name.toLowerCase() === "branca" ? "border border-gray-300" : ""}`}
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-muted-foreground truncate" title={name}>
                            {name}
                          </span>
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-6 text-right">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Por Cargo */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Por Cargo
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const roleCounts: Record<string, { count: number; color: string }> = {};
                    const roleColors: Record<string, string> = {
                      leader: "#3b82f6",
                      employee: "#10b981",
                    };
                    teamMembers.forEach((m) => {
                      const role = m.role || "employee";
                      const displayRole = getRoleLabel(role);
                      if (!roleCounts[displayRole]) {
                        roleCounts[displayRole] = { count: 0, color: roleColors[role] || "#9ca3af" };
                      }
                      roleCounts[displayRole].count++;
                    });
                    const entries = Object.entries(roleCounts).sort((a, b) => b[1].count - a[1].count);
                    const maxCount = Math.max(...Object.values(roleCounts).map((b) => b.count), 1);

                    return entries.map(([name, { count, color }]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24 truncate" title={name}>
                          {name}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-6 text-right">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total de membros</span>
                  <span className="text-lg font-bold text-foreground">{teamMembers.length}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para CEO criar novo ciclo PDI */}
        <Dialog open={isPDICEODialogOpen} onOpenChange={setIsPDICEODialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Novo Ciclo de PDI com o CEO
              </DialogTitle>
              <DialogDescription>
                Configure o prazo de inscrição e se o ciclo já estará aberto para inscrições.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pdi-deadline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Data limite para inscrição
                </Label>
                <Input
                  id="pdi-deadline"
                  type="date"
                  value={pdiCEODeadline}
                  onChange={(e) => setPdiCEODeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="pdi-active" className="text-sm font-medium">
                    Ativar inscrições agora
                  </Label>
                  <p className="text-xs text-muted-foreground">Se ativado, usuários já poderão se inscrever</p>
                </div>
                <Switch id="pdi-active" checked={pdiCEOActiveToggle} onCheckedChange={setPdiCEOActiveToggle} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPDICEODialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePDICycle} disabled={creatingPDICycle || !pdiCEODeadline}>
                {creatingPDICycle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Ciclo"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para usuário se inscrever no PDI */}
        <Dialog open={isPDIUserDialogOpen} onOpenChange={setIsPDIUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Inscrição para PDI com o CEO
              </DialogTitle>
              <DialogDescription>
                Confirme sua participação no Programa de Desenvolvimento Individual com o CEO.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground">
                  Ao se inscrever, você terá a oportunidade de participar de sessões de mentoria diretamente com o CEO
                  para desenvolver sua trajetória na empresa.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdi-phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Telefone para contato
                </Label>
                <Input
                  id="pdi-phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={pdiUserPhone}
                  onChange={(e) => setPdiUserPhone(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdi-message">Motivação</Label>
                <Textarea
                  id="pdi-message"
                  placeholder="Por que você quer participar do PDI com o CEO?"
                  value={pdiUserMessage}
                  onChange={(e) => setPdiUserMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPDIUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleRegisterPDI}
                disabled={registeringPDI || !pdiUserPhone.trim() || !pdiUserMessage.trim()}
              >
                {registeringPDI ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inscrevendo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Inscrição
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Notificações - Usuários inscritos no PDI */}
        <Dialog open={isPDINotificationsOpen} onOpenChange={setIsPDINotificationsOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-primary" />
                Inscritos no PDI com o CEO
              </DialogTitle>
              <DialogDescription>Visualize e gerencie os usuários inscritos em cada ciclo de PDI.</DialogDescription>
            </DialogHeader>

            {/* Seletor de Ciclo */}
            {pdiCycles.length > 0 && (
              <div className="flex items-center gap-2 py-2">
                <Label className="text-sm text-muted-foreground">Ciclo:</Label>
                <Select value={selectedPDICycleForView?.toString() || ""} onValueChange={handleChangePDICycleView}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione um ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdiCycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id.toString()}>
                        Ciclo #{cycle.id} -{" "}
                        {cycle.status === "closed"
                          ? "Encerrado"
                          : cycle.status === "registration_open"
                            ? "Aberto"
                            : "Pendente"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lista de Usuários */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {loadingPDIUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando inscritos...</span>
                </div>
              ) : pdiUsers.filter((u) => u.user_id).length === 0 ? ( // Filtra apenas usuários válidos para decidir se mostra a lista
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Nenhum usuário inscrito neste ciclo.</p>
                  <p className="text-xs text-muted-foreground/70">
                    As novas inscrições aparecerão aqui conforme os colaboradores se cadastrarem.
                  </p>
                </div>
              ) : (
                pdiUsers.map((pdiUser) => {
                  // Garante que não renderize cards fantasmas sem ID
                  if (!pdiUser || !pdiUser.user_id) return null;

                  const isExpanded = expandedId === pdiUser.id;

                  return (
                    <div
                      key={pdiUser.id}
                      className={`flex flex-col rounded-lg border transition-all duration-200 ${
                        pdiUser.done ? "bg-green-50/50 border-green-200" : "bg-card border-border"
                      }`}
                    >
                      {/* Header do Card */}
                      <div className="flex items-center gap-3 p-3">
                        {/* Foto */}
                        {pdiUser.user_picture ? (
                          <img
                            src={pdiUser.user_picture}
                            alt={pdiUser.user_name || "Usuário"}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-foreground truncate">
                              {pdiUser.user_name || `Usuário #${pdiUser.user_id}`}
                            </h4>
                            {pdiUser.user_band && (
                              <div
                                className={`w-3 h-3 rounded-full flex-shrink-0 ${getBandColor(pdiUser.user_band)}`}
                                title={`Faixa ${pdiUser.user_band}`}
                              />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            {pdiUser.user_role && <span className="capitalize">{getRoleLabel(pdiUser.user_role)}</span>}
                            {pdiUser.user_position && (
                              <>
                                <span className="text-muted-foreground/50">•</span>
                                <span>{pdiUser.user_position}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Checkbox e Flecha */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-muted-foreground">Concluído</span>
                            <button
                              onClick={() => handleTogglePDIUserDone(pdiUser.id, pdiUser.done)}
                              disabled={updatingPDIUserDone === pdiUser.id}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                pdiUser.done
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-muted-foreground/30 hover:border-primary"
                              }`}
                            >
                              {updatingPDIUserDone === pdiUser.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : pdiUser.done ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : null}
                            </button>
                          </label>

                          {/* Botão de Expansão */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : pdiUser.id)}
                            className={`p-1 rounded-full hover:bg-muted transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>

                      {/* Área da Motivação (Expansível) */}
                      {isExpanded && (
                        <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="pt-3 border-t border-border/50 flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                              Motivação
                            </span>
                            <p className="text-sm text-foreground/80 leading-relaxed italic">
                              "{pdiUser.motive || "Nenhuma motivação informada."}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter className="pt-4 border-t">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">
                  {pdiUsers.filter((u) => u.user_id).length}{" "}
                  {pdiUsers.filter((u) => u.user_id).length === 1 ? "inscrito" : "inscritos"}
                  {pdiUsers.filter((u) => u.done).length > 0 && (
                    <span className="text-green-600 ml-2">
                      ({pdiUsers.filter((u) => u.done).length} concluído
                      {pdiUsers.filter((u) => u.done).length !== 1 ? "s" : ""})
                    </span>
                  )}
                </span>
                <Button variant="outline" onClick={() => setIsPDINotificationsOpen(false)}>
                  Fechar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Home;
