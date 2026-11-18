/**
 * Motor Determinístico de Keywords, Sinônimos Técnicos e Métricas ATS
 */

export const TECH_SYNONYM_GROUPS: string[][] = [
  ["typescript", "ts"],
  ["javascript", "js", "ecmascript", "es6", "es6+"],
  ["node.js", "nodejs", "node js"],
  ["react", "reactjs", "react.js"],
  ["next.js", "nextjs", "next js", "next.js app router"],
  ["vue.js", "vuejs", "vue"],
  ["angular", "angularjs"],
  ["postgresql", "postgres", "psql"],
  ["mongodb", "mongo"],
  ["kubernetes", "k8s"],
  ["amazon web services", "aws"],
  ["google cloud platform", "gcp", "google cloud"],
  ["microsoft azure", "azure"],
  ["ci/cd", "cicd", "ci/cd pipelines", "integração contínua", "entrega contínua"],
  ["tailwind css", "tailwindcss", "tailwind"],
  ["rest apis", "rest api", "api rest", "apis restful", "restful"],
  ["graphql", "graph ql"],
  ["docker", "containers", "containerização", "docker compose"],
  ["c#", "csharp", "c sharp"],
  [".net", "dotnet", ".net core", "asp.net"],
  ["c++", "cpp"],
  ["golang", "go"],
  ["python", "py"],
  ["testes automatizados", "automated testing", "unit tests", "testes unitários", "tdd", "jest", "vitest", "cypress", "playwright"],
  ["metodologia ágil", "agile", "scrum", "kanban", "metodologias ágeis"],
  ["microsserviços", "microservices", "arquitetura de microsserviços"],
];

const PLACEHOLDER_REGEX = /\[(?:ex|exemplo|inserir|adicione|preencher|metric|métrica|x%|y%)[^\]]*\]/gi;

const QUANTIFIED_METRIC_REGEX =
  /(?:\b\d+(?:[.,]\d+)?\s*(?:%|(?:x|ms|s|seg|segundos|min|minutos|h|horas|dias|mil|milhões|milhoes|bi|k|m|gb|tb|req\/s|rps|usuários|usuarios|clientes|projetos|endpoints|serviços|servicos|times|pessoas)\b)|\b(?:r\$|us\$|\$|€)\s*\d+)/i;

const STRONG_ACTION_VERBS = [
  // PT-BR
  "arquitetei",
  "implementei",
  "automatizei",
  "otimizei",
  "liderei",
  "reduzi",
  "desenvolvi",
  "escalei",
  "migrei",
  "projetei",
  "estruturei",
  "refatorei",
  "elevei",
  "acelerei",
  "construí",
  "integrei",
  // EN-US
  "architected",
  "implemented",
  "automated",
  "optimized",
  "led",
  "reduced",
  "developed",
  "scaled",
  "migrated",
  "designed",
  "engineered",
  "refactored",
  "increased",
  "accelerated",
  "built",
  "integrated",
];

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Cria regex com fronteira segura para termos técnicos (incluindo C#, C++, .NET, Go, Node.js)
 */
export function buildSkillRegex(term: string): RegExp {
  const norm = normalizeText(term.trim());
  const escaped = escapeRegExp(norm);
  // Fronteira que não faz parte de palavra alfanumérica adjacente
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9+#.])`, "i");
}

/**
 * Retorna sinônimos conhecidos de uma habilidade (excluindo o próprio termo normalizado)
 */
export function getSynonymsForSkill(skill: string): string[] {
  const norm = normalizeText(skill.trim());
  // Também limpa parênteses explicativos, ex: "Testes Automatizados (Jest/Cypress)" -> testa "Testes Automatizados"
  const baseWithoutParens = norm.replace(/\s*\([^)]*\)\s*/g, "").trim();

  const synonyms = new Set<string>();
  if (baseWithoutParens && baseWithoutParens !== norm) {
    synonyms.add(baseWithoutParens);
  }

  for (const group of TECH_SYNONYM_GROUPS) {
    const normalizedGroup = group.map((g) => normalizeText(g));
    if (
      normalizedGroup.includes(norm) ||
      (baseWithoutParens && normalizedGroup.includes(baseWithoutParens))
    ) {
      for (const item of group) {
        if (normalizeText(item) !== norm) {
          synonyms.add(item);
        }
      }
    }
  }

  return Array.from(synonyms);
}

export interface SkillMatchResult {
  matched: boolean;
  matchType: "exact" | "synonym" | "none";
  matchedTerm: string;
  occurrences: number;
}

export function matchSkillInText(skill: string, rawText: string): SkillMatchResult {
  if (!skill.trim() || !rawText.trim()) {
    return { matched: false, matchType: "none", matchedTerm: "", occurrences: 0 };
  }

  const normalizedCorpus = normalizeText(rawText);
  const exactRegex = buildSkillRegex(skill);

  if (exactRegex.test(normalizedCorpus)) {
    const globalRegex = new RegExp(exactRegex.source, "gi");
    const matches = normalizedCorpus.match(globalRegex);
    return {
      matched: true,
      matchType: "exact",
      matchedTerm: skill,
      occurrences: matches ? matches.length : 1,
    };
  }

  // Tenta sinônimos
  const synonyms = getSynonymsForSkill(skill);
  for (const syn of synonyms) {
    const synRegex = buildSkillRegex(syn);
    if (synRegex.test(normalizedCorpus)) {
      const globalRegex = new RegExp(synRegex.source, "gi");
      const matches = normalizedCorpus.match(globalRegex);
      return {
        matched: true,
        matchType: "synonym",
        matchedTerm: syn,
        occurrences: matches ? matches.length : 1,
      };
    }
  }

  return { matched: false, matchType: "none", matchedTerm: "", occurrences: 0 };
}

export function countUnfilledPlaceholders(text: string): number {
  if (!text) return 0;
  const matches = text.match(PLACEHOLDER_REGEX);
  return matches ? matches.length : 0;
}

export function isBulletQuantified(bullet: string): boolean {
  if (!bullet) return false;
  // Remove placeholders não preenchidos antes de testar se há métrica real
  const withoutPlaceholders = bullet.replace(PLACEHOLDER_REGEX, "");
  return QUANTIFIED_METRIC_REGEX.test(withoutPlaceholders);
}

export function hasStrongActionVerb(bullet: string): boolean {
  const norm = normalizeText(bullet.trim());
  return STRONG_ACTION_VERBS.some((verb) => {
    const v = normalizeText(verb);
    return norm.startsWith(v + " ") || norm.includes(" " + v + " ");
  });
}

export function countQuantifiedBullets(bullets: string[]): number {
  return bullets.filter(isBulletQuantified).length;
}

export function detectKeywordStuffing(text: string, skills: string[]): string[] {
  const warnings: string[] = [];
  const words = text.trim().split(/\s+/).length;
  if (words < 20) return warnings;

  for (const skill of skills) {
    const match = matchSkillInText(skill, text);
    if (match.matched && match.occurrences >= 12 && match.occurrences / words > 0.06) {
      warnings.push(
        `Possível keyword stuffing detectado para "${skill}" (${match.occurrences} ocorrências). Algoritmos como Gupy e Greenhouse podem penalizar repetição artificial.`
      );
    }
  }
  return warnings;
}
