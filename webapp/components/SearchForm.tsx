'use client';

import { useState } from "react";
import { SearchResults } from "./SearchResults";

export function SearchForm({
	initialQuery,
}: {
	initialQuery: string;
}) {
	const [query, setQuery] = useState(initialQuery);

	return (
		<form>
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>

			<SearchResults
				query={query}
			/>
		</form>
	)
}
