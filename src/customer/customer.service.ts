import { CustomerRepository } from "./customer.repository";
import { Customer, CreateCustomer } from "./customer.types";

export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  /**
   * Finds a customer by Telegram chat ID.
   */
  async findByTelegramChatId(chatId: number): Promise<Customer | null> {
    return this.customerRepository.findByTelegramChatId(chatId);
  }

  /**
   * Creates a new customer.
   */
  async create(customer: CreateCustomer): Promise<Customer> {
    return this.customerRepository.create(customer);
  }

  /**
   * Finds an existing customer or creates one.
   */
  async findOrCreate(customer: CreateCustomer): Promise<Customer> {
    return this.customerRepository.findOrCreate(customer);
  }
}
