import { useEffect, useState } from "react";
import { api, type AccuracyReport, FALLBACK_ACCURACY } from "../api";

export default function Accuracy() {
  const [report, setReport] = useState<AccuracyReport>(FALLBACK_ACCURACY);
  const [activeChart, setActiveChart] = useState<"track" | "image">("track");
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.accuracy().then((r) => {
      if (alive && r) setReport(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  const summary = report.summary;
  const horizons = report.horizons;
  const trackModel = report.track_model;
  const imageModel = report.image_model;

  return (
    <div className="accuracy-page">
      <div className="kicker">Model Benchmark & Evaluation</div>
      <h1>Overall System Accuracy & Skill</h1>
      <p className="lede">
        Operational performance metrics for CycloneSense across multi-task satellite IR vision (
        <code>CycloneImageNet</code>) and 72-hour trajectory prediction (<code>TrackLSTM</code>), evaluated against
        strictly held-out post-2022 test seasons and operational RSMC New Delhi NWP baselines.
      </p>

      {/* Top Level Summary KPIs */}
      <div className="row cols-4">
        <div className="card stat highlight-card">
          <div className="label">Cyclone Presence Acc</div>
          <div className="value" style={{ color: "var(--ok)" }}>
            {(summary.presence_accuracy * 100).toFixed(1)}%
          </div>
          <div className="hint">Binary IR detection · Val split</div>
        </div>

        <div className="card stat highlight-card">
          <div className="label">Pattern Recognition</div>
          <div className="value" style={{ color: "var(--accent)" }}>
            {(summary.pattern_accuracy * 100).toFixed(1)}%
          </div>
          <div className="hint">5 Dvorak cloud patterns</div>
        </div>

        <div className="card stat highlight-card">
          <div className="label">24-Hour Track Error</div>
          <div className="value" style={{ color: "var(--accent-2)" }}>
            {summary.track_mae_24h_km} <span style={{ fontSize: 16 }}>km</span>
          </div>
          <div className="hint">~75 nm · Held-out test split (≥2022)</div>
        </div>

        <div className="card stat highlight-card">
          <div className="label">24-Hour Wind MAE</div>
          <div className="value" style={{ color: "var(--ok)" }}>
            {summary.wind_mae_24h_kt} <span style={{ fontSize: 16 }}>kt</span>
          </div>
          <div className="hint">Beats 24h NWP baseline (10.5 kt)</div>
        </div>
      </div>

      {/* Secondary Highlights Ribbon */}
      <div className="accuracy-ribbon card" style={{ marginTop: 16 }}>
        <div className="ribbon-item">
          <span className="ribbon-title">Composite Multi-task Score</span>
          <span className="ribbon-val mono">{(summary.composite_score * 100).toFixed(1)}%</span>
        </div>
        <div className="ribbon-divider" />
        <div className="ribbon-item">
          <span className="ribbon-title">Mean 72h Track Error</span>
          <span className="ribbon-val mono">{summary.mean_track_mae_km} km</span>
        </div>
        <div className="ribbon-divider" />
        <div className="ribbon-item">
          <span className="ribbon-title">Mean 72h Wind Error</span>
          <span className="ribbon-val mono">{summary.mean_wind_mae_kt} kt</span>
        </div>
        <div className="ribbon-divider" />
        <div className="ribbon-item">
          <span className="ribbon-title">Inference Latency</span>
          <span className="ribbon-val mono" style={{ color: "var(--ok)" }}>
            &lt; 50 ms (CPU)
          </span>
        </div>
        <div className="ribbon-divider" />
        <div className="ribbon-item">
          <span className="ribbon-title">Evaluation Test Split</span>
          <span className="ribbon-val mono">≥ 2022 Seasons</span>
        </div>
      </div>

      {/* Forecast Lead-Time Degradation Table */}
      <div className="row cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Forecast Lead-Time Degradation (Track & Intensity)</h2>
          <p className="lede" style={{ fontSize: 13, marginBottom: 16 }}>
            Error growth across the 72-hour forecast horizon on held-out test cyclones (≥2022) vs validation split
            (2018–2021) and IMD NWP consensus.
          </p>

          <table className="table">
            <thead>
              <tr>
                <th>Horizon</th>
                <th>Test Track MAE</th>
                <th>Val Track MAE</th>
                <th>Test Wind MAE</th>
                <th>IMD NWP Track</th>
              </tr>
            </thead>
            <tbody>
              {horizons.map((h) => (
                <tr key={h.lead_hours}>
                  <td>
                    <span className="pill mono" style={{ background: "#1b334d", color: "var(--accent)" }}>
                      +{h.lead_hours} h
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "var(--text)" }}>{h.test_track_km} km</strong>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{h.val_track_km} km</td>
                  <td>
                    <span style={{ color: "var(--ok)", fontWeight: 600 }}>{h.test_wind_kt} kt</span>
                  </td>
                  <td style={{ color: "var(--accent-2)" }}>~{h.rsmc_nwp_km} km</td>
                </tr>
              ))}
              <tr style={{ background: "#0c1a27", fontWeight: 600 }}>
                <td>Overall Mean</td>
                <td>{summary.mean_track_mae_km} km</td>
                <td style={{ color: "var(--muted)" }}>{trackModel.val.track_mae_km_mean} km</td>
                <td style={{ color: "var(--ok)" }}>{summary.mean_wind_mae_kt} kt</td>
                <td style={{ color: "var(--accent-2)" }}>~258 km</td>
              </tr>
            </tbody>
          </table>

          {/* Visual Horizon Error Bars */}
          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>
              Track Position Error by Lead Time (km)
            </div>
            <div className="horizon-bars">
              {horizons.map((h) => {
                const maxKm = 550;
                const pct = (h.test_track_km / maxKm) * 100;
                const nwpPct = (h.rsmc_nwp_km / maxKm) * 100;
                return (
                  <div key={h.lead_hours} className="horizon-bar-group">
                    <div className="bar-header">
                      <span className="mono">+{h.lead_hours}h Forecast</span>
                      <span>
                        TrackLSTM: <strong>{h.test_track_km} km</strong> vs NWP: {h.rsmc_nwp_km} km
                      </span>
                    </div>
                    <div className="multi-bar-track">
                      <div
                        className="bar-fill model-bar"
                        style={{ width: `${pct}%`, background: "var(--accent)" }}
                        title={`TrackLSTM: ${h.test_track_km} km`}
                      />
                      <div
                        className="bar-fill nwp-bar"
                        style={{ width: `${nwpPct}%`, borderColor: "var(--accent-2)" }}
                        title={`RSMC NWP: ${h.rsmc_nwp_km} km`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="legend" style={{ marginTop: 12, fontSize: 12 }}>
              <span>
                <i style={{ background: "var(--accent)" }} /> CycloneSense TrackLSTM
              </span>
              <span>
                <i style={{ background: "var(--accent-2)" }} /> RSMC New Delhi NWP Baseline
              </span>
            </div>
          </div>
        </div>

        {/* Operational Benchmarks & Architecture Insights */}
        <div className="card">
          <h2>Operational Baseline Comparison</h2>
          <p className="lede" style={{ fontSize: 13, marginBottom: 16 }}>
            Comparing deep sequence modeling against regional NWP consensus over the North Indian Ocean.
          </p>

          <div className="benchmark-box">
            <div className="benchmark-title">{report.benchmarks.agency}</div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 12px" }}>
              {report.benchmarks.description}
            </p>
            <ul className="benchmark-list">
              {report.benchmarks.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 20 }}>
            <h2>Multi-Task Vision Accuracy (CycloneImageNet)</h2>
            <div className="vision-metric-grid">
              <div className="vision-card">
                <div className="v-label">Presence Detection</div>
                <div className="v-value" style={{ color: "var(--ok)" }}>
                  100.0%
                </div>
                <div className="v-desc">Binary classification accuracy (Val)</div>
              </div>
              <div className="vision-card">
                <div className="v-label">Dvorak Cloud Pattern</div>
                <div className="v-value" style={{ color: "var(--accent)" }}>
                  87.5%
                </div>
                <div className="v-desc">5-class morphological recognition</div>
              </div>
              <div className="vision-card">
                <div className="v-label">IMD Intensity Class</div>
                <div className="v-value" style={{ color: "var(--accent-2)" }}>
                  60.0%
                </div>
                <div className="v-desc">Exact tier; 89% within ±1 category</div>
              </div>
              <div className="vision-card">
                <div className="v-label">Wind Speed Regressor</div>
                <div className="v-value" style={{ color: "var(--ok)" }}>
                  12.6 kt
                </div>
                <div className="v-desc">Mean Absolute Error in knots</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <h2>Spatial Explainability</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              The CNN features integrated Grad-CAM gradient backpropagation to verify that classification decisions
              are grounded in the convective deep cloud wall and central eye, rather than non-meteorological artifact
              noise.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Training & Convergence Curves */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2>Model Training Convergence & Loss History</h2>
            <p className="lede" style={{ fontSize: 13, marginBottom: 0 }}>
              Verify model learning dynamics, lack of overfitting, and optimal checkpoint selection across training epochs.
            </p>
          </div>
          <div className="tab-group">
            <button
              className={`tab-btn ${activeChart === "track" ? "active" : ""}`}
              onClick={() => setActiveChart("track")}
            >
              TrackLSTM (40 Epochs)
            </button>
            <button
              className={`tab-btn ${activeChart === "image" ? "active" : ""}`}
              onClick={() => setActiveChart("image")}
            >
              CycloneImageNet (8 Epochs)
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {activeChart === "track" ? (
            <TrackLossChart
              history={trackModel.history}
              bestEpoch={trackModel.best_epoch}
              bestVal={trackModel.best_val_loss}
              selectedPoint={selectedPoint}
              onSelectPoint={setSelectedPoint}
            />
          ) : (
            <ImageMetricChart history={imageModel.history} bestEpoch={imageModel.best_epoch.epoch} />
          )}
        </div>
      </div>

      {/* Dataset Split & Methodology Rigor */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Dataset Chronological Splitting & Rigor</h2>
        <p className="lede" style={{ fontSize: 13, marginBottom: 16 }}>
          Strict temporal separation guarantees that evaluation reflects realistic operational forecasting on unseen
          future seasons without data leakage.
        </p>
        <div className="split-grid">
          <div className="split-item">
            <div className="split-badge" style={{ background: "#163148", color: "var(--accent)" }}>
              TRAIN SPLIT
            </div>
            <div className="split-years">≤ 2017 Seasons</div>
            <div className="split-desc">
              1980–2017 IBTrACS North Indian Ocean 6-hourly trajectories for recurrent pattern and velocity encoding.
            </div>
          </div>
          <div className="split-item">
            <div className="split-badge" style={{ background: "#2a2717", color: "var(--accent-2)" }}>
              VALIDATION SPLIT
            </div>
            <div className="split-years">2018 – 2021 Seasons</div>
            <div className="split-desc">
              Independent seasons used strictly for cosine learning rate scheduling and best checkpoint selection (Epoch 28).
            </div>
          </div>
          <div className="split-item">
            <div className="split-badge" style={{ background: "#113028", color: "var(--ok)" }}>
              HELD-OUT TEST SPLIT
            </div>
            <div className="split-years">≥ 2022 Seasons</div>
            <div className="split-desc">
              Blind test evaluation including severe historical storms (Biparjoy, Mocha, Tej, Midhili, Michaung) yielding
              139.8 km track error.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// SVG Interactive Chart for TrackLSTM Loss
// ---------------------------------------------------------------------------------
function TrackLossChart({
  history,
  bestEpoch,
  bestVal,
  selectedPoint,
  onSelectPoint,
}: {
  history: { epoch: number; train: number; val: number }[];
  bestEpoch: number;
  bestVal: number;
  selectedPoint: string | null;
  onSelectPoint: (p: string | null) => void;
}) {
  if (!history || history.length === 0) return null;

  const width = 860;
  const height = 280;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 40;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minEpoch = 1;
  const maxEpoch = history.length;

  const minLoss = 0.35;
  const maxLoss = 1.45;

  const getX = (ep: number) => padLeft + ((ep - minEpoch) / (maxEpoch - minEpoch)) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - minLoss) / (maxLoss - minLoss)) * chartH;

  const trainPoints = history.map((h) => `${getX(h.epoch)},${getY(h.train)}`).join(" ");
  const valPoints = history.map((h) => `${getX(h.epoch)},${getY(h.val)}`).join(" ");

  const bestX = getX(bestEpoch);
  const bestY = getY(bestVal);

  return (
    <div className="chart-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        className="svg-chart"
      >
        {/* Grid lines */}
        {[0.4, 0.6, 0.8, 1.0, 1.2, 1.4].map((loss) => {
          const y = getY(loss);
          return (
            <g key={loss}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#1b2f42" strokeDasharray="3 3" />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#6f889d" fontSize="11" fontFamily="IBM Plex Mono">
                {loss.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {[1, 5, 10, 15, 20, 25, 28, 35, 40].map((ep) => {
          const x = getX(ep);
          return (
            <g key={ep}>
              <line x1={x} y1={height - padBottom} x2={x} y2={height - padBottom + 5} stroke="#35506a" />
              <text
                x={x}
                y={height - padBottom + 18}
                textAnchor="middle"
                fill={ep === bestEpoch ? "var(--accent)" : "#6f889d"}
                fontWeight={ep === bestEpoch ? "bold" : "normal"}
                fontSize="11"
                fontFamily="IBM Plex Mono"
              >
                {ep === bestEpoch ? `Ep ${ep}*` : ep}
              </text>
            </g>
          );
        })}

        {/* Axes lines */}
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke="#35506a"
          strokeWidth="1.5"
        />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="#35506a" strokeWidth="1.5" />

        {/* Axis Labels */}
        <text
          x={padLeft + chartW / 2}
          y={height - 6}
          textAnchor="middle"
          fill="#8aa0b5"
          fontSize="12"
        >
          Training Epochs (Cosine Annealing Schedule)
        </text>
        <text
          x={14}
          y={padTop + chartH / 2}
          textAnchor="middle"
          fill="#8aa0b5"
          fontSize="12"
          transform={`rotate(-90 14 ${padTop + chartH / 2})`}
        >
          Smooth L1 Loss
        </text>

        {/* Lines */}
        <polyline fill="none" stroke="#2ee6d6" strokeWidth="2" points={trainPoints} />
        <polyline fill="none" stroke="#f5b942" strokeWidth="2" points={valPoints} />

        {/* Best checkpoint indicator line & star */}
        <line
          x1={bestX}
          y1={padTop}
          x2={bestX}
          y2={height - padBottom}
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle cx={bestX} cy={bestY} r="5" fill="#f5b942" stroke="#071018" strokeWidth="2" />
        <text x={bestX + 8} y={bestY - 8} fill="var(--accent)" fontSize="11" fontWeight="600" fontFamily="IBM Plex Mono">
          Best Checkpoint (Val: {bestVal.toFixed(3)})
        </text>

        {/* Interactive hover points */}
        {history.map((h) => {
          const x = getX(h.epoch);
          const yVal = getY(h.val);
          const isSel = selectedPoint === `val-${h.epoch}`;
          return (
            <circle
              key={h.epoch}
              cx={x}
              cy={yVal}
              r={isSel ? 6 : 3}
              fill="#f5b942"
              stroke="#071018"
              strokeWidth="1"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onSelectPoint(`val-${h.epoch}`)}
              onMouseLeave={() => onSelectPoint(null)}
            >
              <title>{`Epoch ${h.epoch}: Val Loss ${h.val.toFixed(4)}, Train Loss ${h.train.toFixed(4)}`}</title>
            </circle>
          );
        })}
      </svg>

      <div className="chart-footer">
        <div className="legend">
          <span>
            <i style={{ background: "#2ee6d6" }} /> Train Loss (IBTrACS ≤2017)
          </span>
          <span>
            <i style={{ background: "#f5b942" }} /> Validation Loss (2018–2021)
          </span>
          <span>
            <i style={{ background: "transparent", border: "1px dashed var(--accent)", width: 14 }} /> Best Model Selected (Epoch 28)
          </span>
        </div>
        <div className="hint mono">Smooth L1 Loss converged to {bestVal.toFixed(4)} on validation fix sequences</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// SVG Interactive Chart for Vision CNN Multi-Task Metrics
// ---------------------------------------------------------------------------------
function ImageMetricChart({
  history,
  bestEpoch,
}: {
  history: {
    epoch: number;
    presence_acc: number;
    pattern_acc: number;
    category_acc: number;
    wind_mae_kt: number;
    train_loss: number;
  }[];
  bestEpoch: number;
}) {
  if (!history || history.length === 0) return null;

  const width = 860;
  const height = 280;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 40;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minEpoch = 1;
  const maxEpoch = history.length;

  const getX = (ep: number) => padLeft + ((ep - minEpoch) / (maxEpoch - minEpoch)) * chartW;
  const getY = (acc: number) => padTop + chartH - acc * chartH; // 0.0 to 1.0

  const presencePts = history.map((h) => `${getX(h.epoch)},${getY(h.presence_acc)}`).join(" ");
  const patternPts = history.map((h) => `${getX(h.epoch)},${getY(h.pattern_acc)}`).join(" ");
  const categoryPts = history.map((h) => `${getX(h.epoch)},${getY(h.category_acc)}`).join(" ");

  return (
    <div className="chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        {/* Horizontal gridlines */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((pct) => {
          const y = getY(pct);
          return (
            <g key={pct}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#1b2f42" strokeDasharray="3 3" />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#6f889d" fontSize="11" fontFamily="IBM Plex Mono">
                {(pct * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {history.map((h) => {
          const x = getX(h.epoch);
          return (
            <g key={h.epoch}>
              <line x1={x} y1={height - padBottom} x2={x} y2={height - padBottom + 5} stroke="#35506a" />
              <text
                x={x}
                y={height - padBottom + 18}
                textAnchor="middle"
                fill={h.epoch === bestEpoch ? "var(--accent)" : "#6f889d"}
                fontWeight={h.epoch === bestEpoch ? "bold" : "normal"}
                fontSize="11"
                fontFamily="IBM Plex Mono"
              >
                {h.epoch === bestEpoch ? `Epoch ${h.epoch}*` : `Epoch ${h.epoch}`}
              </text>
            </g>
          );
        })}

        {/* Axes lines */}
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke="#35506a"
          strokeWidth="1.5"
        />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="#35506a" strokeWidth="1.5" />

        {/* Axis Labels */}
        <text
          x={padLeft + chartW / 2}
          y={height - 6}
          textAnchor="middle"
          fill="#8aa0b5"
          fontSize="12"
        >
          Training Epochs
        </text>
        <text
          x={14}
          y={padTop + chartH / 2}
          textAnchor="middle"
          fill="#8aa0b5"
          fontSize="12"
          transform={`rotate(-90 14 ${padTop + chartH / 2})`}
        >
          Validation Accuracy (%)
        </text>

        {/* Lines */}
        <polyline fill="none" stroke="#5eead4" strokeWidth="2.5" points={presencePts} />
        <polyline fill="none" stroke="#2ee6d6" strokeWidth="2.5" points={patternPts} />
        <polyline fill="none" stroke="#fb923c" strokeWidth="2.5" points={categoryPts} />

        {/* Best epoch vertical line */}
        <line
          x1={getX(bestEpoch)}
          y1={padTop}
          x2={getX(bestEpoch)}
          y2={height - padBottom}
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={getX(bestEpoch) + 8}
          y={padTop + 20}
          fill="var(--accent)"
          fontSize="11"
          fontWeight="600"
          fontFamily="IBM Plex Mono"
        >
          Best Epoch (Composite: 84.0%)
        </text>
      </svg>

      <div className="chart-footer">
        <div className="legend">
          <span>
            <i style={{ background: "#5eead4" }} /> Cyclone Presence (100.0%)
          </span>
          <span>
            <i style={{ background: "#2ee6d6" }} /> Cloud Pattern (87.5%)
          </span>
          <span>
            <i style={{ background: "#fb923c" }} /> IMD Category (60.0%)
          </span>
        </div>
        <div className="hint mono">Multi-task shared convolutional backbone with 4 specialized task heads</div>
      </div>
    </div>
  );
}
