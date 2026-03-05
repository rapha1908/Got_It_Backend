import { IService } from "./models/service.interface";

export class ServiceEntity implements IService {
  id?: string;
  condominium_id: number;
  staff_id: number;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  price: number;

  constructor(
    condominium_id: number,
    staff_id: number,
    description: string,
    start_date: string,
    end_date: string,
    status: string,
    price: number,
  ) {
    this.condominium_id = condominium_id;
    this.staff_id = staff_id;
    this.description = description;
    this.start_date = start_date;
    this.end_date = end_date;
    this.status = status;
    this.price = price;
  }
}
