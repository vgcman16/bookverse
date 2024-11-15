declare global {
    function flushPromises(): Promise<void>;

    namespace jest {
        interface Matchers<R> {
            toBeWithinRange(floor: number, ceiling: number): R;
        }
    }
}

export {};
