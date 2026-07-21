import { DoctorRepository } from "./doctor.repository";

export async function testDoctorRepository() {
  const repository = new DoctorRepository();

  const doctors = await repository.findAll();

  console.table(doctors);
}
