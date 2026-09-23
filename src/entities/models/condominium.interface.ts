export interface ICondominium {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  manager_ids: number[];
}

export interface ICondominiumOfManager extends ICondominium {
  manager_id: number;
}
