import Image from 'next/image'
import styles from './page.module.css'
import { SearchForm } from '@/components/SearchForm';

export default function Search({
	searchParams: {
		q: initialQuery = '',
	},
}: {
	searchParams: {
		q?: string;
	};
}) {
	return (
		<>
			<SearchForm
				initialQuery={initialQuery}
			/>
		</>
	);
}
