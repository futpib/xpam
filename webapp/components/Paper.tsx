
import { ReactNode } from 'react';
import styles from './Paper.module.css';
import classNames from 'classnames';

export function Paper({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={classNames(styles.paper, className)}>
			{children}
		</div>
	);
}
