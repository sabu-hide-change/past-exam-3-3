// npm install lucide-react recharts firebase
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Check, X, Home, ChevronRight, RefreshCw, BarChart2, BookOpen, User, ArrowRight, HelpCircle } from "lucide-react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// データの分離用ID
const APP_ID = "QuizApp_Production_Planning_3_3_Past_001";

// Firebase設定
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase初期化 (防衛的)
let app;
let db;
let auth;
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully for APP_ID:", APP_ID);
  } else {
    console.warn("Firebase credentials missing. Local fallback active.");
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// ==========================================
// インラインSVG & HTML 図表コンポーネント
// ==========================================

// 問題1用の生産計画テーブル
const Q1Table = ({ showExplanation = false }) => (
  <div className="my-6 overflow-x-auto">
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-lg mx-auto shadow-inner text-xs">
      <div className="text-center font-bold text-slate-300 mb-2">需要量と各計画案（ロット生産）</div>
      <table className="w-full text-center border-collapse border border-slate-700 bg-slate-950/60 rounded overflow-hidden">
        <thead>
          <tr className="bg-slate-800 text-slate-200">
            <th className="border border-slate-700 p-1.5 font-bold">項目</th>
            <th className="border border-slate-700 p-1.5">1日目</th>
            <th className="border border-slate-700 p-1.5">2日目</th>
            <th className="border border-slate-700 p-1.5">3日目</th>
            <th className="border border-slate-700 p-1.5">4日目</th>
            <th className="border border-slate-700 p-1.5">5日目</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-700 p-1.5 bg-slate-800/40 text-slate-300 font-semibold">需要量 (個)</td>
            <td className="border border-slate-700 p-1.5">120</td>
            <td className="border border-slate-700 p-1.5">160</td>
            <td className="border border-slate-700 p-1.5">180</td>
            <td className="border border-slate-700 p-1.5">100</td>
            <td className="border border-slate-700 p-1.5">140</td>
          </tr>
          <tr className="border-t border-slate-800">
            <td className="border border-slate-700 p-1.5 bg-slate-800/40 text-slate-400">案 0 (生産量)</td>
            <td className="border border-slate-700 p-1.5 bg-indigo-950/20">700</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
          </tr>
          <tr>
            <td className="border border-slate-700 p-1.5 bg-slate-800/40 text-slate-400">案 1 (生産量)</td>
            <td className="border border-slate-700 p-1.5 bg-sky-950/20">280</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5 bg-sky-950/20">420</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
          </tr>
          <tr className="bg-emerald-950/10">
            <td className="border border-slate-700 p-1.5 bg-slate-800/40 text-slate-300 font-bold">案 2 (生産量)</td>
            <td className="border border-slate-700 p-1.5 bg-emerald-950/30 font-semibold">280</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5 bg-emerald-950/30 font-semibold">420</td>
            <td className="border border-slate-700 p-1.5">0</td>
          </tr>
          <tr>
            <td className="border border-slate-700 p-1.5 bg-slate-800/40 text-slate-400">案 3 (生産量)</td>
            <td className="border border-slate-700 p-1.5 bg-sky-950/20">460</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5 bg-sky-950/20">240</td>
            <td className="border border-slate-700 p-1.5">0</td>
          </tr>
          <tr>
            <td className="border border-slate-700 p-1.5 bg-slate-800/40 text-slate-400">案 4 (生産量)</td>
            <td className="border border-slate-700 p-1.5 bg-sky-950/20">460</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5">0</td>
            <td className="border border-slate-700 p-1.5 bg-sky-950/20">240</td>
          </tr>
        </tbody>
      </table>

      {showExplanation && (
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded text-slate-300">
          <div className="font-bold text-emerald-400 mb-1">【解説：在庫費用比較】</div>
          <div className="space-y-1 leading-relaxed">
            <div>・<strong>案 1</strong>: 繰越在庫量(個) ＝ (1日目:160, 2日目:0, 3日目:240, 4日目:140) ＝ 合計 540個 ＝ 在庫費 5,400円 ＋ 段取り費 10,000円 ＝ <strong>15,400円</strong></div>
            <div className="text-emerald-400 font-semibold">・<strong>案 2</strong>: 繰越在庫量(個) ＝ (1日目:160, 2日目:0, 3日目:0, 4日目:320, 5日目:140) ＝ 合計 480個 ＝ 在庫費 4,800円 ＋ 段取り費 10,000円 ＝ <strong>14,800円 (最小)</strong></div>
            <div>・<strong>案 3</strong>: 繰越在庫量(個) ＝ (1日目:340, 2日目:180, 3日目:0, 4日目:140, 5日目:0) ＝ 合計 660個 ＝ 在庫費 6,600円 ＋ 段取り費 10,000円 ＝ <strong>16,600円</strong></div>
            <div>・<strong>案 4</strong>: 繰越在庫量(個) ＝ (1日目:340, 2日目:180, 3日目:0, 4日目:0, 5日目:100) ＝ 合計 620個 ＝ 在庫費 6,200円 ＋ 段取り費 10,000円 ＝ <strong>16,200円</strong></div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// 問題4用のPERT図（最早・最遅、クリティカルパスの出し分け対応）
const Q4PERT = ({ showExplanation = false }) => {
  // SVG座標
  const nodes = [
    { id: 1, x: 60, y: 150, es: 0, ls: 0 },
    { id: 2, x: 200, y: 90, es: 3, ls: 3 },
    { id: 3, x: 380, y: 90, es: 5, ls: 6 },
    { id: 4, x: 320, y: 220, es: 6, ls: 6 },
    { id: 5, x: 520, y: 150, es: 9, ls: 9 }
  ];

  const arrows = [
    { from: 1, to: 2, label: "A (3日)", textX: 130, textY: 110, isCritical: true },
    { from: 1, to: 4, label: "B (4日)", textX: 170, textY: 200, isCritical: false },
    { from: 2, to: 4, label: "C (3日)", textX: 250, textY: 165, isCritical: true },
    { from: 2, to: 3, label: "D (2日)", textX: 290, textY: 75, isCritical: false },
    { from: 3, to: 4, label: "ダミー", textX: 360, textY: 160, isDummy: true, isCritical: false },
    { from: 3, to: 5, label: "F (3日)", textX: 460, textY: 110, isCritical: false },
    { from: 4, to: 5, label: "E (3日)", textX: 430, textY: 200, isCritical: true }
  ];

  return (
    <div className="my-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-2xl mx-auto shadow-inner">
        <div className="text-center font-bold text-slate-300 mb-2">アローダイアグラム (PERT)</div>
        <svg viewBox="0 0 720 300" className="w-full bg-slate-950 rounded border border-slate-800/80">
          <defs>
            {/* 矢の定義 (通常青) */}
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            {/* 矢の定義 (クリティカル赤) */}
            <marker id="arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
            {/* 矢の定義 (点線ダミー青) */}
            <marker id="arrow-dummy" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748b" />
            </marker>
          </defs>

          {/* 凡例 (showExplanationがtrueの時のみ表示) */}
          {showExplanation && (
            <g transform="translate(530, 20)" className="text-[10px] fill-slate-400">
              <rect x="0" y="0" width="165" height="70" rx="4" fill="#0f172a" stroke="#1e293b" />
              <line x1="10" y1="18" x2="35" y2="18" stroke="#f43f5e" strokeWidth="2.5" />
              <text x="45" y="21" className="fill-rose-400 font-bold">クリティカルパス</text>

              <rect x="10" y="32" width="20" height="26" fill="#1e293b" stroke="#38bdf8" />
              <line x1="10" y1="45" x2="30" y2="45" stroke="#38bdf8" />
              <text x="38" y="42" className="fill-slate-300 text-[9px]">上段：最早着手日</text>
              <text x="38" y="54" className="fill-slate-300 text-[9px]">下段：最遅着手日</text>
            </g>
          )}

          {/* アロー(作業)の描画 */}
          {arrows.map((arr, idx) => {
            const fromNode = nodes.find(n => n.id === arr.from);
            const toNode = nodes.find(n => n.id === arr.to);
            
            const isCrit = showExplanation && arr.isCritical;
            const strokeColor = isCrit ? "#f43f5e" : (arr.isDummy ? "#64748b" : "#38bdf8");
            const strokeWidth = isCrit ? 2.5 : 1.5;
            const strokeDash = arr.isDummy ? "5,5" : "0";
            const markerId = isCrit ? "url(#arrow-red)" : (arr.isDummy ? "url(#arrow-dummy)" : "url(#arrow-blue)");

            return (
              <g key={idx}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  markerEnd={markerId}
                />
                <text
                  x={arr.textX}
                  y={arr.textY}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isCrit ? "bold" : "normal"}
                  className={isCrit ? "fill-rose-400" : (arr.isDummy ? "fill-slate-500" : "fill-sky-400")}
                >
                  {arr.label}
                </text>
              </g>
            );
          })}

          {/* 各ノード(結合点)の描画 */}
          {nodes.map((n) => {
            const showBox = showExplanation;

            return (
              <g key={n.id}>
                {showBox && (
                  <g transform={"translate(" + (n.x - 12) + ", " + (n.y - 70) + ")"} className="text-[10px] font-mono">
                    <rect x="0" y="0" width="24" height="30" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="2" />
                    <line x1="0" y1="15" x2="24" y2="15" stroke="#475569" strokeWidth="0.8" />
                    <text x="12" y="11" textAnchor="middle" fill="#38bdf8" fontWeight="bold">{n.es}</text>
                    <text x="12" y="26" textAnchor="middle" fill="#fda4af" fontWeight="bold">{n.ls}</text>
                    <line x1="12" y1="30" x2="12" y2="46" stroke="#475569" strokeWidth="0.8" strokeDasharray="2,2" />
                  </g>
                )}
                
                <circle cx={n.x} cy={n.y} r="18" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#f8fafc">{n.id}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// 問題5用のPERT図（最早・最遅、クリティカルパスの出し分け対応）
const Q5PERT = ({ showExplanation = false }) => {
  // SVG座標 (8個 of ノード)
  const nodes = [
    { id: 1, x: 60, y: 160, es: 0, ls: 0 },
    { id: 2, x: 180, y: 70, es: 3, ls: 6 },
    { id: 3, x: 280, y: 160, es: 4, ls: 5 },
    { id: 4, x: 400, y: 70, es: 10, ls: 11 },
    { id: 5, x: 180, y: 250, es: 5, ls: 5 },
    { id: 6, x: 400, y: 250, es: 11, ls: 11 },
    { id: 7, x: 520, y: 160, es: 16, ls: 16 },
    { id: 8, x: 640, y: 160, es: 19, ls: 19 }
  ];

  const arrows = [
    { from: 1, to: 2, label: "作業A (3h)", textX: 110, textY: 100, isCritical: false },
    { from: 1, to: 3, label: "作業B (4h)", textX: 160, textY: 150, isCritical: false },
    { from: 1, to: 5, label: "作業C (5h)", textX: 110, textY: 220, isCritical: true },
    { from: 2, to: 4, label: "作業D (5h)", textX: 290, textY: 55, isCritical: false },
    { from: 3, to: 4, label: "作業E (6h)", textX: 340, textY: 105, isCritical: false },
    { from: 3, to: 6, label: "ダミー", textX: 350, textY: 215, isDummy: true, isCritical: false },
    { from: 5, to: 6, label: "作業F (6h)", textX: 290, textY: 270, isCritical: true },
    { from: 4, to: 7, label: "作業G (5h)", textX: 470, textY: 105, isCritical: false },
    { from: 6, to: 7, label: "作業H (5h)", textX: 470, textY: 220, isCritical: true },
    { from: 7, to: 8, label: "作業I (3h)", textX: 580, textY: 150, isCritical: true }
  ];

  return (
    <div className="my-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-2xl mx-auto shadow-inner">
        <div className="text-center font-bold text-slate-300 mb-2">アローダイアグラム (PERT2)</div>
        <svg viewBox="0 0 720 340" className="w-full bg-slate-950 rounded border border-slate-800/80">
          <defs>
            <marker id="arrow-blue-5" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-red-5" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
            <marker id="arrow-dummy-5" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#64748b" />
            </marker>
          </defs>

          {showExplanation && (
            <g transform="translate(530, 15)" className="text-[10px] fill-slate-400">
              <rect x="0" y="0" width="165" height="52" rx="4" fill="#0f172a" stroke="#1e293b" />
              <line x1="10" y1="15" x2="35" y2="15" stroke="#f43f5e" strokeWidth="2.5" />
              <text x="45" y="18" className="fill-rose-400 font-bold">クリティカルパス</text>

              <rect x="10" y="27" width="18" height="20" fill="#1e293b" stroke="#38bdf8" />
              <line x1="10" y1="37" x2="28" y2="37" stroke="#38bdf8" />
              <text x="35" y="34" className="fill-slate-300 text-[8px]">上段:最早 / 下段:最遅</text>
            </g>
          )}

          {arrows.map((arr, idx) => {
            const fromNode = nodes.find(n => n.id === arr.from);
            const toNode = nodes.find(n => n.id === arr.to);
            
            const isCrit = showExplanation && arr.isCritical;
            const strokeColor = isCrit ? "#f43f5e" : (arr.isDummy ? "#64748b" : "#38bdf8");
            const strokeWidth = isCrit ? 2.5 : 1.5;
            const strokeDash = arr.isDummy ? "5,5" : "0";
            const markerId = isCrit ? "url(#arrow-red-5)" : (arr.isDummy ? "url(#arrow-dummy-5)" : "url(#arrow-blue-5)");

            return (
              <g key={idx}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  markerEnd={markerId}
                />
                <text
                  x={arr.textX}
                  y={arr.textY}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isCrit ? "bold" : "normal"}
                  className={isCrit ? "fill-rose-400" : (arr.isDummy ? "fill-slate-500" : "fill-sky-400")}
                >
                  {arr.label}
                </text>
              </g>
            );
          })}

          {nodes.map((n) => {
            const showBox = showExplanation;
            const boxYOffset = n.id === 5 || n.id === 6 ? 35 : -55;

            return (
              <g key={n.id}>
                {showBox && (
                  <g transform={"translate(" + (n.x - 11) + ", " + (n.y + boxYOffset) + ")"} className="text-[9px] font-mono">
                    <rect x="0" y="0" width="22" height="24" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="2" />
                    <line x1="0" y1="12" x2="22" y2="12" stroke="#475569" strokeWidth="0.8" />
                    <text x="11" y="9" textAnchor="middle" fill="#38bdf8" fontWeight="bold">{n.es}</text>
                    <text x="11" y="21" textAnchor="middle" fill="#fda4af" fontWeight="bold">{n.ls}</text>
                    <line x1="11" y1={boxYOffset > 0 ? 0 : 24} x2="11" y2={boxYOffset > 0 ? -15 : 36} stroke="#475569" strokeWidth="0.8" strokeDasharray="2,2" />
                  </g>
                )}
                
                <circle cx={n.x} cy={n.y} r="16" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#f8fafc">{n.id}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// 問題6用のCPMアローダイアグラムとテーブル (出し分け対応)
const Q6CPM = ({ showExplanation = false }) => {
  // SVG座標 (5個 of ノード)
  const nodes = [
    { id: 1, x: 60, y: 120, es: 0, ls: 0, esMin: 0, lsMin: 0 },
    { id: 2, x: 200, y: 120, es: 5, ls: 5, esMin: 4, lsMin: 4 },
    { id: 3, x: 320, y: 50, es: 11, ls: 12, esMin: 6, lsMin: 8 },
    { id: 4, x: 440, y: 120, es: 18, ls: 18, esMin: 11, lsMin: 11 },
    { id: 5, x: 580, y: 120, es: 23, ls: 23, esMin: 14, lsMin: 14 }
  ];

  const normalArrows = [
    { from: 1, to: 2, label: "A (5)", textX: 130, textY: 100 },
    { from: 2, to: 3, label: "B (6)", textX: 250, textY: 70 },
    { from: 3, to: 4, label: "C (7)", textX: 390, textY: 70 },
    { from: 2, to: 4, label: "D (9)", textX: 320, textY: 140 },
    { from: 4, to: 5, label: "E (5)", textX: 510, textY: 100 }
  ];

  const minArrows = [
    { from: 1, to: 2, label: "A (4)", textX: 130, textY: 100, isCritical: true },
    { from: 2, to: 3, label: "B (2)", textX: 250, textY: 70, isCritical: false },
    { from: 3, to: 4, label: "C (3)", textX: 390, textY: 70, isCritical: false },
    { from: 2, to: 4, label: "D (7)", textX: 320, textY: 140, isCritical: true },
    { from: 4, to: 5, label: "E (3)", textX: 510, textY: 100, isCritical: true }
  ];

  return (
    <div className="my-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-lg mx-auto shadow-inner text-xs">
        <div className="text-center font-bold text-slate-300 mb-2">作業要件テーブル (CPM)</div>
        <table className="w-full text-center border-collapse border border-slate-700 bg-slate-950/60 rounded overflow-hidden">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="border border-slate-700 p-1.5 font-bold">作業名</th>
              <th className="border border-slate-700 p-1.5">先行作業</th>
              <th className="border border-slate-700 p-1.5">通常期間</th>
              <th className="border border-slate-700 p-1.5 text-cyan-400">最短期間</th>
              <th className="border border-slate-700 p-1.5 text-rose-400">短縮費用/日</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-700 p-1.5 font-bold bg-slate-800/20">A</td>
              <td className="border border-slate-700 p-1.5">－</td>
              <td className="border border-slate-700 p-1.5">5日</td>
              <td className="border border-slate-700 p-1.5 text-cyan-400">4日</td>
              <td className="border border-slate-700 p-1.5 text-rose-400">10万円</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-1.5 font-bold bg-slate-800/20">B</td>
              <td className="border border-slate-700 p-1.5">A</td>
              <td className="border border-slate-700 p-1.5">6日</td>
              <td className="border border-slate-700 p-1.5 text-cyan-400">2日</td>
              <td className="border border-slate-700 p-1.5 text-rose-400">50万円</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-1.5 font-bold bg-slate-800/20">C</td>
              <td className="border border-slate-700 p-1.5">B</td>
              <td className="border border-slate-700 p-1.5">7日</td>
              <td className="border border-slate-700 p-1.5 text-cyan-400">3日</td>
              <td className="border border-slate-700 p-1.5 text-rose-400">90万円</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-1.5 font-bold bg-slate-800/20">D</td>
              <td className="border border-slate-700 p-1.5">A</td>
              <td className="border border-slate-700 p-1.5">9日</td>
              <td className="border border-slate-700 p-1.5 text-cyan-400">7日</td>
              <td className="border border-slate-700 p-1.5 text-rose-400">30万円</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-1.5 font-bold bg-slate-800/20">E</td>
              <td className="border border-slate-700 p-1.5">C, D</td>
              <td className="border border-slate-700 p-1.5">5日</td>
              <td className="border border-slate-700 p-1.5 text-cyan-400">3日</td>
              <td className="border border-slate-700 p-1.5 text-rose-400">40万円</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-2xl mx-auto shadow-inner">
        <div className="text-center font-bold text-slate-300 mb-2">
          {!showExplanation ? "【図1 所要期間のアローダイアグラム (初期状態)】" : "【図2 最短所要期間のアローダイアグラム (最短化・解説)】"}
        </div>
        <svg viewBox="0 0 660 220" className="w-full bg-slate-950 rounded border border-slate-800/80">
          <defs>
            <marker id="cpm-arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="cpm-arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
          </defs>

          {showExplanation && (
            <g transform="translate(470, 15)" className="text-[10px] fill-slate-400">
              <rect x="0" y="0" width="170" height="52" rx="4" fill="#0f172a" stroke="#1e293b" />
              <line x1="10" y1="15" x2="35" y2="15" stroke="#f43f5e" strokeWidth="2.5" />
              <text x="40" y="18" className="fill-rose-400 font-bold">クリティカルパス (14日)</text>
              <rect x="10" y="27" width="18" height="20" fill="#1e293b" stroke="#38bdf8" />
              <line x1="10" y1="37" x2="28" y2="37" stroke="#38bdf8" />
              <text x="35" y="34" className="fill-slate-300 text-[8px]">上段:最早結合点 / 下段:最遅結合点</text>
            </g>
          )}

          {/* 矢印の描画 */}
          {(!showExplanation ? normalArrows : minArrows).map((arr, idx) => {
            const fromNode = nodes.find(n => n.id === arr.from);
            const toNode = nodes.find(n => n.id === arr.to);
            const isCrit = showExplanation && arr.isCritical;

            return (
              <g key={idx}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isCrit ? "#f43f5e" : "#38bdf8"}
                  strokeWidth={isCrit ? 2.5 : 1.5}
                  markerEnd={isCrit ? "url(#cpm-arrow-red)" : "url(#cpm-arrow-blue)"}
                />
                <text
                  x={arr.textX}
                  y={arr.textY}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isCrit ? "bold" : "normal"}
                  className={isCrit ? "fill-rose-400" : "fill-sky-400"}
                >
                  {arr.label}
                </text>
              </g>
            );
          })}

          {/* ノード円と最早最遅ボックス */}
          {nodes.map((n) => {
            const esVal = showExplanation ? n.esMin : n.es;
            const lsVal = showExplanation ? n.lsMin : n.ls;

            return (
              <g key={n.id}>
                {showExplanation && (
                  <g transform={"translate(" + (n.x - 11) + ", " + (n.y + 24) + ")"} className="text-[9px] font-mono">
                    <rect x="0" y="0" width="22" height="24" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="2" />
                    <line x1="0" y1="12" x2="22" y2="12" stroke="#475569" strokeWidth="0.8" />
                    <text x="11" y="9" textAnchor="middle" fill="#38bdf8" fontWeight="bold">{esVal}</text>
                    <text x="11" y="21" textAnchor="middle" fill="#fda4af" fontWeight="bold">{lsVal}</text>
                  </g>
                )}
                <circle cx={n.x} cy={n.y} r="16" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#f8fafc">{n.id}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {showExplanation && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-2xl mx-auto shadow-inner text-xs text-slate-300">
          <div className="font-bold text-emerald-400 mb-2">【解説：最短化の短縮費用計算】</div>
          <div className="space-y-2 leading-relaxed">
            <div>初期状態のクリティカルパス：A (5日) ＋ D (9日) ＋ E (5日) ＝ <strong>19日</strong></div>
            <div>最短所要時間でのクリティカルパス：A (4日) ＋ D (7日) ＋ E (3日) ＝ <strong>14日</strong>（5日間短縮が必要）</div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono space-y-1">
              <div>・作業A：5日 → 4日 (1日短縮) ＝ 10万円 × 1 ＝ 10万円</div>
              <div>・作業D：9日 → 7日 (2日短縮) ＝ 30万円 × 2 ＝ 60万円</div>
              <div>・作業E：5日 → 3日 (2日短縮) ＝ 40万円 × 2 ＝ 80万円</div>
              <div className="text-slate-400">※クリティカルパス以外の並行パス（B, C）も14日以下にする必要がある：</div>
              <div>・作業B＋C（初期 13日 → 最短 5日）は、パス全体の短縮がA, D, Eの短縮で自然にまかなわれるか確認する。</div>
              <div>・作業Bは通常6日のところ「2日」まで4日間短縮（短縮費50万/日、計200万）か、作業Cは通常7日を「5日」まで2日間短縮（短縮費90万/日、計180万）。</div>
              <div>・費用最小化のために、短縮単価が安いBを限界の2日まで短縮(費用50万×4＝200万) ＋ Cを最短5日まで短縮(費用90万×2＝180万) ＝ 合計 380万円。</div>
              <div className="text-emerald-400 font-bold border-t border-slate-800 pt-1 mt-1 text-right">
                総最小費用：10(A) ＋ 60(D) ＋ 80(E) ＋ 200(B) ＋ 180(C) ＝ 530万円 (選択肢ウ)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 問題7用の加工時間テーブルと Johnson法タイムチャート
const Q7Table = ({ showExplanation = false }) => (
  <div className="my-6 space-y-6">
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-md mx-auto shadow-inner text-xs">
      <div className="text-center font-bold text-slate-300 mb-2">ジョブ別・工程別の加工時間</div>
      <table className="w-full text-center border-collapse border border-slate-700 bg-slate-950/60 rounded overflow-hidden">
        <thead>
          <tr className="bg-slate-800 text-slate-200">
            <th className="border border-slate-700 p-2 font-bold">ジョブ</th>
            <th className="border border-slate-700 p-2">第1工程 (前工程)</th>
            <th className="border border-slate-700 p-2">第2工程 (後工程)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-700 p-2 font-bold bg-slate-800/20">J1</td>
            <td className="border border-slate-700 p-2">3時間</td>
            <td className="border border-slate-700 p-2 text-rose-400 font-semibold">2時間</td>
          </tr>
          <tr>
            <td className="border border-slate-700 p-2 font-bold bg-slate-800/20">J2</td>
            <td className="border border-slate-700 p-2">5時間</td>
            <td className="border border-slate-700 p-2">4時間</td>
          </tr>
          <tr className="bg-emerald-950/10">
            <td className="border border-slate-700 p-2 font-bold bg-slate-800/20 text-emerald-400">J3</td>
            <td className="border border-slate-700 p-2 text-emerald-400 font-bold">1時間</td>
            <td className="border border-slate-700 p-2">6時間</td>
          </tr>
        </tbody>
      </table>
    </div>

    {showExplanation && (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-w-xl mx-auto shadow-inner text-xs text-slate-300">
        <div className="text-center font-bold text-slate-300 mb-3">ジョンソン法によるスケジュール (J3 → J2 → J1)</div>
        {/* ガントチャートのSVG表現 */}
        <svg viewBox="0 0 540 120" className="w-full bg-slate-950 rounded border border-slate-800 p-2">
          {/* 目盛り */}
          <line x1="40" y1="95" x2="520" y2="95" stroke="#475569" strokeWidth="1" />
          {[0, 2, 4, 6, 8, 10, 12, 14, 16].map((h) => {
            const x = 40 + h * 30;
            return (
              <g key={h}>
                <line x1={x} y1={95} x2={x} y2={99} stroke="#475569" strokeWidth="1" />
                <text x={x} y={110} textAnchor="middle" fontSize="8" fill="#64748b">{h}h</text>
              </g>
            );
          })}

          {/* 第1工程 */}
          <text x="35" y="38" textAnchor="end" fontSize="9" fontWeight="bold" fill="#38bdf8">第1工程</text>
          {/* J3: 0h-1h */}
          <rect x="40" y="25" width="30" height="20" fill="#047857" stroke="#065f46" rx="2" />
          <text x="55" y="37" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">J3</text>
          {/* J2: 1h-6h */}
          <rect x="70" y="25" width="150" height="20" fill="#1e3a8a" stroke="#1e40af" rx="2" />
          <text x="145" y="37" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">J2</text>
          {/* J1: 6h-9h */}
          <rect x="220" y="25" width="90" height="20" fill="#b91c1c" stroke="#991b1b" rx="2" />
          <text x="265" y="37" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">J1</text>

          {/* 第2工程 */}
          <text x="35" y="73" textAnchor="end" fontSize="9" fontWeight="bold" fill="#fb923c">第2工程</text>
          {/* J3: 1h-7h */}
          <rect x="70" y="60" width="180" height="20" fill="#065f46" fillOpacity="0.75" stroke="#065f46" rx="2" />
          <text x="160" y="72" textAnchor="middle" fontSize="9" fill="#fff">J3</text>
          {/* J2: 7h-11h */}
          <rect x="250" y="60" width="120" height="20" fill="#1e40af" fillOpacity="0.75" stroke="#1e40af" rx="2" />
          <text x="310" y="72" textAnchor="middle" fontSize="9" fill="#fff">J2</text>
          {/* J1: 11h-13h */}
          <rect x="370" y="60" width="60" height="20" fill="#991b1b" fillOpacity="0.75" stroke="#991b1b" rx="2" />
          <text x="400" y="72" textAnchor="middle" fontSize="9" fill="#fff">J1</text>

          {/* 手待ち・総時間表示 */}
          <line x1="430" y1="15" x2="430" y2="95" stroke="#fda4af" strokeWidth="1" strokeDasharray="3,3" />
          <text x="435" y="20" fontSize="8" fill="#fda4af" fontWeight="bold">メイクスパン ＝ 13時間 (最小)</text>
        </svg>
        <div className="mt-3 leading-relaxed text-[11px] text-slate-400">
          ・前工程で最小値がある場合は最初（J3が最小 of 1h なので最初）<br/>
          ・後工程で最小値がある場合は最後（J1が最小 of 2h なので最後）<br/>
          ・決定順：<strong>J3 → J2 → J1</strong>
        </div>
      </div>
    )}
  </div>
);

// 図表の条件レンダラー
const renderDiagram = (id, isAnswered = false) => {
  switch (id) {
    case 1:
      return <Q1Table showExplanation={isAnswered} />;
    case 4:
      return <Q4PERT showExplanation={isAnswered} />;
    case 5:
      return <Q5PERT showExplanation={isAnswered} />;
    case 6:
      return <Q6CPM showExplanation={isAnswered} />;
    case 7:
      return <Q7Table showExplanation={isAnswered} />;
    default:
      return null;
  }
};

// ==========================================
// パースされた問題データ配列
// ==========================================
const QUESTIONS = [
  {
    "id": 1,
    "title": "ロット生産における生産計画",
    "source": "平成26年　第9問",
    "answer": "イ",
    "choices": [
      "ア. 案１",
      "イ. 案２",
      "ウ. 案３",
      "エ. 案４"
    ],
    "category": "生産計画と生産統制",
    "question": "ある製品をロット生産している工場で、以下の表に示す5日間の需要量(個)に対する生産計画を考える。製品を生産する日には、生産に先だち段取りが必要で、1回当たり段取り費5,000円が発生する。また、生産した製品を当日の需要に充当する場合、在庫保管費は発生しないが、翌日以降に繰り越す場合、繰越在庫量に比例して、1個1日当たり10円の在庫保管費が発生する。\n生産計画の案0は1日目に5日間の総需要量700個を生産する計画で、総費用(段取り費と在庫保管費の合計)は16,000円になる。\n案1〜案4は総需要量700個を2回に分けて生産する計画である。これらの中で総費用を最小にするものを、下記の解答群から選べ。",
    "explanation": "ロット生産の生産計画に関する出題です。設問が長いので一見すると難しく感じられますが、問われている内容は単純な計算で、難易度は高くありません。\nまず、条件を整理すると次のとおりとなります。\n段取り費：１回5,000円\n在庫保管費：繰越在庫1個あたり10円\n段取り回数はすべて2回\n以上を踏まえて、案１～案４の中で最小費用となる生産計画案を探します。段取り費用は、１と３の条件よりすべて同じである為、在庫保管費（繰越在庫量）だけを比較すれば正解を導き出すことができます。\n設問の生産計画表から繰越在庫量を計算すると、下記のようになります。\n\nよって、案２が最小費用となるため、選択肢イが正解です。"
  },
  {
    "id": 2,
    "title": "プッシュ型管理とプル型管理",
    "source": "平成28年　第3問",
    "answer": "エ",
    "choices": [
      "ア. プッシュ型管理方式では、顧客の注文が起点となって順番に製造指示が発生するため、余分な工程間在庫を持つ必要がない。",
      "イ. プッシュ型管理方式では、生産計画の変更は最終工程のみに指示すればよい。",
      "ウ. プル型管理方式では、管理部門が生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となる。",
      "エ. プル型管理方式では、稼働率を維持するための作りだめなどができないため、過剰在庫が発生する可能性は少ない。"
    ],
    "category": "生産計画と生産統制",
    "question": "プッシュ型管理方式とプル型管理方式に関する記述として、最も適切なものはどれか。",
    "explanation": "プッシュ型管理とプル型管理の問題です。\nプッシュ型管理方式とは、あらかじめ定められたスケジュールに従い、生産活動を行う管理方式で、押出し方式ともいわれます。この方式では現状に合わせてスケジュールを適切に維持・管理していく必要があります。そのためには管理部門により集中的に生産・配送・在庫状況情報が管理される必要があります。\n一方、プル管理方式は、後工程から引き取られた量を補充するためだけに生産能力が使用される管理方式です。引っ張り方式ともいわれます。この方式は、プッシュ型管理方式のような集中管理は必要ありません。\nそれでは選択肢を見ていきましょう。\n選択肢アは不適切な記述です。顧客の注文が起点となって順番に製造指示が発生するのはプル型管理方式です。プッシュ型管理方式では工程間の負荷のばらつきが生じたり、稼働率を維持するために工程間在庫を持つことがあります。\n選択肢イは不適切な記述です。生産計画の変更を最終工程のみに指示すればいいのはプル型管理方式の特徴です。\n選択肢ウは不適切な記述です。管理部門が、生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となるのはプッシュ型管理方式です。\n選択肢エは適切な記述です。プル型管理では注文を起点としているため、原則、作りだめは行われません。したがって、過剰在庫が発生するリスクは低くなります。"
  },
  {
    "id": 3,
    "title": "工数計画",
    "source": "平成28年　第11問",
    "answer": "ア",
    "choices": [
      "ア. 各職場・各作業者について手持仕事量と現有生産能力とを調査し、これらを比較対照したうえで手順計画によって再スケジュールをする。",
      "イ. 工数計画において、仕事量や生産能力を算定するためには、一般的に作業時間や作業量が用いられる。",
      "ウ. 工数計画において求めた工程別の仕事量と日程計画で計画された納期までに完了する工程別の仕事量とを比較することを並行的に進めていき、生産能力の過不足の状況を把握する。",
      "エ. 余力がマイナスになった場合に、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強などの対策をとる。"
    ],
    "category": "生産計画と生産統制",
    "question": "工数計画およびそれに対応した余力管理に関する記述として、最も不適切なものはどれか。",
    "explanation": "生産計画のうち、特に工数計画と余力管理に関する問題です。\n　生産計画の中で工数計画と他の手順計画、日程計画との関係を理解していれば正解できる問題です。\n　まずは、工数計画を含む生産計画と余力管理を簡単に復習しましょう。\n　生産計画は、手順計画、工数計画、日程計画に分けられます。\n　手順計画は、製品を生産するための作業や、工程の順序、作業条件などを決定する活動です。\n　工数計画は、生産に必要な工数を計算し、工数を調整する活動です。\n　日程計画は、生産のスケジュールを決定する活動です。\n　余力管理は、工程や作業者について、現在の負荷状況と能力を把握し、余力や不足がある場合は、作業の再配分を行う活動です。\n　ここまで押さえた上で、選択肢を見ていきましょう。\n　選択肢アについて、手持仕事量が現有生産能力を超えている場合は、超過分の仕事量を別の期間に振り分けるなど、「日程計画」によって再スケジュールをします。よって、選択肢アは不適切です。\n　選択肢イについて、一般的に、作業時間や作業量から仕事量や生産能力を算定します。よって、選択肢イは適切です。\n　選択肢ウについて、「日程計画で計画された納期までに完了する工程別の仕事量」(納期までに対応できる仕事の量)が生産能力であり、これと工数計画を比較することで生産能力の過不足の状況を把握できます。よって、選択肢ウは適切です。\n　選択肢エについて、余力がマイナスのため、工数計画で計画した工数より、実際に発生した工数のほうが大きい状態になっています。そのため、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強といった、余力の確保が必要となります。よって、選択肢エは適切です。"
  },
  {
    "id": 4,
    "title": "PERT1",
    "source": "平成30年　第6問",
    "answer": "エ",
    "choices": [
      "ア. このプロジェクトのアローダイアグラムを作成するためには、ダミーが２本必要である。",
      "イ. このプロジェクトの所要日数は８日である。",
      "ウ. このプロジェクトの所要日数を１日縮めるためには、作業Fを１日短縮すればよい。",
      "エ. 作業Eを最も早く始められるのは６日後である。"
    ],
    "category": "生産計画と生産統制",
    "question": "下表に示される作業A～Fで構成されるプロジェクトについて、PERTを用いて日程管理をすることに関する記述として、最も適切なものを下記の解答群から選べ。\n作業\n作業日数\n先行作業\nA\n3\nなし\nB\n4\nなし\nC\n3\nA\nD\n2\nA\nE\n3\nB,C,D\nF\n3\nD",
    "explanation": "PERTに関する問題です。ダミー矢線の正確な知識が必要となります。\n　アローダイアグラムを作成すると以下のようになります。\n\n　それでは選択肢アを見ていきましょう。\n　ダミー（アロー）とは、ノード間に重複する作業がある場合に、複数の作業が並行すると考えず、ダミー作業を設けて分割するものです。つまり、同じ結合点からは複数のアローは入れないため一本に限定するというルールです。複数の作業を並行して行う場合には架空の作業であるダミー（アロー）を点線で示します。\n　上図ではCとDの作業が重複するため、ノード③、④の間にダミー（アロー）が引かれます。したがってダミーは2本ではなく1本なので、不適切な選択肢です。\n　選択肢イを見ていきましょう。クリティカルパスとは、プロジェクトの始点と終点を結ぶ最も長いアクティビティの流れです。上図では最早着手日と最遅着手日が等しい工程であるA→C→E（3日＋3日＋3日＝9日）となります。したがって、8日ではなく9日ですので不適切な選択肢です。\n　選択肢ウはプロジェクトの所要日数を1日縮めるためには作業Fを1日短縮すればよい、としていますが、作業Fはクリティカルパスではありませんので、全体の日数を短縮することはできません。なお、クリティカルパスである作業Eを1日縮めると全体を8日とすれば短縮することができます。従って、記述は不適切です。\n　選択肢エは、作業Eを最も早く始められるのは6日後としています。結合点④の最早着手日程は6日ですので、記述は適切です。\n　PERTは頻出テーマであり、ある程度複雑な問題が出ても対応できるように、復習をしっかりしておきましょう。"
  },
  {
    "id": 5,
    "title": "PERT2",
    "source": "令和5年　第8問",
    "answer": "オ",
    "choices": [
      "ア. 作業Ｃの終了時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "イ. 作業Ｅの開始時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "ウ. 作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は変わらない。",
      "エ. 作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは変わらない。",
      "オ. 作業Ｈの作業所要時間が２時間長くなった場合、クリティカルパスは変わらない。"
    ],
    "category": "生産計画と生産統制",
    "question": "以下は、あるプロジェクトにおけるPERT図であり、各作業の作業所要時間の予定が記載されている。この図のプロジェクトに関する記述として、最も適切なものを下記の解答群から選べ。",
    "explanation": "PERTに関する出題です。アローダイアグラムからクリティカルパスを特定し、解答群の選択肢から正しい記述を選ぶ問題です。\nPERT（Program Evaluation and Review Technique）とは、各作業の先行関係と所要時間をアローダイアグラムと呼ばれる図で表し、短期間でプロジェクトを実行するスケジュールを決定するものです。アローダイアグラムでは、プロジェクトの作業をアクティビティと呼ばれる矢印の線で表します。作業の開始と終了の時点はノードと呼ばれる丸で表します。\nでは、本問のアローダイアグラムを確認してみましょう。各作業の作業所要時間から各ノードの最早着手時間及び最遅着手時間は次の通りです。作業Ｃ→Ｆ→Ｈ→Ｉの経路がクリティカルパスであることが分かります。\n\nでは、解答群の記述を確認していきましょう。\n選択肢アは不適切な記述です。作業Ｃの終了時刻が２時間早くなった場合、クリティカルパスは作業Ｂ→Ｅ→Ｇ→Ｉの経路（18時間）に変わります。よって、プロジェクトの完了時刻は１時間だけ早くなります。\n選択肢イは不適切な記述です。作業Ｅの開始時刻が２時間早くなっても、クリティカルパスは作業Ｃ→Ｆ→Ｈ→Ｉのままですので、プロジェクトの完了時刻は変わりません。\n選択肢ウは不適切な記述です。作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は18時間に変わります。\n選択肢エは不適切な記述です。作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは作業Ｂ→Ｅ→Ｇ→Ｉの経路に変わります。\n選択肢オは適切な記述です。作業Ｈの作業所要時間が２時間長くなった場合、プロジェクトの完了時刻が２時間遅くなるだけであり、クリティカルパスは変わりません。\n以上より、選択肢オが正解です。\nPERTは出題頻度の高いテーマです。本問はアローダイアグラムが与えられていましたが、過去の本試験ではアローダイアグラムの作成が求められる問題も度々出題されています。アローダイアグラムを作成してクリティカルパスが特定できるよう、トレーニングしておくと良いでしょう。"
  },
  {
    "id": 6,
    "title": "CPM",
    "source": "令和2年　第11問",
    "answer": "ウ",
    "choices": [
      "ア. 440",
      "イ. 510",
      "ウ. 530",
      "エ. 610",
      "オ. 710"
    ],
    "category": "生産計画と生産統制",
    "question": "下表は、あるプロジェクト業務を行う際の各作業の要件を示している。CPM（Critical Path Method）を適用して、最短プロジェクト遂行期間となる条件を達成したときの最小費用として、最も適切なものを下記の解答群から選べ（単位：万円）。",
    "explanation": "PERTに関する問題です。最短プロジェクト日数達成のための最小費用の算出まで求められる難易度の高いものです。\n解答の手順は以下の通りです。\n手順1：最短所要時間を用いたクリティカルパスの導出と最短プロジェクト遂行時間の把握\n手順２：手順１の最短プロジェクト遂行期間を実現する必要短縮時間の把握\n手順３：手順２の必要短縮時間を最小費用で行う方法の特定\n【手順１：最短プロジェクト遂行期間の把握】\n所要期間と最短所要期間のアローダイヤグラムは以下のとおりです。\n\n\n最短所要時間に基づくアローダイヤグラムのクリティカルパスはA（4）＋D（7）＋E（3）＝14となります。\n【手順2：必要短縮時間の把握】\n図1と図2より、\n・作業Aは5から4に短縮\n・作業Dは9から7に短縮\n・作業Eは5から3に短縮\nする必要があります。\nなお、作業Bと作業Cは現状の6と7のままであると作業Dの7を超えてしまいます。そこで作業Bと作業Cの所要時間を7にする最小費用を特定します。\n【手順3：最小費用の特定】\n作業Bと作業Cの単位時間当たりの短縮費用から、短縮費用の小さい作業Bを優先的に短縮します。\n・作業Bは6から2に短縮\n・作業Cは7から5に短縮\n以上から各作業の短縮時間と短縮費用は以下のようになります。\n\nしたがって、最小費用は530となるため、選択肢ウが正解です。"
  },
  {
    "id": 7,
    "title": "ジョブの投入順序",
    "source": "令和元年　第9問",
    "answer": "エ",
    "choices": [
      "ア. J1→J2→J3",
      "イ. J1→J3→J2",
      "ウ. J2→J1→J3",
      "エ. J3→J2→J1"
    ],
    "category": "生産計画と生産統制",
    "question": "2工程のフローショップにおけるジョブの投入順序を考える。各ジョブ各工程の加工時間が下表のように与えられたとき、生産を開始して全てのジョブの加工を完了するまでの時間（メイクスパン）を最小にする順序として、最も適切なものを下記の解答群から選べ。\nジョブ\nJ1\nJ2\nJ3\n第１工程\n3時間\n5時間\n1時間\n第２工程\n2時間\n4時間\n6時間",
    "explanation": "本問では、フローショップにおけるジョブの投入順序が問われています。また、ジョブショップスケジューリングのJohnson法の知識と各工程開始の判断が求められるため、やや難易度は高いものです。\nフローショップは、すべてのジョブについて実行されるべき作業が類似のもので、その作業順序に従って機械が配置されている多段階生産システムです。全ジョブはその機械配置に沿って一方向に流れます。2工程のフローショップでメイクスパン、つまり最も早い作業時間の開始時刻から、最も遅い作業の終了時刻までの長さの最小化を目的とするスケジューリングに対してはジョンソンの最適化アルゴリズムを利用します。\nジョブショップは、ジョブについて実行されるべき作業内容や工程順序が異なる多段階生産システムです。フローショップに比べて、ジョブの流れは複雑で交錯したものになります。ジョブショップは順序付け手法とディスパチング手法に大別されます。順位付け手法にはJohnson法、完全列挙法等の手法があります。\n本問では、2工程のフローショップなのでジョンソンの最適化アルゴリズムを利用します。ジョンソンの最適化アルゴリズムにおける順位付けのルールは、以下のステップから決定されます。\nジョブ\nJ1\nJ2\nJ3\n第１工程\n3時間\n5時間\n1時間\n第２工程\n2時間\n4時間\n6時間\nステップ１：すべての作業時間から最小のものを選ぶ。2工程では第1工程のJ3の1時間が該当します。\nステップ2：ステップ1で選んだ工程が、第1工程の場合は最初に、第2工程の場合は最後に処理します。J3の1時間は第1工程なので最初にスケジューリングします。\nステップ3：処理順序の決定したJ3の第1工程を除きます。\nステップ4：順序の決定していないものをステップ1に戻り繰り返します。\n上記の結果、次の工程が最小のメイクスパンとなります。\n\n従って、投入順序はJ3→J2→J1となり、選択肢エが適切な順番です。"
  },
  {
    "id": 8,
    "title": "需要予測1",
    "source": "令和3年　第8問",
    "answer": "ウ",
    "choices": [
      "ア. 移動平均法の予測精度は、個々の予測値の計算に用いるデータ数に依存しない。",
      "イ. 移動平均法では、期が進むにつれて個々の予測値の計算に用いるデータ数が増加する。",
      "ウ. 指数平滑法では、過去の需要量にさかのぼるにつれて重みが指数的に減少する。",
      "エ. 指数平滑法では、過去の予測誤差とは独立に将来の需要量が予測される。"
    ],
    "category": "生産計画と生産統制",
    "question": "需要量の時系列データを用いる需要予測法に関する記述として、最も適切なものはどれか。",
    "explanation": "需要予測法に関する出題です。時系列データを用いる「移動平均法」と「指数平滑法」の基本的な知識が問われています。難易度は高くありませんので、確実に正解したい問題です。\nまず、それぞれの需要予測法について確認しておきましょう。\n 需要予測の方法\n移動平均法とは、過去の実績データをもとに将来の需要量を予測する方法です。過去のデータを単純平均した値を使う「単純移動平均法」と、過去のデータに異なる重み付けをした加重平均値を用いる「加重移動平均法」があります。\n指数平滑法とは、過去の実績データのうち、直近の新しいデータに重いウェイトを置いて将来の需要量を予測する方法です。過去のデータに遡るにつれて、指数的に重みを減少させる加重移動平均法です。\nでは、選択肢を見ていきましょう。\n選択肢アは不適切な記述です。移動平均法は、過去の実績データを平均して予測値を求めますので、予測精度は計算に用いるデータの数に依存します。数が多ければ予測精度は高まり、少なければ予測精度は低くなります。\n選択肢イは不適切な記述です。移動平均法の計算に用いるデータ数は、任意で設定します。過去の全期間を対象にする必要はありませんので、期が進むにつれて必ずしもデータ数が増加するわけではありません。\n選択肢ウは適切な記述です。指数平滑法は、直近の実績データに重きを置いて将来の需要量を予測します。過去のデータ（需要量）に遡るにつれて、重みは指数的に減少します。\n選択肢エは不適切な記述です。指数平滑法は、前回の予測と実績がどの程度乖離したかを踏まえて、将来の需要予測を立てます。計算式は次の通りです。\n将来の予測値＝前回の予測値＋平滑化指数×（前回の実績値－前回の予測値）\n右辺の（前回の実績値－前回の予測値）が過去の予測誤差です。よって、指数平滑法では将来の需要量を予測する際に、過去の予測誤差を反映します。\n需要予測法は生産管理だけでなく、店舗販売管理においても頻繁に出題されています。需要予測法のそれぞれの特徴と計算式はしっかり覚えておきましょう。"
  },
  {
    "id": 9,
    "title": "需要予測2",
    "source": "平成29年　第34問",
    "answer": "ウ",
    "choices": [
      "ア. 移動平均法は、過去の一定期間の実績値の平均に過去の変動要因を加えて予測する方法である。",
      "イ. 季節変動とは、3か月を周期とする変動である。",
      "ウ. 指数平滑法は、当期の実績値と当期の予測値を加重平均して次期の予測値を算出する方法である。",
      "エ. 重回帰分析では、説明変数間の相関が高いほど良い数式（モデル）であると評価できる。"
    ],
    "category": "生産計画と生産統制",
    "question": "需要予測に関する次の記述として、最も適切なものはどれか。",
    "explanation": "需要予測に関する問題です。\nそれでは選択肢を見ていきましょう。\n　選択肢アですが、移動平均法は、過去の実績値のみを予測に利用するものです。過去の変動要因を加えるものではありません。したがって、不適切な記述です。\n　選択肢イですが、季節変動は3か月ではなく、1年を周期とする変動です。季節変動の要因は天候など自然現象や社会慣習、ボーナス支給、年末年始などがあります。したがって、不適切な記述です。\n　選択肢ウを見てみましょう。指数平滑法とは、次期の予測値を以下の式で求めるものです。\n次期の予測値＝当期の予測値＋α（当期の実績値－当期の予測値）\nαは平滑化定数といわれ、0から1の値をとります。当期の実績値と当期の予測値は平滑化定数αにより加重平均されます。したがって、適切な記述です。\n　選択肢エを見てみましょう。重回帰分析では重回帰モデルを利用して、説明したい変数を説明変数によりモデル化します。説明変数が１つのものを単回帰モデル、複数の場合を重回帰モデルといいます。重回帰モデルによる予測値と実際の値の相関関係（重回帰係数）を二乗したものを重決定係数といいます。この値が高いほど、重回帰モデルの予測値の精度が高いものとされます。説明変数間の相関が高いものではありません。したがって、不適切な記述です。"
  },
  {
    "id": 10,
    "title": "指数平滑法",
    "source": "平成27年　第9問",
    "answer": "ウ",
    "choices": [
      "ア. 63",
      "イ. 65",
      "ウ. 67",
      "エ. 69"
    ],
    "category": "生産計画と生産統制",
    "question": "ある会社では、商品の需要予測に指数平滑法（平滑化定数α＝0.4）を用いている。当期の需要予測値75に対し、需要実績値は55であった。次期の需要予測値として、最も適切なものはどれか。",
    "explanation": "需要予測について、指数平滑法に関する問題です。\n指数平滑法で予測値を求める式を覚えていれば容易に解ける問題です。\n指数平滑法では、需要予測にあたって、直近の値を重視します。予測値を求める式は次の通りです。\n　来期予測値＝今期予測値＋平滑化指数Ｘ（今期実績値－今期予測値）\nこの式にあてはめて、次期の需要予測値を計算すると、\n　75＋0.4× (55－75) ＝75－8＝67\nとなります。\nしたがって正解はウになります。"
  },
  {
    "id": 11,
    "title": "現品管理",
    "source": "平成30年　第14問",
    "answer": "エ",
    "choices": [
      "ア. 受け入れ外注品の品質と数量の把握",
      "イ. 仕掛品の適正な保管位置や保管方法の設定",
      "ウ. 製品の適正な運搬荷姿や運搬方法の検討",
      "エ. 利用資材の発注方式の見直し"
    ],
    "category": "生産計画と生産統制",
    "question": "JIS で定義される現品管理の活動として、最も不適切なものはどれか。",
    "explanation": "本問は、現品管理について問われています。\nまずは現品管理について、簡単に復習しておきましょう。\nなお、JISには以下のように定義されています。\n「資材、仕掛品、製品などの物について、運搬・移動や停滞・保管の状況を管理する活動。現品の経済的処理と数量、所在の確実な把握を目的とする。現物管理ともいう。」（JISZ8142-4102）\nでは、選択肢をみていきましょう。本問は、不適切なものを選択することに注意します。\n選択肢アは適切な記述です。「受け入れ外注品の品質と数量」を把握することは、前述の定義と照らし、現品管理と言えます。よって、アは適切です。\n選択肢イは適切な記述です。「仕掛品の適正な保管位置や保管方法」を設定することは、前述の定義と照らし、現品管理と言えます。よって、イは適切です。\n選択肢ウは適切な記述です。「製品の適正な運搬荷姿や運搬方法」を検討することは、前述の定義と照らし、現品管理と言えます。よって、ウは適切です。\n選択肢エは不適切な記述です。「利用資材の発注方式」を見直すことは、前述の定義と照らし、現品管理とは合致しません。これは、改善活動と言えます。よって、記述は不適切で、エが正解です。\nJISの定義を網羅して学習することは非効率ですので、基礎的な用語の定義は、一通り覚えておきましょう。また、現品管理は生産統制を構成する3要素の1つですので、幅広く理解を深めておきましょう。"
  },
  {
    "id": 12,
    "title": "余力管理",
    "source": "令和5年　第10問",
    "answer": "イ",
    "choices": [
      "ア. ａ：工数　　　　　　　　ｂ：作業余裕　　　　　ｃ：工数低減 　　ｄ：工程編成",
      "イ. ａ：工数　　　　　　　　ｂ：余力　　　　　　　ｃ：工数低減 　ｄ：工数の山積山崩",
      "ウ. ａ：工程能力　　　　　　ｂ：工程能力指数　　　ｃ：工程分割 　ｄ：工数低減",
      "エ. ａ：標準時間　　　　　　ｂ：作業余裕　　　　　ｃ：工程分割 　ｄ：工数の山積山崩",
      "オ. ａ：標準時間　　　　　　ｂ：余力　　　　　　　ｃ：工数の山積山崩 　ｄ：工程編成"
    ],
    "category": "生産計画と生産統制",
    "question": "工数管理や余力管理に関する以下のａ～ｄの記述と用語の組み合わせとして、最も適切なものを下記の解答群から選べ。\nａ　仕事量の全体を表す尺度で、仕事を１人の作業者で遂行するのに要する時間。\nｂ　各工程または個々の作業者における、現在の作業負荷状態と現有作業能力の差。\nｃ　作業習熟や改善活動、設計改良などによって作業時間を減らすこと。\nｄ　作業の実施時期をずらすなどにより生産の負荷平準化を行うこと。",
    "explanation": "余力管理に関する出題です。基本的な知識が問われており、難易度は高くありません。\n余力とは、負荷と能力の差を指します。余力管理では、各工程又は個々の作業者について、現在の負荷状態と現有能力とを把握し、現在どれだけの余力又は不足があるかを検討し、作業の再配分を行って能力と負荷を均衡させていく活動です。工数管理ともいいます。\n工数とは、仕事量の全体を表す尺度で、仕事を一人の作業者で遂行するのに要する時間を指します。\nでは、それぞれの記述を確認してみましょう。\nａ：仕事量の全体を表す尺度で、仕事を１人の作業者で遂行するのに要する時間は、工数です。\nｂ：各工程または個々の作業者における現在の作業負荷状態と現有作業能力の差は、余力です。\nｃ：作業習熟や改善活動、設計改良などによって作業時間を減らすことを、工数低減といいます。\nｄ：作業の実施時期をずらすなどにより、生産の負荷平準化を行うことを、工数の山積山崩といいます。\n以上より、選択肢イの組み合わせが正解です。\n余力管理は過去の本試験で度々出題されています。しっかり理解しておきましょう。"
  },
  {
    "id": 13,
    "title": "生産管理方式",
    "source": "令和4年　第4問",
    "answer": "イ",
    "choices": [
      "ア. ａ：正　　ｂ：正　　ｃ：誤　　ｄ：誤",
      "イ. ａ：正　　ｂ：誤　　ｃ：正　　ｄ：誤",
      "ウ. ａ：正　　ｂ：誤　　ｃ：正　　ｄ：正",
      "エ. ａ：誤　　ｂ：正　　ｃ：誤　　ｄ：正",
      "オ. ａ：誤　　ｂ：誤　　ｃ：正　　ｄ：正"
    ],
    "category": "生産計画と生産統制",
    "question": "生産方式に関する記述の正誤の組み合わせとして、最も適切なものを下記の解答群から選べ。\nａ　オーダエントリー方式は、生産工程にある半製品に顧客のオーダを引き当て、顧客が希望した仕様の製品として完成させるために、仕様に合わせた部品や作業を選択して生産する方式である。\nｂ　生産座席予約方式は、設備の稼働状況を基に、顧客のオーダを到着順に生産する方式である。\nｃ　モジュール生産方式は、あらかじめモジュール部品を複数用意し、受注後にそれらの組み合わせによって多品種の最終製品を生産する方式で、リードタイムの短縮が期待できる。\nｄ　製番管理方式は、製品の組立を開始する時点で部品を引き当てる方式で、ロット生産にも利用可能で、特にロットサイズが大きい場合に適している。",
    "explanation": "生産方式に関する出題です。それぞれの生産方式について踏み込んだ知識が問われており、すべての設問の正誤を判断する必要があるため、難易度はやや高いと言えます。\nでは、設問を見ていきましょう。\naは適切な記述です。オーダエントリー方式とは、「生産工程にある製品に顧客のオーダを引き当て、製品の仕様の選択又は変更をする生産方式」です。例えば、自動車の生産では、途中まで組み立てられた標準の車体に対して、シートの素材や塗装の色など、顧客が選択したオプションに合わせて、個別に仕様を変更して車を完成させます。\nbは不適切な記述です。生産座席予約方式とは、「受注時に、製造設備の使用日程・資材の使用予定などにオーダを割り付け、顧客が要求する納期どおりに生産する方式」です。製造工程を「座席」に見立て、例えば営業部門が（飛行機などの座席を予約する感覚で）顧客の希望する製品の出荷を予約していきます。オーダを到着順に生産する方式ではありません。\ncは適切な記述です。モジュール生産方式は、モジュールと呼ばれる機能ごとの部品をあらかじめ組み上げておき、受注後にそれらのモジュールを複数組み合わせて、最終製品として完成させる方式です。これにより、リードタイムの短縮が図れます。\ndは不適切な記述です。製番管理方式は、製品ごとに「製番」という製造番号を発行し、製品を構成する全ての部品に対して同じ製番を付けて管理します。ロット生産でも利用可能ですが、ロットサイズは小さい場合に適しています。\n以上より、a：正　b：誤　c：正　d：誤　の組み合わせとなりますので、選択肢イが正解です。\n生産方式は出題頻度の高いテーマです。本問で問われた生産方式は、今後も出題される可能性がありますので、しっかり理解しておきましょう。"
  },
  {
    "id": 14,
    "title": "トヨタ生産方式",
    "source": "平成30年　第11問",
    "answer": "エ",
    "choices": [
      "ア. ａとｃ",
      "イ. ａとｄ",
      "ウ. ｂとｃ",
      "エ. ｂとｅ",
      "オ. ｄとｅ"
    ],
    "category": "生産計画と生産統制",
    "question": "トヨタ生産方式の特徴を表す用語として、最も適切なものの組み合わせを下記の解答群から選べ。\nａ　MRP\nｂ　かんばん方式\nｃ　セル生産方式\nｄ　製番管理方式\nｅ　あんどん方式",
    "explanation": "本問は、トヨタ生産方式について問われています。\n　生産管理の管理方式について基礎的な知識と、トヨタ生産方式の特徴を押さえている方であれば、容易に正解できる問題です。\n　まずは生産管理の管理方式について、簡単に復習しておきましょう。\n　次にトヨタ生産方式ですが、無駄をできるだけ排除して、必要な数だけ生産する方式です。トヨタ生産方式は、ジャストインタイムと、自働化という思想に基づいています。また、かんばん方式は、トヨタ自動車が開発した管理方式として有名で、トヨタ生産方式の一部となっています。\n　ジャストインタイム（JIT）は、必要なものを、必要な時に、必要な数だけ生産する方式です。ジャストインタイムでは、後工程が使った分だけ前工程から引き取ります。そのため、ジャストインタイムは、後工程引取方式やプルシステムと呼ばれることもあります。\n　自働化は、異常が発生したときに、機械を自動的に停止し、不良品を作らないための仕組みです。異常が発生した場合には、すぐにラインを停止します。また「あんどん」というランプによって、どこで停止したかが一目で分かるようになっています。ちなみに、自働化の「働」という字には、ニンベンがついています。\n　かんばん方式は、後工程引取方式を実現するための情報伝達の手法です。かんばんには、「生産指示かんばん」と「引取りかんばん」の2種類があります。生産指示かんばんは、作業の指示を表し、引取りかんばんは、運搬を表します。このかんばんによって、後工程から前工程に生産指示が出されていきます。これにより、後工程が生産した分だけ、前工程で生産するため、無駄を極力排除することができます。\n　ここまで押さえた上で、選択肢の各用語をみていきましょう。\n　ａですが、MRP（Material Requirement Planning：資材所要量計画）とは、製品の生産計画を基に、資材の所要量と時期を計画するための仕組みです。製品の生産計画を、MRPでは「基準生産計画」MPS（Master Production Schedule）と呼びますが、トップダウンの計画に基づいているため、プルシステムに対してプッシュシステムと呼ばれることがあります。MRPは、トヨタ生産方式の特徴であるジャストインタイム（プルシステム）と相反する特徴をもつシステムであり、不適切です。\n　ｂですが、かんばん方式は前述の通り、トヨタ自動車が開発した管理方式として有名で、トヨタ生産方式の一部となっています。よって、適切です。\n　ｃですが、セル生産方式は、加工機械のグループを作り、そのグループ単位で工程を編成する方式です。加工機械のグループのことをセルと呼びます。\nセル生産方式では、グループテクノロジーを利用して部品をグループ化することで、それらの生産に適した機械を配置します。グループテクノロジーとは、多種類の部品をなんらかの類似性に基づいて分類することで、多種少量生産に大量生産的効果を与える管理手法です。一般的には、セル生産方式は、1人から数人の作業者で製品を最後まで作り上げる生産方式という意味で使われることが多いですが、本来の意味では、グループテクノロジーが使われているのが、セル生産方式です。\nセル生産方式は、トヨタ生産方式やジャストインタイムでライン形式を進化させて生まれた方式と言われますが、トヨタ生産方式で必ず使用される方式というわけではなく、特徴的なものではありません。よって、不適切です。\n　ｄですが、製番管理方式は、製品を中心に管理する手法です。製番管理方式では、製品ごとに製番という製造番号を発行し、製品を構成する全ての部品に対して同じ製番を付けて管理します。製番管理方式は、受注生産形態で多く用いられている手法ですが、トヨタ生産方式で用いられる方式ではありません。よって、不適切です。\n　ｅですが、あんどん方式の「あんどん」は、前述の通りトヨタ生産方式の自働化において、異常発生時にどこで停止しているかを可視化するランプのことです。自働化を支える方式の1つであり、適切です。\n　よって、ｂとｅが適切な組み合わせであり、エが正解です。\n　生産管理の管理方式は、過去に何度も出題されたほどの頻出論点です。また、トヨタ生産方式は、日本の製造業を支える代表的で、重要な方式の1つです。本問のような基礎的でシンプルな設問は必ず正解するのは言うまでもありませんが、応用力も養って様々な切り口の出題に対応できるようにしましょう。"
  },
  {
    "id": 15,
    "title": "製造現場の改善方法",
    "source": "平成29年　第20問",
    "answer": "ウ",
    "choices": [
      "ア. 機械設備の稼働状況を可視化するために、「あんどん」を設置した。",
      "イ. 「シングル段取」の実現を目指して、内段取の一部を外段取に変更した。",
      "ウ. 品種変更に伴う段取り替えの回数を抑制するために、製品の流れを「1個流し」に変更した。",
      "エ. 部品の組み付け忘れを防止するために、部品の供給棚に「ポカヨケ」の改善を施した。"
    ],
    "category": "生産計画と生産統制",
    "question": "生産現場で行われる改善施策に関する記述として、最も不適切なものはどれか。",
    "explanation": "生産現場の改善に関する問題です。\n　選択肢アは適切な記述です。あんどんとは、各工程の状況をランプで示し、工程内外に一目で見てわかるように工夫した工程管理方式の1つです。機械設備の稼働状況を可視化する方式ですので、適切な記述です。\n　選択肢イは適切な記述ですシングル段取とは、機械の停止時間が10分未満の内段取のことです。段取替え時間の短縮、改善方法には内段取そのものの短縮化、内段取の外段取化があります。したがって、適切な記述です。\n　選択肢ウは不適切な記述です1個流しは、部品の生産から組み立てまで顧客が必要とする単位である「1個ずつ」流す方法です。製品を1個加工したら、すぐ次工程に送るので工程間に仕掛品は置きません。1個流しは中間仕掛品の滞留や工程における遊休防止のためですが、品種変更に伴う段取り替えの回数はむしろ増える可能性があります。したがって不適切な記述です。\n　選択肢エは適切な記述です「ポカヨケ」とは、生産ラインに設置される作業ミスを防止する仕組み、装置のことです。部品の供給棚に「ポカヨケ」の改善を施すことは部品の組み付け忘れという間違いの予防に役立つと考えられます。したがって適切な記述です。"
  }
];

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [passcode, setPasscode] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 学習進捗データ
  const [history, setHistory] = useState({});
  const [reviews, setReviews] = useState({});
  
  // 途中再開用の状態
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressMode, setProgressMode] = useState("all");
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // 画面遷移・クイズ進行の状態
  const [appMode, setAppMode] = useState("login"); // "login" | "dashboard" | "quiz"
  const [quizMode, setQuizMode] = useState("all"); // "all" | "wrong" | "review"
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // 履歴からの特定問題詳細表示用 (アコーディオン的)
  const [expandedReviewId, setExpandedReviewId] = useState(null);

  // 1. 画面・ID監視用のRef定義 (割り込みポップアップ防止ガード)
  const screenRef = useRef(appMode);
  useEffect(() => {
    screenRef.current = appMode;
  }, [appMode]);

  const isFirstLoad = useRef(true);

  // 2. Firebase匿名認証を実行
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    console.log("Firebase Authの初期化中...");
    signInAnonymously(auth)
      .then((cred) => {
        console.log("匿名サインイン完了。UID:", cred.user.uid);
        setUser(cred.user);
      })
      .catch((err) => {
        console.error("Firebase匿名認証に失敗しました:", err);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // 3. 履歴・進捗のFirestore保存関数
  const saveProgressToFirestore = async (updatedHistory, updatedReviews, index, mode) => {
    if (!isAuthenticated || !passcode.trim() || !db) return;
    console.log("Firestoreに進捗を保存します... インデックス: " + index + ", モード: " + mode);
    try {
      const docRef = doc(db, "users", APP_ID + "_" + passcode.trim());
      await setDoc(docRef, {
        answers: updatedHistory || {},
        reviews: updatedReviews || {},
        progressIndex: index,
        progressMode: mode,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("Firestore保存が完了しました。");
    } catch (err) {
      console.error("Firestoreへの保存中にエラーが発生しました:", err);
    }
  };

  // 4. 合言葉によるログイン・同期処理
  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    const cleanPasscode = passcode.trim();
    if (!cleanPasscode) return;

    setIsLoadingData(true);
    console.log("Firestoreへの接続を開始します。合言葉: " + cleanPasscode);
    
    // ローカルストレージキーの定義
    const localKey = APP_ID + "_" + cleanPasscode + "_progress";

    try {
      if (!db) {
        throw new Error("Firestore is not available");
      }
      
      const docRef = doc(db, "users", APP_ID + "_" + cleanPasscode);
      
      // リアルタイム監視 (onSnapshot) の設定
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const parsedProgress = {
            progressIndex: Number(data.progressIndex || 0),
            progressMode: data.progressMode || "all",
            history: data.answers || {},
            reviews: data.reviews || {}
          };

          // ガードレール：初回ロード時かつダッシュボード画面のときのみ途中再開プロンプトを表示
          if (isFirstLoad.current && screenRef.current === "dashboard") {
            isFirstLoad.current = false;
            if (parsedProgress.progressIndex > 0) {
              setProgressIndex(parsedProgress.progressIndex);
              setProgressMode(parsedProgress.progressMode);
              setHistory(parsedProgress.history);
              setReviews(parsedProgress.reviews);
              setShowResumePrompt(true);
              return;
            }
          }

          // クイズ中のデータ受信時はモーダルを表示せず状態のみ更新
          setHistory(parsedProgress.history);
          setReviews(parsedProgress.reviews);
        }
      });

      setIsAuthenticated(true);
      setAppMode("dashboard");
    } catch (err) {
      console.error("接続処理に失敗しました。ローカルストレージを使用します:", err);
      // ローカルストレージからの復元
      const localDataRaw = localStorage.getItem(localKey);
      if (localDataRaw) {
        try {
          const localData = JSON.parse(localDataRaw);
          setHistory(localData.history || {});
          setReviews(localData.reviews || {});
          if (localData.progressIndex > 0) {
            setProgressIndex(localData.progressIndex);
            setProgressMode(localData.progressMode || "all");
            setShowResumePrompt(true);
          }
        } catch (e) {
          console.error("ローカルストレージデータの解析に失敗しました:", e);
        }
      }
      setIsAuthenticated(true);
      setAppMode("dashboard");
    } finally {
      setIsLoadingData(false);
    }
  };

  // 5. クイズ開始処理
  const startQuiz = (mode, resumeFromIndex = 0) => {
    console.log("クイズを開始します。モード: " + mode + ", 再開インデックス: " + resumeFromIndex);
    let targetQuestions = [];
    
    if (mode === "all") {
      targetQuestions = [...QUESTIONS];
    } else if (mode === "wrong") {
      targetQuestions = QUESTIONS.filter(q => {
        const ans = history[q.id];
        return ans && ans.correct === false;
      });
    } else if (mode === "review") {
      targetQuestions = QUESTIONS.filter(q => reviews[q.id] === true);
    }

    if (targetQuestions.length === 0) {
      alert("対象となる問題がありません。別モードを選択してください。");
      return;
    }

    setQuizMode(mode);
    setCurrentQuizQuestions(targetQuestions);
    setCurrentQuizIndex(resumeFromIndex);
    setSelectedAnswerIdx(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setAppMode("quiz");
  };

  // 6. 途中再開の判断処理
  const handleResumeDecision = (shouldResume) => {
    setShowResumePrompt(false);
    if (shouldResume) {
      startQuiz(progressMode, progressIndex);
    } else {
      // 進行状況をリセットして最初から
      setProgressIndex(0);
      saveProgressToFirestore(history, reviews, 0, "all");
    }
  };

  // 7. 解答選択処理
  const handleAnswerSelect = (choiceIdx) => {
    if (selectedAnswerIdx !== null) return;

    const currentQuestion = currentQuizQuestions[currentQuizIndex];
    const labels = ["ア", "イ", "ウ", "エ", "オ"];
    const isAnsCorrect = labels[choiceIdx] === currentQuestion.answer;
    
    setSelectedAnswerIdx(choiceIdx);
    setIsCorrect(isAnsCorrect);
    setShowExplanation(true);

    const updatedHistory = {
      ...history,
      [currentQuestion.id]: {
        correct: isAnsCorrect,
        choiceIdx: choiceIdx,
        timestamp: new Date().toISOString()
      }
    };
    setHistory(updatedHistory);

    // 進行状況の保存 (最後の問題なら progressIndex を 0 にリセット)
    const isLast = currentQuizIndex === currentQuizQuestions.length - 1;
    const nextIdx = isLast ? 0 : currentQuizIndex + 1;
    
    saveProgressToFirestore(updatedHistory, reviews, nextIdx, quizMode);
    
    // ローカルストレージ保存 (通信エラー時の備え)
    const localKey = APP_ID + "_" + passcode.trim() + "_progress";
    localStorage.setItem(localKey, JSON.stringify({
      history: updatedHistory,
      reviews,
      progressIndex: nextIdx,
      progressMode: quizMode
    }));
  };

  // 8. 「要復習」フラグの切り替え
  const toggleReview = async (id) => {
    const updatedReviews = {
      ...reviews,
      [id]: !reviews[id]
    };
    setReviews(updatedReviews);
    await saveProgressToFirestore(history, updatedReviews, progressIndex, progressMode);
    
    const localKey = APP_ID + "_" + passcode.trim() + "_progress";
    localStorage.setItem(localKey, JSON.stringify({
      history,
      reviews: updatedReviews,
      progressIndex,
      progressMode
    }));
  };

  // 9. 次の問題へ
  const handleNext = () => {
    if (currentQuizIndex < currentQuizQuestions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedAnswerIdx(null);
      setIsCorrect(null);
      setShowExplanation(false);
    } else {
      // 全問終了
      setAppMode("dashboard");
      setProgressIndex(0);
      saveProgressToFirestore(history, reviews, 0, "all");
    }
  };

  // 10. ダッシュボード指標の集計 (useMemo)
  const stats = useMemo(() => {
    const total = QUESTIONS.length;
    const solved = Object.keys(history).length;
    const correct = QUESTIONS.filter(q => history[q.id]?.correct === true).length;
    
    const progressRate = Math.round((solved / total) * 100) || 0;
    const correctRate = Math.round((correct / total) * 100) || 0;
    const accuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0;
    
    const wrongCount = QUESTIONS.filter(q => history[q.id] && history[q.id].correct === false).length;
    const reviewCount = QUESTIONS.filter(q => reviews[q.id] === true).length;

    return {
      total,
      solved,
      correct,
      progressRate,
      correctRate,
      accuracy,
      wrongCount,
      reviewCount
    };
  }, [history, reviews]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="flex items-center space-x-2 animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-lg font-medium text-slate-300">初期化中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30">
      {/* ヘッダーバー */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-sky-500 p-2 rounded-lg text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              生産計画と生産統制
            </span>
          </div>
          {isAuthenticated && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-full text-xs text-slate-300 shadow-inner">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-medium font-mono">ID: {passcode}</span>
              <button 
                onClick={() => {
                  setIsAuthenticated(false);
                  setAppMode("login");
                  setPasscode("");
                }} 
                className="ml-2 text-[10px] text-slate-500 hover:text-rose-400 font-bold transition-colors"
              >
                切替
              </button>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* ログイン画面 */}
        {appMode === "login" && (
          <div className="max-w-md mx-auto my-12 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-xl backdrop-blur-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">過去問セレクト演習 3-3</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                合言葉（お名前や任意のID）を入力して、Firestore上の進捗データとリアルタイム同期します。
              </p>
            </div>
            
            <form onSubmit={handleConnect} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">合言葉 (ユーザーID)</label>
                <input
                  type="text"
                  placeholder="例: hide"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingData}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 text-sm"
              >
                {isLoadingData ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>データを同期中...</span>
                  </>
                ) : (
                  <>
                    <span>クイズを開始する</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ダッシュボード画面 */}
        {appMode === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* 中断データの復元モーダル */}
            {showResumePrompt && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up">
                  <div className="flex items-center space-x-3 text-amber-400 mb-4">
                    <HelpCircle className="w-6 h-6" />
                    <h3 className="font-extrabold text-slate-100">中断データが見つかりました</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    前回の続きからクイズを再開しますか？<br/>
                    （モード: {progressMode === "all" ? "全問題" : progressMode === "wrong" ? "間違えた問題" : "要復習問題"}, 再開位置: 問 {progressIndex + 1}）
                  </p>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleResumeDecision(false)}
                      className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      最初から
                    </button>
                    <button 
                      onClick={() => handleResumeDecision(true)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
                    >
                      再開する
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 進捗要約カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-bold mb-1">全体の進捗率</div>
                  <div className="text-2xl font-extrabold font-mono text-indigo-400">{stats.progressRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">解答済: {stats.solved} / {stats.total} 問</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {stats.progressRate}%
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-bold mb-1">正解率 (全問題比)</div>
                  <div className="text-2xl font-extrabold font-mono text-sky-400">{stats.correctRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">正解: {stats.correct} / {stats.total} 問</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {stats.correctRate}%
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-bold mb-1">回答正確性 (正答精度)</div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-400">{stats.accuracy}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">誤答: {stats.wrongCount} 問</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {stats.accuracy}%
                </div>
              </div>
            </div>

            {/* モード選択エリア */}
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
              <h3 className="font-extrabold text-md text-slate-200 mb-4 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>演習を始める</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => startQuiz("all")}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 p-5 rounded-xl text-left transition-all hover:scale-[1.01] hover:shadow-lg group"
                >
                  <div className="font-bold text-sm text-slate-200 group-hover:text-indigo-400 transition-colors">① 全問題演習</div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">全15問を最初から順に学習します。中断と再開が可能です。</p>
                  <div className="text-[10px] text-slate-500 mt-4 flex items-center space-x-1 font-mono">
                    <span>収録数: {stats.total} 問</span>
                  </div>
                </button>

                <button
                  onClick={() => startQuiz("wrong")}
                  disabled={stats.wrongCount === 0}
                  className="bg-slate-900 border border-slate-800 hover:border-rose-500/60 disabled:opacity-40 disabled:hover:scale-100 p-5 rounded-xl text-left transition-all hover:scale-[1.01] hover:shadow-lg group"
                >
                  <div className="font-bold text-sm text-slate-200 group-hover:text-rose-400 transition-colors">② 弱点克服演習</div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">過去に間違えた問題のみを抜き出して再演習します。</p>
                  <div className="text-[10px] text-slate-500 mt-4 flex items-center space-x-1 font-mono">
                    <span className={stats.wrongCount > 0 ? "text-rose-400 font-bold" : ""}>間違えた問題: {stats.wrongCount} 問</span>
                  </div>
                </button>

                <button
                  onClick={() => startQuiz("review")}
                  disabled={stats.reviewCount === 0}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 disabled:opacity-40 disabled:hover:scale-100 p-5 rounded-xl text-left transition-all hover:scale-[1.01] hover:shadow-lg group"
                >
                  <div className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">③ 要復習演習</div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">ブックマーク（要復習チェック）を付けた問題を演習します。</p>
                  <div className="text-[10px] text-slate-500 mt-4 flex items-center space-x-1 font-mono">
                    <span className={stats.reviewCount > 0 ? "text-amber-400 font-bold" : ""}>ブックマーク: {stats.reviewCount} 問</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 問題一覧と復習ステータス (アコーディオン風) */}
            <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="font-extrabold text-md text-slate-200 mb-4 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>収録問題一覧 & 復習チェック</span>
              </h3>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {QUESTIONS.map((q, idx) => {
                  const isWrong = history[q.id] && history[q.id].correct === false;
                  const isCorrectVal = history[q.id] && history[q.id].correct === true;
                  const isRev = reviews[q.id] === true;
                  const isExpanded = expandedReviewId === q.id;

                  return (
                    <div key={q.id} className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden transition-all">
                      <div className="flex items-center justify-between p-3.5 hover:bg-slate-800/30 transition-colors">
                        <button 
                          onClick={() => setExpandedReviewId(isExpanded ? null : q.id)}
                          className="flex-1 text-left flex items-center space-x-2"
                        >
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">問 {idx + 1}</span>
                          <span className="text-xs font-bold text-slate-200 truncate">{q.title}</span>
                          <span className="text-[8px] text-slate-500 font-mono hidden md:inline">({q.source})</span>
                        </button>
                        
                        <div className="flex items-center space-x-3 ml-2">
                          {isCorrectVal && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">正解</span>}
                          {isWrong && <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">復習要</span>}
                          {!history[q.id] && <span className="text-[10px] font-bold text-slate-500 bg-slate-800/30 px-2 py-0.5 rounded border border-slate-800">未挑戦</span>}
                          
                          <button
                            onClick={() => toggleReview(q.id)}
                            className={"p-1.5 rounded-lg border transition-all " + (isRev ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "border-slate-700 text-slate-500 hover:text-slate-300")}
                            title="復習フォルダに追加"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-300 space-y-3">
                          <div>
                            <span className="font-bold text-sky-400">【出題情報】</span> {q.source}
                          </div>
                          <div>
                            <span className="font-bold text-indigo-400">【問題文】</span>
                            <div className="whitespace-pre-wrap mt-1 leading-relaxed text-slate-400">{q.question}</div>
                          </div>
                          {renderDiagram(q.id, true)}
                          <div className="bg-slate-900 border border-slate-800/60 p-3 rounded">
                            <span className="font-bold text-emerald-400">【解説・正解: {q.answer}】</span>
                            <div className="whitespace-pre-wrap mt-1.5 leading-relaxed text-slate-400">{q.explanation}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* クイズ画面 */}
        {appMode === "quiz" && (
          <div className="space-y-6 animate-fade-in">
            {/* 上部進行状況バー */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-400">進行度:</span>
                <span className="font-extrabold font-mono text-indigo-400 text-sm">{currentQuizIndex + 1} / {currentQuizQuestions.length}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] font-mono">
                  {currentQuizQuestions[currentQuizIndex].source}
                </span>
              </div>
              <button
                onClick={() => {
                  if (confirm("学習を中断してダッシュボードに戻りますか？")) {
                    setAppMode("dashboard");
                  }
                }}
                className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 py-1.5 px-3 rounded-lg font-bold transition-all text-[11px]"
              >
                中断して戻る
              </button>
            </div>

            {/* 問題カード */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-sky-400 text-sm">問題</h3>
                <button
                  onClick={() => toggleReview(currentQuizQuestions[currentQuizIndex].id)}
                  className={"p-1.5 rounded-lg border transition-all " + (reviews[currentQuizQuestions[currentQuizIndex].id] ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "border-slate-700 text-slate-500 hover:text-slate-300")}
                  title="復習フォルダに追加"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>

              {/* 問題本文 */}
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium mb-6">
                {currentQuizQuestions[currentQuizIndex].question}
              </div>

              {/* 問題に応じたインラインSVGの描画 (showExplanation===isAnsweredを渡すことで問題と解説で出し分ける) */}
              {renderDiagram(currentQuizQuestions[currentQuizIndex].id, showExplanation)}

              {/* 選択肢リスト */}
              <div className="space-y-3">
                {currentQuizQuestions[currentQuizIndex].choices.map((choice, idx) => {
                  const labels = ["ア", "イ", "ウ", "エ", "オ"];
                  const isSelected = selectedAnswerIdx === idx;
                  const isCorrectOption = labels[idx] === currentQuizQuestions[currentQuizIndex].answer;
                  
                  let optionStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/20";
                  
                  if (selectedAnswerIdx !== null) {
                    if (isCorrectOption) {
                      // 正解の選択肢は常に緑色
                      optionStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold";
                    } else if (isSelected) {
                      // 自分が選んで間違えた選択肢は赤色
                      optionStyle = "bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold";
                    } else {
                      // その他は透過
                      optionStyle = "bg-slate-950/20 border-slate-850 text-slate-600 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      disabled={selectedAnswerIdx !== null}
                      className={"w-full text-left p-4 rounded-xl border transition-all text-xs flex items-center justify-between " + optionStyle}
                    >
                      <span>{choice}</span>
                      {selectedAnswerIdx !== null && isCorrectOption && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                      {selectedAnswerIdx !== null && isSelected && !isCorrectOption && <X className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 解答・解説の表示 */}
            {showExplanation && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl animate-scale-up">
                <div className="flex items-center space-x-2 mb-4">
                  {isCorrect ? (
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-sm bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      <Check className="w-4 h-4" />
                      <span>正解！</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-sm bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                      <X className="w-4 h-4" />
                      <span>不正解...</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 font-mono">
                    正解： <span className="font-bold text-emerald-400 text-sm">{currentQuizQuestions[currentQuizIndex].answer}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-sky-400">解説</h4>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {currentQuizQuestions[currentQuizIndex].explanation}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-colors flex items-center space-x-1.5"
                  >
                    <span>{currentQuizIndex < currentQuizQuestions.length - 1 ? "次の問題へ" : "ダッシュボードへ戻る"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-900 mt-16 py-8 text-center text-xs text-slate-500">
        <p>© 2026 過去問セレクト演習 3-3 クイズアプリ. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
