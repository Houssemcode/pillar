declare const panelStack: {
    stack: string[];
    count(): number;
    add(panelId: string): void;
    remove(panelId: string): void;
    bringToFront(id: string): void;
    isTopmost(id: string): boolean;
    indexOf(id: string): number;
};

export { panelStack };
