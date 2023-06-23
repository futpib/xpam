'use client';

import { useState } from "react";
import { SearchResults } from "./SearchResults";
import { Input } from "./Input";
import styles from "./SearchForm.module.css";

export function SearchForm({
	initialQuery,
}: {
	initialQuery: string;
}) {
	const [query, setQuery] = useState(initialQuery);

	return (
		<form
			className={styles.searchForm}
		>
			<Input
				placeholder="Search"
				value={query}
				onChange={setQuery}
			/>

			<SearchResults
				query={query}
			/>
		</form>
	)
}
