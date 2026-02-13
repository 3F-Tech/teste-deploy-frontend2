import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, UserCheck, Crown, TrendingUp, AlertTriangle, FileText, Download, PieChart, Radar, CheckCircle, Clock, Users, Pencil, Plus, X, UserPlus, Link2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const evaluations = [
  { id: 1, name: "Autoavaliação", type: "self", icon: UserCheck, completed: true },
  { id: 2, name: "Smithers", type: "leader", icon: Crown, label: "líder", completed: false },
  { id: 3, name: "Lenny", type: "subordinate", icon: Users, label: "liderado", completed: false },
  { id: 4, name: "Mandy Simmons", type: "subordinate", icon: Users, label: "liderado", completed: false },
  { id: 5, name: "Roz Davis", type: "peer", icon: User, label: "par", completed: false },
];

// Pessoas disponíveis para adicionar à equipe
const availablePeople = [
  { 
    id: 101, 
    name: "Duffman", 
    role: "Promotor de Vendas",
    char: { competencia: 3.80, habilidade: 4.50, atitude: 4.90, resultado: 3.60 }
  },
  { 
    id: 102, 
    name: "Gil Gunderson", 
    role: "Vendedor",
    char: { competencia: 2.80, habilidade: 2.50, atitude: 3.20, resultado: 2.10 }
  },
  { 
    id: 103, 
    name: "Barney", 
    role: "Assistente de Operações",
    char: { competencia: 3.20, habilidade: 3.00, atitude: 2.80, resultado: 2.50 }
  },
];

// Dados iniciais da equipe do Carl
const initialTeamMembers = [
  { 
    id: 1, 
    name: "Lenny Leonard", 
    role: "Técnico de Operações",
    char: { competencia: 4.50, habilidade: 4.20, atitude: 4.60, resultado: 4.30 }
  },
  { 
    id: 2, 
    name: "Mandy Simmons", 
    role: "Analista de Processos",
    char: { competencia: 3.90, habilidade: 4.10, atitude: 4.40, resultado: 3.80 }
  },
];

type TeamMember = {
  id: number;
  name: string;
  role: string;
  char: { competencia: number; habilidade: number; atitude: number; resultado: number };
};

const getTeamAverage = (teamMembers: TeamMember[]) => {
  if (teamMembers.length === 0) {
    return { competencia: 0, habilidade: 0, atitude: 0, resultado: 0, overall: 0 };
  }
  const totals = { competencia: 0, habilidade: 0, atitude: 0, resultado: 0 };
  teamMembers.forEach(member => {
    totals.competencia += member.char.competencia;
    totals.habilidade += member.char.habilidade;
    totals.atitude += member.char.atitude;
    totals.resultado += member.char.resultado;
  });
  const count = teamMembers.length;
  return {
    competencia: totals.competencia / count,
    habilidade: totals.habilidade / count,
    atitude: totals.atitude / count,
    resultado: totals.resultado / count,
    overall: (totals.competencia + totals.habilidade + totals.atitude + totals.resultado) / (count * 4)
  };
};

const getTeamClassificationCounts = (teamMembers: TeamMember[]) => {
  const counts = { alta: 0, evolucao: 0, atencao: 0, critica: 0 };
  teamMembers.forEach(member => {
    const score = (member.char.competencia + member.char.habilidade + member.char.atitude + member.char.resultado) / 4;
    if (score > 4.5) counts.alta++;
    else if (score > 3.5) counts.evolucao++;
    else if (score > 2.5) counts.atencao++;
    else counts.critica++;
  });
  return counts;
};

const getMemberScore = (char: { competencia: number; habilidade: number; atitude: number; resultado: number }) => {
  return ((char.competencia + char.habilidade + char.atitude + char.resultado) / 4).toFixed(2);
};

const lastEvaluation = {
  competencia: 4.65,
  habilidade: 4.32,
  atitude: 4.90,
  resultado: 4.18,
};

const getScoreFinal = () => {
  const scores = Object.values(lastEvaluation);
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
};

