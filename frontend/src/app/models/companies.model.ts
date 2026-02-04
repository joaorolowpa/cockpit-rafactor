export interface Analyst {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  display_name: string;
  capital_iq_id: number;
  analysts: Analyst[];
  created_at: string;
  created_by: number;
}
