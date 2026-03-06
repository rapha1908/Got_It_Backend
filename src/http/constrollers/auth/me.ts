import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { Request, Response } from "express";

export async function meController(_req: Request, res: Response) {
  const userId = Number(res.locals.userId);

  const userRepository = new PrismaUserRepository();
  const user = await userRepository.findByUserId(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { password, ...safeUserData } = user;
  void password;

  return res.status(200).json({
    message: "Authenticated user fetched successfully",
    data: safeUserData,
  });
}
