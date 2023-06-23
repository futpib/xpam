import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as mimeTypes from 'mime-types';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { TelegramBotService } from './telegram-bot.service';

@Controller('/api/v1')
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly telegramBotService: TelegramBotService,
	) {}

	@Get('search')
	async search(
		@Query('q') query: undefined | string,
		@Res() response: Response,
	): Promise<Response> {
		if (typeof query !== 'string') {
			return response.status(400).send();
		}

		const responseData = await this.appService.search(query.trim() || '');

		return (
			response
				.status(200)
				.setHeader('content-type', 'application/json')
				.send(JSON.stringify(responseData, (key, value) => {
					if (typeof value === 'bigint') {
						return value.toString();
					}

					return value;
				}))
		);
	}

	@Get('file')
	async file(
		@Query('id') id: undefined | string,
		@Res() response: Response,
	): Promise<Response> {
		if (typeof id !== 'string') {
			return response.status(400).send();
		}

		const downloadDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'xpam-api-telegram-download-'));

		const downloadedFilePath = await this.telegramBotService.downloadFile(id, downloadDirectory);

		const mimeType = mimeTypes.lookup(downloadedFilePath);

		response.status(200).sendFile(downloadedFilePath, {
			headers: {
				'content-type': mimeType ?? 'application/octet-stream',
			},
		});

		await fs.rm(downloadDirectory, {
			recursive: true,
		});

		return response;
	}
}
