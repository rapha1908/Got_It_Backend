import { UserEntity } from "@/entities/user.entity";
import { UserRepository } from "@/repository/user.repository";

export class FindUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async handle(email: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findByEmail(email);
    return user;
  }
}
