/** @format */

import React from 'react';
import HeadComponent from "@/components/HeadComponent";

const SearchPage = () => {
	return (
		<>
			<HeadComponent title="Tìm Kiếm Sản Phẩm | Kanban Fashion" noindex={true} />
			<div className="container py-4 text-center">
				<h2>Tìm kiếm sản phẩm</h2>
			</div>
		</>
	);
};

export default SearchPage;
