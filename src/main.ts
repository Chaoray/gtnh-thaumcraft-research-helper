import { ResearchSolver, type ResearchSolution, type ResearchProblem } from "./research-solver";
import aspects_data from "./aspects.json";
import translations_data from "./translations.json";

const $ = (q: string, p: Element = document.body) => p.querySelector(q);
const $$ = (q: string, p: Element = document.body) => p.querySelectorAll(q);

const solver = ResearchSolver.create();
const translations = fetchTranslations();
const aspects = fetchAspects();

addAspectButtons();

const nodeList = $("#node-list");
const solutionList = $("#solution-list");

if (nodeList) {
  const observer = new MutationObserver(findSolutionsOfResearch);
  observer.observe(nodeList, { childList: true });
}

$("#reset")?.addEventListener("click", () => {
  if (!nodeList || !solutionList) return;
  nodeList.innerHTML = "";
  solutionList.innerHTML = "";
});

function generateSolutionNodes(solutions: ResearchSolution[]) {
  if (!solutionList) return;
  solutionList.innerHTML = "";

  for (const solution of solutions) {
    const p = document.createElement("p");

    if (!solution.path || solution.path.length === 0) {
      p.textContent = "No solution found";
      solutionList.appendChild(p);
      continue;
    }

    const span = document.createElement("span");
    span.className = "solution-path";
    const path = solution.path;
    path.forEach((aspect, idx) => {
      const aspectElement = createAspectElement(aspect);
      aspectElement.className = "solution-aspect";
      span.appendChild(aspectElement);
      if (idx < path.length - 1) {
        span.append(" → ");
      }
    });

    p.appendChild(span);
    p.append(` (${solution.weight})`);
    solutionList.appendChild(p);
  }
}

function findSolutionsOfResearch() {
  if (!solutionList) return;

  const path = getResearchPath();
  if (path.length <= 1) return;

  let lastAspect = path[0];
  let problems: ResearchProblem[] = [];
  for (let i = 1; i < path.length; i++) {
    let j = i;
    while (path[i] === "hex") i++;
    if (i >= path.length) break;
    const distance = i - j + 2;
    const currentAspect = path[i];
    problems.push({ start: lastAspect, end: currentAspect, distance });
    lastAspect = currentAspect;
  }

  let solutions: ResearchSolution[] = [];
  for (const problem of problems) {
    const solution = solver.findSolution(problem);
    solutions.push(solution);
  }

  generateSolutionNodes(solutions);
}

function getResearchPath(): string[] {
  if (!nodeList) return [];
  const nodes = $$("span.node", nodeList);
  const path: string[] = [];
  for (const node of nodes) {
    if (node instanceof HTMLSpanElement && node.dataset.aspect) {
      path.push(node.dataset.aspect);
    }
  }
  return path;
}

function addResearchNode(aspect: string) {
  if (!nodeList) return;
  const node = createAspectElement(aspect);
  node.className = "node";
  node.onclick = () => {
    node.remove();
    findSolutionsOfResearch();
  };
  nodeList.appendChild(node);
}

function addAspectButtons() {
  const container = $("#aspect-buttons");
  if (!container) return;

  container.appendChild(createAspectButton("hex", () => addResearchNode("hex")));

  for (const aspect of aspects) {
    container.appendChild(
      createAspectButton(aspect, () => addResearchNode(aspect))
    );
  }
}

function createAspectButton(aspect: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "aspect-button";
  button.id = aspect;
  const element = createAspectElement(aspect);
  button.appendChild(element);

  button.onclick = onClick;

  const showTooltip = () => {
    let tooltip = $("#tooltip") as HTMLDivElement | null;
    if (!tooltip) return;
    tooltip.style.display = "block";

    let tooltipAspectName = $("#tooltip > #aspect-name") as HTMLSpanElement | null;
    if (!tooltipAspectName) return;
    tooltipAspectName.textContent = capitalizeFirstLetter(aspect);

    let tooltipTranslations = $("#tooltip > #translations") as HTMLSpanElement | null;
    if (!tooltipTranslations) return;
    tooltipTranslations.textContent = translations[aspect] || aspect;

    let tooltipRecipe = $("#tooltip > #recipe") as HTMLSpanElement | null;
    if (!tooltipRecipe) return;
    tooltipRecipe.innerHTML = "";
    const recipeElements = getAspectRecipeElements(aspect);
    recipeElements.forEach(element => tooltipRecipe.appendChild(element));
  };

  const updateTooltipPosition = (e: MouseEvent) => {
    let tooltip = $("#tooltip") as HTMLDivElement | null;
    if (!tooltip) return;

    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    tooltip.style.left = `${e.clientX + scrollLeft}px`;
    tooltip.style.top = `${e.clientY + scrollTop}px`;
  };

  const hideTooltip = () => {
    let tooltip = $("#tooltip") as HTMLDivElement | null;
    if (!tooltip) return;
    tooltip.style.display = "none";
  };

  button.addEventListener('mouseenter', showTooltip);
  button.addEventListener('mousemove', updateTooltipPosition);
  button.addEventListener('mouseleave', hideTooltip);

  return button;
}

function createAspectElement(aspect: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "aspect";
  span.dataset.aspect = aspect;

  const img = document.createElement("img");
  img.src = getAspectImageUrl(aspect);

  span.appendChild(img);

  return span;
}

function getAspectRecipeElements(aspect: string) {
  const combination = aspects_data["combinations"] as unknown as Record<string, string[]>;
  const recipeElements: HTMLElement[] = [];

  if (combination[aspect]) {
    for (const material of combination[aspect]) {
      recipeElements.push(createAspectElement(material));
    }
  }

  return recipeElements;
}

function fetchTranslations(): Record<string, string> {
  const translationsOfAspects = translations_data as unknown as Record<string, string | string[]>;
  for (const aspect in translationsOfAspects) {
    let translations = translationsOfAspects[aspect] as string[];
    if (Array.isArray(translations)) {
      translations = translations.map(str =>
        str.split(" ").map(word => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(" ")
      );
      translationsOfAspects[aspect] = translations.join(", ");
    }
  }
  return translationsOfAspects as Record<string, string>;
}

function fetchAspects(): string[] {
  type AspectsData = { primal: string[]; compound: string[] };
  const aspects = aspects_data as AspectsData;
  if (Array.isArray(aspects.primal) && Array.isArray(aspects.compound)) {
    return [...aspects.primal, ...aspects.compound];
  }
  throw new Error("Invalid aspects data format");
}

function getAspectImageUrl(aspect: string): string {
  return `${import.meta.env.BASE_URL}aspects/${aspect}.png`;
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// TODO: better ui design
// TODO: scroll to delete / add aspects
