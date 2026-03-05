import { UserEntity } from "@/entities/user.entity";
import { UserRepository } from "@/repository/user.repository";

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async handle(
    name: string,
    email: string,
    password: string,
    type: string,
  ): Promise<UserEntity | undefined> {
    const user = await this.userRepository.create({ name, email, password, type });
    return user;
  }
}
