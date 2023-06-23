import { useTelegramFileUrl } from "@/hooks/useTelegramFileUrl";
import styles from "./TelegramAudio.module.css";
import classNames from "classnames";

export function TelegramAudio({
	autoPlay = false,
	muted = false,
	loop = true,
	className,
	fileId,
}: {
	autoPlay?: boolean;
	muted?: boolean;
	loop?: boolean;
	className?: string;
	fileId: string;
}) {
	const src = useTelegramFileUrl(fileId);

	return (
		<audio
			autoPlay={autoPlay}
			muted={muted}
			loop={loop}
			className={classNames(styles.telegramAudio, className)}
			src={src}
		/>
	);
}
