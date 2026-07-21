export interface Customer {
  id: string;
  telegramChatId: number;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  languageCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomer {
  telegramChatId: number;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}
