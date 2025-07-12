/** @format */

import handleAPI from "@/apis/handleApi";
import { CategoyModel } from "@/models/Products";
import {
  Card,
  Drawer,
  Empty,
  List,
  Menu,
  MenuProps,
  Skeleton,
  Typography,
  theme,
} from "antd";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const { useToken } = theme;

type MenuItem = Required<MenuProps>["items"][number];

interface Props {
  type: "card" | "menu";
}

const CategoriesListCard = (props: Props) => {
  const { type } = props;
  const { token } = useToken();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoyModel[]>([]);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    getCategories();
  }, []);

  const getCategories = async () => {
    setIsLoading(true);
    try {
      const res: any = await handleAPI(`/public/categories/all`);
      if (res && res.result) {
        changeListToTreeList(res.result);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeListToTreeList = (datas: CategoyModel[]) => {
    const items = datas.filter((element) => !element.parentId);
    const values: CategoyModel[] = [];
    items.forEach((item) => {
      const vals = datas.filter((element) => element.parentId === item.id);
      if (vals.length > 0) {
        values.push({ ...item, children: vals });
      }
    });
    setCategories(values);
  };

  if (type === "card") {
    return (
      <Card
        className="shadow mt-3"
        style={{
          minWidth: width * 0.6,
          backgroundColor: token.colorBgContainer,
          borderRadius: token.borderRadiusLG,
        }}
      >
        {isLoading ? (
          <Skeleton />
        ) : categories.length > 0 ? (
          <div className="row">
            {categories.map((item) => (
              <div className="col" key={item.id}>
                <Typography.Title level={5}>{item.title}</Typography.Title>
                {item.children && item.children.length > 0 && (
                  <List
                    dataSource={item.children}
                    renderItem={(chil) => (
                      <List.Item
                        className="menu-category-list"
                        key={chil.id}
                        style={{ border: "none" }}
                      >
                        <List.Item.Meta
                          title={
                            <Link href={`/shop?catId=${chil.id}`}>
                              {chil.title}
                            </Link>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Không tìm thấy dữ liệu" />
        )}
      </Card>
    );
  }

  return (
    <Menu
      style={{ backgroundColor: "transparent" }}
      items={categories.map((item) => ({
        key: item.id,
        label: item.title,
        children: item.children
          ? item.children.map((child) => ({
              key: child.id,
              label: (
                <Link href={`/shop?catId=${child.id}`}>{child.title}</Link>
              ),
            }))
          : undefined,
      }))}
    />
  );
};

export default CategoriesListCard;
