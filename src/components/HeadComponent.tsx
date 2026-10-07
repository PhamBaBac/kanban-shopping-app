/** @format */

import { appInfo } from '@/constants/appInfos';
import Head from 'next/head';
import React from 'react';

interface Props {
	title?: string;
	description?: string;
	keywords?: string;
	image?: string;
	url?: string;
	type?: 'website' | 'article' | 'product';
	noindex?: boolean;
	structuredData?: Record<string, any> | Array<Record<string, any>>;
}

const HeadComponent: React.FC<Props> = ({
	title,
	description,
	keywords,
	image,
	url,
	type = 'website',
	noindex = false,
	structuredData,
}) => {
	const rawTitle = title ? title.trim() : appInfo.title;
	const fullTitle = rawTitle.includes('Kanban') || rawTitle.includes('|')
		? rawTitle
		: `${rawTitle} | ${appInfo.title}`;

	const metaDescription = description ? description.trim() : appInfo.description;
	const metaKeywords = keywords ? keywords.trim() : appInfo.keywords;
	const metaImage = image || appInfo.logo;
	const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : appInfo.siteUrl);

	return (
		<Head>
			{/* Tiêu đề & SEO cơ bản */}
			<title>{fullTitle}</title>
			<meta name="title" content={fullTitle} />
			<meta name="description" content={metaDescription} />
			{metaKeywords && <meta name="keywords" content={metaKeywords} />}
			<meta name="author" content="Kanban Fashion" />

			{/* Robots Indexing */}
			{noindex ? (
				<meta name="robots" content="noindex, nofollow" />
			) : (
				<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
			)}

			{/* Canonical Link */}
			{metaUrl && <link rel="canonical" href={metaUrl} />}

			{/* Open Graph (Facebook, Zalo, LinkedIn) */}
			<meta property="og:type" content={type} />
			<meta property="og:locale" content="vi_VN" />
			<meta property="og:site_name" content={appInfo.siteName} />
			<meta property="og:url" content={metaUrl} />
			<meta property="og:title" content={fullTitle} />
			<meta property="og:description" content={metaDescription} />
			<meta property="og:image" content={metaImage} />
			<meta property="og:image:secure_url" content={metaImage} />
			<meta property="og:image:alt" content={fullTitle} />

			{/* Twitter Card */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={fullTitle} />
			<meta name="twitter:description" content={metaDescription} />
			<meta name="twitter:image" content={metaImage} />

			{/* Dữ liệu có cấu trúc (Schema.org JSON-LD) */}
			{structuredData && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(structuredData),
					}}
				/>
			)}
		</Head>
	);
};

export default HeadComponent;
