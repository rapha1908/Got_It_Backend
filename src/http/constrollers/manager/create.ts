import { ManagerEntity } from "@/entities/manager.entity";
import { ManagerRepository } from "@/repository/manager.respository";
import { CreateManagerUseCase } from "@/use-cases/create-manager";
import { Request, Response } from "express";
import { z } from "zod";

export async function createManagerController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    nif: z.string().min(1),
  });

  const { name, phone, nif } = registerBodySchema.parse(req.body);
  try {
    const managerRepository = new ManagerRepository();
    const createManagerUseCase = new CreateManagerUseCase(managerRepository);
    const createdManager = await createManagerUseCase.create(new ManagerEntity(name, phone, nif));
    res.status(201).json({ message: "Manager created successfully", data: createdManager });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
