'use client';

import styles from "./Input.module.css";

export function Input({
	autoFocus,
	placeholder,
	value,
	onChange,
}: {
	autoFocus?: boolean;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<input
			className={styles.input}
			type="text"
			autoFocus={autoFocus}
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}
