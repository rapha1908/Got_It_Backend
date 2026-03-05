import { randomUUID } from "node:crypto";
import { IService } from "@/entities/models/service.interface";
import { db } from "@/lib/pg/db";
import { IServiceRepository } from "../service.repository.interface";

export class ServiceRepository implements IServiceRepository {
  async create(service: IService): Promise<IService> {
    const client = await db.clientInstance;
    const serviceId = randomUUID();
    const result = await client.query(
      "INSERT INTO services (id, condominium_id, staff_id, description, start_date, end_date, status, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        serviceId,
        service.condominium_id,
        service.staff_id,
        service.description,
        service.start_date,
        service.end_date,
        service.status,
        service.price,
      ],
    );
    return result.rows[0];
  }
}
