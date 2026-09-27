/** @format */

import { store } from "@/redux/store";
import Routers from "@/routers/Routers";
import "@/styles/globals.css";
import "nprogress/nprogress.css";
import NProgress from "nprogress";
import { Router } from "next/router";
import { ConfigProvider, theme } from "antd";
import type { AppProps } from "next/app";
import { Provider, useSelector } from "react-redux";
import { themeSelector } from "@/redux/reducers/themeSlice";
import Head from "next/head";
import { useEffect } from "react";

NProgress.configure({ showSpinner: false, trickleSpeed: 100 });

const AppWrapper = ({ Component, pageProps }: AppProps) => {
  const { mode } = useSelector(themeSelector);

  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleStop);
    Router.events.on("routeChangeError", handleStop);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleStop);
      Router.events.off("routeChangeError", handleStop);
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", mode);

    if (mode === "dark") {
      document.body.style.backgroundColor = "#141414";
      document.body.style.color = "rgba(255, 255, 255, 0.85)";
    } else {
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#131118";
    }
  }, [mode]);

  return (
    <>
      <Head>
        <style>{`
          #nprogress .bar {
            background: ${mode === "dark" ? "#10B981" : "#131118"} !important;
            height: 3px !important;
            z-index: 999999 !important;
          }
          #nprogress .peg {
            box-shadow: 0 0 10px ${mode === "dark" ? "#10B981" : "#131118"}, 0 0 5px ${mode === "dark" ? "#10B981" : "#131118"} !important;
          }
        `}</style>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#131118",
          colorInfo: "#131118",
          colorSuccess: "#10B981",
          colorWarning: "#F59E0B",
          colorError: "#DC2626",
          colorLink: "#131118",
          colorLinkHover: "#383E49",
          fontFamily: "'Plus Jakarta Sans', 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
        },
        algorithm:
          mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        components: {
          Layout: {
            bodyBg: "transparent",
            footerBg: "transparent",
            siderBg: "transparent",
          },
          Card: {
            colorBgContainer: mode === "dark" ? "#1d1d1d" : "#FFFFFF",
            colorBorderSecondary: mode === "dark" ? "#303030" : "#E5E7EB",
            borderRadiusLG: 12,
          },
          Button: {
            colorPrimary: "#131118",
            colorPrimaryHover: "#27272A",
            colorPrimaryActive: "#000000",
            borderRadius: 8,
            controlHeightLG: 44,
          },
          Input: {
            colorPrimary: "#131118",
            colorPrimaryHover: "#131118",
            borderRadius: 8,
            controlHeight: 40,
            controlHeightLG: 44,
          },
          Tabs: {
            cardBg: "transparent",
            colorPrimary: "#131118",
            itemSelectedColor: "#131118",
            itemHoverColor: "#383E49",
          },
          Switch: {
            colorPrimary: "#131118",
            colorPrimaryHover: "#27272A",
          },
          Badge: {
            colorError: "#DC2626",
          },
          Checkbox: {
            colorPrimary: "#131118",
          },
          Pagination: {
            colorPrimary: "#131118",
          },
        },
      }}
    >
      <Routers Component={Component} pageProps={pageProps} />
    </ConfigProvider>
    </>
  );
};

export default function App(props: AppProps) {
  return (
    <Provider store={store}>
      <AppWrapper {...props} />
    </Provider>
  );
}
