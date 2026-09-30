/** @format */

import { SubProductModel } from "@/models/Products";
import { Carousel } from "antd";
import React, { useEffect, useState } from "react";

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

const CarouselImages = (props: Props) => {
  const { items, onClick, selectedImageUrl } = props;

  const [images, setImages] = useState<CarouselImageItem[][]>([]);

  useEffect(() => {
    const vals: CarouselImageItem[] = [];

    items.forEach((item: any) => {
      if (item.imgURL && typeof item.imgURL === "string") {
        vals.push(item);
      } else if (Array.isArray(item.images) && item.images.length > 0) {
        item.images.forEach((img: any) => {
          const url = typeof img === "string" ? img : img?.url;
          if (url) {
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

    const imageGroups: CarouselImageItem[][] = [];
    for (let i = 0; i < vals.length; i += 6) {
      imageGroups.push(vals.slice(i, i + 6));
    }

    setImages(imageGroups);
  }, [items]);

  return (
    <Carousel dots={images.length > 1} className="mt-3">
      {images.map((groups, index) => (
        <div key={`image-${index}`}>
          <div className="d-flex gap-2 justify-content-center py-1 flex-wrap">
            {groups.map((item, imgIdx) => {
              const isSelected = selectedImageUrl === item.imgURL;
              return (
                <div
                  key={`${item.id || "img"}-${imgIdx}`}
                  onClick={() => onClick(item)}
                  style={{
                    cursor: "pointer",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: isSelected ? "2px solid #131118" : "1px solid #E5E7EB",
                    padding: 2,
                    transition: "all 0.2s ease",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <img
                    src={item.imgURL}
                    alt={item.title || "product thumbnail"}
                    style={{
                      width: "clamp(54px, 13vw, 72px)",
                      height: "clamp(54px, 13vw, 72px)",
                      objectFit: "cover",
                      borderRadius: 6,
                      display: "block",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Carousel>
  );
};

export default CarouselImages;
