
import { ReactNode } from 'react';
import styles from './ListItem.module.css';
import classNames from 'classnames';

export function ListItem({
	className,
	children,
}: {
	className?: string;
	children?: ReactNode;
}) {
	return (
		<div className={classNames(styles.listItem, className)}>
			{children}
		</div>
	);
}
