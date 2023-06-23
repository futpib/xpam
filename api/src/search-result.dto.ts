
export type SearchResultDTO = {
	title: string;
	message:
		| {
			type: 'sticker';
			sticker_file_id: string;
		}
		| {
			type: 'photo';
			photo_file_id: string;
		}
		| {
			type: 'voice';
			audio_file_id: string;
		}
		| {
			type: 'mpeg4_gif';
			mpeg4_file_id: string;
		}
		| {
			type: 'video';
			video_file_id: string;
		}
		| {
			type: 'audio';
			audio_file_id: string;
		}
		| {
			type: 'document';
			document_file_id: string;
		}
		| {
			type: 'article';
			input_message_content: {
				message_text: string;
			},
		}
	;
};
