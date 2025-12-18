declare module "tarantool-driver" {
  interface TarantoolOptions {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    timeout?: number;
    retryStrategy?: (times: number) => number | null;
  }

  class TarantoolDriver {
    constructor(options?: TarantoolOptions);

    connect(): Promise<void>;
    destroy(): Promise<void>;

    eval(expression: string, args?: unknown[]): Promise<unknown[]>;
    call(functionName: string, ...args: unknown[]): Promise<unknown[]>;

    select(
      spaceId: number,
      indexId: number,
      limit: number,
      offset: number,
      iterator: string,
      key: unknown[]
    ): Promise<unknown[]>;

    insert(spaceId: number, tuple: unknown[]): Promise<unknown[]>;
    replace(spaceId: number, tuple: unknown[]): Promise<unknown[]>;
    update(
      spaceId: number,
      indexId: number,
      key: unknown[],
      operations: unknown[]
    ): Promise<unknown[]>;
    delete(
      spaceId: number,
      indexId: number,
      key: unknown[]
    ): Promise<unknown[]>;

    upsert(
      spaceId: number,
      tuple: unknown[],
      operations: unknown[]
    ): Promise<unknown[]>;
  }

  export = TarantoolDriver;
}
