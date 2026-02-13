import { useState, forwardRef, useEffect } from "react";
import { ChevronLeft, Info, Crown, User, UserCheck, Users } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Dedupe de montagem em DEV (React pode montar/desmontar 2x para validar efeitos)
const __mountDedupe = new Set<string>();

const evaluationTypes: Record<string, { icon: typeof UserCheck; label: string; color: string }> = {
  auto: { icon: UserCheck, label: "Autoavaliação", color: "text-primary" },
  self: { icon: UserCheck, label: "Autoavaliação", color: "text-primary" },
  peer: { icon: Users, label: "Avaliação de Par", color: "text-blue-500" },
  par: { icon: Users, label: "Avaliação de Par", color: "text-blue-500" },
  leader: { icon: Crown, label: "Avaliação de Líder", color: "text-amber-500" },
  lider: { icon: Crown, label: "Avaliação de Líder", color: "text-amber-500" },
  led: { icon: User, label: "Avaliação de Liderado", color: "text-green-500" },
  subordinate: { icon: User, label: "Avaliação de Liderado", color: "text-green-500" },
  liderado: { icon: User, label: "Avaliação de Liderado", color: "text-green-500" },
};

const pillars = [
  {
    id: "competencia",
    name: "Competência",
    letter: "C",
    color: "#1F4FD8",
    description:
      "Avalia o domínio técnico da função, conhecimento de processos e uso das ferramentas essenciais do cargo.",
    ratings: [
      { value: 1, label: "Não domina tarefas básicas da função, comete erros recorrentes." },
      { value: 2, label: "Conhece o básico, mas precisa de apoio constante para entregar." },
      { value: 3, label: "Entrega com autonomia, mas ainda com lacunas pontuais no conhecimento." },
      { value: 4, label: "Demonstra domínio técnico sólido e orienta colegas quando necessário." },
      { value: 5, label: "Referência técnica na área. Ajuda a desenvolver padrões, processos ou formar outros." },
    ],
  },
  {
    id: "habilidade",
    name: "Habilidade",
    letter: "H",
    color: "#2FAE61",
    description: "Avalia a capacidade de execução, organização, proatividade e solução de problemas.",
    ratings: [
      { value: 1, label: "Desorganizado(a), procrastina tarefas e depende de constante direcionamento." },
      { value: 2, label: "Executa com ajuda, mas demonstra dificuldade em manter ritmo ou foco." },
      { value: 3, label: "Cumpre bem o que é pedido, mas raramente antecipa necessidades." },
      { value: 4, label: "Organizado(a), proativo(a), resolve problemas e contribui além do escopo." },
      { value: 5, label: "Atua com alto grau de autonomia, propõe melhorias e influencia processos." },
    ],
  },
  {
    id: "atitude",
    name: "Atitude",
    letter: "A",
    color: "#F59E0B",
    description: "Avalia comportamento, cultura, colaboração, ética, comunicação e mentalidade de dono.",
    ratings: [
      { value: 1, label: "Tem atitudes desalinhadas à cultura e prejudica o clima do time." },
      { value: 2, label: "Demonstra esforço, mas ainda tem falhas de postura e comunicação." },
      { value: 3, label: "Cumpre o esperado com ética e respeito, mas sem protagonismo claro." },
      { value: 4, label: "É engajado(a), respeitoso(a), colabora e representa bem os valores da empresa." },
      { value: 5, label: "Inspira pelo exemplo. É um multiplicador de cultura e referência comportamental." },
    ],
  },
  {
    id: "resultado",
    name: "Resultado",
    letter: "R",
    color: "#7C3AED",
    description: "Avalia entrega real, impacto nas metas da área e contribuição concreta para o negócio.",
    ratings: [
      { value: 1, label: "Não cumpre metas e compromete resultados da equipe." },
      { value: 2, label: "Entrega parcialmente, com constância irregular." },
      { value: 3, label: "Cumpre o combinado de forma consistente, mesmo sem grandes destaques." },
      { value: 4, label: "Supera metas com frequência e contribui para metas do time." },
      {
        value: 5,
        label: "Tem impacto direto no crescimento da empresa. Entrega com excelência, escala e visão de negócio.",
      },
    ],
  },
];

interface RatingButtonProps {
  value: number;
  selected: boolean;
  onClick: () => void;
  color: string;
  description: string;
}

