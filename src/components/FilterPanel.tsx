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
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setFilterValues, setRootCatId } from "@/redux/reducers/filterSlice";
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

const buildHierarchy = (list: CategoyModel[]): CategoyModel[] => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const map = new Map<string, CategoyModel>();
  const roots: CategoyModel[] = [];

  // Lọc trùng lặp theo ID
  const uniqueList: CategoyModel[] = [];
  const seenIds = new Set<string>();
  for (const item of list) {
    if (item && item.id && !seenIds.has(String(item.id))) {
      seenIds.add(String(item.id));
      uniqueList.push(item);
    }
  }

  uniqueList.forEach((item) => {
    map.set(String(item.id), { ...item, children: [] });
  });

  uniqueList.forEach((item) => {
    const parentIdStr = item.parentId ? String(item.parentId).trim() : "";
    const itemIdStr = String(item.id).trim();
    if (parentIdStr && parentIdStr !== itemIdStr && map.has(parentIdStr)) {
      const parent = map.get(parentIdStr);
      if (parent) {
        parent.children.push(map.get(itemIdStr)!);
      }
    } else {
      roots.push(map.get(itemIdStr)!);
    }
  });

  return roots;
};

// Kiểm tra nếu 1 category node hoặc descendant của nó khớp với targetIds
const categoryTreeMatches = (
  cat: CategoyModel,
  targetIds: string[]
): boolean => {
  if (!cat) return false;
  const stringTargetIds = targetIds.map((id) =>
    String(id).toLowerCase().trim()
  );
  const catId = String(cat.id || "").toLowerCase().trim();
  const catSlug = String(cat.slug || "").toLowerCase().trim();

  if (
    stringTargetIds.includes(catId) ||
    (catSlug && stringTargetIds.includes(catSlug))
  ) {
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
  const stringTargetIds = targetIds.map((id) =>
    String(id).toLowerCase().trim()
  );
  const traverse = (cat: CategoyModel): boolean => {
    if (!cat) return false;
    const catId = String(cat.id || "").toLowerCase().trim();
    const catSlug = String(cat.slug || "").toLowerCase().trim();
    let isTargetOrDescendant =
      stringTargetIds.includes(catId) ||
      (catSlug && stringTargetIds.includes(catSlug));

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
    return Boolean(isTargetOrDescendant);
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

// Lấy tất cả ID danh mục con cháu
const getDescendantIds = (cat: CategoyModel): string[] => {
  let ids: string[] = [];
  if (cat.children && cat.children.length > 0) {
    for (const child of cat.children) {
      ids.push(String(child.id));
      ids = ids.concat(getDescendantIds(child));
    }
  }
  return ids;
};

// Lấy tất cả ID tổ tiên của 1 category ID
const getAncestorIds = (targetId: string, roots: CategoyModel[]): string[] => {
  const ancestors: string[] = [];
  const find = (cat: CategoyModel, path: string[]): boolean => {
    if (String(cat.id) === String(targetId)) {
      ancestors.push(...path);
      return true;
    }
    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        if (find(child, [...path, String(cat.id)])) return true;
      }
    }
    return false;
  };
  roots.forEach((root) => find(root, []));
  return ancestors;
};

// Tìm category node theo id hoặc slug
const findCategoryByIdOrSlug = (
  cats: CategoyModel[],
  target: string
): CategoyModel | null => {
  const norm = String(target).toLowerCase().trim();
  for (const cat of cats) {
    if (
      String(cat.id).toLowerCase().trim() === norm ||
      (cat.slug && String(cat.slug).toLowerCase().trim() === norm)
    ) {
      return cat;
    }
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryByIdOrSlug(cat.children, target);
      if (found) return found;
    }
  }
  return null;
};

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

  const categoriesRef = useRef<CategoyModel[]>([]);
  const isFetchingRef = useRef(false);

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

  // Tải danh mục theo ngữ cảnh: nếu có catId thì chỉ tải nhánh cha + con của nó (không gọi get all)
  useEffect(() => {
    if (!router.isReady) return;

    const rawCatId = router.query.catId;
    const targetCatIds: string[] = rawCatId
      ? Array.isArray(rawCatId)
        ? rawCatId
        : typeof rawCatId === "string" && rawCatId.includes(",")
          ? rawCatId.split(",").map((s) => s.trim())
          : [rawCatId as string]
      : [];

    if (targetCatIds.length === 0) {
      setCategories([]);
      categoriesRef.current = [];
      return;
    }

    // Nếu TẤT CẢ các targetCatIds đã nằm trong cây categories hiện tại thì KHÔNG tải lại!
    const currentCats = categoriesRef.current;
    const allAlreadyLoaded =
      currentCats.length > 0 &&
      targetCatIds.every((id) =>
        currentCats.some((root) => categoryTreeMatches(root, [id]))
      );

    if (allAlreadyLoaded) {
      return;
    }

    if (isFetchingRef.current) return;

    const loadCategories = async () => {
      isFetchingRef.current = true;
      setIsLoading(true);
      try {
        const branchRes = await shopService.getCategoryBranch(targetCatIds[0]);
        if (Array.isArray(branchRes) && branchRes.length > 0) {
          const hierarchicalCategories = buildHierarchy(branchRes);
          setCategories(hierarchicalCategories);
          categoriesRef.current = hierarchicalCategories;

          // Lưu root parent ID vào Redux để "Xóa tất cả bộ lọc" biết nên quay về đâu
          const rootId = hierarchicalCategories[0]?.id;
          dispatch(setRootCatId(rootId));

          const autoExpandKeys = getKeysToExpand(
            hierarchicalCategories,
            targetCatIds
          );
          setExpandedKeys((prev) =>
            Array.from(new Set([...prev, ...autoExpandKeys]))
          );
        } else {
          setCategories([]);
          categoriesRef.current = [];
          dispatch(setRootCatId(undefined));
        }
      } catch (error) {
        console.error("Error loading category branch in FilterPanel:", error);
        setCategories([]);
        categoriesRef.current = [];
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    loadCategories();
  }, [router.isReady, router.query.catId]);

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

  const displayedCategories = categories;

  // Effect đồng bộ checkbox đã chọn: ưu tiên router.query.catId (luôn có ngay từ URL)
  // thay vì filterValues.catIds (có thể lag so với Redux dispatch)
  useEffect(() => {
    if (!router.isReady) return;

    const rawCatId = router.query.catId;

    // Xác định IDs cần pre-check: URL catId là nguồn chính xác nhất
    const activeIds: string[] = rawCatId
      ? Array.isArray(rawCatId)
        ? rawCatId
        : typeof rawCatId === "string" && rawCatId.includes(",")
          ? rawCatId.split(",").map((s) => s.trim())
          : [rawCatId as string]
      : filterValues.catIds && filterValues.catIds.length > 0
        ? filterValues.catIds
        : [];

    // Map bất kỳ slug hoặc id nào về đúng cat.id để Checkbox.Group bind chính xác
    const resolvedActiveIds = activeIds.map((val) => {
      const node = findCategoryByIdOrSlug(categories, val);
      return node ? String(node.id) : String(val);
    });

    // Pre-check checkbox đúng với danh mục đã chọn
    form.setFieldsValue({
      catIds: resolvedActiveIds,
    });

    // Auto-expand để danh mục được chọn luôn hiển thị
    if (resolvedActiveIds.length > 0 && categories.length > 0) {
      const autoExpandKeys = getKeysToExpand(categories, resolvedActiveIds);
      setExpandedKeys((prev) =>
        Array.from(new Set([...prev, ...autoExpandKeys]))
      );
    }
  }, [router.isReady, router.query.catId, categories, form, filterValues.catIds]);


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
        <div key={cat.id} style={{ width: "100%", marginBottom: 3 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px 8px",
              borderRadius: "6px",
              transition: "background-color 0.15s ease",
            }}
          >
            <Checkbox
              value={cat.id}
              style={{
                flex: 1,
                fontSize: "0.9rem",
                fontWeight: level === 0 ? 600 : 400,
              }}
            >
              {cat.title}
            </Checkbox>
            <div style={{ width: 24, textAlign: "right" }}>
              {hasChildren && (
                <Button
                  type="text"
                  size="small"
                  style={{ width: 22, height: 22, padding: 0 }}
                  icon={isExpanded ? <MinusOutlined style={{ fontSize: 10 }} /> : <PlusOutlined style={{ fontSize: 10 }} />}
                  onClick={() => handleToggle(cat.id)}
                />
              )}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ marginTop: 2 }}>{renderCategories(cat.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      className="filter-panel"
      style={{
        padding: "16px 18px",
        backgroundColor: "#FFFFFF",
        borderRadius: "14px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        className="d-flex align-items-center gap-2 pb-3 mb-2 border-bottom"
        style={{ borderColor: "#F3F4F6" }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading, 'Rubik', sans-serif)",
            fontWeight: 600,
            fontSize: "0.98rem",
            color: "#131118",
          }}
        >
          Bộ lọc tìm kiếm
        </span>
      </div>

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
              // Đọc từ form (chính xác ngay lập tức) thay vì Redux (có thể lag)
              const prevCatIds: string[] = (form.getFieldValue("catIds") || []).map(String);
              let nextCatIds: string[] = (allValues.catIds || []).map((id: any) => String(id));

              // Tìm ID vừa mới được click thêm vào
              const addedId = nextCatIds.find((id) => !prevCatIds.includes(id));


              if (addedId) {
                const findNode = (id: string, list: CategoyModel[]): CategoyModel | null => {
                  for (const c of list) {
                    if (String(c.id) === id) return c;
                    if (c.children) {
                      const res = findNode(id, c.children);
                      if (res) return res;
                    }
                  }
                  return null;
                };

                const addedNode = findNode(addedId, categories);
                if (addedNode) {
                  const descendants = getDescendantIds(addedNode);
                  const ancestors = getAncestorIds(addedId, categories);

                  // Nếu vừa tích thằng cha: bỏ tích các con cháu của nó để tránh trùng lặp
                  if (descendants.length > 0) {
                    nextCatIds = nextCatIds.filter((id) => !descendants.includes(id));
                  }
                  // Nếu vừa tích thằng con: bỏ tích các tổ tiên để thu hẹp kết quả về đúng thằng con
                  if (ancestors.length > 0) {
                    nextCatIds = nextCatIds.filter((id) => !ancestors.includes(id));
                  }
                }
              }

              // Cập nhật giá trị vào form để hiển thị chính xác
              form.setFieldsValue({
                ...allValues,
                catIds: nextCatIds,
              });

              const newQuery: Record<string, any> = { ...router.query };
              if (nextCatIds.length > 0) {
                newQuery.catId =
                  nextCatIds.length === 1
                    ? nextCatIds[0]
                    : nextCatIds;
                dispatch(setFilterValues({ ...filterValues, catIds: nextCatIds }));
              } else {
                // Khi người dùng bỏ tích hết:
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
                if (!rootParentId && categories.length === 1) {
                  rootParentId = categories[0].id;
                }

                if (rootParentId) {
                  newQuery.catId = rootParentId;
                } else {
                  delete newQuery.catId;
                }

                dispatch(
                  setFilterValues({
                    ...filterValues,
                    catIds: [],
                  })
                );
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
            defaultActiveKey={["1", "2"]}
            ghost
            expandIconPosition="end"
            style={{ padding: 0 }}
          >
            {Boolean(router.query.catId) && (
              <Collapse.Panel
                header={
                  <Title
                    level={5}
                    style={{
                      marginBottom: 0,
                      fontFamily: "var(--font-heading, 'Rubik', sans-serif)",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      color: "#131118",
                    }}
                  >
                    Product Categories
                  </Title>
                }
                key="1"
              >
                {isLoading && categories.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <Spin size="small" />
                  </div>
                ) : (
                  <Form.Item name="catIds" style={{ marginBottom: 0 }}>
                    <Checkbox.Group style={{ width: "100%" }}>
                      {renderCategories(categories)}
                    </Checkbox.Group>
                  </Form.Item>
                )}
              </Collapse.Panel>
            )}

            <Collapse.Panel
              header={
                <Title level={5} style={{ marginBottom: 0, fontFamily: "var(--font-heading, 'Rubik', sans-serif)", fontSize: "0.92rem", fontWeight: 600, color: "#131118" }}>
                  Khoảng giá
                </Title>
              }
              key="2"
            >
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <InputNumber
                    placeholder="Từ (đ)"
                    min={0}
                    value={minPrice}
                    onChange={(val) => setMinPrice(val)}
                    onPressEnter={() => handleApplyPrice()}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      (value ? Number(value.replace(/\$\s?|(,*)/g, "")) : "") as any
                    }
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                  <span style={{ color: "#888" }}>-</span>
                  <InputNumber
                    placeholder="Đến (đ)"
                    min={0}
                    value={maxPrice}
                    onChange={(val) => setMaxPrice(val)}
                    onPressEnter={() => handleApplyPrice()}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      (value ? Number(value.replace(/\$\s?|(,*)/g, "")) : "") as any
                    }
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    type="primary"
                    onClick={() => handleApplyPrice()}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      backgroundColor: "#131118",
                      borderColor: "#131118",
                      fontWeight: 500,
                    }}
                  >
                    Áp dụng
                  </Button>
                  {filterValues.price && (
                    <Button
                      onClick={handleClearPrice}
                      style={{ borderRadius: 8 }}
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
