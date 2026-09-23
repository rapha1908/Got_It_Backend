import { makeFindCondominiumsUseCase } from "@/use-cases/factory/condominium/make-find-usecase";
import { Request, Response } from "express";

export async function findCondominiumsController(_req: Request, res: Response) {
  const findCondominiums = makeFindCondominiumsUseCase();
  const condominiums = await findCondominiums.handle();

  res.status(200).json({ message: "Condominiums fetched successfully", data: condominiums });
}
