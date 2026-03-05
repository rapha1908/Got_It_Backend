import { UserEntity } from "@/entities/user.entity";
import { db } from "@/lib/pg/db";

export class UserRepository {
  async create({ name, email, password, type }: UserEntity): Promise<UserEntity> {
    const client = await db.clientInstance;
    const result = await client.query(
      "INSERT INTO users (name, email, password, type) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, password, type],
    );
    return result.rows[0];
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    const client = await db.clientInstance;
    const result = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
  }
}
