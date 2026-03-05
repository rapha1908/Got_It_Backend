import { ICondominium } from "@/entities/models/condominium.interface";

export interface ICondominiumRepository {
  create(condominium: ICondominium): Promise<ICondominium>;
}
