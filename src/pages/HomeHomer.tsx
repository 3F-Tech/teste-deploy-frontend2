import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, UserCheck, Crown, TrendingUp, AlertTriangle, FileText, Download, PieChart, Radar, CheckCircle, Clock, LogOut, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface para BU
interface BU {
  id: number;
  name: string;
}

// Avaliações disponíveis (da mais recente para a mais antiga)
const availableEvaluations = [
  { id: "current", label: "Avaliação Atual", period: "2025/4" },
  { id: "2025-3", label: "2025/3", period: "2025/3" },
  { id: "2025-2", label: "2025/2", period: "2025/2" },
  { id: "2025-1", label: "2025/1", period: "2025/1" },
  { id: "2024-4", label: "2024/4", period: "2024/4" },
  { id: "2024-3", label: "2024/3", period: "2024/3" },
];

const evaluations = [
  { id: 1, name: "Autoavaliação", type: "self", icon: UserCheck, completed: false },
  { id: 2, name: "Frank Grimes", type: "peer", icon: User, completed: false },
  { id: 3, name: "Roz Davis", type: "leader", icon: Crown, label: "líder", completed: false },
];

const lastEvaluation = {
  competencia: 4.25,
  habilidade: 3.78,
  atitude: 4.85,
  resultado: 3.12,
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

  // Create polygon points for the data
  const dataPoints = radarData.map((d, i) => getPoint(i, d.value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Grid levels
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full max-h-[350px]">
      {/* Circular grid */}
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

      {/* Scale numbers on right axis */}
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

      {/* Data polygon */}
      <path
        d={dataPath}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3B82F6"
        strokeWidth="2"
      />

      {/* Data points */}
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

      {/* Values at each point */}
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
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

interface EvaluationCycle {
  id: number;
  evaluation_start: string;
  evaluation_end: string;
  status: string;
}

const HomeHomer = () => {
  const { best, worst } = getBestAndWorst();
  const scoreFinal = parseFloat(getScoreFinal());
  const [chartType, setChartType] = useState<"gauge" | "radar">("gauge");
  const [selectedEvaluation, setSelectedEvaluation] = useState("current");
  const [buName, setBuName] = useState<string>("");
  const [currentCycle, setCurrentCycle] = useState<EvaluationCycle | null>(null);
  const [isOutOfDeadline, setIsOutOfDeadline] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Buscar nome da BU do usuário e ciclo atual
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
          console.error('Erro ao buscar BU:', error);
        }
      }
    };

    const fetchCurrentCycle = async () => {
      try {
        const response = await fetch("https://app.impulsecompany.com.br/webhook/getEvalutionCycles");
        if (response.ok) {
          const data = await response.json();
          // Encontrar ciclo em fase de avaliação
          const activeCycle = data.find((cycle: EvaluationCycle) => 
            cycle.status === "evaluation" || cycle.status === "active"
          );
          if (activeCycle) {
            setCurrentCycle(activeCycle);
            // Verificar se está fora do prazo
            const endDate = new Date(activeCycle.evaluation_end);
            const now = new Date();
            setIsOutOfDeadline(now > endDate);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar ciclo:', error);
      }
    };

    fetchBU();
    fetchCurrentCycle();
  }, [user?.bu_id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <header className="bg-primary text-primary-foreground py-4 px-3">
        <div className="px-[20%] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-xl font-bold">Olá, {user?.name || 'Homer'}!</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-primary-foreground/80">
                {user?.role && (
                  <span className="capitalize">{user.role}</span>
                )}
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
              <Link
                to="/manage-users"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
                title="Gerenciar Usuários"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Usuários</span>
              </Link>
            )}
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

      <main className="px-[20%] py-4">
        {/* Seletor de avaliação */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Selecione uma avaliação</label>
          <Select value={selectedEvaluation} onValueChange={setSelectedEvaluation}>
            <SelectTrigger className="w-full md:w-72 bg-muted/50 border-0 ring-0 focus:ring-0 focus:ring-offset-0 hover:bg-muted transition-colors">
              <SelectValue placeholder="Selecione uma avaliação" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {availableEvaluations.map((evaluation) => (
                <SelectItem 
                  key={evaluation.id} 
                  value={evaluation.id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={evaluation.id === "current" ? "font-medium" : ""}>{evaluation.label}</span>
                    {evaluation.id === "current" && (
                      <span className="text-xs text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-full">{evaluation.period}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dashboard da última avaliação */}
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
              {/* 4 gráficos à esquerda */}
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

              {/* Score Final à direita */}
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

        {/* Lista de avaliações pendentes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Avaliações Pendentes</h2>
            {currentCycle && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isOutOfDeadline 
                  ? "bg-red-100 text-red-700 border border-red-300 animate-pulse" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {isOutOfDeadline ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Fora de Prazo</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Prazo: {new Date(currentCycle.evaluation_end).toLocaleDateString('pt-BR')}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            {evaluations.map((evaluation) => {
              const content = (
                <>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    evaluation.completed 
                      ? "bg-primary/10" 
                      : isOutOfDeadline 
                        ? "bg-red-100" 
                        : "bg-primary/10"
                  }`}>
                    <evaluation.icon className={`w-5 h-5 ${
                      evaluation.completed 
                        ? "text-primary" 
                        : isOutOfDeadline 
                          ? "text-red-600" 
                          : "text-primary"
                    }`} />
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
                  ) : isOutOfDeadline ? (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                      Fora de Prazo
                      <AlertCircle className="w-3.5 h-3.5" />
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
                        evaluation.type === "self" ? "Homer Simpson" : evaluation.name
                      )}&type=${evaluation.type}`
                    );
                  }}
                  className={`w-full text-left flex items-center gap-3 p-3 bg-card rounded-lg border transition-all ${
                    isOutOfDeadline
                      ? "border-red-300 hover:border-red-500 hover:bg-red-50"
                      : "border-border hover:border-primary hover:shadow-md"
                  }`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sistema de Avaliação C.H.A.R
        </p>
      </main>
    </div>
  );
};

export default HomeHomer;
