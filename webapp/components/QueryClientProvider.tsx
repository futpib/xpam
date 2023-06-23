"use client";

import { QueryClientProvider as QueryClientProviderBase, QueryClient } from "@tanstack/react-query";
import { ReactNode, useMemo } from "react";

export function QueryClientProvider({
	children,
}: {
	children: ReactNode;
}) {
	const queryClient = useMemo(() => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					refetchOnWindowFocus: false,
					refetchOnMount: false,
					refetchOnReconnect: false,
				},
			},
		});

		return queryClient;
	}, []);

	return (
		<QueryClientProviderBase client={queryClient}>
			{children}
		</QueryClientProviderBase>
	);
}
