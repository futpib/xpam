import { useTelegramFileUrl } from "@/hooks/useTelegramFileUrl";
import styles from "./TelegramImage.module.css";
import classNames from "classnames";

export function TelegramImage({
	className,
	fileId,
}: {
	className?: string;
	fileId: string;
}) {
	const src = useTelegramFileUrl(fileId);

	return (
		<img
			className={classNames(styles.telegramImage, className)}
			src={src}
		/>
	);
}
