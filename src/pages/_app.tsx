/** @format */

import { store } from "@/redux/store";
import Routers from "@/routers/Routers";
import "@/styles/globals.css";
import { ConfigProvider, theme } from "antd";
import type { AppProps } from "next/app";
import { Provider, useSelector } from "react-redux";
import { themeSelector } from "@/redux/reducers/themeSlice";
import { useEffect } from "react";

const AppWrapper = ({ Component, pageProps }: AppProps) => {
  const { mode } = useSelector(themeSelector);

  useEffect(() => {
    // Set the data-theme attribute on the body tag
    document.body.setAttribute("data-theme", mode);

    // Apply background and text color directly to the body
    if (mode === "dark") {
      document.body.style.backgroundColor = "#141414";
      document.body.style.color = "rgba(255, 255, 255, 0.85)";
    } else {
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#131118";
    }
  }, [mode]);

  return (
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
          fontFamily: "'Nunito Sans', sans-serif",
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
  );
};

export default function App(props: AppProps) {
  return (
    <Provider store={store}>
      <AppWrapper {...props} />
    </Provider>
  );
}
