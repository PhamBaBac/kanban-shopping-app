/** @format */

import handleAPI from "@/apis/handleApi";
import { CategoyModel } from "@/models/Products";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Collapse,
  Form,
  Slider,
  Space,
  Spin,
  Typography,
  theme,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFilterValues } from "@/redux/reducers/filterSlice";
import { RootState } from "@/redux/store";

const { Title } = Typography;
const { useToken } = theme;

export interface FilterValues {
  catIds?: string[];
  price?: [number, number];
  colors?: string[];
  sizes?: string[];
}

const FilterPanel = () => {
  const dispatch = useDispatch();
  const filterValues = useSelector(
    (state: RootState) => state.filter.filterValues
  );
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [filterData, setFilterData] = useState<{
    colors: string[];
    sizes: string[];
    prices: number[];
  }>();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const { token } = useToken();
  const [form] = Form.useForm();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [catsRes, filtersRes]: [any, any] = await Promise.all([
          handleAPI("/categories/all", undefined, "get"),
          handleAPI("/subProducts/get-filter-values", undefined, "get"),
        ]);
        if (catsRes.result) {
          const hierarchicalCategories = buildHierarchy(catsRes.result);
          setCategories(hierarchicalCategories);
        }
        if (filtersRes.result) {
          setFilterData(filtersRes.result);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const buildHierarchy = (list: CategoyModel[]): CategoyModel[] => {
    const map = new Map<string, CategoyModel>();
    const roots: CategoyModel[] = [];

    list.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    list.forEach((item) => {
      if (item.parentId && map.has(item.parentId)) {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children.push(map.get(item.id)!);
        }
      } else {
        roots.push(map.get(item.id)!);
      }
    });

    return roots;
  };

  useEffect(() => {
    if (filterValues) {
      form.setFieldsValue(filterValues);
    }
  }, [filterValues, form]);

  const handleToggle = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderCategories = (
    categoriesToRender: CategoyModel[],
    level = 0
  ): React.ReactNode => {
    return categoriesToRender.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedKeys.includes(cat.id);

      return (
        <div key={cat.id} style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginLeft: `${level * 24}px`,
            }}
          >
            <Checkbox value={cat.id}>{cat.title}</Checkbox>
            <div style={{ width: 24 }}>
              {hasChildren && (
                <Button
                  type="text"
                  size="small"
                  icon={isExpanded ? <MinusOutlined /> : <PlusOutlined />}
                  onClick={() => handleToggle(cat.id)}
                />
              )}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderCategories(cat.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return <Spin style={{ display: "block", margin: "20px auto" }} />;
  }

  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
      }}
    >
      <Form
        form={form}
        onValuesChange={(_, allValues) => dispatch(setFilterValues(allValues))}
        layout="vertical"
        initialValues={filterValues}
      >
        <Collapse defaultActiveKey={["1"]} ghost expandIconPosition="end">
          <Collapse.Panel
            header={
              <Title level={5} style={{ marginBottom: 0 }}>
                Product Categories
              </Title>
            }
            key="1"
          >
            <Form.Item name="catIds" style={{ marginBottom: 0 }}>
              <Checkbox.Group style={{ width: "100%" }}>
                {renderCategories(categories)}
              </Checkbox.Group>
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel
            header={
              <Title level={5} style={{ marginBottom: 0 }}>
                Filter by Price
              </Title>
            }
            key="2"
          >
            {filterData?.prices && filterData.prices.length > 1 && (
              <Form.Item name="price" style={{ marginBottom: 0 }}>
                <Slider
                  range
                  min={Math.min(...filterData.prices)}
                  max={Math.max(...filterData.prices)}
                  step={10}
                  style={{ margin: "0 10px" }}
                  tooltip={{
                    formatter: (value) => value && `$${value}`,
                  }}
                />
              </Form.Item>
            )}
          </Collapse.Panel>

          <Collapse.Panel
            header={
              <Title level={5} style={{ marginBottom: 0 }}>
                Filter by Color
              </Title>
            }
            key="3"
          >
            <Form.Item name="colors" style={{ marginBottom: 0 }}>
              <Checkbox.Group>
                <Space direction="vertical">
                  {filterData?.colors.map((color) => (
                    <Checkbox key={color} value={color}>
                      <Space>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            backgroundColor: color,
                            border: "1px solid #ccc",
                          }}
                        />
                        {color}
                      </Space>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          </Collapse.Panel>

          <Collapse.Panel
            header={
              <Title level={5} style={{ marginBottom: 0 }}>
                Filter by Size
              </Title>
            }
            key="4"
          >
            <Form.Item name="sizes" style={{ marginBottom: 0 }}>
              <Checkbox.Group>
                <Space direction="vertical">
                  {filterData?.sizes.map((size) => (
                    <Checkbox key={size} value={size}>
                      {size}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </div>
  );
};

export default FilterPanel;
