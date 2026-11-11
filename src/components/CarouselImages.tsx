/** @format */

import { SubProductModel } from "@/models/Products";
import React, { useEffect, useRef, useState } from "react";
import {
  BsChevronLeft,
  BsChevronRight,
  BsChevronUp,
  BsChevronDown,
} from "react-icons/bs";
import Image from "next/image";
import { cloudinaryLoader } from "@/utils/imageOptimizer";

export interface CarouselImageItem {
  id?: string;
  imgURL: string;
  title?: string;
  subProduct?: SubProductModel;
}

interface Props {
  items: (SubProductModel | CarouselImageItem)[];
  onClick: (val: any) => void;
  selectedImageUrl?: string;
  orientation?: "vertical" | "horizontal";
  maxHeight?: number | string;
}

const CarouselImages: React.FC<Props> = ({
  items,
  onClick,
  selectedImageUrl,
  orientation = "vertical",
  maxHeight = "clamp(420px, 46vw, 520px)",
}) => {
  const isVertical = orientation === "vertical";
  const [images, setImages] = useState<CarouselImageItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  // Kéo chuột để cuộn (Drag to scroll)
  const isDraggingRef = useRef(false);
  const startCoordRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Tập hợp toàn bộ ảnh trên cùng 1 dãy duy nhất (không phân nhóm gián đoạn)
  useEffect(() => {
    const vals: CarouselImageItem[] = [];
    const seenUrls = new Set<string>();

    items.forEach((item: any) => {
      if (item.imgURL && typeof item.imgURL === "string") {
        if (!seenUrls.has(item.imgURL)) {
          seenUrls.add(item.imgURL);
          vals.push(item);
        }
      } else if (Array.isArray(item.images) && item.images.length > 0) {
        item.images.forEach((img: any) => {
          const url = typeof img === "string" ? img : img?.url;
          if (url && !seenUrls.has(url)) {
            seenUrls.add(url);
            vals.push({
              id: item.id,
              imgURL: url,
              title: item.title,
              subProduct: item,
            });
          }
        });
      }
    });

    setImages(vals);
  }, [items]);

  // Cập nhật trạng thái hiển thị của nút lướt
  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (isVertical) {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setCanScrollStart(scrollTop > 4);
      setCanScrollEnd(scrollTop + clientHeight < scrollHeight - 6);
    } else {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollStart(scrollLeft > 4);
      setCanScrollEnd(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [images, isVertical]);

  // Tự động cuộn container đến ảnh đang được chọn (chỉ cuộn bên trong container, tuyệt đối không cuộn toàn trang window)
  useEffect(() => {
    if (!selectedImageUrl || !scrollRef.current) return;
    const container = scrollRef.current;
    const selectedEl = container.querySelector(
      `[data-img-url="${encodeURIComponent(selectedImageUrl)}"]`
    ) as HTMLElement;

    if (!selectedEl) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = selectedEl.getBoundingClientRect();

    if (isVertical) {
      // Kiểm tra nếu thumbnail đã nằm trọn vẹn trong khung nhìn của container thì không cần cuộn
      const isFullyVisible =
        elementRect.top >= containerRect.top + 4 &&
        elementRect.bottom <= containerRect.bottom - 4;

      if (!isFullyVisible) {
        // Tính toán vị trí cuộn nội bộ chỉ trong container
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = relativeTop - container.clientHeight / 2 + selectedEl.offsetHeight / 2;

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
      }
    } else {
      const isFullyVisible =
        elementRect.left >= containerRect.left + 4 &&
        elementRect.right <= containerRect.right - 4;

      if (!isFullyVisible) {
        const relativeLeft = elementRect.left - containerRect.left + container.scrollLeft;
        const targetScrollLeft = relativeLeft - container.clientWidth / 2 + selectedEl.offsetWidth / 2;

        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: "smooth",
        });
      }
    }
  }, [selectedImageUrl, isVertical]);

  // Nút lướt tới / lùi một đoạn
  const scrollByAmount = (direction: "start" | "end") => {
    if (!scrollRef.current) return;
    const amount = direction === "start" ? -180 : 180;
    if (isVertical) {
      scrollRef.current.scrollBy({ top: amount, behavior: "smooth" });
    } else {
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Lăn chuột dọc chuyển thành cuộn ngang khi ở chế độ horizontal
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (!isVertical) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  // Kéo rê chuột trên Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    if (isVertical) {
      startCoordRef.current = e.pageY - scrollRef.current.offsetTop;
      scrollStartRef.current = scrollRef.current.scrollTop;
    } else {
      startCoordRef.current = e.pageX - scrollRef.current.offsetLeft;
      scrollStartRef.current = scrollRef.current.scrollLeft;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    if (isVertical) {
      const y = e.pageY - scrollRef.current.offsetTop;
      const walk = (y - startCoordRef.current) * 1.4;
      if (Math.abs(walk) > 4) {
        hasDraggedRef.current = true;
      }
      scrollRef.current.scrollTop = scrollStartRef.current - walk;
    } else {
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startCoordRef.current) * 1.4;
      if (Math.abs(walk) > 4) {
        hasDraggedRef.current = true;
      }
      scrollRef.current.scrollLeft = scrollStartRef.current - walk;
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleItemClick = (item: CarouselImageItem) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    onClick(item);
  };

  if (images.length === 0) return null;

  return (
    <div
      style={
        isVertical
          ? {
              position: "relative",
              width: "100%",
              height: maxHeight,
              maxHeight: maxHeight,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }
          : {
              position: "relative",
              width: "100%",
              marginTop: 12,
            }
      }
    >
      {/* Nút lướt đầu (Trái hoặc Lên) */}
      {canScrollStart && (
        <button
          type="button"
          onClick={() => scrollByAmount("start")}
          aria-label={isVertical ? "Xem ảnh phía trên" : "Xem ảnh trước"}
          style={
            isVertical
              ? {
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#131118",
                  transition: "all 0.2s ease",
                }
              : {
                  position: "absolute",
                  left: -8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#131118",
                  transition: "all 0.2s ease",
                }
          }
        >
          {isVertical ? <BsChevronUp size={14} /> : <BsChevronLeft size={16} />}
        </button>
      )}

      {/* Dãy ảnh danh sách thumbnails */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={
          isVertical
            ? {
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflowY: "auto",
                overflowX: "hidden",
                height: "100%",
                maxHeight: "100%",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "4px 2px",
                cursor: isDraggingRef.current ? "grabbing" : "grab",
                userSelect: "none",
              }
            : {
                display: "flex",
                gap: 10,
                overflowX: "auto",
                overflowY: "hidden",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "6px 2px",
                cursor: isDraggingRef.current ? "grabbing" : "grab",
                userSelect: "none",
              }
        }
        className="hide-thumbnail-scrollbar"
      >
        {images.map((item, idx) => {
          const isSelected = selectedImageUrl === item.imgURL;
          return (
            <div
              key={`${item.id || "thumb"}-${idx}`}
              data-img-url={encodeURIComponent(item.imgURL)}
              onClick={() => handleItemClick(item)}
              style={{
                position: "relative",
                width: isVertical ? "100%" : 76,
                aspectRatio: "1 / 1",
                height: isVertical ? "auto" : 76,
                flexShrink: 0,
                cursor: "pointer",
                borderRadius: 10,
                overflow: "hidden",
                border: isSelected
                  ? "2.5px solid #131118"
                  : "1.5px solid #E5E7EB",
                padding: 2,
                transition: "all 0.2s ease",
                backgroundColor: "#FFFFFF",
                boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
            >
              <Image
                src={item.imgURL}
                loader={cloudinaryLoader}
                alt={item.title || `Ảnh sản phẩm ${idx + 1}`}
                draggable={false}
                fill
                sizes="240px"
                quality={90}
                style={{
                  objectFit: "cover",
                  borderRadius: 7,
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Nút lướt cuối (Phải hoặc Xuống) */}
      {canScrollEnd && (
        <button
          type="button"
          onClick={() => scrollByAmount("end")}
          aria-label={isVertical ? "Xem ảnh phía dưới" : "Xem ảnh tiếp theo"}
          style={
            isVertical
              ? {
                  position: "absolute",
                  bottom: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#131118",
                  transition: "all 0.2s ease",
                }
              : {
                  position: "absolute",
                  right: -8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#131118",
                  transition: "all 0.2s ease",
                }
          }
        >
          {isVertical ? <BsChevronDown size={14} /> : <BsChevronRight size={16} />}
        </button>
      )}

      {/* Style ẩn thanh cuộn scrollbar trên Webkit */}
      <style jsx>{`
        .hide-thumbnail-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CarouselImages;
