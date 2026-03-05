import { ICondominium } from "@/entities/models/condominium.interface";
import { db } from "@/lib/pg/db";
import { ICondominiumRepository } from "../condominium.repository.interface";

export class CondominiumRepository implements ICondominiumRepository {
  async create(condominium: ICondominium): Promise<ICondominium> {
    const client = await db.clientInstance;
    const result = await client.query(
      "INSERT INTO condominiums (name, address, city, state, zip, country, manager_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        condominium.name,
        condominium.address,
        condominium.city,
        condominium.state,
        condominium.zip,
        condominium.country,
        condominium.manager_id,
      ],
    );
    return result.rows[0];
  }
}
