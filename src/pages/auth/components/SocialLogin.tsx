"use client";

import { Button } from "antd";
import { useState } from "react";

interface Props {
  provider: "google" | "github";
}

const SocialLogin = ({ provider }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    const redirectUrl =
      provider === "google"
        ? "http://localhost:8080/oauth2/authorization/google"
        : "http://localhost:8080/oauth2/authorization/github";
    window.location.href = redirectUrl;
  };

  const getIcon = () => {
    return provider === "google" ? (
      <img
        width={24}
        height={24}
        src="https://img.icons8.com/color/48/google-logo.png"
        alt="google-logo"
      />
    ) : (
      <img
        width={24}
        height={24}
        src="https://img.icons8.com/ios-filled/50/github.png"
        alt="github-logo"
      />
    );
  };

  const getLabel = () =>
    provider === "google" ? "Login with Google" : "Login with GitHub";

  return (
    <Button
      loading={isLoading}
      onClick={handleLogin}
      style={{ width: "100%" }}
      size="large"
      icon={getIcon()}
    >
      {getLabel()}
    </Button>
  );
};

export default SocialLogin;
