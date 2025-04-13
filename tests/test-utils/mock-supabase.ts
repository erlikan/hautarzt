// tests/test-utils/mock-supabase.ts

/**
 * Type for query chain to enable proper typing and self-referencing
 */
interface QueryChain {
    select: (...args: any[]) => QueryChain;
    update: (...args: any[]) => QueryChain;
    insert: (...args: any[]) => QueryChain;
    upsert: (...args: any[]) => QueryChain;
    delete: (...args: any[]) => QueryChain;
    eq: (...args: any[]) => QueryChain;
    neq: (...args: any[]) => QueryChain;
    gt: (...args: any[]) => QueryChain;
    lt: (...args: any[]) => QueryChain;
    gte: (...args: any[]) => QueryChain;
    lte: (...args: any[]) => QueryChain;
    like: (...args: any[]) => QueryChain;
    ilike: (...args: any[]) => QueryChain;
    is: (...args: any[]) => QueryChain;
    in: (...args: any[]) => QueryChain;
    contains: (...args: any[]) => QueryChain;
    containedBy: (...args: any[]) => QueryChain;
    range: (...args: any[]) => QueryChain;
    match: (...args: any[]) => QueryChain;
    not: (...args: any[]) => QueryChain;
    or: (...args: any[]) => QueryChain;
    and: (...args: any[]) => QueryChain;
    filter: (...args: any[]) => QueryChain;
    limit: (...args: any[]) => QueryChain;
    offset: (...args: any[]) => QueryChain;
    order: (...args: any[]) => QueryChain;
    single: () => { data: any; error: any };
    maybeSingle: () => { data: any; error: any };
    execute: () => { data: any; error: any };
    then: (callback: (result: { data: any; error: any }) => any) => Promise<any>;
    [key: string]: any;
}

/**
 * Type for mocking Supabase query methods
 */
type MockQueryMethods = {
    select?: (...args: any[]) => any;
    update?: (...args: any[]) => any;
    eq?: (...args: any[]) => any;
    maybeSingle?: (...args: any[]) => any;
    execute?: (...args: any[]) => any;
    in?: (...args: any[]) => any;
    match?: (...args: any[]) => any;
    limit?: (...args: any[]) => any;
    order?: (...args: any[]) => any;
};

/**
 * Type for mocking Supabase client RPC function
 */
type MockRpcFunction = (funcName: string, params?: any) => { data: any; error: any };

/**
 * Creates a mock Supabase client for testing
 * 
 * @param overrides Optional method overrides for the mock
 * @returns A mock Supabase client object
 */
export function createMockSupabase(overrides: {
    from?: (...args: any[]) => any;
    rpc?: MockRpcFunction;
    auth?: any;
    storage?: any;
    queryMethods?: MockQueryMethods;
} = {}) {
    // Default query chain that returns itself for each method call
    const createDefaultQueryChain = (data: any = null, error: any = null): QueryChain => {
        const queryChain: QueryChain = {
            select: (..._args: any[]): QueryChain => queryChain,
            update: (..._args: any[]): QueryChain => queryChain,
            insert: (..._args: any[]): QueryChain => queryChain,
            upsert: (..._args: any[]): QueryChain => queryChain,
            delete: (..._args: any[]): QueryChain => queryChain,
            eq: (..._args: any[]): QueryChain => queryChain,
            neq: (..._args: any[]): QueryChain => queryChain,
            gt: (..._args: any[]): QueryChain => queryChain,
            lt: (..._args: any[]): QueryChain => queryChain,
            gte: (..._args: any[]): QueryChain => queryChain,
            lte: (..._args: any[]): QueryChain => queryChain,
            like: (..._args: any[]): QueryChain => queryChain,
            ilike: (..._args: any[]): QueryChain => queryChain,
            is: (..._args: any[]): QueryChain => queryChain,
            in: (..._args: any[]): QueryChain => queryChain,
            contains: (..._args: any[]): QueryChain => queryChain,
            containedBy: (..._args: any[]): QueryChain => queryChain,
            range: (..._args: any[]): QueryChain => queryChain,
            match: (..._args: any[]): QueryChain => queryChain,
            not: (..._args: any[]): QueryChain => queryChain,
            or: (..._args: any[]): QueryChain => queryChain,
            and: (..._args: any[]): QueryChain => queryChain,
            filter: (..._args: any[]): QueryChain => queryChain,
            limit: (..._args: any[]): QueryChain => queryChain,
            offset: (..._args: any[]): QueryChain => queryChain,
            order: (..._args: any[]): QueryChain => queryChain,
            single: () => ({ data, error }),
            maybeSingle: () => ({ data, error }),
            execute: () => ({ data, error }),
            then: (callback: (result: { data: any; error: any }) => any) => Promise.resolve(callback({ data, error })),
            ...overrides.queryMethods
        };
        return queryChain;
    };

    // Default mock response
    const defaultResponse = { data: null, error: null };

    // Create the mock Supabase client
    const mockClient = {
        from: (tableName: string) => {
            if (overrides.from) {
                return overrides.from(tableName);
            }
            return createDefaultQueryChain();
        },
        rpc: (funcName: string, params?: any) => {
            if (overrides.rpc) {
                return overrides.rpc(funcName, params);
            }
            return defaultResponse;
        },
        auth: {
            getUser: () => ({ data: { user: null }, error: null }),
            getSession: () => ({ data: { session: null }, error: null }),
            signIn: () => defaultResponse,
            signOut: () => defaultResponse,
            ...overrides.auth
        },
        storage: {
            from: (bucketName: string) => ({
                upload: () => defaultResponse,
                download: () => defaultResponse,
                list: () => defaultResponse,
                remove: () => defaultResponse,
                getPublicUrl: () => ({ data: { publicUrl: '' }, error: null }),
                ...overrides.storage
            })
        }
    };

    return mockClient;
}

// Mock the createClient function from Supabase
export function mockCreateClient() {
    // Return a new mock client each time it's called
    return (url: string, key: string, options?: any) => {
        return createMockSupabase();
    };
} 