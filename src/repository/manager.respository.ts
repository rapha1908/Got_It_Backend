import { ManagerEntity } from "@/entities/manager.entity";
import { db } from "@/lib/pg/db";

export class ManagerRepository {
  async create({ name, phone, nif, user_id }: ManagerEntity): Promise<ManagerEntity> {
    const client = await db.clientInstance;
    const result = await client.query(
      "INSERT INTO managers (name, phone, nif, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, phone, nif, user_id],
    );
    return result.rows[0];
  }
}
