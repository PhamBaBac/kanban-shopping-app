/** @format */

import { CategoyModel } from "@/models/Products";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Collapse,
  ConfigProvider,
  Form,
  InputNumber,
  Space,
  Spin,
  Typography,
  theme,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setFilterValues } from "@/redux/reducers/filterSlice";
import { RootState } from "@/redux/store";
import { FilterValues, shopService } from "@/services";
import { VND } from "@/utils/handleCurrency";

const { Title } = Typography;
const { useToken } = theme;

// Interface cho form filter values (từ Redux)
interface FormFilterValues {
  catIds?: string[];
  price?: [number, number];
  colors?: string[];
  sizes?: string[];
  search?: string;
}

const FilterPanel = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const filterValues = useSelector(
    (state: RootState) => state.filter.filterValues
  );
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoyModel[]>([]);
  const [filterData, setFilterData] = useState<FilterValues>();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  useEffect(() => {
    if (filterValues.price && filterValues.price.length === 2) {
      setMinPrice(filterValues.price[0] ?? null);
      setMaxPrice(filterValues.price[1] ?? null);
    } else {
      setMinPrice(null);
      setMaxPrice(null);
    }
  }, [filterValues.price]);

  const handleApplyPrice = () => {
    const hasMin = minPrice !== null && minPrice !== undefined && minPrice > 0;
    const hasMax = maxPrice !== null && maxPrice !== undefined && maxPrice > 0;

    if (!hasMin && !hasMax) {
      handleClearPrice();
      return;
    }

    const min = hasMin ? Number(minPrice) : 0;
    const max = hasMax ? Number(maxPrice) : 1000000000;

    dispatch(
      setFilterValues({
        ...filterValues,
        price: [Math.min(min, max), Math.max(min, max)],
      })
    );
  };

  const handleClearPrice = () => {
    setMinPrice(null);
    setMaxPrice(null);
    const updated = { ...filterValues };
    delete updated.price;
    dispatch(setFilterValues(updated));
  };

  const { token } = useToken();
  const [form] = Form.useForm<FormFilterValues>();

  // Tải danh mục ban đầu
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const categoriesRes = await shopService.getCategoriesForFilter();
        const hierarchicalCategories = buildHierarchy(categoriesRes);
        setCategories(hierarchicalCategories);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Tải filter values tương ứng khi category hoặc search thay đổi
  useEffect(() => {
    const fetchDynamicFilters = async () => {
      try {
        const filterValuesRes = await shopService.getFilterValues(
          filterValues.catIds,
          filterValues.search
        );
        setFilterData(filterValuesRes);
      } catch (error) {
        console.error("Error fetching dynamic filter values:", error);
      }
    };
    fetchDynamicFilters();
  }, [filterValues.catIds, filterValues.search]);

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

  // Kiểm tra nếu 1 category node hoặc descendant của nó khớp với targetIds
  const categoryTreeMatches = (
    cat: CategoyModel,
    targetIds: string[]
  ): boolean => {
    const stringTargetIds = targetIds.map((id) => String(id));
    if (stringTargetIds.includes(String(cat.id))) {
      return true;
    }
    if (cat.children && cat.children.length > 0) {
      return cat.children.some((child) =>
        categoryTreeMatches(child, targetIds)
      );
    }
    return false;
  };

  // Tìm tất cả các key cần auto-expand (ancestor + category có children)
  const getKeysToExpand = (
    cats: CategoyModel[],
    targetIds: string[]
  ): string[] => {
    const keys = new Set<string>();
    const stringTargetIds = targetIds.map((id) => String(id));
    const traverse = (cat: CategoyModel): boolean => {
      let isTargetOrDescendant = stringTargetIds.includes(String(cat.id));
      if (cat.children && cat.children.length > 0) {
        for (const child of cat.children) {
          if (traverse(child)) {
            isTargetOrDescendant = true;
          }
        }
        if (isTargetOrDescendant) {
          keys.add(String(cat.id));
        }
      }
      return isTargetOrDescendant;
    };
    cats.forEach(traverse);
    return Array.from(keys);
  };

  // Tìm danh mục cha cao nhất (root parent) của một category bất kỳ
  const findRootParent = (
    catId: string | undefined,
    rootCats: CategoyModel[]
  ): CategoyModel | null => {
    if (!catId) return null;
    return (
      rootCats.find((root) => categoryTreeMatches(root, [catId])) || null
    );
  };

  const displayedCategories = useMemo(() => {
    const rawCatId = router.query.catId;
    const activeCatIds = rawCatId
      ? Array.isArray(rawCatId)
        ? rawCatId
        : typeof rawCatId === "string" && rawCatId.includes(",")
          ? rawCatId.split(",").map((s) => s.trim())
          : [rawCatId as string]
      : filterValues.catIds && filterValues.catIds.length > 0
        ? filterValues.catIds
        : [];

    if (activeCatIds.length === 0) {
      return categories;
    }

    const matched = categories.filter((rootCat) =>
      categoryTreeMatches(rootCat, activeCatIds)
    );

    return matched.length > 0 ? matched : categories;
  }, [categories, filterValues.catIds, router.query.catId]);

  useEffect(() => {
    if (filterValues) {
      // Khi catId là danh mục cha có con (như "Thiết bị điện tử"),
      // lọc bỏ ID này khỏi form để các checkbox đều không bị tích (hiển thị bỏ tích hết)
      const isRootWithChildren = (id: string) =>
        categories.some(
          (root) => root.id === id && root.children && root.children.length > 0
        );

      const formCatIds = (filterValues.catIds || []).filter(
        (id) => !isRootWithChildren(id)
      );

      form.setFieldsValue({
        ...filterValues,
        catIds: formCatIds,
      });

      // Auto-expand category nếu router.query.catId hoặc catIds được chọn
      const rawCatId = router.query.catId;
      const activeIds = rawCatId
        ? Array.isArray(rawCatId)
          ? rawCatId
          : typeof rawCatId === "string" && rawCatId.includes(",")
            ? rawCatId.split(",").map((s) => s.trim())
            : [rawCatId as string]
        : filterValues.catIds && filterValues.catIds.length > 0
          ? filterValues.catIds
          : [];

      if (activeIds.length > 0) {
        const autoExpandKeys = getKeysToExpand(categories, activeIds);
        setExpandedKeys((prev) =>
          Array.from(new Set([...prev, ...autoExpandKeys]))
        );
      }
    }
  }, [filterValues, form, categories, router.query.catId]);

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
      className="filter-panel"
      style={{
        padding: 0,
        backgroundColor: "transparent",
      }}
    >
      <ConfigProvider
        theme={{
          components: {
            Collapse: {
              headerPadding: "12px 0px",
              contentPadding: "8px 0px",
            },
          },
        }}
      >
        <Form
          form={form}
          onValuesChange={(_, allValues) => {
            if (router && router.isReady) {
              const newQuery: Record<string, any> = { ...router.query };
              if (allValues.catIds && allValues.catIds.length > 0) {
                newQuery.catId =
                  allValues.catIds.length === 1
                    ? allValues.catIds[0]
                    : allValues.catIds;
                dispatch(setFilterValues(allValues));
              } else {
                // Khi người dùng bỏ tích hết (allValues.catIds rỗng):
                // Giữ URL với catId của thằng cha (root category của nhánh hiện tại)
                const rawCurrent =
                  router.query.catId ||
                  (filterValues.catIds && filterValues.catIds[0]);
                const currentCatId = Array.isArray(rawCurrent)
                  ? rawCurrent[0]
                  : (rawCurrent as string);

                let rootParentId: string | null = null;
                if (currentCatId) {
                  const rootCat = findRootParent(currentCatId, categories);
                  if (rootCat) {
                    rootParentId = rootCat.id;
                  }
                }
                if (!rootParentId && displayedCategories.length === 1) {
                  rootParentId = displayedCategories[0].id;
                }

                if (rootParentId) {
                  newQuery.catId = rootParentId;
                  // Dispatch Redux với catId của thằng cha để backend fetch đúng sản phẩm của thằng cha
                  dispatch(
                    setFilterValues({
                      ...allValues,
                      catIds: [rootParentId],
                    })
                  );
                } else {
                  delete newQuery.catId;
                  dispatch(setFilterValues(allValues));
                }
              }

              router.replace(
                {
                  pathname: router.pathname,
                  query: newQuery,
                },
                undefined,
                { shallow: true }
              );
            }
          }}
          layout="vertical"
          initialValues={filterValues}
        >
          <Collapse
            defaultActiveKey={["1"]}
            ghost
            expandIconPosition="end"
            style={{ padding: 0 }}
          >
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
                  {renderCategories(displayedCategories)}
                </Checkbox.Group>
              </Form.Item>
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <Title level={5} style={{ marginBottom: 0 }}>
                  Khoảng giá
                </Title>
              }
              key="2"
            >
              <Space direction="vertical" style={{ width: "100%" }} size={10}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <InputNumber
                    placeholder="Từ (đ)"
                    min={0}
                    value={minPrice}
                    onChange={(val) => setMinPrice(val)}
                    onPressEnter={handleApplyPrice}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      (value ? Number(value.replace(/\$\s?|(,*)/g, "")) : "") as any
                    }
                    style={{ width: "100%", borderRadius: 6 }}
                  />
                  <span style={{ color: "#888" }}>-</span>
                  <InputNumber
                    placeholder="Đến (đ)"
                    min={0}
                    value={maxPrice}
                    onChange={(val) => setMaxPrice(val)}
                    onPressEnter={handleApplyPrice}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      (value ? Number(value.replace(/\$\s?|(,*)/g, "")) : "") as any
                    }
                    style={{ width: "100%", borderRadius: 6 }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    type="primary"
                    onClick={handleApplyPrice}
                    style={{ flex: 1, borderRadius: 6 }}
                  >
                    Áp dụng
                  </Button>
                  {filterValues.price && (
                    <Button
                      onClick={handleClearPrice}
                      style={{ borderRadius: 6 }}
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </Space>
            </Collapse.Panel>
          </Collapse>
        </Form>
      </ConfigProvider>
    </div>
  );
};

export default FilterPanel;
