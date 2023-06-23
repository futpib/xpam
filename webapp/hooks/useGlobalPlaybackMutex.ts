import { useEffect } from "react";

const pauseCallbacks = new Set<() => void>();

export function useGlobalPlaybackMutext({
	isPlaying,
	handlePause,
}: {
	isPlaying: boolean;
	handlePause: () => void;
}) {
	useEffect(() => {
		if (isPlaying) {
			for (const pauseCallback of pauseCallbacks) {
				pauseCallback();
				pauseCallbacks.delete(pauseCallback);
			}
		}

		pauseCallbacks.add(handlePause);

		return () => {
			pauseCallbacks.delete(handlePause);
		}
	}, [ isPlaying, handlePause ]);
}
