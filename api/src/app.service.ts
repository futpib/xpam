import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from './paginated-response.dto';
import { PrismaService } from './prisma.service';
import { SearchResultDTO } from './search-result.dto';

type ReplyData = {
	text?: string;
	document?: {
		file_name?: string;
	};
	forward_from?: {
		first_name?: string;
	};
	from?: {
		first_name?: string;
	};
};

type MessageData = {
	sticker?: {
		file_id: string;
	};
	photo?: {
		file_id: string;
	}[];
	voice?: {
		file_id: string;
	};
	audio?: {
		file_id: string;
	};
	animation?: {
		file_id: string;
		mime_type: string;
	};
	video?: {
		file_id: string;
	};
	document?: {
		file_id: string;
	};
	text?: string;
};

@Injectable()
export class AppService {
	constructor(private readonly prismaService: PrismaService) {}

	async search(query: string): Promise<PaginatedResponse<SearchResultDTO>> {
		const skip = 0;

		type Row = {
			message_data: MessageData;
			reply_data: ReplyData;
		};

		const data = await this.prismaService.$queryRaw<Row[]>`
			SELECT DISTINCT ON (message.id) message.data AS message_data
				, reply.data AS reply_data
				, ts_rank(vector, query) AS rank
			FROM message JOIN reply ON message.id = reply.reply_to_message_id
				, plainto_tsquery(${query}) query
				, my_to_tsvector(reply.data->>'text') vector
			WHERE query @@ vector OR query = ''
			LIMIT 10
			OFFSET ${skip}
		`;

		return {
			data: data.flatMap((reply) => {
				const replyData = reply.reply_data;
				const messageData = reply.message_data;

				const searchResult: Partial<SearchResultDTO> = {
					title: (
						replyData.text
							|| replyData.document?.file_name
							|| replyData.forward_from?.first_name
							|| replyData.from?.first_name
					),

					message: ((): undefined | SearchResultDTO['message'] => {
						if (messageData.sticker) {
							return {
								type: 'sticker',
								sticker_file_id: messageData.sticker.file_id,
							};
						}

						if (messageData.photo) {
							const photo = messageData.photo[messageData.photo.length - 1];
							return {
								type: 'photo',
								photo_file_id: photo.file_id,
							};
						}

						if (messageData.voice) {
							return {
								type: 'voice',
								audio_file_id: messageData.voice.file_id,
							};
						}

						if (messageData.audio) {
							return {
								type: 'audio',
								audio_file_id: messageData.audio.file_id,
							};
						}

						if (messageData.animation) {
							if (messageData.animation.mime_type === 'video/mp4') {
								return {
									type: 'mpeg4_gif',
									mpeg4_file_id: messageData.animation.file_id,
								};
							}
						}

						if (messageData.video) {
							return {
								type: 'video',
								video_file_id: messageData.video.file_id,
							};
						}

						if (messageData.document) {
							return {
								type: 'document',
								document_file_id: messageData.document.file_id,
							};
						}

						if (messageData.text) {
							return {
								type: 'article',
								input_message_content: {
									message_text: messageData.text,
								},
							};
						}

						return undefined;
					})(),
				};

				if (!searchResult.title || !searchResult.message) {
					return [];
				}

				return [ searchResult as SearchResultDTO ];
			}),
		};
	}
}
