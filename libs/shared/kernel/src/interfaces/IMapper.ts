export interface IMapper<Domain, Persistence> {
  toDomain(persistence: Persistence): Domain;
  toPersistence(domain: Domain): Persistence;
}
