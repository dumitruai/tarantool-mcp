import TarantoolDriver from "tarantool-driver";

export interface TarantoolConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export class TarantoolConnection {
  private connection: TarantoolDriver | null = null;
  private config: TarantoolConfig | null = null;
  private connecting: Promise<void> | null = null;

  setConfig(config: TarantoolConfig): void {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (!this.config) {
      throw new Error("Tarantool configuration not set");
    }

    // Already connected
    if (this.connection) {
      return;
    }

    // Connection in progress, wait for it
    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = this.doConnect();
    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  private async doConnect(): Promise<void> {
    if (!this.config) {
      throw new Error("Tarantool configuration not set");
    }

    this.connection = new TarantoolDriver({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      lazyConnect: true,
    });

    await this.connection.connect();
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.destroy();
      this.connection = null;
    }
  }

  private async ensureConnected(): Promise<TarantoolDriver> {
    if (!this.connection) {
      await this.connect();
    }
    return this.connection!;
  }

  async eval(code: string, args: unknown[] = []): Promise<unknown> {
    const conn = await this.ensureConnected();
    return conn.eval(code, args);
  }

  async call(func: string, args: unknown[] = []): Promise<unknown> {
    const conn = await this.ensureConnected();
    return conn.call(func, ...args);
  }

  async select(
    space: string | number,
    key?: unknown[],
    index?: string | number,
    limit?: number,
    offset?: number
  ): Promise<unknown> {
    const conn = await this.ensureConnected();
    const spaceId = await this.resolveSpace(space);
    const indexId = index !== undefined ? await this.resolveIndex(spaceId, index) : 0;

    return conn.select(spaceId, indexId, limit ?? 100, offset ?? 0, "eq", key ?? []);
  }

  async insert(space: string | number, tuple: unknown[]): Promise<unknown> {
    const conn = await this.ensureConnected();
    const spaceId = await this.resolveSpace(space);
    return conn.insert(spaceId, tuple);
  }

  async replace(space: string | number, tuple: unknown[]): Promise<unknown> {
    const conn = await this.ensureConnected();
    const spaceId = await this.resolveSpace(space);
    return conn.replace(spaceId, tuple);
  }

  async update(
    space: string | number,
    key: unknown[],
    operations: unknown[]
  ): Promise<unknown> {
    const conn = await this.ensureConnected();
    const spaceId = await this.resolveSpace(space);
    return conn.update(spaceId, 0, key, operations);
  }

  async delete(space: string | number, key: unknown[]): Promise<unknown> {
    const conn = await this.ensureConnected();
    const spaceId = await this.resolveSpace(space);
    return conn.delete(spaceId, 0, key);
  }

  async listSpaces(): Promise<{ name: string; id: number }[]> {
    const result = await this.eval(`
      local spaces = {}
      for name, space in pairs(box.space) do
        if type(name) == 'string' and not name:match('^_') then
          table.insert(spaces, { name = name, id = space.id })
        end
      end
      return spaces
    `);

    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0] as { name: string; id: number }[];
    }
    return [];
  }

  private async resolveSpace(space: string | number): Promise<number> {
    if (typeof space === "number") {
      return space;
    }

    const result = await this.eval(`return box.space['${space}'] and box.space['${space}'].id`);
    if (Array.isArray(result) && result[0]) {
      return result[0] as number;
    }
    throw new Error(`Space '${space}' not found`);
  }

  private async resolveIndex(
    spaceId: number,
    index: string | number
  ): Promise<number> {
    if (typeof index === "number") {
      return index;
    }

    const result = await this.eval(
      `return box.space[${spaceId}].index['${index}'] and box.space[${spaceId}].index['${index}'].id`
    );
    if (Array.isArray(result) && result[0] !== undefined) {
      return result[0] as number;
    }
    throw new Error(`Index '${index}' not found in space ${spaceId}`);
  }
}
