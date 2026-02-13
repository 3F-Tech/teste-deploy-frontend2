import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface ScoreItem {
  name: string;
  value: number;
  color?: string;
}

interface BandItem {
  name: string;
  value: number;
  color?: string;
}

interface HistogramBin {
  range: string;
  count: number;
  minValue: number;
  maxValue: number;
}

interface MarkdownRendererProps {
  content: string;
  chartData?: {
    radar?: ScoreItem[];
    bar?: ScoreItem[];
    hist?: HistogramBin[];
    gauge?: { value: number; label?: string };
    bands?: BandItem[];
  };
  performanceClassification?: string;
  isGeneralReport?: boolean; // Indica se é relatório geral (aplica regras especiais)
}

// Seções que PERMITEM bullets (whitelist)
const BULLET_ALLOWED_SECTIONS = [
  'sumário executivo',
  'sumario executivo',
  'distribuição',
  'distribuicao',
  'classificação',
  'classificacao',
  'faixas',
  'papel',
  'ranking',
  'top',
  'bottom',
  'prioridades de gestão',
  'prioridades de gestao',
  'plano de ação',
  'plano de acao',
  'tabela',
];

// Seções de CALLOUT (destaques e riscos)
const CALLOUT_SECTIONS = [
  'destaques',
  'destaque',
  'riscos',
  'risco',
  'riscos prioritários',
  'riscos prioritarios',
];

// Seções que devem ser cards compactos (faixas)
const COMPACT_CARD_SECTIONS = [
  'análise por faixa',
  'analise por faixa',
  'score médio por faixa',
  'score medio por faixa',
];

// Tópicos válidos para labels semânticos
const SEMANTIC_TOPICS = [
  'concentração',
  'concentracao',
  'dispersão',
  'dispersao',
  'assimetria',
  'piso',
  'consistência',
  'consistencia',
  'governança',
  'governanca',
  'risco',
  'comparação',
  'comparacao',
  'síntese',
  'sintese',
  'padrão',
  'padrao',
  'tendência',
  'tendencia',
  'amplitude',
  'média',
  'media',
  'desvio',
];

// Normalização de vocabulário técnico para PT-BR
const normalizeVocabulary = (text: string): string => {
  return text
    .replace(/\bEmployee\b/gi, 'Colaborador')
    .replace(/\bEmployees\b/gi, 'Colaboradores')
    .replace(/\bLeader\b/gi, 'Líder')
    .replace(/\bLeaders\b/gi, 'Líderes')
    .replace(/\bscore_geral\b/gi, 'Score Geral')
    .replace(/\bscore_/gi, 'Score ')
    .replace(/_/g, ' ');
};

