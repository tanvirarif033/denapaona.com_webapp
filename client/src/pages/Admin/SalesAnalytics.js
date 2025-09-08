import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import { useAuth } from "../../context/auth";
import axios from "axios";
import moment from "moment";
import {
  Card, Row, Col, DatePicker, Select, Statistic, Space, Typography, Divider, Spin, Alert, Segmented, Tooltip as AntdTooltip
} from "antd";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../../styles/SalesAnalytics.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

// ✅ API root from .env (fallback to localhost:8080)
const API_ROOT = (process.env.REACT_APP_API || "http://localhost:8080").replace(/\/+$/, "");
const ANALYTICS_BASE = `${API_ROOT}/api/v1/analytics`;

// 🎨 Color palette (color-blind friendly leaning)
const COLORS = [
  "#6366F1", // indigo
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#84CC16", // lime
  "#F97316", // orange
  "#14B8A6", // teal
  "#EC4899", // pink
];

export default function SalesAnalytics() {
  const [auth] = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [granularity, setGranularity] = useState("daily");
  const [metric, setMetric] = useState("count"); // 'count' | 'revenue' (for pies & bars)
  const [range, setRange] = useState([moment().subtract(29, "days"), moment()]);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  const headers = useMemo(
    () => ({ Authorization: auth?.token || "" }),
    [auth?.token]
  );

  const params = useMemo(
    () => ({
      start: range[0]?.startOf("day").toISOString(),
      end: range[1]?.endOf("day").toISOString(),
    }),
    [range]
  );

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [sumRes, tsRes, tpRes, tcRes] = await Promise.all([
        axios.get(`${ANALYTICS_BASE}/summary`, { headers, params }),
        axios.get(`${ANALYTICS_BASE}/timeseries`, {
          headers,
          params: { ...params, granularity },
        }),
        axios.get(`${ANALYTICS_BASE}/top-products`, {
          headers,
          params: { ...params, limit: 8 },
        }),
        axios.get(`${ANALYTICS_BASE}/top-categories`, {
          headers,
          params: { ...params, limit: 8 },
        }),
      ]);

      setSummary(sumRes.data);
      setSeries(tsRes.data.points || []);
      setTopProducts(tpRes.data.items || []);
      setTopCategories(tcRes.data.items || []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auth?.token) loadAll();
    // eslint-disable-next-line
  }, [auth?.token, granularity, range]);

  const totalRevenue = summary?.revenue ?? 0;
  const totalItems = summary?.itemsSold ?? 0;
  const totalOrders = summary?.orders ?? 0;

  // ------- Derived pie data (based on 'metric') -------
  const productPieData = useMemo(
    () =>
      (topProducts || []).map((p) => ({
        name: p.name,
        value: metric === "revenue" ? Number(p.revenue || 0) : Number(p.count || 0),
      })),
    [topProducts, metric]
  );

  const categoryPieData = useMemo(
    () =>
      (topCategories || []).map((c) => ({
        name: c.name,
        value: metric === "revenue" ? Number(c.revenue || 0) : Number(c.count || 0),
      })),
    [topCategories, metric]
  );

  // ------- Axis label helpers -------
  const valueFormatter = (v) =>
    metric === "revenue" ? Number(v || 0).toFixed(2) : v;

  return (
    <Layout title="Sales Analytics">
      <div className="admin-dashboard-container">
        <div className="admin-header">
          <Title level={2} style={{ marginBottom: 0 }}>
            Sales Analytics
          </Title>
          <Text className="welcome-text">
            Visualize sales by product, category & time.
          </Text>
        </div>
        <Divider />

        <Row gutter={[16, 16]}>
          {/* --------- Controls --------- */}
          <Col xs={24} md={6}>
            <Card>
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Text strong>Date Range</Text>
                <RangePicker
                  allowClear={false}
                  value={range}
                  onChange={(val) => setRange(val)}
                  style={{ width: "100%" }}
                />
                <Text strong>Granularity</Text>
                <Select
                  value={granularity}
                  onChange={setGranularity}
                  style={{ width: "100%" }}
                >
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>

                <Text strong>Metric (for Top lists & Pies)</Text>
                <Segmented
                  block
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { label: "Items Sold", value: "count" },
                    { label: "Revenue", value: "revenue" },
                  ]}
                />
              </Space>
            </Card>

            <Card style={{ marginTop: 16 }}>
              <Space direction="vertical">
                <Text type="secondary">Best Product</Text>
                <Text strong>{topProducts?.[0]?.name || "—"}</Text>
                <Text type="secondary">Best Category</Text>
                <Text strong>{topCategories?.[0]?.name || "—"}</Text>
              </Space>
            </Card>
          </Col>

          {/* --------- Main Charts --------- */}
          <Col xs={24} md={18}>
            {error && (
              <Alert type="error" message={error} style={{ marginBottom: 16 }} />
            )}
            <Spin spinning={loading}>
              <Row gutter={[16, 16]}>
                {/* KPI Cards */}
                <Col xs={24} md={8}>
                  <Card className="kpi-card kpi-revenue" bordered>
                    <Statistic
                      title="Revenue"
                      value={totalRevenue}
                      precision={2}
                      suffix="৳"
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="kpi-card kpi-items" bordered>
                    <Statistic title="Items Sold" value={totalItems} />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="kpi-card kpi-orders" bordered>
                    <Statistic title="Orders" value={totalOrders} />
                  </Card>
                </Col>

                {/* Trend Line */}
                <Col span={24}>
                  <Card title="Sales Trend" className="chart-card">
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={series}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#6366F1"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="itemsSold"
                            name="Items"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="orders"
                            name="Orders"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>

                {/* Top Products (Bar) */}
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <Space>
                        <span>Top Products</span>
                        <AntdTooltip title="Sorted by selected metric">
                          <span className="badge-metric">{metric}</span>
                        </AntdTooltip>
                      </Space>
                    }
                    className="chart-card"
                  >
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={[...topProducts].sort(
                            (a, b) =>
                              (metric === "revenue"
                                ? b.revenue - a.revenue
                                : b.count - a.count) || 0
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" hide />
                          <YAxis />
                          <Tooltip formatter={(v) => valueFormatter(v)} />
                          <Legend />
                          {metric === "revenue" ? (
                            <Bar
                              dataKey="revenue"
                              name="Revenue"
                              fill="#6366F1"
                              radius={[6, 6, 0, 0]}
                            />
                          ) : (
                            <Bar
                              dataKey="count"
                              name="Items Sold"
                              fill="#10B981"
                              radius={[6, 6, 0, 0]}
                            />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>

                {/* Top Categories (Bar) */}
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <Space>
                        <span>Top Categories</span>
                        <AntdTooltip title="Sorted by selected metric">
                          <span className="badge-metric">{metric}</span>
                        </AntdTooltip>
                      </Space>
                    }
                    className="chart-card"
                  >
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={[...topCategories].sort(
                            (a, b) =>
                              (metric === "revenue"
                                ? b.revenue - a.revenue
                                : b.count - a.count) || 0
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" hide />
                          <YAxis />
                          <Tooltip formatter={(v) => valueFormatter(v)} />
                          <Legend />
                          {metric === "revenue" ? (
                            <Bar
                              dataKey="revenue"
                              name="Revenue"
                              fill="#F59E0B"
                              radius={[6, 6, 0, 0]}
                            />
                          ) : (
                            <Bar
                              dataKey="count"
                              name="Items Sold"
                              fill="#06B6D4"
                              radius={[6, 6, 0, 0]}
                            />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>

                {/* ---------- New PIE CHARTS (Products & Categories) ---------- */}
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <Space>
                        <span>Products Share (Pie)</span>
                        <AntdTooltip title="Share by selected metric">
                          <span className="badge-metric">{metric}</span>
                        </AntdTooltip>
                      </Space>
                    }
                    className="chart-card"
                  >
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Tooltip formatter={(v) => valueFormatter(v)} />
                          <Legend />
                          <Pie
                            data={productPieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            stroke="#fff"
                            strokeWidth={1}
                          >
                            {productPieData.map((_, idx) => (
                              <Cell key={`pc-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card
                    title={
                      <Space>
                        <span>Categories Share (Pie)</span>
                        <AntdTooltip title="Share by selected metric">
                          <span className="badge-metric">{metric}</span>
                        </AntdTooltip>
                      </Space>
                    }
                    className="chart-card"
                  >
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Tooltip formatter={(v) => valueFormatter(v)} />
                          <Legend />
                          <Pie
                            data={categoryPieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            stroke="#fff"
                            strokeWidth={1}
                          >
                            {categoryPieData.map((_, idx) => (
                              <Cell key={`cc-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Spin>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}
