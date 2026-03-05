import { IStaff } from "./models/staff.interface";

export class StaffEntity implements IStaff {
  id?: number;
  name: string;
  phone: string;
  nif: string;
  user_id?: number;

  constructor(name: string, phone: string, nif: string, user_id: number) {
    this.name = name;
    this.phone = phone;
    this.nif = nif;
    this.user_id = user_id;
  }
}