// Componente de Gauge (meia roda)
const GaugeChart = ({ value, label }: { value: number; label?: string }) => {
  const normalizedPercentage = Math.min(
    Math.max(value <= 5 ? (value / 5) * 100 : value, 0),
    100
  );

  const arcPath = `M 5 55 A 45 45 0 0 1 95 55`;

  return (
    <div className="my-4 flex flex-col items-center">
      {label && (
        <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      )}

      <svg viewBox="0 0 100 58" className="h-14 w-40" aria-label={label ?? "Gauge"}>
        <path
          d={arcPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="8"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${normalizedPercentage} 100`}
        />
      </svg>

      <div className="-mt-1 text-lg font-medium text-muted-foreground">
        {normalizedPercentage.toFixed(1)}%
      </div>
    </div>
  );
};

// Componente de Bands (distribuição por classificação)
const BandsChart = ({ data }: { data: BandItem[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const getDefaultColor = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('excelência') || lower.includes('excelencia')) return '#22c55e';
    if (lower.includes('alta performance') || lower.includes('alta')) return '#22c55e';
    if (lower.includes('evolução') || lower.includes('evolucao') || lower.includes('constante')) return '#3b82f6';
    if (lower.includes('atenção') || lower.includes('atencao')) return '#f59e0b';
    if (lower.includes('zona crítica') || lower.includes('zona critica') || lower.includes('risco') || lower.includes('crítico') || lower.includes('critico')) return '#ef4444';
    return '#6366f1';
  };

  return (
    <div className="my-4 space-y-2">
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const color = item.color || getDefaultColor(item.name);
          return (
            <div
              key={index}
              style={{ 
                width: `${percentage}%`, 
                backgroundColor: color,
                minWidth: percentage > 0 ? '20px' : '0'
              }}
              className="flex items-center justify-center text-white text-xs font-medium transition-all"
              title={`${item.name}: ${item.value.toFixed(1)}%`}
            >
              {percentage >= 15 && `${item.value.toFixed(1)}%`}
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs">
        {data.map((item, index) => {
          const color = item.color || getDefaultColor(item.name);
          return (
            <div key={index} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">
                {item.name}: <span className="font-medium text-foreground">{item.value.toFixed(1)}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Callout component para Destaques e Riscos
const CalloutBlock = ({ type, children }: { type: 'highlight' | 'risk'; children: React.ReactNode }) => {
  const isHighlight = type === 'highlight';
  return (
    <div className={`my-4 p-4 rounded-lg border-l-4 ${
      isHighlight 
        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500' 
        : 'bg-red-50 dark:bg-red-950/20 border-red-500'
    }`}>
      <div className="flex items-start gap-2">
        <span className={`text-lg ${isHighlight ? 'text-emerald-600' : 'text-red-600'}`}>
          ✦
        </span>
        <div className="flex-1 text-foreground leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

// Card compacto para faixas
const FaixaCard = ({ title, score, count }: { title: string; score?: string; count?: string }) => {
  return (
    <div className="my-2 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="font-semibold text-foreground text-sm mb-1">{title}</div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        {score && (
          <span>Score médio: <span className="font-bold text-foreground text-sm">{score}</span></span>
        )}
        {count && (
          <span>Colaboradores: <span className="font-medium text-foreground">{count}</span></span>
        )}
      </div>
    </div>
  );
};

// Semantic label para tópicos em negrito
const SemanticLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-block mr-1 text-xs font-semibold uppercase tracking-wider text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
      {children}
    </span>
  );
};

const parseChartData = (content: string): { name: string; value: number }[] => {
  const lines = content.trim().split('\n');
  return lines
    .map(line => {
      const match = line.match(/^[\-\*]?\s*(.+?):\s*([\d.]+)/);
      if (match) {
        return { name: match[1].trim(), value: parseFloat(match[2]) };
      }
      return null;
    })
    .filter((item): item is { name: string; value: number } => item !== null);
};

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

const getClassificationColor = (classification?: string): string => {
  if (!classification) return '#6366f1';
  const lower = classification.toLowerCase();
  if (lower.includes('excelência') || lower.includes('excelencia')) return '#22c55e';
  if (lower.includes('alta performance') || lower.includes('alta')) return '#22c55e';
  if (lower.includes('evolução') || lower.includes('evolucao') || lower.includes('constante')) return '#3b82f6';
  if (lower.includes('atenção') || lower.includes('atencao')) return '#f59e0b';
  if (lower.includes('zona crítica') || lower.includes('zona critica') || lower.includes('risco') || lower.includes('crítico') || lower.includes('critico')) return '#ef4444';
  return '#6366f1';
};

// Verifica se o texto começa com um tópico semântico
const startsWithSemanticTopic = (text: string): { topic: string; rest: string } | null => {
  const normalizedText = text.trim();
  
  // Procura por padrão: **Tópico:** ou **Tópico** no início
  const match = normalizedText.match(/^\*\*([^*:]+?)(?::|\.|\s*–|\s*-)?\s*\*\*/);
  if (match) {
    const topic = match[1].trim().toLowerCase();
    if (SEMANTIC_TOPICS.some(t => topic.includes(t))) {
      const rest = normalizedText.slice(match[0].length).trim();
      return { topic: match[1].trim(), rest };
    }
  }
  
  return null;
};

// Verifica se a seção atual permite bullets
const isBulletAllowed = (currentSection: string): boolean => {
  const lower = currentSection.toLowerCase();
  return BULLET_ALLOWED_SECTIONS.some(s => lower.includes(s));
};

// Verifica se é seção de callout
const isCalloutSection = (sectionTitle: string): 'highlight' | 'risk' | null => {
  const lower = sectionTitle.toLowerCase();
  if (lower.includes('destaque')) return 'highlight';
  if (lower.includes('risco')) return 'risk';
  return null;
};

// Verifica se é seção de faixas compactas
const isCompactCardSection = (sectionTitle: string): boolean => {
  const lower = sectionTitle.toLowerCase();
  return COMPACT_CARD_SECTIONS.some(s => lower.includes(s));
};

// Verifica se é sumário executivo
const isExecutiveSummary = (sectionTitle: string): boolean => {
  const lower = sectionTitle.toLowerCase();
  return lower.includes('sumário executivo') || lower.includes('sumario executivo');
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  chartData, 
  performanceClassification,
  isGeneralReport = false 
}) => {
  const classificationColor = getClassificationColor(performanceClassification);
  
  const renderContent = () => {
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;
    let currentSection = ''; // Track da seção atual (H2)
    let currentSubsection = ''; // Track da subseção atual (H3)
    let calloutType: 'highlight' | 'risk' | null = null;
    let calloutContent: React.ReactNode[] = [];
    let inCompactCardSection = false;

    // Normalizar vocabulário
    const normalizedContent = isGeneralReport ? normalizeVocabulary(content) : content;

    // Processar blocos especiais (gráficos)
    const processedContent = normalizedContent
      .replace(/\[{radar}\](?:([\s\S]*?)\[{\/radar}\])?/gi, (match, chartContent) => {
        if (chartData?.radar && chartData.radar.length > 0) {
          return `__CHART_RADAR__${JSON.stringify(chartData.radar)}__END_CHART__`;
        }
        if (chartContent) {
          const data = parseChartData(chartContent);
          if (data.length > 0) {
            return `__CHART_RADAR__${JSON.stringify(data)}__END_CHART__`;
          }
        }
        return '__CHART_RADAR_PLACEHOLDER__';
      })
      .replace(/\[{bar}\](?:([\s\S]*?)\[{\/bar}\])?/gi, (match, chartContent) => {
        if (chartData?.bar && chartData.bar.length > 0) {
          return `__CHART_BAR__${JSON.stringify(chartData.bar)}__END_CHART__`;
        }
        if (chartContent) {
          const data = parseChartData(chartContent);
          if (data.length > 0) {
            return `__CHART_BAR__${JSON.stringify(data)}__END_CHART__`;
          }
        }
        return '__CHART_BAR_PLACEHOLDER__';
      })
      .replace(/\[{hist}\](?:([\s\S]*?)\[{\/hist}\])?/gi, (match, chartContent) => {
        if (chartData?.hist && chartData.hist.length > 0) {
          return `__CHART_HIST__${JSON.stringify(chartData.hist)}__END_CHART__`;
        }
        return '__CHART_HIST_PLACEHOLDER__';
      })
      .replace(/\[{gauge}\](?:([\s\S]*?)\[{\/gauge}\])?/gi, (match, chartContent) => {
        if (chartData?.gauge) {
          return `__CHART_GAUGE__${JSON.stringify(chartData.gauge)}__END_CHART__`;
        }
        if (chartContent) {
          const match = chartContent.match(/([\d.]+)/);
          const value = match ? parseFloat(match[1]) : 0;
          const labelMatch = chartContent.match(/label:\s*(.+)/i);
          const label = labelMatch ? labelMatch[1].trim() : '';
          return `__CHART_GAUGE__${JSON.stringify({ value, label })}__END_CHART__`;
        }
        return '__CHART_GAUGE_PLACEHOLDER__';
      })
      .replace(/\[{bands}\](?:([\s\S]*?)\[{\/bands}\])?/gi, (match, chartContent) => {
        if (chartData?.bands && chartData.bands.length > 0) {
          return `__CHART_BANDS__${JSON.stringify(chartData.bands)}__END_CHART__`;
        }
        if (chartContent) {
          const data = parseChartData(chartContent);
          if (data.length > 0) {
            return `__CHART_BANDS__${JSON.stringify(data)}__END_CHART__`;
          }
        }
        return '__CHART_BANDS_PLACEHOLDER__';
      })
      .replace(/__CHART_(RADAR|BAR|HIST|GAUGE|BANDS)_PLACEHOLDER__/g, '');

    const lines = processedContent.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];
    let inList = false;
    let listItems: { text: string; level: number }[] = [];
    let listType: 'ul' | 'ol' = 'ul';

    // Flush do callout acumulado
    const flushCallout = () => {
      if (calloutType && calloutContent.length > 0) {
        elements.push(
          <CalloutBlock key={`callout-${currentIndex++}`} type={calloutType}>
            {calloutContent}
          </CalloutBlock>
        );
        calloutContent = [];
        calloutType = null;
      }
    };

    const renderNestedList = (items: { text: string; level: number }[], startIndex: number = 0): { element: React.ReactNode; endIndex: number } => {
      const result: React.ReactNode[] = [];
      let i = startIndex;
      const baseLevel = items[startIndex]?.level ?? 0;

      while (i < items.length) {
        const item = items[i];
        if (item.level < baseLevel) break;

        if (item.level === baseLevel) {
          if (i + 1 < items.length && items[i + 1].level > baseLevel) {
            const nested = renderNestedList(items, i + 1);
            result.push(
              <li key={i} className="text-foreground">
                {renderInlineMarkdown(item.text)}
                {nested.element}
              </li>
            );
            i = nested.endIndex;
          } else {
            result.push(
              <li key={i} className="text-foreground">{renderInlineMarkdown(item.text)}</li>
            );
            i++;
          }
        } else {
          break;
        }
      }

      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      return {
        element: (
          <ListTag className={`pl-5 space-y-1 ${listType === 'ol' ? 'list-decimal' : 'list-disc'}`}>
            {result}
          </ListTag>
        ),
        endIndex: i
      };
    };

    // Renderizar lista como cards horizontais (sumário executivo)
    const renderExecutiveGrid = (items: { text: string; level: number }[]) => {
      return (
        <div key={`exec-grid-${currentIndex++}`} className="my-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm text-foreground">
              {renderInlineMarkdown(item.text)}
            </div>
          ))}
        </div>
      );
    };

    // Renderizar bullets como texto corrido (para seções proibidas)
    const renderAsFlowText = (items: { text: string; level: number }[]) => {
      return items.map((item, i) => (
        <p key={`flow-${currentIndex++}-${i}`} className="text-foreground leading-relaxed my-2">
          {renderInlineMarkdown(item.text)}
        </p>
      ));
    };

    const flushList = () => {
      if (listItems.length > 0) {
        const isSummary = isExecutiveSummary(currentSection);
        const bulletsAllowed = !isGeneralReport || isBulletAllowed(currentSection) || isBulletAllowed(currentSubsection);
        
        if (isGeneralReport && isSummary && listItems.length <= 8) {
          // Sumário executivo: renderizar como grid
          elements.push(renderExecutiveGrid(listItems));
        } else if (isGeneralReport && !bulletsAllowed) {
          // Seção não permite bullets: renderizar como texto corrido
          elements.push(...renderAsFlowText(listItems));
        } else {
          // Renderização normal de lista
          const { element } = renderNestedList(listItems, 0);
          elements.push(
            <div key={`list-${currentIndex++}`} className="my-3">
              {element}
            </div>
          );
        }
        listItems = [];
        inList = false;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const hasHeader = tableRows.length > 1 && tableRows[1]?.every(cell => /^[\-:]+$/.test(cell.trim()));
        const headerRow = hasHeader ? tableRows[0] : null;
        const bodyRows = hasHeader ? tableRows.slice(2) : tableRows;

        elements.push(
          <div key={`table-${currentIndex++}`} className="my-4 w-full">
            <table className="w-full table-fixed border-collapse border border-border rounded-lg text-xs sm:text-sm">
              {headerRow && (
                <thead>
                  <tr className="bg-muted">
                    {headerRow.map((cell, i) => (
                      <th key={i} className="border border-border px-1.5 py-1.5 sm:px-2 sm:py-2 text-left font-semibold text-foreground break-words">
                        {renderInlineMarkdown(cell.trim())}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-border px-1.5 py-1.5 sm:px-2 sm:py-2 text-foreground break-words">
                        {renderInlineMarkdown(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (const line of lines) {
      // Verificar gráficos embutidos
      if (line.includes('__CHART_RADAR__')) {
        flushList();
        flushTable();
        flushCallout();
        const match = line.match(/__CHART_RADAR__(.+?)__END_CHART__/);
        if (match) {
          const data = JSON.parse(match[1]);
          elements.push(
            <div key={`radar-${currentIndex++}`} className="my-6 bg-background border border-border rounded-lg p-4">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={data}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 5]} 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickCount={6}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke={classificationColor}
                    fill={classificationColor}
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          );
        }
        continue;
      }

      if (line.includes('__CHART_BAR__')) {
        flushList();
        flushTable();
        flushCallout();
        const match = line.match(/__CHART_BAR__(.+?)__END_CHART__/);
        if (match) {
          const data = JSON.parse(match[1]) as { name: string; value: number }[];
          
          const isClassificationChart = data.some((d) => 
            d.name.toLowerCase().includes('evolução') || 
            d.name.toLowerCase().includes('atenção') ||
            d.name.toLowerCase().includes('excelência') ||
            d.name.toLowerCase().includes('crítica') ||
            d.name.toLowerCase().includes('risco')
          );
          
          const getBarColor = (name: string, index: number): string => {
            if (!isClassificationChart) return COLORS[index % COLORS.length];
            const lower = name.toLowerCase();
            if (lower.includes('excelência') || lower.includes('excelencia')) return '#22c55e';
            if (lower.includes('alta performance') || lower.includes('alta')) return '#22c55e';
            if (lower.includes('evolução') || lower.includes('evolucao') || lower.includes('constante')) return '#3b82f6';
            if (lower.includes('atenção') || lower.includes('atencao')) return '#f59e0b';
            if (lower.includes('zona crítica') || lower.includes('zona critica') || lower.includes('risco') || lower.includes('crítico') || lower.includes('critico')) return '#ef4444';
            return COLORS[index % COLORS.length];
          };
          
          const yDomain = isClassificationChart ? undefined : [0, 5];
          
          elements.push(
            <div key={`bar-${currentIndex++}`} className="my-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis domain={yDomain} allowDecimals={!isClassificationChart} />
                  <Tooltip 
                    formatter={(value: number) => [
                      isClassificationChart ? `${Math.round(value)}` : value.toFixed(2),
                      isClassificationChart ? 'Quantidade' : 'Score'
                    ]}
                  />
                  <Bar dataKey="value">
                    {data.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(item.name, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }
        continue;
      }

      if (line.includes('__CHART_HIST__')) {
        flushList();
        flushTable();
        flushCallout();
        const match = line.match(/__CHART_HIST__(.+?)__END_CHART__/);
        if (match) {
          const data = JSON.parse(match[1]) as { range: string; count: number; minValue: number; maxValue: number }[];
          
          const getHistColor = (minValue: number): string => {
            if (minValue >= 4) return '#22c55e';
            if (minValue >= 3.5) return '#84cc16';
            if (minValue >= 3) return '#eab308';
            if (minValue >= 2.5) return '#f97316';
            return '#ef4444';
          };
          
          elements.push(
            <div key={`hist-${currentIndex++}`} className="my-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barCategoryGap="5%">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 10 }} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    label={{ value: 'Colaboradores', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} colaborador${value !== 1 ? 'es' : ''}`, 'Quantidade']}
                    labelFormatter={(label) => `Faixa: ${label}`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={getHistColor(item.minValue)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }
        continue;
      }

      if (line.includes('__CHART_GAUGE__')) {
        flushList();
        flushTable();
        flushCallout();
        const match = line.match(/__CHART_GAUGE__(.+?)__END_CHART__/);
        if (match) {
          const { value, label } = JSON.parse(match[1]);
          elements.push(<GaugeChart key={`gauge-${currentIndex++}`} value={value} label={label} />);
        }
        continue;
      }

      if (line.includes('__CHART_BANDS__')) {
        flushList();
        flushTable();
        flushCallout();
        const match = line.match(/__CHART_BANDS__(.+?)__END_CHART__/);
        if (match) {
          const data = JSON.parse(match[1]);
          elements.push(<BandsChart key={`bands-${currentIndex++}`} data={data} />);
        }
        continue;
      }

      // Tabela
      const hasPipeOutsideParentheses = (str: string): boolean => {
        let depth = 0;
        for (const char of str) {
          if (char === '(') depth++;
          else if (char === ')') depth--;
          else if (char === '|' && depth === 0) return true;
        }
        return false;
      };
      const isTableRow = hasPipeOutsideParentheses(line) && !line.startsWith('#');
      if (isTableRow) {
        flushList();
        flushCallout();
        let cells: string[];
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          cells = line.split('|').slice(1, -1);
        } else {
          cells = line.split('|');
        }
        tableRows.push(cells);
        inTable = true;
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Lista não ordenada
      const ulMatch = line.match(/^(\s*)([\-\*])\s+(.*)$/);
      if (ulMatch) {
        flushCallout();
        const indent = ulMatch[1].length;
        const level = Math.floor(indent / 2);
        const text = ulMatch[3];
        
        if (!inList || listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        inList = true;
        listItems.push({ text, level });
        continue;
      }

      // Lista ordenada
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (olMatch) {
        flushCallout();
        const indent = olMatch[1].length;
        const level = Math.floor(indent / 2);
        const text = olMatch[3];
        
        if (!inList || listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        inList = true;
        listItems.push({ text, level });
        continue;
      }

      // Se não é lista, flush
      if (inList) {
        flushList();
      }

      // H2 - Seção principal
      if (line.startsWith('## ')) {
        flushCallout();
        const title = line.slice(3);
        currentSection = title;
        currentSubsection = '';
        inCompactCardSection = isCompactCardSection(title);
        
        // Verificar se é seção de callout
        const newCalloutType = isCalloutSection(title);
        if (isGeneralReport && newCalloutType) {
          calloutType = newCalloutType;
        }
        
        elements.push(
          <h2 key={`h2-${currentIndex++}`} className="text-xl font-bold text-foreground mt-6 mb-3">
            {renderInlineMarkdown(title)}
          </h2>
        );
        continue;
      }

      // H3 - Subseção / âncora
      if (line.startsWith('### ')) {
        flushCallout();
        const title = line.slice(4);
        currentSubsection = title;
        
        // Se estamos em seção de faixas compactas, renderizar como card
        if (isGeneralReport && inCompactCardSection && title.toLowerCase().includes('faixa')) {
          // Próximas linhas serão score e colaboradores - vamos capturar
          elements.push(
            <h3 key={`h3-anchor-${currentIndex++}`} className="text-base font-semibold text-foreground mt-4 mb-1 text-primary/90">
              {renderInlineMarkdown(title)}
            </h3>
          );
        } else {
          // H3 como "anchor header" - menor que H2, sem divisor pesado
          elements.push(
            <h3 key={`h3-${currentIndex++}`} className="text-base font-semibold text-foreground mt-5 mb-2 border-l-2 border-primary/30 pl-3">
              {renderInlineMarkdown(title)}
            </h3>
          );
        }
        continue;
      }

      // Detectar padrões de "30 dias", "60 dias", "90 dias" em Plano de Ação
      // (no markdown às vezes vem como "✦ **30 dias:**" ou com bullets). Aqui removemos marcadores antes de checar.
      const diasCandidate = line
        .trim()
        .replace(/^[-*+]\s+/, '')
        .replace(/^✦\s*/, '')
        .replace(/\*\*/g, '')
        .trim();

      const isPlanoDeAcao = (() => {
        const lower = currentSection.toLowerCase();
        return lower.includes('plano de ação') || lower.includes('plano de acao');
      })();

      const isDiasPattern = /^(\d+)\s*dias\s*:?/i.test(diasCandidate);
      if (isPlanoDeAcao && isDiasPattern) {
        elements.push(
          <h4 key={`dias-header-${currentIndex++}`} className="text-sm font-semibold text-foreground mt-4 mb-2">
            {renderInlineMarkdown(diasCandidate)}
          </h4>
        );
        continue;
      }

      // H1
      if (line.startsWith('# ')) {
        flushCallout();
        currentSection = '';
        currentSubsection = '';
        elements.push(
          <h1 key={`h1-${currentIndex++}`} className="text-2xl font-bold text-foreground mt-6 mb-4">
            {renderInlineMarkdown(line.slice(2))}
          </h1>
        );
        continue;
      }

      // Linha horizontal
      if (/^[\-_\*]{3,}$/.test(line.trim())) {
        flushCallout();
        elements.push(<hr key={`hr-${currentIndex++}`} className="my-4 border-border" />);
        continue;
      }

      // Parágrafo vazio
      if (line.trim() === '') {
        elements.push(<div key={`br-${currentIndex++}`} className="h-2" />);
        continue;
      }

      // Detectar callouts inline: **Destaques**: ou RISCOS : ou **Riscos**: ou Top: ou Bottom:
      if (isGeneralReport) {
        const inlineCalloutMatch = line.match(/^(?:\*\*(Destaques?|Riscos?|Top|Bottom)\*\*\s*:|([A-Z]+)\s*:)\s*(.*)$/i);
        if (inlineCalloutMatch) {
          flushCallout();
          const label = (inlineCalloutMatch[1] || inlineCalloutMatch[2]).toLowerCase();
          const content = inlineCalloutMatch[3];
          
          // Destaques e Top = highlight (verde), Riscos e Bottom = risk (vermelho)
          const isHighlightType = label.includes('destaque') || label.includes('top');
          const type: 'highlight' | 'risk' = isHighlightType ? 'highlight' : 'risk';
          
          elements.push(
            <CalloutBlock key={`inline-callout-${currentIndex++}`} type={type}>
              <p className="leading-relaxed">{renderInlineMarkdown(content)}</p>
            </CalloutBlock>
          );
          continue;
        }
      }

      // Parágrafo normal - verificar se tem tópico semântico
      if (isGeneralReport) {
        const semanticMatch = startsWithSemanticTopic(line);
        if (semanticMatch) {
          // Renderizar com label semântico
          if (calloutType) {
            calloutContent.push(
              <p key={`callout-p-${currentIndex++}`} className="leading-relaxed mb-2">
                <SemanticLabel>{semanticMatch.topic}</SemanticLabel>
                {renderInlineMarkdown(semanticMatch.rest)}
              </p>
            );
          } else {
            elements.push(
              <p key={`p-${currentIndex++}`} className="text-foreground leading-relaxed my-3">
                <SemanticLabel>{semanticMatch.topic}</SemanticLabel>
                {renderInlineMarkdown(semanticMatch.rest)}
              </p>
            );
          }
          continue;
        }
        
        // Se estamos em callout, acumular conteúdo
        if (calloutType) {
          calloutContent.push(
            <p key={`callout-p-${currentIndex++}`} className="leading-relaxed mb-2">
              {renderInlineMarkdown(line)}
            </p>
          );
          continue;
        }
      }

      // Parágrafo normal
      elements.push(
        <p key={`p-${currentIndex++}`} className="text-foreground leading-relaxed my-2">
          {renderInlineMarkdown(line)}
        </p>
      );
    }

    // Flush remaining
    flushList();
    flushTable();
    flushCallout();

    return elements;
  };

  // Processar markdown inline
  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

      const matches = [
        boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
        italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index! } : null,
        codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
        linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index! } : null,
      ].filter((m): m is NonNullable<typeof m> => m !== null);

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const firstMatch = matches.reduce((a, b) => (a.index < b.index ? a : b));

      if (firstMatch.index > 0) {
        parts.push(remaining.slice(0, firstMatch.index));
      }

      switch (firstMatch.type) {
        case 'bold':
          parts.push(
            <strong key={key++} className="font-bold">
              {firstMatch.match[1]}
            </strong>
          );
          break;
        case 'italic':
          parts.push(
            <em key={key++} className="italic">
              {firstMatch.match[1]}
            </em>
          );
          break;
        case 'code':
          parts.push(
            <code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {firstMatch.match[1]}
            </code>
          );
          break;
        case 'link':
          parts.push(
            <a
              key={key++}
              href={firstMatch.match[2]}
              className="text-primary underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {firstMatch.match[1]}
            </a>
          );
          break;
      }

      remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
    }

    return parts.length === 1 ? parts[0] : parts;
  };

  return <div className="space-y-1">{renderContent()}</div>;
};

export default MarkdownRenderer;
