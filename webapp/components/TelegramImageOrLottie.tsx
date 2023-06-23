import { useState } from "react";
import { TelegramLottie } from "./TelegramLottie";
import { TelegramImage } from "./TelegramImage";

export function TelegramImageOrLottie({
	className,
	fileId,
}: {
	className?: string;
	fileId: string;
}) {
	const [ didImageError, setDidImageError ] = useState(false);

	return didImageError ? (
		<TelegramLottie
			className={className}
			fileId={fileId}
		/>
	) : (
		<TelegramImage
			className={className}
			fileId={fileId}
			onError={() => setDidImageError(true)}
		/>
	);
}
