export interface EntryNumberGenerator {
  generate(): Promise<string>;
}
