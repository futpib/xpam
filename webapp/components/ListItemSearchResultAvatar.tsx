'use client';

import { SearchResultDTO } from '@/dtos/search-result.dto';
import { ListItemAvatar } from './ListItemAvatar';
import styles from './ListItemSearchResultAvatar.module.css';
import { useMemo } from 'react';
import { TelegramVideo } from './TelegramVideo';
import { TelegramImageOrLottie } from './TelegramImageOrLottie';
import { TelegramAudioPlayButton } from './TelegramAudioPlayButton';

export function ListItemSearchResultAvatar({
	value,
}: {
	value: SearchResultDTO;
}) {
	const imageFileId = useMemo(() => {
		if (value.message?.type === 'sticker') {
			return value.message.sticker_file_id;
		}

		if (value.message?.type === 'photo') {
			return value.message.photo_file_id;
		}

		return undefined;
	}, [value.message]);

	const audioFileId = useMemo(() => {
		if (value.message?.type === 'voice') {
			return value.message.audio_file_id;
		}

		if (value.message?.type === 'audio') {
			return value.message.audio_file_id;
		}

		return undefined;
	}, [value.message]);

	const videoFileId = useMemo(() => {
		if (value.message?.type === 'video') {
			return value.message.video_file_id;
		}

		if (value.message?.type === 'mpeg4_gif') {
			return value.message.mpeg4_file_id;
		}

		return undefined;
	}, [value.message]);

	return (
		<ListItemAvatar>
			{imageFileId ? (
				<TelegramImageOrLottie
					className={styles.listItemSearchResultAvatarTelegramImage}
					fileId={imageFileId}
				/>
			) : audioFileId ? (
				<TelegramAudioPlayButton
					className={styles.listItemSearchResultAvatarTelegramAudio}
					fileId={audioFileId}
				/>
			) : videoFileId ? (
				<TelegramVideo
					autoPlay
					muted
					className={styles.listItemSearchResultAvatarTelegramVideo}
					fileId={videoFileId}
				/>
			) : null}
		</ListItemAvatar>
	);
}
