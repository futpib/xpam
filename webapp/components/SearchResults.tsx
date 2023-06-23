'use client';

import { PaginatedResponse } from "@/dtos/paginated-response.dto";
import { SearchResultDTO } from "@/dtos/search-result.dto";
import { useVisibility } from "@/hooks/useVisibility";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ListItem } from "./ListItem";

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

	return (
		<div>
			{data?.pages.map((page, i) => (
				<div key={i}>
					{page.data.map((result, j) => (
						<ListItem key={j}>
							{result.title}
						</ListItem>
					))}
				</div>
			))}
			<div ref={afterSearchResultsRef} />
		</div>
	)
}
