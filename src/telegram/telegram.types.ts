export interface TelegramUpdate {
  update_id: number;

  message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;

  text?: string;

  chat: TelegramChat;

  from?: TelegramUser;
}

export interface TelegramChat {
  //   id: number;
  id: any;
}

export interface TelegramUser {
  id: number;

  username?: string | undefined;

  first_name?: string | undefined;

  last_name?: string | undefined;
}
