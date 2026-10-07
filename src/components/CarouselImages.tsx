/** @format */

import { SubProductModel } from "@/models/Products";
import React, { useEffect, useRef, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

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
}

const CarouselImages: React.FC<Props> = ({ items, onClick, selectedImageUrl }) => {
  const [images, setImages] = useState<CarouselImageItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Kéo chuột để cuộn trên máy tính (Drag to scroll)
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Tập hợp toàn bộ ảnh trên cùng 1 hàng duy nhất (không phân nhóm gián đoạn)
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

  // Cập nhật trạng thái hiển thị của nút lướt trái/phải
  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
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
  }, [images]);

  // Tự động cuộn đến ảnh đang được chọn
  useEffect(() => {
    if (!selectedImageUrl || !scrollRef.current) return;
    const selectedEl = scrollRef.current.querySelector(
      `[data-img-url="${encodeURIComponent(selectedImageUrl)}"]`
    ) as HTMLElement;

    if (selectedEl) {
      selectedEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedImageUrl]);

  // Nút lướt tới / lùi một đoạn
  const scrollByAmount = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -220 : 220;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Lăn chuột dọc chuyển thành cuộn ngang
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Kéo rê chuột trên Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
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
    <div style={{ position: "relative", width: "100%", marginTop: 12 }}>
      {/* Nút lướt sang trái */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          aria-label="Xem ảnh trước"
          style={{
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
          }}
        >
          <BsChevronLeft size={16} />
        </button>
      )}

      {/* Dãy ảnh cùng 1 hàng duy nhất, lướt ngang mượt mà */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
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
        }}
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
                flexShrink: 0,
                cursor: "pointer",
                borderRadius: 10,
                overflow: "hidden",
                border: isSelected ? "2.5px solid #131118" : "1.5px solid #E5E7EB",
                padding: 2,
                transition: "all 0.2s ease",
                backgroundColor: "#FFFFFF",
                boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
            >
              <img
                src={item.imgURL}
                alt={item.title || `Ảnh sản phẩm ${idx + 1}`}
                draggable={false}
                style={{
                  width: "clamp(60px, 14vw, 76px)",
                  height: "clamp(60px, 14vw, 76px)",
                  objectFit: "cover",
                  borderRadius: 7,
                  display: "block",
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Nút lướt sang phải */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          aria-label="Xem ảnh tiếp theo"
          style={{
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
          }}
        >
          <BsChevronRight size={16} />
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
