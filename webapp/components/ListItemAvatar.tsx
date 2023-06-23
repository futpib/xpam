
import { ReactNode } from 'react';
import styles from './ListItemAvatar.module.css';
import classNames from 'classnames';

export function ListItemAvatar({
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
			className={classNames(styles.listItemAvatar, className)}
			onClick={onClick}
		>
			{children}
		</div>
	);
}
