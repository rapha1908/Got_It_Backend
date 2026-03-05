import { UserEntity } from "@/entities/user.entity";
import { db } from "@/lib/pg/db";
import { ManagerEntity } from "@/entities/manager.entity";

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

  public async findByUserId(user_id: number): Promise<(UserEntity & ManagerEntity) | undefined> {
    const client = await db.clientInstance;
    const result = await client.query(
      "SELECT * FROM users LEFT JOIN managers ON users.id = managers.user_id WHERE users.id = $1",
      [user_id],
    );
    return result.rows[0] || undefined;
  }
}
