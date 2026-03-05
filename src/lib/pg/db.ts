import { env } from "@/env";
import { Pool, PoolClient } from "pg";

const CONFIG = {
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
};

class database {
  private pool: Pool;
  private client: PoolClient | undefined;
  constructor() {
    this.pool = new Pool(CONFIG);
    this.connect();
  }

  async connect(): Promise<void> {
    this.client = await this.pool.connect();
    console.log("Connected to the database");
  }

  get clientInstance(): PoolClient {
    return this.client;
  }
}

export const db = new database();
