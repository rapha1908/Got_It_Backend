import { ManagerEntity } from "@/entities/manager.entity";
import { db } from "@/lib/pg/db";
import { IManagerRepository } from "../manager.repository.interface";
import { UserEntity } from "@/entities/user.entity";

export class ManagerRepository implements IManagerRepository {
  async create(manager: ManagerEntity): Promise<ManagerEntity> {
    const client = await db.clientInstance;
    const result = await client.query(
      "INSERT INTO managers (name, phone, nif, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [manager.name, manager.phone, manager.nif, manager.user_id],
    );
    return result.rows[0];
  }

  async findWithManager(user_id: string): Promise<(UserEntity & ManagerEntity) | undefined> {
    const client = await db.clientInstance;
    const result = await client.query(
      "SELECT * FROM users JOIN managers ON users.id = managers.user_id WHERE users.id = $1",
      [user_id],
    );
    return result.rows[0];
  }
}