const getClassification = (score: number) => {
  if (score > 4.5) return { label: "Alta Performance", color: "bg-green-500", textColor: "text-green-600" };
  if (score > 3.5) return { label: "Evolução Constante", color: "bg-blue-500", textColor: "text-blue-600" };
  if (score > 2.5) return { label: "Zona de Atenção", color: "bg-amber-500", textColor: "text-amber-600" };
  return { label: "Zona Crítica", color: "bg-red-500", textColor: "text-red-600" };
};

const getBestAndWorst = () => {
  const entries = Object.entries(lastEvaluation);
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return { best: sorted[0][0], worst: sorted[sorted.length - 1][0] };
};

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
  value: number;
  maxValue: number;
  color: string;
  label: string;
  fullLabel: string;
  isBest?: boolean;
  isWorst?: boolean;
}

const GaugeChart = ({ value, maxValue, color, label, fullLabel, isBest, isWorst, size = "normal" }: GaugeChartProps & { size?: "normal" | "large" }) => {
  const percentage = ((value - 1) / (maxValue - 1)) * 100;
  const angle = (percentage / 100) * 180;
  const isLarge = size === "large";
  
  return (
    <div className={`bg-card rounded p-2 relative flex flex-col justify-center ${isBest ? "ring-2 ring-green-500" : isWorst ? "ring-2 ring-destructive" : "border border-border"}`}>
      {isBest && <TrendingUp className="absolute top-1 right-1 w-3 h-3 text-green-500" />}
      {isWorst && <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-destructive" />}
      
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 60" className={isLarge ? "w-full" : "w-full max-w-[100px]"}>
          <path
            d="M 8 55 A 42 42 0 0 1 92 55"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="12"
            strokeLinecap="butt"
          />
          <path
            d="M 8 55 A 42 42 0 0 1 92 55"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="butt"
            strokeDasharray={`${(angle / 180) * 131.95} 131.95`}
          />
          <text x="50" y="52" textAnchor="middle" fontSize={isLarge ? "16" : "18"} fontWeight="bold" fill={color}>
            {label}
          </text>
        </svg>
        
        <div className="text-center">
          <span className={`font-bold ${isLarge ? "text-2xl" : "text-base"}`} style={{ color }}>{value.toFixed(2)}</span>
          <p className={`text-muted-foreground ${isLarge ? "text-xs" : "text-[9px]"}`}>{fullLabel}</p>
        </div>
      </div>
    </div>
  );
};

const ScoreGauge = ({ value }: { value: number }) => {
  const percentage = ((value - 1) / (5 - 1)) * 100;
  const angle = (percentage / 100) * 180;
  
  return (
    <svg viewBox="0 0 100 60" className="w-full max-w-[140px]">
      <path
        d="M 8 55 A 42 42 0 0 1 92 55"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="12"
        strokeLinecap="butt"
      />
      <path
        d="M 8 55 A 42 42 0 0 1 92 55"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="12"
        strokeLinecap="butt"
        strokeDasharray={`${(angle / 180) * 131.95} 131.95`}
      />
    </svg>
  );
};

const RadarChart = () => {
  const scoreFinal = parseFloat(getScoreFinal());
  const radarData = [
    { key: "competencia", label: "Competência", value: lastEvaluation.competencia },
    { key: "habilidade", label: "Habilidade", value: lastEvaluation.habilidade },
    { key: "atitude", label: "Atitude", value: lastEvaluation.atitude },
    { key: "resultado", label: "Resultado", value: lastEvaluation.resultado },
    { key: "score", label: "Score Final", value: scoreFinal },
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
      angle,
    };
  };

  const getValuePoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const radius = (value / 5) * maxRadius + 12;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const dataPoints = radarData.map((d, i) => getPoint(i, d.value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

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
        return (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={point.x}
            y2={point.y}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        );
      })}

      {gridLevels.map((level) => (
        <text
          key={level}
          x={centerX + (level / 5) * maxRadius + 5}
          y={centerY - 3}
          fontSize="9"
          fill="#9ca3af"
        >
          {level}
        </text>
      ))}

      <path
        d={dataPath}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3B82F6"
        strokeWidth="2"
      />

      {radarData.map((d, i) => {
        const point = getPoint(i, d.value);
        return (
          <circle
            key={d.key}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3B82F6"
          />
        );
      })}

      {radarData.map((d, i) => {
        const valuePoint = getValuePoint(i, d.value);
        return (
          <text
            key={`value-${d.key}`}
            x={valuePoint.x}
            y={valuePoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#374151"
          >
            {d.value.toFixed(1)}
          </text>
        );
      })}

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
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

const HomeCarl = () => {
  const navigate = useNavigate();
  const { best, worst } = getBestAndWorst();
  const scoreFinal = parseFloat(getScoreFinal());
  const [chartType, setChartType] = useState<"gauge" | "radar">("gauge");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isPeersOpen, setIsPeersOpen] = useState(false);

  // Estado para pares de cada liderado
  const [memberPeers, setMemberPeers] = useState<Record<number, number[]>>({
    1: [], // Lenny sem pares
    2: [], // Mandy sem pares
  });

  // Estado para pesquisa de pessoas
  const [searchQuery, setSearchQuery] = useState("");
  const [peersSearchQuery, setPeersSearchQuery] = useState("");
  const [selectedMemberForPeers, setSelectedMemberForPeers] = useState<TeamMember | null>(null);
  const [tempSelectedPeers, setTempSelectedPeers] = useState<number[]>([]);

  const getAvailableToAdd = () => {
    const teamIds = teamMembers.map(m => m.id);
    return availablePeople
      .filter(p => !teamIds.includes(p.id))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const addMember = (person: TeamMember) => {
    setTeamMembers(prev => [...prev, person]);
    setMemberPeers(prev => ({ ...prev, [person.id]: [] }));
  };

  const removeMember = (memberId: number) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    setMemberPeers(prev => {
      const newPeers = { ...prev };
      delete newPeers[memberId];
      return newPeers;
    });
  };

  const togglePeer = (memberId: number, peerId: number) => {
    setMemberPeers(prev => {
      const current = prev[memberId] || [];
      if (current.includes(peerId)) {
        return { ...prev, [memberId]: current.filter(id => id !== peerId) };
      } else {
        return { ...prev, [memberId]: [...current, peerId] };
      }
    });
  };

  // Todas as pessoas da empresa (para seleção de pares)
  const getAllCompanyPeople = (excludeId: number) => {
    const allPeople = [
      ...teamMembers.filter(m => m.id !== excludeId),
      ...availablePeople,
    ];
    return allPeople
      .filter(p => p.name.toLowerCase().includes(peersSearchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const openPeersSelection = (member: TeamMember) => {
    setSelectedMemberForPeers(member);
    setTempSelectedPeers(memberPeers[member.id] || []);
    setPeersSearchQuery("");
  };

  const closePeersSelection = () => {
    setSelectedMemberForPeers(null);
    setTempSelectedPeers([]);
    setPeersSearchQuery("");
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

  const applyPeersSelection = () => {
    if (selectedMemberForPeers) {
      setMemberPeers(prev => ({
        ...prev,
        [selectedMemberForPeers.id]: tempSelectedPeers
      }));
      closePeersSelection();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <header className="bg-primary text-primary-foreground py-4 px-3">
        <div className="px-[20%] flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
          <div>
            <h1 className="text-xl font-bold">Olá, Carl!</h1>
            <p className="text-sm text-primary-foreground/80">Suas avaliações pendentes</p>
          </div>
        </div>
      </header>

      <main className="px-[20%] py-4">
        {/* Título da avaliação atual */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Avaliação Atual: <span className="text-primary">2025/4</span></h2>
        </div>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Sua última avaliação C.H.A.R</h2>
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
              <div className="grid grid-cols-2 gap-1.5 flex-shrink-0" style={{ width: "65%" }}>
                {Object.entries(lastEvaluation).map(([key, value]) => (
                  <GaugeChart
                    key={key}
                    value={value}
                    maxValue={5}
                    color={charHexColors[key]}
                    label={charLabels[key]}
                    fullLabel={charFullLabels[key]}
                    isBest={key === best}
                    isWorst={key === worst}
                  />
                ))}
              </div>

              <div className="flex-1 bg-card border border-border rounded p-3 flex flex-col items-center justify-center">
                <p className="text-xs text-muted-foreground mb-1">Score Final</p>
                <ScoreGauge value={scoreFinal} />
                <p className="text-3xl font-bold text-foreground -mt-1">{scoreFinal.toFixed(2)}</p>
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium text-white ${getClassification(scoreFinal).color}`}>
                  {getClassification(scoreFinal).label}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded p-4 relative">
              <div className="flex items-center justify-center">
                <RadarChart />
              </div>
              
              {/* Floating card - Classificação */}
              <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${getClassification(scoreFinal).color}`} />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{scoreFinal.toFixed(2)}</p>
                    <p className={`text-[10px] font-medium ${getClassification(scoreFinal).textColor}`}>{getClassification(scoreFinal).label}</p>
                  </div>
                </div>
              </div>
              
              {/* Floating card - Ponto Forte */}
              <div className="absolute top-14 left-3 bg-card/95 backdrop-blur-sm border border-green-500/50 rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ponto Forte</p>
                    <p className="text-sm font-semibold text-green-600">{charFullLabels[best]} ({lastEvaluation[best as keyof typeof lastEvaluation].toFixed(1)})</p>
                  </div>
                </div>
              </div>
              
              {/* Floating card - Área de Desenvolvimento */}
              <div className="absolute bottom-3 right-3 bg-card/95 backdrop-blur-sm border border-destructive/50 rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-xs text-muted-foreground">Área de Desenvolvimento</p>
                    <p className="text-sm font-semibold text-destructive">{charFullLabels[worst]} ({lastEvaluation[worst as keyof typeof lastEvaluation].toFixed(1)})</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Link 
              to="/report" 
              className="flex-1 flex items-center justify-between py-3 px-4 text-sm font-medium bg-card border border-border rounded hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                <span>Visualizar relatório</span>
              </div>
              <span className="text-xs text-muted-foreground">Não visualizado</span>
            </Link>
            <button 
              className="p-3 bg-card border border-border rounded hover:border-primary hover:shadow-md transition-all"
              title="Baixar relatório"
            >
              <Download className="w-4 h-4 text-primary" />
            </button>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Avaliações Pendentes</h2>
          <div className="space-y-2">
            {evaluations.map((evaluation) => {
              const content = (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <evaluation.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-foreground">{evaluation.name}</h3>
                    {evaluation.label && (
                      <span className="text-xs text-muted-foreground">({evaluation.label})</span>
                    )}
                  </div>
                  {evaluation.completed ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      Avaliado
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      Pendente
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </>
              );

              return evaluation.completed ? (
                <div
                  key={evaluation.id}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-green-500 hover:bg-green-50 transition-all cursor-default"
                >
                  {content}
                </div>
              ) : (
                <button
                  key={evaluation.id}
                  type="button"
                  onClick={() => {
                    navigate(
                      `/evaluation-form?name=${encodeURIComponent(
                        evaluation.type === "self" ? "Carl Carlson" : evaluation.name
                      )}&type=${evaluation.type}`
                    );
                  }}
                  className="w-full text-left flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </section>

        {/* Seção Equipe - apenas para líderes */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Minha Equipe
              </h2>
              
              {/* Botão Editar Equipe */}
              <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs border-border hover:border-primary hover:bg-primary hover:text-primary-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Editar Equipe</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Membros atuais */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Membros da equipe</h4>
                      {teamMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">Nenhum membro na equipe</p>
                      ) : (
                        <div className="space-y-2">
                          {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.role}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeMember(member.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pessoas disponíveis */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Adicionar à equipe</h4>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Pesquisar pessoa..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {getAvailableToAdd().length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {getAvailableToAdd().map((person) => (
                            <div key={person.id} className="flex items-center justify-between p-2 bg-card border border-border rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{person.name}</p>
                                  <p className="text-xs text-muted-foreground">{person.role}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => addMember(person)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          {searchQuery ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa disponível"}
                        </p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Botão Definir Pares */}
              <Dialog open={isPeersOpen} onOpenChange={(open) => {
                setIsPeersOpen(open);
                if (!open) closePeersSelection();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs border-border hover:border-primary hover:bg-primary hover:text-primary-foreground">
                    <Link2 className="w-3.5 h-3.5" />
                    Definir Pares
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedMemberForPeers 
                        ? `Selecionar Pares de ${selectedMemberForPeers.name}` 
                        : "Definir Pares dos Liderados"
                      }
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
                          {teamMembers.sort((a, b) => a.name.localeCompare(b.name)).map((member) => (
                            <button
                              key={member.id}
                              onClick={() => openPeersSelection(member)}
                              className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.role}</p>
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
                        {getAllCompanyPeople(selectedMemberForPeers.id).length > 0 ? (
                          getAllCompanyPeople(selectedMemberForPeers.id).map((peer) => {
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}>
                                  {isSelected ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <User className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{peer.name}</p>
                                  <p className="text-xs text-muted-foreground">{peer.role}</p>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            {peersSearchQuery ? "Nenhuma pessoa encontrada" : "Nenhuma pessoa disponível"}
                          </p>
                        )}
                      </div>
                      
                      <div className="pt-3 border-t border-border space-y-3">
                        <p className="text-xs text-muted-foreground text-center">
                          {tempSelectedPeers.length} par(es) selecionado(s) para {selectedMemberForPeers.name}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={closePeersSelection}
                            className="flex-1"
                          >
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
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-xs text-muted-foreground">Média da equipe:</span>
              <span className="text-sm font-bold text-primary">{getTeamAverage(teamMembers).overall.toFixed(2)}</span>
              <div className={`w-2 h-2 rounded-full ${getClassification(getTeamAverage(teamMembers).overall).color}`} />
            </div>
          </div>

          {/* Classificação da equipe */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{getTeamClassificationCounts(teamMembers).alta}</div>
              <div className="text-[10px] text-green-700 font-medium">Alta Performance</div>
              <div className="text-[9px] text-green-600/70">{"> 4.5"}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{getTeamClassificationCounts(teamMembers).evolucao}</div>
              <div className="text-[10px] text-blue-700 font-medium">Evolução Constante</div>
              <div className="text-[9px] text-blue-600/70">{"3.5 - 4.5"}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-amber-600">{getTeamClassificationCounts(teamMembers).atencao}</div>
              <div className="text-[10px] text-amber-700 font-medium">Zona de Atenção</div>
              <div className="text-[9px] text-amber-600/70">{"2.5 - 3.5"}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-600">{getTeamClassificationCounts(teamMembers).critica}</div>
              <div className="text-[10px] text-red-700 font-medium">Zona Crítica</div>
              <div className="text-[9px] text-red-600/70">{"< 2.5"}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {teamMembers.map((member) => {
              const score = parseFloat(getMemberScore(member.char));
              const classification = getClassification(score);
              return (
                <div 
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-foreground">{member.name}</h3>
                    <span className="text-xs text-muted-foreground">{member.role}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">C: {member.char.competencia.toFixed(1)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">H: {member.char.habilidade.toFixed(1)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">A: {member.char.atitude.toFixed(1)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">R: {member.char.resultado.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
                      <div className={`w-2 h-2 rounded-full ${classification.color}`} />
                      <span className="text-sm font-semibold text-foreground">{score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Média CHAR da equipe */}
          {teamMembers.length > 0 && (
            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Média CHAR da Equipe</span>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">C: {getTeamAverage(teamMembers).competencia.toFixed(2)}</span>
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">H: {getTeamAverage(teamMembers).habilidade.toFixed(2)}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">A: {getTeamAverage(teamMembers).atitude.toFixed(2)}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">R: {getTeamAverage(teamMembers).resultado.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sistema de Avaliação C.H.A.R
        </p>
      </main>
    </div>
  );
};

export default HomeCarl;
