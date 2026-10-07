/** @format */

import React from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import type { DocumentContext } from 'next/document';

const MyDocument = () => (
	<Html lang='vi'>
		<Head>
			<meta charSet="utf-8" />
			<meta name="referrer" content="no-referrer" />
			<meta name="theme-color" content="#131118" />
			<meta name="format-detection" content="telephone=no" />
			<link rel="icon" href="/favicon.ico" sizes="any" />
			<link rel="icon" type="image/svg+xml" href="/kanban-logo.svg" />
			<link rel="apple-touch-icon" href="/favicon.ico" />
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			<link
				href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Nunito+Sans:ital,opsz,wght@0,6..12,300..800;1,6..12,300..800&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
				rel="stylesheet"
			/>
		</Head>
		<body data-theme="light">
			<Main />
			<NextScript />
		</body>
	</Html>
);

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
	const cache = createCache();
	const originalRenderPage = ctx.renderPage;
	ctx.renderPage = () =>
		originalRenderPage({
			enhanceApp: (App) => (props) =>
				(
					<StyleProvider cache={cache}>
						<App {...props} />
					</StyleProvider>
				),
		});

	const initialProps = await Document.getInitialProps(ctx);
	const style = extractStyle(cache, true);
	return {
		...initialProps,
		styles: (
			<>
				{initialProps.styles}
				<style dangerouslySetInnerHTML={{ __html: style }} />
			</>
		),
	};
};

export default MyDocument;
