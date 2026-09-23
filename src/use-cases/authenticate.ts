import { compare } from "bcryptjs";
import { UserEntity } from "@/entities/user.entity";
import { IUserRepository } from "@/repository/user.repository.interface";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error";

export class AuthenticateUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(email: string, password: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const doesPasswordMatch = await compare(password, user.password);

    if (!doesPasswordMatch) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