const RatingButton = forwardRef<HTMLButtonElement, RatingButtonProps>(
  ({ value, selected, onClick, color, description }, ref) => (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
            selected ? "text-white scale-110 shadow-lg" : "bg-muted text-muted-foreground hover:scale-105"
          }`}
          style={selected ? { backgroundColor: color } : {}}
        >
          {value}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-center">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  ),
);
RatingButton.displayName = "RatingButton";

export default function EvaluationForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const key = `EvaluationForm:${window.location.pathname}${window.location.search}`;
    if (__mountDedupe.has(key)) return;
    __mountDedupe.add(key);
  }, []);

  const evaluationId = searchParams.get("id");
  const evaluatedId = searchParams.get("evaluated");
  const evaluatedName = searchParams.get("name") || "Colaborador";
  const evaluationType = searchParams.get("type")?.toLowerCase() || "peer";
  const evaluationLabel = searchParams.get("label") || "";
  const typeInfo = evaluationTypes[evaluationType] || evaluationTypes.peer;
  const TypeIcon = typeInfo.icon;
  const isAutoEvaluation = evaluationType === "auto" || evaluationType === "self";

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [observation, setObservation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (pillarId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [pillarId]: value }));
  };

  const allRated = pillars.every((p) => ratings[p.id]);

  const handleSubmit = async () => {
    if (!allRated || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const overall_score = (ratings.competencia + ratings.habilidade + ratings.atitude + ratings.resultado) / 4;

      const payload = {
        id: evaluationId,
        evaluator_id: user?.id,
        evaluator_name: user?.name,
        evaluated_id: evaluatedId,
        evaluated_name: evaluatedName,
        evaluation_type: evaluationType,
        evaluation_label: evaluationLabel,
        ratings: {
          competencia: ratings.competencia,
          habilidade: ratings.habilidade,
          atitude: ratings.atitude,
          resultado: ratings.resultado,
        },
        overall_score,
        observation,
        submitted_at: new Date().toISOString(),
      };

      const response = await fetch("https://app.impulsecompany.com.br/webhook/updateEvalution", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar avaliação");
      }

      toast.success("Avaliação enviada com sucesso!");
      navigate("/home");
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-3">
        <div className="px-[20%] flex items-center justify-between">
          <Link
            to="/home"
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-[20%] py-6">
        {/* Avaliado Header */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">
            {isAutoEvaluation
              ? "Autoavaliação"
              : `Avaliação de ${evaluationLabel || typeInfo.label.replace("Avaliação de ", "")}`}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              {isAutoEvaluation ? "Você está se avaliando" : evaluatedName}
            </h1>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted cursor-help ${typeInfo.color}`}
                >
                  <TypeIcon className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">{typeInfo.label}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Pillars */}
        <div className="space-y-4">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: pillar.color }}
                  >
                    {pillar.letter}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{pillar.name}</h2>
                    <p className="text-xs text-muted-foreground max-w-md">{pillar.description}</p>
                  </div>
                </div>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-sm">
                    <div className="space-y-1 text-xs">
                      {pillar.ratings.map((r) => (
                        <p key={r.value}>
                          <strong>{r.value}:</strong> {r.label}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center justify-center gap-3">
                {pillar.ratings.map((rating) => (
                  <RatingButton
                    key={rating.value}
                    value={rating.value}
                    selected={ratings[pillar.id] === rating.value}
                    onClick={() => handleRatingChange(pillar.id, rating.value)}
                    color={pillar.color}
                    description={rating.label}
                  />
                ))}
              </div>

              {ratings[pillar.id] && (
                <p className="text-xs text-center text-muted-foreground mt-3 italic">
                  {pillar.ratings.find((r) => r.value === ratings[pillar.id])?.label}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Observation */}
        <div className="bg-card border border-border rounded-lg p-4 mt-4">
          <label htmlFor="observation" className="block text-sm font-medium text-foreground mb-2">
            Observações (opcional)
          </label>
          <textarea
            id="observation"
            rows={3}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none text-sm"
            placeholder="Espaço livre para comentários específicos, exemplos práticos ou recomendações de desenvolvimento"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allRated || isSubmitting}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-all ${
            allRated && !isSubmitting
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-6">Sistema de Avaliação C.H.A.R</p>
      </main>
    </div>
  );
}
