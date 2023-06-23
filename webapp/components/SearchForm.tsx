'use client';

import { useState } from "react";
import { SearchResults } from "./SearchResults";
import { Input } from "./Input";
import styles from "./SearchForm.module.css";
import { Paper } from "./Paper";

export function SearchForm({
	initialQuery,
}: {
	initialQuery: string;
}) {
	const [query, setQuery] = useState(initialQuery);

	return (
		<Paper
			className={styles.searchForm}
		>
			<Input
				autoFocus
				placeholder="Search"
				value={query}
				onChange={setQuery}
			/>

			<SearchResults
				query={query}
			/>
		</Paper>
	)
}
