import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

/**
 * Trang callback cũ - tự động chuyển hướng ngay lập tức về trang chủ (/)
 * Logic xử lý mã đăng nhập OAuth đã được chuyển hoàn toàn về chạy ngầm tại trang chủ.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/${search}`);
  }, [router]);

  return null;
}
