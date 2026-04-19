import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Scatter, Chart } from "react-chartjs-2";
import API from "../services/api";
import "../styles/WalkThrough.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function WalkThrough() {
  const [user, setUser] = useState(null);
  const [analyticsResult, setAnalyticsResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedCities, setSelectedCities] = useState("");
  const [selectedCountries, setSelectedCountries] = useState("");
  const [selectedCategories, setSelectedCategories] = useState("");
  const [selectedProducts, setSelectedProducts] = useState("");
  const [selectedGroupFields, setSelectedGroupFields] = useState("");
  const [selectedMeasureFields, setSelectedMeasureFields] = useState("");
  const [aggFunction, setAggFunction] = useState("SUM");
  const [rankingMode, setRankingMode] = useState("Top");
  const [limitN, setLimitN] = useState(10);
  const [chartType, setChartType] = useState("Bar");

  // Options state
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [groupFields, setGroupFields] = useState([]);
  const [measureFields, setMeasureFields] = useState([]);

  // Date bounds
  const [dateBounds, setDateBounds] = useState({ min: "", max: "" });

  useEffect(() => {
    // Get current user
    API.get("/me").then((res) => {
      if (!res.data.error) {
        setUser(res.data);
        loadOptions(res.data.role);
        loadDateBounds();
      }
    });
  }, []);

  const loadProducts = async (categories) => {
    try {
      const categoryQuery = Array.isArray(categories) ? categories.join(",") : categories;
      const query = categoryQuery ? `?categories=${categoryQuery}` : "";
      const res = await API.get(`/walkthrough/products${query}`);
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadOptions = async (role) => {
    try {
      const [citiesRes, countriesRes, categoriesRes] = await Promise.all([
        API.get("/walkthrough/cities"),
        API.get("/walkthrough/countries"),
        API.get("/walkthrough/categories"),
      ]);

      setCities(citiesRes.data.cities || []);
      setCountries(countriesRes.data.countries || []);
      const fetchedCategories = categoriesRes.data.categories || [];
      setCategories(fetchedCategories);

      // Load products and default fields
      await loadProducts([]);
      const fieldsRes = await API.get(`/walkthrough/fields?role=${role}`);
      const availableGroups = fieldsRes.data.group_fields || [];
      const availableMeasures = fieldsRes.data.measure_fields || [];
      setGroupFields(availableGroups);
      setMeasureFields(availableMeasures);
      if (availableGroups.length && !selectedGroupFields) {
        setSelectedGroupFields(availableGroups[0].id);
      }
      if (availableMeasures.length && !selectedMeasureFields) {
        setSelectedMeasureFields(availableMeasures[0].id);
      }
    } catch (error) {
      console.error("Error loading options:", error);
    }
  };

  const loadDateBounds = async () => {
    try {
      const res = await API.get("/walkthrough/date-bounds");
      setDateBounds(res.data);
      if (!selectedDates.length && res.data.min && res.data.max) {
        setSelectedDates([res.data.min, res.data.max]);
      }
    } catch (error) {
      console.error("Error loading date bounds:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadMeasureFields(user.role, aggFunction);
    }
  }, [user, aggFunction]);

  useEffect(() => {
    loadProducts(selectedCategories);
  }, [selectedCategories]);

  const loadMeasureFields = async (role, aggFunc) => {
    try {
      const fieldsRes = await API.get(`/walkthrough/fields?role=${role}&agg_function=${aggFunc}`);
      const availableMeasures = fieldsRes.data.measure_fields || [];
      setMeasureFields(availableMeasures);
      if (availableMeasures.length && !availableMeasures.find((item) => item.id === selectedMeasureFields)) {
        setSelectedMeasureFields(availableMeasures[0].id);
      }
    } catch (error) {
      console.error("Error loading measure fields:", error);
    }
  };

  const handleRunAnalytics = async () => {
    if (!selectedMeasureFields) {
      alert("Please select a measure field.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role: user.role,
        group_field_ids: selectedGroupFields ? [selectedGroupFields] : [],
        agg_function: aggFunction,
        measure_field_ids: selectedMeasureFields ? [selectedMeasureFields] : [],
        start_date: selectedDates[0] || "",
        end_date: selectedDates[1] || "",
        cities: selectedCities ? [selectedCities] : [],
        categories: selectedCategories ? [selectedCategories] : [],
        products: selectedProducts ? [selectedProducts] : [],
        countries: selectedCountries ? [selectedCountries] : [],
        ranking_mode: rankingMode,
        limit_n: parseInt(limitN),
      };

      const res = await API.post("/walkthrough/analytics", payload);
      setAnalyticsResult(res.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || error.message || "Unable to run analytics.");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!analyticsResult || !analyticsResult.data || analyticsResult.data.length === 0) {
      return null;
    }

    const headers = Object.keys(analyticsResult.data[0]);
    const firstHeader = headers[0];
    const secondHeader = headers[1];

    const labels = analyticsResult.data.map(row => row[firstHeader]);
    const dataValues = analyticsResult.data.map(row => parseFloat(row[secondHeader]) || 0);

    const chartData = {
      labels,
      datasets: [
        {
          label: secondHeader,
          data: dataValues,
          backgroundColor: "rgba(37, 99, 235, 0.6)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 2,
          fill: chartType === "Area",
        },
      ],
    };

    return chartData;
  };

  const renderChart = () => {
    const data = getChartData();
    if (!data) return null;

    const commonOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#f4f7ff",
            font: { size: 14 },
          },
        },
        title: {
          display: true,
          text: `${chartType} Chart`,
          color: "#f4f7ff",
          font: { size: 16 },
        },
      },
      scales: {
        x: {
          ticks: { color: "rgba(255, 255, 255, 0.7)" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
        y: {
          ticks: { color: "rgba(255, 255, 255, 0.7)" },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
      },
    };

    switch (chartType) {
      case "Line":
        return (
          <Line
            data={{
              ...data,
              datasets: [
                {
                  ...data.datasets[0],
                  borderColor: "rgba(37, 99, 235, 1)",
                  backgroundColor: "rgba(37, 99, 235, 0.1)",
                  tension: 0.4,
                },
              ],
            }}
            options={commonOptions}
          />
        );
      case "Scatter":
        return (
          <Scatter
            data={{
              ...data,
              datasets: [
                {
                  ...data.datasets[0],
                  pointRadius: 8,
                  pointHoverRadius: 10,
                },
              ],
            }}
            options={commonOptions}
          />
        );
      case "Area":
        return (
          <Chart
            type="area"
            data={{
              ...data,
              datasets: [
                {
                  ...data.datasets[0],
                  fill: true,
                  backgroundColor: "rgba(37, 99, 235, 0.15)",
                  borderColor: "rgba(37, 99, 235, 1)",
                  tension: 0.4,
                },
              ],
            }}
            options={commonOptions}
          />
        );
      case "Bar":
      default:
        return <Bar data={data} options={commonOptions} />;
    }
  };

  const handleClearFilters = () => {
    setSelectedCities("");
    setSelectedCountries("");
    setSelectedCategories("");
    setSelectedProducts("");
    setAggFunction("SUM");
    setRankingMode("Top");
    setLimitN(10);
    setChartType("Bar");
    setAnalyticsResult(null);
    setError(null);

    if (dateBounds.min && dateBounds.max) {
      setSelectedDates([dateBounds.min, dateBounds.max]);
    }

    if (groupFields.length) {
      setSelectedGroupFields(groupFields[0].id);
    } else {
      setSelectedGroupFields("");
    }
    if (measureFields.length) {
      setSelectedMeasureFields(measureFields[0].id);
    } else {
      setSelectedMeasureFields("");
    }
  };

  if (!user) return <div>Loading...</div>

  return (
    <div className="walkthrough">
      <div className="walkthrough-header">
        <h2>Analytics Builder</h2>
        <p>Build custom analytics queries with filters and aggregations</p>
      </div>

      <div className="walkthrough-form">
        {/* Date Range */}
        <div className="form-section">
          <h3>Sales Date Range</h3>
          <input
            type="date"
            min={dateBounds.min}
            max={dateBounds.max}
            value={selectedDates[0] || ""}
            onChange={(e) => setSelectedDates([e.target.value, selectedDates[1]])}
          />
          <span>to</span>
          <input
            type="date"
            min={dateBounds.min}
            max={dateBounds.max}
            value={selectedDates[1] || ""}
            onChange={(e) => setSelectedDates([selectedDates[0], e.target.value])}
          />
        </div>

        {/* Filters */}
        <div className="form-row">
          <div className="form-section">
            <h3>City</h3>
            <select
              value={selectedCities}
              onChange={(e) => setSelectedCities(e.target.value)}
            >
              <option value="">Select city</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h3>Country</h3>
            <select
              value={selectedCountries}
              onChange={(e) => setSelectedCountries(e.target.value)}
            >
              <option value="">Select country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h3>Category</h3>
            <select
              value={selectedCategories}
              onChange={(e) => setSelectedCategories(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h3>Products</h3>
            <select
              value={selectedProducts}
              onChange={(e) => setSelectedProducts(e.target.value)}
            >
              <option value="">Select product</option>
              {products.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Group By and Measures */}
        <div className="form-row">
          <div className="form-section">
            <h3>Analyze by (Group Fields)</h3>
            <select
              value={selectedGroupFields}
              onChange={(e) => setSelectedGroupFields(e.target.value)}
            >
              <option value="">Select group field</option>
              {groupFields.map(field => (
                <option key={field.id} value={field.id}>{field.label}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h3>Aggregate Function</h3>
            <select value={aggFunction} onChange={(e) => setAggFunction(e.target.value)}>
              <option value="NONE">None</option>
              <option value="SUM">Sum</option>
              <option value="AVG">Average</option>
              <option value="COUNT">Count</option>
              <option value="MAX">Maximum</option>
              <option value="MIN">Minimum</option>
            </select>
          </div>

          <div className="form-section">
            <h3>Measure Fields</h3>
            <select
              value={selectedMeasureFields}
              onChange={(e) => setSelectedMeasureFields(e.target.value)}
            >
              <option value="">Select measure field</option>
              {measureFields.map(field => (
                <option key={field.id} value={field.id}>{field.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ranking and Chart */}
        <div className="form-row">
          <div className="form-section">
            <h3>Result Mode</h3>
            <select value={rankingMode} onChange={(e) => setRankingMode(e.target.value)}>
              <option value="Top">Top</option>
              <option value="Bottom">Bottom</option>
              <option value="Full table">Full Table</option>
            </select>
          </div>

          <div className="form-section">
            <h3>Limit</h3>
            <input
              type="number"
              min="1"
              max="1000000"
              value={limitN}
              onChange={(e) => setLimitN(e.target.value)}
              disabled={rankingMode === "Full table"}
            />
          </div>

          <div className="form-section">
            <h3>Chart Type</h3>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="Bar">Bar</option>
              <option value="Line">Line</option>
              <option value="Scatter">Scatter</option>
              <option value="Area">Area</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="run-analytics-btn primary"
            onClick={handleRunAnalytics}
            disabled={loading}
          >
            {loading ? "Running..." : "Run Analytics"}
          </button>
          <button
            className="run-analytics-btn secondary"
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
          >
            Clear All Filters
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Results */}
      {analyticsResult && (
        <div className="results-section">
          <h3>Analytics Results</h3>
          {analyticsResult.truncated && (
            <p className="warning">Results were truncated for performance.</p>
          )}

          {analyticsResult.data.length === 0 ? (
            <p className="no-data-message">
              No rows returned. Try widening the date range or removing filters.
            </p>
          ) : (
            <>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(analyticsResult.data[0] || {}).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsResult.data.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="chart-container">
                {renderChart()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}