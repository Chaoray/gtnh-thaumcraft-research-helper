import { ResearchSolver, type ResearchSolution } from "./research-solver";
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

let previousPath: string[] = [];
function findSolutionsOfResearch() {
  if (!solutionList) return;
  solutionList.innerHTML = "";

  const path = getResearchPath();
  if (path.length <= 1) return;
  
  let i = 0;
  for (i = 0; i < path.length; i++) {

  }
  
  let lastAspect = path[i];
  for (i = i + 1; i < path.length; i++) {
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

function addAspectButtons() {
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
  img.src = getAspectImageUrl(aspect);
  img.title = translations[aspect] || aspect;
  span.appendChild(img);
  return span;
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

// TODO: find new aspects images
// TODO: add a way to save and compare research paths to reduce computation time
// TODO: add reset button
// TODO: better ui design
// TODO: scroll to delete / add aspects
