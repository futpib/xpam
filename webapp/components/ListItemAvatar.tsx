
import { ReactNode } from 'react';
import styles from './ListItemAvatar.module.css';
import classNames from 'classnames';

export function ListItemAvatar({
	className,
	children,
}: {
	className?: string;
	children?: ReactNode;
}) {
	return (
		<div className={classNames(styles.listItemAvatar, className)}>
			{children}
		</div>
	);
}
