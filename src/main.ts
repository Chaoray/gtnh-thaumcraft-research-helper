import { ResearchSolver, type ResearchSolution } from "./research-solver";

const $ = (q: string, p: Element = document.body) => p.querySelector(q);
const $$ = (q: string, p: Element = document.body) => p.querySelectorAll(q);

const solver = await ResearchSolver.create();
const translations = await fetchTranslations();
const aspects = await fetchAspects();

addAspectButtons(aspects);

const nodeList = $("#node-list");
const solutionList = $("#solution-list");

if (nodeList) {
  const observer = new MutationObserver(findSolutionsOfResearch);
  observer.observe(nodeList, { childList: true });
}

function generateSolutionNodes(solution: ResearchSolution) {
  if (!solutionList) return;

  const p = document.createElement("p");

  if (!solution.path || solution.path.length === 0) {
    p.textContent = "No solution found";
    solutionList.appendChild(p);
    return;
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

function findSolutionsOfResearch() {
  if (!solutionList) return;
  solutionList.innerHTML = "";

  const path = getResearchPath();
  if (path.length <= 1) return;

  let lastAspect = path[0];
  for (let i = 1; i < path.length; i++) {
    let j = i;
    while (path[i] === "hex") i++;
    if (i >= path.length) break;
    const distance = i - j + 2;
    const currentAspect = path[i];
    const solution = solver.findSolution(lastAspect, currentAspect, distance);
    generateSolutionNodes(solution);
    lastAspect = currentAspect;
  }
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
  node.onclick = () => node.remove();
  nodeList.appendChild(node);
}

function addAspectButtons(aspects: string[]) {
  const container = $("#aspect-buttons");
  if (!container) return;

  container.appendChild(createAspectButton("hex", "Empty Hex", () => addResearchNode("hex")));

  for (const aspect of aspects) {
    container.appendChild(
      createAspectButton(aspect, translations[aspect] || aspect, () => addResearchNode(aspect))
    );
  }
}

function createAspectButton(aspect: string, title: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "aspect-button";
  button.id = aspect;
  button.title = title;
  const element = createAspectElement(aspect);
  button.appendChild(element);
  button.onclick = onClick;
  return button;
}

function createAspectElement(aspect: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "aspect";
  span.dataset.aspect = aspect;
  const img = document.createElement("img");
  img.src = `/aspects/${aspect}.png`;
  img.title = translations[aspect] || aspect;
  span.appendChild(img);
  return span;
}

async function fetchTranslations(): Promise<Record<string, string>> {
  const response = await fetch("/translations.json");
  if (!response.ok) throw new Error("Failed to fetch translations");
  const translationsOfAspects = await response.json() as Record<string, string | string[]>;

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

async function fetchAspects(): Promise<string[]> {
  const response = await fetch("/aspects.json");
  if (!response.ok) throw new Error("Failed to fetch aspects");
  type AspectsData = { primal: string[]; compound: string[] };
  const aspects = await response.json() as AspectsData;
  if (Array.isArray(aspects.primal) && Array.isArray(aspects.compound)) {
    return [...aspects.primal, ...aspects.compound];
  }
  throw new Error("Invalid aspects data format");
}
