import { env } from "@/env";
import { PrismaUserRepository } from "@/repository/prisma/user.repository";
import { compare } from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

export async function loginController(req: Request, res: Response) {
  const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  });

  const { email, password } = loginBodySchema.parse(req.body);

  const userRepository = new PrismaUserRepository();
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const doesPasswordMatch = await compare(password, user.password);

  if (!doesPasswordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ type: user.type }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: "1d",
  });

  return res.status(200).json({
    message: "Login successful",
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
      },
    },
  });
}
