import React, { useEffect, useState } from "react";
import API from "../services/api";
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
  ArcElement
} from "chart.js";
import { Bar, Line, Scatter, Doughnut } from "react-chartjs-2";
import "../styles/Chat.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const PIE_COLORS = ["#2563EB", "#059669", "#F59E0B", "#DC2626", "#7C3AED"];
const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20
};
const TOP_LIMIT_PATTERN = /\b(top|first)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/i;
const CITY_PATTERN = /\b(from|in|at)\s+([A-Za-z][A-Za-z .'-]*?)(?=\s+(?:for|by|with|where|and|top|sales|stores|store|products|product|revenue|quantity)\b|$)/i;

export default function Chat() {
  const [query, setQuery] = useState("");
  const [topQueries, setTopQueries] = useState([]);
  const [recentLimits, setRecentLimits] = useState({});
  const [recentCities, setRecentCities] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTopQueries();
  }, []);

  const fetchTopQueries = async () => {
    try {
      const res = await API.get("/queries/top?limit=20");
      setTopQueries(res.data.queries || []);
    } catch (err) {
      console.error("Failed to load top queries", err);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const clearRecentQueries = async () => {
    if (loading) return;

    try {
      await API.delete("/queries/top");
      setTopQueries([]);
      setRecentLimits({});
      setRecentCities({});
    } catch (err) {
      console.error("Failed to clear recent queries", err);
      alert("Error clearing recent queries");
    }
  };

  const getTopLimit = (text) => {
    const match = TOP_LIMIT_PATTERN.exec(text || "");
    if (!match) return null;

    const rawLimit = match[2].toLowerCase();
    return /^\d+$/.test(rawLimit) ? Number(rawLimit) : NUMBER_WORDS[rawLimit];
  };

  const updateRecentLimit = (index, value) => {
    if (value === "") {
      setRecentLimits((prev) => ({ ...prev, [index]: "" }));
      return;
    }

    const parsedLimit = Number(value);
    if (!Number.isFinite(parsedLimit)) return;

    const nextLimit = Math.min(Math.max(parsedLimit, 1), 100);
    setRecentLimits((prev) => ({ ...prev, [index]: nextLimit }));
  };

  const buildRecentQuery = (item, index) => {
    let nextQuery = item.query;
    const originalLimit = getTopLimit(nextQuery);
    const selectedLimit = recentLimits[index] ?? originalLimit;

    if (originalLimit && selectedLimit) {
      nextQuery = nextQuery.replace(
        TOP_LIMIT_PATTERN,
        (_, keyword) => `${keyword} ${selectedLimit}`
      );
    }

    const selectedCity = recentCities[index];
    if (selectedCity) {
      nextQuery = nextQuery.replace(
        CITY_PATTERN,
        (_, keyword) => `${keyword} ${selectedCity.trim()}`
      );
    }

    return nextQuery;
  };

  const getCityValue = (text) => {
    const match = CITY_PATTERN.exec(text || "");
    if (!match) return "";
    return match[2].trim();
  };

  const updateRecentCity = (index, value) => {
    setRecentCities((prev) => ({ ...prev, [index]: value }));
  };

  const submitQuery = async (text, clearInput = false) => {
    const trimmedQuery = text.trim();
    if (!trimmedQuery || loading) return;

    const payload = { query: trimmedQuery };

    const userMessage = {
      type: "user",
      text: trimmedQuery
    };

    setLoading(true);

    try {
      const res = await API.post("/query", payload);

      const botMessage = {
        type: "bot",
        answer: res.data.answer || res.data.error,
        data: res.data.data || [],
        chart: res.data.chart,
        cached: Boolean(res.data.cached),
        cacheHitCount: res.data.cache_hit_count
      };

      setMessages((prev) => [...prev, userMessage, botMessage]);
      if (clearInput) setQuery("");
      fetchTopQueries();
    } catch (err) {
      console.error(err);
      alert("Error fetching response");
    } finally {
      setLoading(false);
    }
  };

  const sendQuery = () => {
    submitQuery(query, true);
  };

  const renderChart = (data, chart) => {
    if (!chart || !data || data.length === 0 || !chart.x || !chart.y) return null;

    const labels = data.map(item => item[chart.x]);
    const dataValues = data.map(item => item[chart.y]);

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#f4f7ff",
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#f4f7ff",
          bodyColor: "#f4f7ff",
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

    if (chart.type === "bar") {
      return (
        <div style={{ height: "300px", position: "relative" }}>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: chart.y,
                  data: dataValues,
                  backgroundColor: "rgba(37, 99, 235, 0.6)",
                  borderColor: "rgba(37, 99, 235, 1)",
                  borderWidth: 2,
                },
              ],
            }}
            options={commonOptions}
          />
        </div>
      );
    }

    if (chart.type === "line") {
      return (
        <div style={{ height: "300px", position: "relative" }}>
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: chart.y,
                  data: dataValues,
                  borderColor: "rgba(5, 150, 105, 1)",
                  backgroundColor: "rgba(5, 150, 105, 0.1)",
                  borderWidth: 2,
                  tension: 0.4,
                },
              ],
            }}
            options={commonOptions}
          />
        </div>
      );
    }

    if (chart.type === "scatter") {
      return (
        <div style={{ height: "300px", position: "relative" }}>
          <Scatter
            data={{
              labels,
              datasets: [
                {
                  label: chart.y,
                  data: data.map((item, idx) => ({
                    x: idx,
                    y: item[chart.y],
                  })),
                  borderColor: "rgba(124, 58, 237, 1)",
                  backgroundColor: "rgba(124, 58, 237, 0.6)",
                  pointRadius: 8,
                  pointHoverRadius: 10,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                ...commonOptions.scales,
                x: {
                  ...commonOptions.scales.x,
                  type: "linear",
                },
              },
            }}
          />
        </div>
      );
    }

    if (chart.type === "pie") {
      return (
        <div style={{ height: "300px", position: "relative" }}>
          <Doughnut
            data={{
              labels,
              datasets: [
                {
                  data: dataValues,
                  backgroundColor: PIE_COLORS.slice(0, dataValues.length),
                  borderColor: "#0F172A",
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: true,
                  position: "bottom",
                  labels: {
                    color: "#f4f7ff",
                    font: { size: 12 },
                    padding: 15,
                  },
                },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#f4f7ff",
                  bodyColor: "#f4f7ff",
                },
              },
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <p className="chat-kicker">Analytics Workspace</p>
          <h2 className="chat-title">AI Data Assistant</h2>
        </div>
        <div className="chat-status-strip">
          <span>{topQueries.length} recent</span>
          <span>{loading ? "Running" : "Ready"}</span>
        </div>
      </div>

      <section className="top-query-panel">
        <div className="top-query-header">
          <div>
            <p className="section-kicker">Saved patterns</p>
            <h3>Recent Queries</h3>
          </div>
          <div className="top-query-actions">
            <span>{topQueries.length}/20</span>
            <button
              type="button"
              onClick={clearRecentQueries}
              disabled={loading || topQueries.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="top-query-list">
          {topQueries.length === 0 && (
            <p className="top-query-empty">No recent queries yet.</p>
          )}

          {topQueries.map((item, index) => {
            const originalLimit = getTopLimit(item.query);
            const selectedLimit = recentLimits[index] ?? originalLimit ?? "";
            const originalCity = getCityValue(item.query);
            const selectedCity = recentCities[index] || originalCity;
            const queryToRun = buildRecentQuery(item, index);

            return (
              <div className="top-query-row" key={`${item.query}-${index}`}>
                <button
                  className="top-query-button"
                  onClick={() => submitQuery(queryToRun)}
                  disabled={loading}
                >
                  <span className="top-query-text">{queryToRun}</span>
                  <span className="top-query-meta">
                    <span>{item.cache_hits ? `${item.cache_hits} cache hits` : "Saved answer"}</span>
                    {originalLimit && <span>Top {selectedLimit}</span>}
                    {originalCity && <span>{selectedCity}</span>}
                  </span>
                </button>

                <div className="top-query-controls">
                  {originalLimit && (
                    <input
                      type="number"
                      className="top-query-limit-input"
                      min="1"
                      max="100"
                      step="1"
                      aria-label="Top result count"
                      title="Top result count"
                      value={selectedLimit}
                      onChange={(e) => updateRecentLimit(index, e.target.value)}
                    />
                  )}

                  {originalCity && (
                    <input
                      type="text"
                      className="top-query-city-input"
                      aria-label="City"
                      title="City"
                      value={selectedCity}
                      onChange={(e) => updateRecentCity(index, e.target.value)}
                    />
                  )}

                  <button
                    type="button"
                    className="top-query-run"
                    onClick={() => submitQuery(queryToRun)}
                    disabled={loading}
                  >
                    Run
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="chat-window">
        <div className="chat-window-header">
          <div>
            <p className="section-kicker">Conversation</p>
            <h3>Results</h3>
          </div>
          <button type="button" onClick={clearChat} disabled={messages.length === 0}>
            Clear Chat
          </button>
        </div>

        <div className="chat-box">
          {messages.length === 0 && (
            <div className="chat-empty">
              <span>Ready</span>
              <p>No messages yet.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.type === "user" ? "is-user" : "is-bot"}`}>
              {msg.type === "user" && (
                <div className="chat-user">
                  <span>{msg.text}</span>
                </div>
              )}

              {msg.type === "bot" && (
                <div className="chat-bot">
                  <div className="answer-heading">
                    <b>Answer</b>
                    <span className={msg.cached ? "cache-badge hit" : "cache-badge fresh"}>
                      {msg.cached ? "Cached" : "Fresh"}
                      {msg.cacheHitCount ? ` #${msg.cacheHitCount}` : ""}
                    </span>
                  </div>
                  <p>{msg.answer}</p>
                  <div className="chart-container">
                    {renderChart(msg.data, msg.chart)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="chat-input-area">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendQuery();
          }}
          placeholder="Ask your data question..."
          className="chat-input"
        />
        <button onClick={sendQuery} className="chat-button" disabled={loading}>
          {loading ? "Asking" : "Ask"}
        </button>
      </div>
    </div>
  );
}
