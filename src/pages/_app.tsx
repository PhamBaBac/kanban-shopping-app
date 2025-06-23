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
      document.body.style.color = "rgba(0, 0, 0, 0.88)";
    }
  }, [mode]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#131118",
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
            colorBgContainer: "transparent",
          },
          Tabs: {
            cardBg: "transparent",
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
