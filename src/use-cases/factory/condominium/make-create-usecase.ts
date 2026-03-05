import { CondominiumRepository } from "@/repository/pg/condominium.repository";
import { CreateCondominiumUseCase } from "@/use-cases/create-condominium";

export function makeCreateCondominiumUseCase() {
  const condominiumRepository = new CondominiumRepository();
  const createCondominiumUseCase = new CreateCondominiumUseCase(condominiumRepository);
  return createCondominiumUseCase;
}
