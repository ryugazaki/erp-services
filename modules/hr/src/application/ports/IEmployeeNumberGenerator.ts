export interface IEmployeeNumberGenerator {
  generate(): Promise<string>;
}
