import { Request, Response } from "express";
import { z } from "zod";
import { makeFindStaffUseCase } from "@/use-cases/factory/staff/make-find-usecase";

export async function findStaffController(req: Request, res: Response) {
  const paramsSchema = z.object({
    user_id: z.coerce.number(),
  });

  const { user_id } = paramsSchema.parse(req.params);
  const findWithStaff = makeFindStaffUseCase();
  const user = await findWithStaff.handle(user_id);

  res.status(200).json({ message: "Staff found successfully", data: user });
}
