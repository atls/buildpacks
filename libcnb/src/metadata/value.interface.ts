export type CnbMetadataArray =
  | Array<boolean>
  | Array<CnbMetadata>
  | Array<Date>
  | Array<number>
  | Array<string>

export type CnbMetadataValue =
  | Array<CnbMetadataArray>
  | CnbMetadata
  | CnbMetadataArray
  | Date
  | boolean
  | number
  | string

export interface CnbMetadata {
  [key: string]: CnbMetadataValue
}
