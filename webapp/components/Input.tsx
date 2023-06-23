'use client';

import styles from "./Input.module.css";

export function Input({
	placeholder,
	value,
	onChange,
}: {
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<input
			className={styles.input}
			type="text"
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}
