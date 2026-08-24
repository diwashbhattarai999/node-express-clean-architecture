export type SortOrder = "asc" | "desc";

export interface Sort<TField extends string = string> {
  field: TField;
  order: SortOrder;
}
