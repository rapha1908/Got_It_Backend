import { ICondominium } from "@/entities/models/condominium.interface";
import { db } from "@/lib/pg/db";
import { ICondominiumRepository } from "../condominium.repository.interface";

export class CondominiumRepository implements ICondominiumRepository {
  async create(condominium: ICondominium): Promise<ICondominium> {
    const client = await db.clientInstance;
    await client.query("BEGIN");
    try {
      const condominiumResult = await client.query(
        "INSERT INTO condominiums (name, address, city, state, zip, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          condominium.name,
          condominium.address,
          condominium.city,
          condominium.state,
          condominium.zip,
          condominium.country,
        ],
      );

      const createdCondominium = condominiumResult.rows[0];

      await Promise.all(
        condominium.manager_ids.map((managerId) =>
          client.query(
            "INSERT INTO condominium_managers (condominium_id, manager_id) VALUES ($1, $2)",
            [createdCondominium.id, managerId],
          ),
        ),
      );

      await client.query("COMMIT");

      return {
        ...createdCondominium,
        manager_ids: condominium.manager_ids,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}
