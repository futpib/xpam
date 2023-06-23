import { useTelegramFileUrl } from "@/hooks/useTelegramFileUrl";
import styles from "./TelegramLottie.module.css";
import classNames from "classnames";
import LottieReact from "lottie-react";
import { useQuery } from "@tanstack/react-query";

export function TelegramLottie({
	autoPlay = false,
	loop = true,
	className,
	fileId,
}: {
	autoPlay?: boolean;
	loop?: boolean;
	className?: string;
	fileId: string;
}) {
	const src = useTelegramFileUrl(fileId);

	const {
		data: animationData,
	} = useQuery([
		'api',
		'telegram',
		'file',
		fileId,
		'gunzip',
	], async () => {
		const response = await fetch(src);

		const gzipDecompressionStream = new DecompressionStream('gzip');

		if (!response.ok || !response.body) {
			return null;
		}

		const decompressedBodyStream = response.body.pipeThrough(gzipDecompressionStream);

		const decompressedResponse = new Response(decompressedBodyStream);

		const json = await decompressedResponse.json();

		return json;
	});

	return animationData ? (
		<LottieReact
			className={classNames(styles.telegramLottie, className)}
			autoPlay={autoPlay}
			loop={loop}
			animationData={animationData}
		/>
	) : null;
}
