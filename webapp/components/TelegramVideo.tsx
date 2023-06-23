import { useTelegramFileUrl } from "@/hooks/useTelegramFileUrl";
import styles from "./TelegramVideo.module.css";
import classNames from "classnames";

export function TelegramVideo({
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
		<video
			autoPlay={autoPlay}
			muted={muted}
			loop={loop}
			className={classNames(styles.telegramVideo, className)}
			src={src}
		/>
	);
}
