'use client';

import { PaginatedResponse } from "@/dtos/paginated-response.dto";
import { SearchResultDTO } from "@/dtos/search-result.dto";
import { useVisibility } from "@/hooks/useVisibility";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ListItem } from "./ListItem";
import { ListItemSearchResultAvatar } from "./ListItemSearchResultAvatar";
import styles from './SearchResults.module.css';

declare global {
	interface Window {
		Telegram?: {
			WebApp?: {
				version?: string;
				switchInlineQuery?: (query: string, choose_chat_types?: string[]) => void;
			};
		};
	}
}

export function SearchResults({
	query,
}: {
	query: string;
}) {
	const {
		ref: afterSearchResultsRef,
		isVisible: isAfterSearchResultsVisible,
	} = useVisibility();

	const {
		data,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery([
		'api',
		'search',
		query,
	], async ({ pageParam: skip = 0 }) => {
		const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&skip=${skip}`);
		const json = await response.json();
		return json as PaginatedResponse<SearchResultDTO>;
	}, {
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.data.length < 10) {
				return undefined;
			}

			return allPages.length * 10;
		},
	});

	useEffect(() => {
		if (!hasNextPage) {
			return;
		}

		if (isAfterSearchResultsVisible) {
			fetchNextPage();
		}
	}, [ isAfterSearchResultsVisible, hasNextPage, fetchNextPage ]);

	const createHandleClick = (result: SearchResultDTO) => () => {
		if (
			result.title
			&& window.Telegram?.WebApp?.version
			&& Number.parseFloat(window.Telegram.WebApp.version) >= 6.7
			&& window.Telegram?.WebApp?.switchInlineQuery
		) {
			window.Telegram.WebApp.switchInlineQuery(result.title);
		} else {
			console.info('Would call window.Telegram.WebApp.switchInlineQuery with %o', result.title);
		}
	};

	return (
		<div>
			{data?.pages.map((page, i) => (
				<div key={i}>
					{page.data.map((result, j) => (
						<ListItem
							key={j}
							onClick={createHandleClick(result)}
						>
							<ListItemSearchResultAvatar
								value={result}
							/>
							{result.title}
						</ListItem>
					))}
				</div>
			))}
			<div
				className={styles.afterSearchResults}
				ref={afterSearchResultsRef}
			/>
		</div>
	)
}
