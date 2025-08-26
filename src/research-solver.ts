import aspectsData from "./aspects.json";

type ResearchSolution = { path: string[] | null, weight: number };
type ResearchProblem = { start: string, end: string, distance: number };

class ResearchSolver {
    private aspectsData: Record<string, any>;
    private connections: Record<string, string[]>;
    private primal: string[];
    private compound: string[];
    private weights: Record<string, number>;
    public preferredAspects: Set<string>;

    constructor() {
        this.aspectsData = {};
        this.connections = {};
        this.primal = [];
        this.compound = [];
        this.weights = {};
        this.preferredAspects = new Set<string>();
    }

    public static create(): ResearchSolver{
        const solver = new ResearchSolver();
        solver.initialize();
        return solver;
    }

    public findSolution(problem: ResearchProblem): ResearchSolution {
        let min_weight = Infinity;
        let best_path: string[] | null = null;

        const { start, end, distance } = problem;

        if (!this.isValidAspect(start) || !this.isValidAspect(end)) {
            throw new Error('Invalid aspect provided');
        }

        const dfs = (current: string, current_weight: number, target: string, path: string[]): void => {
            if (path.length > distance) {
                return;
            }

            if (current === target && path.length === distance) {
                if (current_weight < min_weight) {
                    min_weight = current_weight;
                    best_path = path;
                }
                return;
            }

            let reachableAspects: string[] | undefined = this.connections[current];
            if (!reachableAspects) {
                return
            }

            for (let next of reachableAspects) {
                let new_weight: number = current_weight + (this.getWeight(next) || 0);
                if (new_weight >= min_weight) {
                    continue
                }
                dfs(next, new_weight, target, [...path, next])
            }
        };

        dfs(start, this.getWeight(start), end, [start]);
        return { path: best_path, weight: min_weight };
    }

    private getWeight(aspect: string): number {
        if (this.preferredAspects.has(aspect)) {
            return 0;
        }
        return this.weights[aspect];
    }

    private initialize(): void {
        this.aspectsData = aspectsData;
        this.initializeAspects();
        this.createValidConnections();
        this.findAspectWeight();
    }

    private initializeAspects(): void {
        this.primal = this.aspectsData.primal;
        this.compound = this.aspectsData.compound;
        for (const aspect of [...this.primal, ...this.compound]) {
            this.connections[aspect] = [];
        }
        for (const aspect of this.primal) {
            this.weights[aspect] = 1;
        }
    }

    private findAspectWeight(): void {
        const dfs = (current: string, visited: Set<string>): number => {
            if (current in this.weights) {
                return this.weights[current];
            }

            if (visited.has(current)) {
                return 0;
            }

            let aspect_weight = 0;
            let composition: string[] = this.aspectsData.combinations[current] || [];

            visited.add(current);
            for (let next of composition) {
                aspect_weight += dfs(next, visited);
            }
            visited.delete(current);

            this.weights[current] = aspect_weight;
            return aspect_weight;
        };

        for (let aspect of this.compound) {
            dfs(aspect, new Set());
        }
    }

    private createValidConnections(): void {
        for (let key in this.aspectsData.combinations) {
            for (let value of this.aspectsData.combinations[key]) {
                if (!this.connections[key]) {
                    this.connections[key] = [];
                }
                if (!this.connections[value]) {
                    this.connections[value] = [];
                }
                this.connections[key].push(value);
                this.connections[value].push(key);
            }
        }
    }

    private isValidAspect(aspect: string): boolean {
        return (this.primal.includes(aspect) || this.compound.includes(aspect))
    }
}

export { ResearchSolver };
export type { ResearchSolution };
export type { ResearchProblem };
