import { useTelegramFileUrl } from "@/hooks/useTelegramFileUrl";
import styles from "./TelegramAudio.module.css";
import classNames from "classnames";
import { Ref, forwardRef } from "react";

export const TelegramAudio = forwardRef(function TelegramAudio(
	{
		autoPlay = false,
		loop = true,
		className,
		fileId,
	}: {
		autoPlay?: boolean;
		loop?: boolean;
		className?: string;
		fileId: string;
	},
	forwardedRef: Ref<HTMLAudioElement>,
) {
	const src = useTelegramFileUrl(fileId);

	return (
		<audio
			ref={forwardedRef}
			autoPlay={autoPlay}
			loop={loop}
			className={classNames(styles.telegramAudio, className)}
			src={src}
		/>
	);
});
