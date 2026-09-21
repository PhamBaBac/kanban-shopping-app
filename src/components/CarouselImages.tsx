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
      // Nếu item là CarouselImageItem có sẵn imgURL
      if (item.imgURL && typeof item.imgURL === "string") {
        vals.push(item);
      } else if (Array.isArray(item.images) && item.images.length > 0) {
        // Nếu item là SubProductModel có mảng images
        item.images.forEach((img: string) => {
          vals.push({
            id: item.id,
            imgURL: img,
            title: item.title,
            subProduct: item,
          });
        });
      }
    });

    const nums = Math.ceil(vals.length / 6);
    const imageGroups: CarouselImageItem[][] = [];
    Array.from({ length: nums }).forEach(() => {
      const group: CarouselImageItem[] = vals.splice(0, 6);
      imageGroups.push(group);
    });

    setImages(imageGroups);
  }, [items]);

  return (
    <Carousel autoplay className="mt-3">
      {images.map((groups, index) => (
        <div key={`image-${index}`}>
          <div className="d-flex gap-2 justify-content-center py-1">
            {groups.map((item, imgIdx) => {
              const isSelected = selectedImageUrl === item.imgURL;
              return (
                <div
                  key={`${item.id || "img"}-${imgIdx}`}
                  onClick={() => onClick(item.subProduct || item)}
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
                      width: 72,
                      height: 72,
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
