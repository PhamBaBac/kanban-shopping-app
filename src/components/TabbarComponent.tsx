/** @format */

import { Typography } from 'antd';
import React, { ReactNode } from 'react';

interface Props {
	title: string;
	right?: ReactNode;
	level?: 1 | 5 | 2 | 3 | 4 | undefined;
	orentation?: string;
}

const { Title, Text, Paragraph } = Typography;

const TabbarComponent = (props: Props) => {
	const { title, right, level, orentation } = props;

	return (
		<div>
			<div
				className='d-flex align-items-center justify-content-between'
				style={{ width: '100%', marginBottom: 16 }}>
				<div
					className={
						orentation ? orentation : !right ? '' : 'text-center'
					}>
					<Title style={{ fontWeight: 300, margin: 0 }} level={level ?? 2}>
						{title}
					</Title>
				</div>
				{right && (
					<div
						className='d-flex align-items-center'
						style={{ marginLeft: 'auto' }}>
						{right}
					</div>
				)}
			</div>
		</div>
	);
};

export default TabbarComponent;
