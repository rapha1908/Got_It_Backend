import { ManagerEntity } from "@/entities/manager.entity";

export class ManagerRepository {
  async create(manager: ManagerEntity): Promise<ManagerEntity> {
    return manager;
  }

  async findAll(): Promise<ManagerEntity[]> {
    return [];
  }

  async findById(id: number): Promise<ManagerEntity | null> {
    return {
      id,
      name: "John Doe",
      phone: "1234567890",
      nif: "1234567890",
      user_id: 1,
    };
  }

  async update(manager: ManagerEntity): Promise<ManagerEntity> {
    return manager;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return;
  }
}
