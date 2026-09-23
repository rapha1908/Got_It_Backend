import { ICondominium, ICondominiumOfManager } from "@/entities/models/condominium.interface";

export interface ICondominiumRepository {
  create(condominium: ICondominium): Promise<ICondominium>;
  findAll(): Promise<ICondominium[]>;
  findById(id: number): Promise<ICondominium | null>;
  findByIds(ids: number[]): Promise<ICondominium[]>;
  findByManagerIds(manager_ids: number[]): Promise<ICondominiumOfManager[]>;
}
