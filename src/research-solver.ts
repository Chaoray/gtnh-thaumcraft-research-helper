import aspects_data from "./aspects.json";

type ResearchSolution = { path: string[] | null, weight: number };

class ResearchSolver {
    private aspects_data: Record<string, any>;
    private connections: Record<string, string[]>;
    private primal: string[];
    private compound: string[];
    private weights: Record<string, number>;
    private MAX_SEARCH_DEPTH: number;

    constructor() {
        this.aspects_data = {};
        this.connections = {};
        this.primal = [];
        this.compound = [];
        this.weights = {};
        this.MAX_SEARCH_DEPTH = 10;
    }

    public static create(): ResearchSolver{
        const solver = new ResearchSolver();
        solver.initialize();
        return solver;
    }

    public findSolution(start: string, end: string, distance: number): ResearchSolution {
        let min_weight = Infinity;
        let best_path: string[] | null = null;

        if (!this.isValidAspect(start) || !this.isValidAspect(end)) {
            throw new Error('Invalid aspect provided');
        }

        const dfs = (current: string, current_weight: number, target: string, path: string[]): void => {
            if (path.length > this.MAX_SEARCH_DEPTH) {
                return;
            }

            if (current === target && path.length === distance) {
                if (current_weight < min_weight) {
                    min_weight = current_weight;
                    best_path = path;
                }
                return;
            }

            let reachable_aspects: string[] | undefined = this.connections[current];
            if (!reachable_aspects) {
                return
            }

            for (let next of reachable_aspects) {
                let new_weight: number = current_weight + (this.weights[next] || 0);
                if (new_weight >= min_weight) {
                    continue
                }
                dfs(next, new_weight, target, [...path, next])
            }
        };

        dfs(start, 0, end, [start]);
        return { path: best_path, weight: min_weight };
    }

    private initialize(): void {
        this.aspects_data = aspects_data;
        this.initializeAspects();
        this.createValidConnections();
        this.findAspectWeight();
    }

    private initializeAspects(): void {
        this.primal = this.aspects_data.primal;
        this.compound = this.aspects_data.compound;
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
            let composition: string[] = this.aspects_data.combinations[current] || [];

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
        for (let key in this.aspects_data.combinations) {
            for (let value of this.aspects_data.combinations[key]) {
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
