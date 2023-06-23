import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramBotService extends TelegramBot implements OnModuleInit, OnModuleDestroy {
	constructor(
		private readonly configService: ConfigService,
	) {
		super(
			configService.get('TELEGRAM_BOT_TOKEN') ?? '',
			{
				polling: {
					autoStart: false,
				},
			},
		);
	}

	async onModuleInit() {
		// await this.startPolling();
	}

	async onModuleDestroy() {
		// await this.stopPolling();
	}
}
