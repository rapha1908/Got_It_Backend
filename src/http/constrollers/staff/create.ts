import { Request, Response } from "express";
import { z } from "zod";
import { IStaff } from "@/entities/models/staff.interface";
import { makeCreateStaffUseCase } from "@/use-cases/factory/staff/make-create-usecase";

export async function createStaffController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    nif: z.string().min(1),
    user_id: z.coerce.number(),
  });

  const { name, phone, nif, user_id } = registerBodySchema.parse(req.body);
  const staff: IStaff = { name, phone, nif, user_id };
  const createStaff = makeCreateStaffUseCase();
  const createdStaff = await createStaff.handle(staff);

  res.status(201).json({ message: "Staff created successfully", data: createdStaff });
}
