import { useRef, useState } from "react";
import { TelegramAudio } from "./TelegramAudio";
import classNames from "classnames";
import styles from "./TelegramAudioPlayButton.module.css";

export function TelegramAudioPlayButton({
	className,
	fileId,
}: {
	className?: string;
	fileId: string;
}) {
	const telegramAudioRef = useRef<HTMLAudioElement>(null);

	const [isPlaying, setIsPlaying] = useState(false);

	const handleClick = () => {
		if (telegramAudioRef.current) {
			if (telegramAudioRef.current.paused) {
				telegramAudioRef.current.play();
				setIsPlaying(true);
			} else {
				telegramAudioRef.current.pause();
				setIsPlaying(false);
			}
		}
	};

	return (
		<>
			<button
				className={classNames(styles.telegramAudioPlayButton, className)}
				onClick={handleClick}
			>
				{isPlaying ? "⏸" : "▶️"}
			</button>

			<TelegramAudio
				ref={telegramAudioRef}
				fileId={fileId}
			/>
		</>
	);
}
