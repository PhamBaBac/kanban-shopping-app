/** @format */

import { SubProductModel } from "@/models/Products";
import { Carousel, Space } from "antd";
import React, { PropsWithRef, useEffect, useState } from "react";

interface Props {
  items: SubProductModel[];
  onClick: (val: SubProductModel) => void;
}

const CarouselImages = (props: Props) => {
  const { items, onClick } = props;

  const [images, setImages] = useState<any[][]>([]);

  useEffect(() => {
    const vals: SubProductModel[] = [];

    items.forEach((item) => {
      const imgs = item.images;
      imgs.forEach((img) => vals.push({ ...item, imgURL: img }));
    });

    const nums = Math.ceil(vals.length / 5);
    const imageGroups: SubProductModel[][] = [];
    Array.from({ length: nums }).forEach((item) => {
      const group: SubProductModel[] = vals.splice(0, 5);
      imageGroups.push(group);
    });

    setImages(imageGroups);
  }, [items]);

  return (
    <Carousel autoplay className="mt-3">
      {images.map((groups, index) => (
        <div key={`image-${index}`}>
          <div className="d-flex gap-2 justify-content-center py-1">
            {groups.map((item, imgIdx) => (
              <div
                key={`${item.id}-${imgIdx}`}
                onClick={() => onClick(item)}
                style={{
                  cursor: "pointer",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #E5E7EB",
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
            ))}
          </div>
        </div>
      ))}
    </Carousel>
  );
};

export default CarouselImages;
