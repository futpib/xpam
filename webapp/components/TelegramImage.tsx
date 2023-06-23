import { useTelegramFileUrl } from "@/hooks/useTelegramFileUrl";
import styles from "./TelegramImage.module.css";
import classNames from "classnames";

export function TelegramImage({
	className,
	fileId,
	onError,
}: {
	className?: string;
	fileId: string;
	onError?: () => void;
}) {
	const src = useTelegramFileUrl(fileId);

	return (
		<img
			className={classNames(styles.telegramImage, className)}
			src={src}
			onError={onError}
		/>
	);
}
