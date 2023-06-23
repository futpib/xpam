
import { ReactNode } from 'react';
import styles from './ListItem.module.css';
import classNames from 'classnames';

export function ListItem({
	className,
	children,
	onClick,
}: {
	className?: string;
	children?: ReactNode;
	onClick?: () => void;
}) {
	return (
		<div
			className={classNames(styles.listItem, className)}
			onClick={onClick}
		>
			{children}
		</div>
	);
}
