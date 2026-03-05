import { IStaff } from "@/entities/models/staff.interface";
import { db } from "@/lib/pg/db";
import { IStaffRepository } from "../staff.repository.interface";
import { UserEntity } from "@/entities/user.entity";

export class StaffRepository implements IStaffRepository {
  async create(staff: IStaff): Promise<IStaff> {
    const client = await db.clientInstance;
    const result = await client.query(
      "INSERT INTO staff (name, phone, nif, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [staff.name, staff.phone, staff.nif, staff.user_id],
    );
    return result.rows[0];
  }

  async findWithStaff(user_id: number): Promise<(UserEntity & IStaff) | undefined> {
    const client = await db.clientInstance;
    const result = await client.query(
      "SELECT * FROM users JOIN staff ON users.id = staff.user_id WHERE users.id = $1",
      [user_id],
    );
    return result.rows[0];
  }
}
