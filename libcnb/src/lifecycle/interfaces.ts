export type MetadataArray =
  | Array<boolean>
  | Array<Date>
  | Array<Metadata>
  | Array<number>
  | Array<string>

export type MetadataValue =
  | Array<MetadataArray>
  | Date
  | Metadata
  | MetadataArray
  | boolean
  | number
  | string

export interface Metadata {
  [key: string]: MetadataValue
}
