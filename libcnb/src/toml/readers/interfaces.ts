export type TomlArray =
  | Array<boolean>
  | Array<Date>
  | Array<number>
  | Array<string>
  | Array<TomlTable>

export type TomlValue = Array<TomlArray> | Date | TomlArray | TomlTable | boolean | number | string

export interface TomlTable {
  [key: string]: TomlValue
}
