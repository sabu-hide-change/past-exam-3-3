// npm install lucide-react recharts firebase
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  X,
  Home,
  ChevronRight,
  RefreshCw,
  BarChart2,
  BookOpen,
  User,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ===================================================================
// Firebase設定（APIキー等は環境変数から読み込み。直書きは厳禁）
// ===================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// データ分離用のアプリ識別子（他問題集と混ざらないように。後から一括書き換え可）
const APP_ID = "QuizApp_Production_Planning_3_3";

// Firebase初期化（多重初期化やエラーでクラッシュしないよう防衛的に）
let app = null;
let auth = null;
let db = null;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("[Firebase] 初期化に失敗しました:", e);
}

const EXAM_NO = "3-3"; // 過去問セレクト演習の番号
const TITLE = "過去問セレクト演習 3-3 生産計画と生産統制";
const CHOICE_LABELS = ["ア", "イ", "ウ", "エ", "オ"];

// 2大カテゴリ（レーダーチャート用）
const CAT_PLAN = "生産計画";
const CAT_CTRL = "生産統制";

// ===================================================================
// 図表（外部画像URLは一切使わず、テーブル / インラインSVGで100%内製化）
// ===================================================================

// 共通：図表カードラッパ（横スクロール対応）
const FigCard = ({ children }) => (
  <div className="my-4 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/60 p-3">
    <div className="flex min-w-fit justify-center">{children}</div>
  </div>
);

// 問題1：生産計画の案（与条件テーブル / 解答情報なし）
const PlanTable = () => {
  const head = ["日", "1", "2", "3", "4", "5", "総費用"];
  const rows = [
    ["需要量", "200", "180", "140", "80", "100", ""],
    ["案 0", "700", "0", "0", "0", "0", "16,000"],
    ["案 1", "200", "500", "0", "0", "0", ""],
    ["案 2", "380", "0", "320", "0", "0", ""],
    ["案 3", "520", "0", "0", "180", "0", ""],
    ["案 4", "600", "0", "0", "0", "100", ""],
  ];
  return (
    <FigCard>
      <table className="border-collapse text-sm text-slate-200">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="border border-slate-600 bg-slate-800 px-4 py-2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`border border-slate-600 px-4 py-2 ${
                    ci === 0
                      ? "bg-slate-800 text-center font-medium"
                      : "text-right"
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </FigCard>
  );
};

// 問題1（解説）：繰越在庫量の計算。案2を強調（＝解答情報なので解説でのみ表示）
const InvTable = () => {
  const head = ["日", "1", "2", "3", "4", "5", "繰越在庫量(合計)"];
  // [ラベル, v1..v5, 合計, ハイライト]
  const rows = [
    ["需要量", "200", "180", "140", "80", "100", "", false],
    ["案 0", "700", "", "", "", "", "", false],
    ["　繰越在庫量", "500", "320", "180", "100", "0", "1,100", false],
    ["案 1", "200", "500", "", "", "", "", false],
    ["　繰越在庫量", "0", "320", "180", "100", "0", "600", false],
    ["案 2", "380", "", "320", "", "", "", true],
    ["　繰越在庫量", "180", "0", "180", "100", "0", "460", true],
    ["案 3", "520", "", "", "180", "", "", false],
    ["　繰越在庫量", "320", "140", "0", "100", "0", "560", false],
    ["案 4", "600", "", "", "", "100", "", false],
    ["　繰越在庫量", "400", "220", "80", "0", "0", "700", false],
  ];
  return (
    <FigCard>
      <table className="border-collapse text-sm text-slate-200">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="border border-slate-600 bg-slate-800 px-3 py-2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const hl = r[7];
            return (
              <tr key={ri} className={hl ? "bg-amber-500/20" : ""}>
                {r.slice(0, 7).map((c, ci) => (
                  <td
                    key={ci}
                    className={`border border-slate-600 px-3 py-1.5 ${
                      ci === 0
                        ? "bg-slate-800/80 text-left font-medium"
                        : "text-right"
                    } ${hl ? "font-bold text-amber-300" : ""}`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </FigCard>
  );
};

// 問題4：作業要件テーブル（与条件）
const WorkTableQ4 = () => {
  const rows = [
    ["A", "3", "なし"],
    ["B", "4", "なし"],
    ["C", "3", "A"],
    ["D", "2", "A"],
    ["E", "3", "B, C, D"],
    ["F", "3", "D"],
  ];
  return (
    <FigCard>
      <table className="border-collapse text-sm text-slate-200">
        <thead>
          <tr>
            {["作業", "作業日数", "先行作業"].map((h, i) => (
              <th
                key={i}
                className="border border-slate-600 bg-slate-800 px-6 py-2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className="border border-slate-600 px-6 py-2 text-center"
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </FigCard>
  );
};

// 結合点の最早/最遅 2段ボックス（SVG）
const TimeBox = ({ x, y, early, late, w = 34, h = 40 }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill="#0f172a"
      stroke="#475569"
      strokeWidth="1"
    />
    <line
      x1={x}
      y1={y + h / 2}
      x2={x + w}
      y2={y + h / 2}
      stroke="#475569"
      strokeWidth="1"
    />
    <text
      x={x + w / 2}
      y={y + h / 4 + 4}
      textAnchor="middle"
      fontSize="13"
      fill="#e2e8f0"
    >
      {early}
    </text>
    <text
      x={x + w / 2}
      y={y + (3 * h) / 4 + 4}
      textAnchor="middle"
      fontSize="13"
      fill="#e2e8f0"
    >
      {late}
    </text>
  </g>
);

const Node = ({ cx, cy, label, r = 22 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
    <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fill="#f1f5f9">
      {label}
    </text>
  </g>
);

// 問題4（解説）：アローダイアグラム（最早=最遅、クリティカルパス A→C→E）
const ArrowQ4 = () => (
  <FigCard>
    <svg viewBox="0 0 700 380" className="h-auto w-full max-w-[700px]">
      <defs>
        <marker id="ar4" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8" />
        </marker>
        <marker id="ar4b" markerWidth="12" markerHeight="12" refX="9" refY="3.5" orient="auto">
          <path d="M0,0 L9,3.5 L0,7 Z" fill="#f87171" />
        </marker>
        <marker id="ar4d" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#64748b" />
        </marker>
      </defs>
      {/* edges */}
      {/* A 1->2 critical */}
      <line x1="82" y1="150" x2="218" y2="150" stroke="#f87171" strokeWidth="3.5" markerEnd="url(#ar4b)" />
      <text x="150" y="135" textAnchor="middle" fontSize="15" fill="#fca5a5">A</text>
      <text x="150" y="172" textAnchor="middle" fontSize="13" fill="#cbd5e1">3日</text>
      {/* D 2->3 */}
      <line x1="262" y1="150" x2="398" y2="150" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#ar4)" />
      <text x="330" y="135" textAnchor="middle" fontSize="15" fill="#cbd5e1">D</text>
      <text x="330" y="172" textAnchor="middle" fontSize="13" fill="#cbd5e1">2日</text>
      {/* F 3->5 */}
      <line x1="442" y1="150" x2="578" y2="150" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#ar4)" />
      <text x="510" y="135" textAnchor="middle" fontSize="15" fill="#cbd5e1">F</text>
      <text x="510" y="172" textAnchor="middle" fontSize="13" fill="#cbd5e1">3日</text>
      {/* B 1->4 */}
      <line x1="78" y1="168" x2="312" y2="300" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#ar4)" />
      <text x="175" y="250" textAnchor="middle" fontSize="15" fill="#cbd5e1">B</text>
      <text x="175" y="270" textAnchor="middle" fontSize="13" fill="#cbd5e1">4日</text>
      {/* C 2->4 critical */}
      <line x1="240" y1="170" x2="322" y2="300" stroke="#f87171" strokeWidth="3.5" markerEnd="url(#ar4b)" />
      <text x="262" y="250" textAnchor="middle" fontSize="15" fill="#fca5a5">C</text>
      <text x="262" y="270" textAnchor="middle" fontSize="13" fill="#cbd5e1">3日</text>
      {/* dummy 3->4 dotted */}
      <line x1="418" y1="168" x2="352" y2="298" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#ar4d)" />
      {/* E 4->5 critical */}
      <line x1="358" y1="305" x2="582" y2="170" stroke="#f87171" strokeWidth="3.5" markerEnd="url(#ar4b)" />
      <text x="500" y="250" textAnchor="middle" fontSize="15" fill="#fca5a5">E</text>
      <text x="500" y="270" textAnchor="middle" fontSize="13" fill="#cbd5e1">3日</text>
      {/* nodes */}
      <Node cx="60" cy="150" label="1" />
      <Node cx="240" cy="150" label="2" />
      <Node cx="420" cy="150" label="3" />
      <Node cx="600" cy="150" label="5" />
      <Node cx="335" cy="320" label="4" />
      {/* time boxes */}
      <TimeBox x="43" y="60" early="0" late="0" />
      <TimeBox x="223" y="60" early="3" late="3" />
      <TimeBox x="403" y="60" early="5" late="6" />
      <TimeBox x="583" y="60" early="9" late="9" />
      <TimeBox x="318" y="340" early="6" late="6" />
      {/* legend */}
      <TimeBox x="630" y="300" early="" late="" />
      <text x="625" y="312" textAnchor="end" fontSize="11" fill="#94a3b8">最早着手日</text>
      <text x="625" y="332" textAnchor="end" fontSize="11" fill="#94a3b8">最遅着手日</text>
    </svg>
  </FigCard>
);

// 問題5：PERT図。phase==="explanation" のときのみ最早/最遅時刻とクリティカルパスを描画
const PertQ5 = ({ showExplanation = false }) => {
  const cp = showExplanation ? "#f87171" : "#94a3b8";
  const cpw = showExplanation ? 3.5 : 1.5;
  const cpMarker = showExplanation ? "url(#p5b)" : "url(#p5)";
  return (
    <FigCard>
      <svg viewBox="0 0 760 400" className="h-auto w-full max-w-[760px]">
        <defs>
          <marker id="p5" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8" />
          </marker>
          <marker id="p5b" markerWidth="12" markerHeight="12" refX="9" refY="3.5" orient="auto">
            <path d="M0,0 L9,3.5 L0,7 Z" fill="#f87171" />
          </marker>
          <marker id="p5d" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>
        {/* A 1->2 */}
        <line x1="68" y1="178" x2="192" y2="78" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#p5)" />
        <text x="110" y="118" fontSize="13" fill="#cbd5e1">作業A</text>
        <text x="110" y="135" fontSize="12" fill="#cbd5e1">3時間</text>
        {/* D 2->4 */}
        <line x1="232" y1="62" x2="408" y2="80" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#p5)" />
        <text x="300" y="52" fontSize="13" fill="#cbd5e1">作業D</text>
        <text x="300" y="69" fontSize="12" fill="#cbd5e1">5時間</text>
        {/* B 1->3 */}
        <line x1="72" y1="190" x2="248" y2="190" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#p5)" />
        <text x="120" y="180" fontSize="13" fill="#cbd5e1">作業B</text>
        <text x="120" y="210" fontSize="12" fill="#cbd5e1">4時間</text>
        {/* E 3->4 */}
        <line x1="290" y1="178" x2="412" y2="98" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#p5)" />
        <text x="330" y="150" fontSize="13" fill="#cbd5e1">作業E</text>
        <text x="330" y="167" fontSize="12" fill="#cbd5e1">6時間</text>
        {/* C 1->5 critical */}
        <line x1="68" y1="202" x2="156" y2="305" stroke={cp} strokeWidth={cpw} markerEnd={cpMarker} />
        <text x="70" y="270" fontSize="13" fill={showExplanation ? "#fca5a5" : "#cbd5e1"}>作業C</text>
        <text x="70" y="287" fontSize="12" fill="#cbd5e1">5時間</text>
        {/* F 5->6 critical */}
        <line x1="194" y1="320" x2="428" y2="300" stroke={cp} strokeWidth={cpw} markerEnd={cpMarker} />
        <text x="280" y="345" fontSize="13" fill={showExplanation ? "#fca5a5" : "#cbd5e1"}>作業F</text>
        <text x="280" y="362" fontSize="12" fill="#cbd5e1">6時間</text>
        {/* dummy 3->6 dotted */}
        <line x1="282" y1="205" x2="432" y2="288" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#p5d)" />
        {/* G 4->7 */}
        <line x1="452" y1="92" x2="572" y2="178" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#p5)" />
        <text x="490" y="125" fontSize="13" fill="#cbd5e1">作業G</text>
        <text x="490" y="142" fontSize="12" fill="#cbd5e1">5時間</text>
        {/* H 6->7 critical */}
        <line x1="472" y1="298" x2="576" y2="205" stroke={cp} strokeWidth={cpw} markerEnd={cpMarker} />
        <text x="495" y="270" fontSize="13" fill={showExplanation ? "#fca5a5" : "#cbd5e1"}>作業H</text>
        <text x="495" y="287" fontSize="12" fill="#cbd5e1">5時間</text>
        {/* I 7->8 critical */}
        <line x1="612" y1="190" x2="688" y2="190" stroke={cp} strokeWidth={cpw} markerEnd={cpMarker} />
        <text x="628" y="180" fontSize="13" fill={showExplanation ? "#fca5a5" : "#cbd5e1"}>作業I</text>
        <text x="628" y="210" fontSize="12" fill="#cbd5e1">3時間</text>
        {/* nodes */}
        <Node cx="50" cy="190" label="1" />
        <Node cx="210" cy="60" label="2" />
        <Node cx="270" cy="190" label="3" />
        <Node cx="170" cy="320" label="5" />
        <Node cx="430" cy="80" label="4" />
        <Node cx="450" cy="300" label="6" />
        <Node cx="590" cy="190" label="7" />
        <Node cx="710" cy="190" label="8" />
        {showExplanation && (
          <g>
            <TimeBox x="33" y="232" early="0" late="0" />
            <TimeBox x="193" y="6" early="3" late="6" />
            <TimeBox x="253" y="226" early="4" late="5" />
            <TimeBox x="120" y="332" early="5" late="5" />
            <TimeBox x="413" y="14" early="10" late="11" />
            <TimeBox x="433" y="332" early="11" late="11" />
            <TimeBox x="556" y="226" early="16" late="16" />
            <TimeBox x="693" y="226" early="19" late="19" />
          </g>
        )}
      </svg>
      {showExplanation && (
        <div className="ml-3 hidden flex-col justify-center gap-1 text-xs text-slate-400 sm:flex">
          <div>□上：最早着手時間</div>
          <div>□下：最遅着手時間</div>
          <div className="text-red-400">━ クリティカルパス</div>
        </div>
      )}
    </FigCard>
  );
};

// 問題6：CPM 作業要件テーブル（与条件）
const CpmTable6 = () => {
  const rows = [
    ["A", "−", "5", "4", "10"],
    ["B", "A", "6", "2", "50"],
    ["C", "B", "7", "3", "90"],
    ["D", "A", "9", "7", "30"],
    ["E", "C, D", "5", "3", "40"],
  ];
  return (
    <FigCard>
      <table className="border-collapse text-sm text-slate-200">
        <thead>
          <tr>
            {["作業名", "先行作業", "所要期間", "最短所要期間", "単位時間当たりの短縮費用(万円)"].map(
              (h, i) => (
                <th
                  key={i}
                  className="border border-slate-600 bg-slate-800 px-3 py-2 font-semibold"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className="border border-slate-600 px-3 py-2 text-center"
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </FigCard>
  );
};

// 問題6（解説）図1：所要期間のアローダイヤグラム
const CpmFig1 = () => (
  <FigCard>
    <div>
      <div className="mb-2 text-center text-sm text-slate-300">
        【図1　所要期間のアローダイヤグラム】
      </div>
      <svg viewBox="0 0 720 280" className="h-auto w-full max-w-[720px]">
        <defs>
          <marker id="c1" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8" />
          </marker>
        </defs>
        {/* A 1->2 */}
        <line x1="82" y1="200" x2="198" y2="200" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c1)" />
        <text x="140" y="190" textAnchor="middle" fontSize="14" fill="#cbd5e1">A</text>
        <text x="140" y="220" textAnchor="middle" fontSize="13" fill="#cbd5e1">5</text>
        {/* B 2->3 */}
        <line x1="236" y1="186" x2="338" y2="92" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c1)" />
        <text x="270" y="135" textAnchor="middle" fontSize="14" fill="#cbd5e1">B</text>
        <text x="300" y="150" textAnchor="middle" fontSize="13" fill="#cbd5e1">6</text>
        {/* C 3->4 */}
        <line x1="382" y1="92" x2="482" y2="186" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c1)" />
        <text x="450" y="135" textAnchor="middle" fontSize="14" fill="#cbd5e1">C</text>
        <text x="420" y="150" textAnchor="middle" fontSize="13" fill="#cbd5e1">7</text>
        {/* D 2->4 */}
        <line x1="242" y1="200" x2="478" y2="200" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c1)" />
        <text x="360" y="190" textAnchor="middle" fontSize="14" fill="#cbd5e1">D</text>
        <text x="360" y="220" textAnchor="middle" fontSize="13" fill="#cbd5e1">9</text>
        {/* E 4->5 */}
        <line x1="522" y1="200" x2="638" y2="200" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c1)" />
        <text x="580" y="190" textAnchor="middle" fontSize="14" fill="#cbd5e1">E</text>
        <text x="580" y="220" textAnchor="middle" fontSize="13" fill="#cbd5e1">5</text>
        <Node cx="60" cy="200" label="1" />
        <Node cx="220" cy="200" label="2" />
        <Node cx="360" cy="70" label="3" />
        <Node cx="500" cy="200" label="4" />
        <Node cx="660" cy="200" label="5" />
      </svg>
    </div>
  </FigCard>
);

// 問題6（解説）図2：最短所要期間のアローダイヤグラム（最早/最遅、クリティカルパス A→D→E）
const CpmFig2 = () => (
  <FigCard>
    <div>
      <div className="mb-2 text-center text-sm text-slate-300">
        【図2　最短所要期間のアローダイヤグラム】
      </div>
      <svg viewBox="0 0 760 320" className="h-auto w-full max-w-[760px]">
        <defs>
          <marker id="c2" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8" />
          </marker>
          <marker id="c2b" markerWidth="12" markerHeight="12" refX="9" refY="3.5" orient="auto">
            <path d="M0,0 L9,3.5 L0,7 Z" fill="#f87171" />
          </marker>
        </defs>
        {/* A 1->2 critical */}
        <line x1="82" y1="200" x2="198" y2="200" stroke="#f87171" strokeWidth="3.5" markerEnd="url(#c2b)" />
        <text x="140" y="190" textAnchor="middle" fontSize="14" fill="#fca5a5">A</text>
        <text x="140" y="220" textAnchor="middle" fontSize="13" fill="#cbd5e1">4</text>
        {/* B 2->3 */}
        <line x1="236" y1="186" x2="338" y2="92" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c2)" />
        <text x="270" y="135" textAnchor="middle" fontSize="14" fill="#cbd5e1">B</text>
        <text x="300" y="150" textAnchor="middle" fontSize="13" fill="#cbd5e1">2</text>
        {/* C 3->4 */}
        <line x1="382" y1="92" x2="482" y2="186" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c2)" />
        <text x="450" y="135" textAnchor="middle" fontSize="14" fill="#cbd5e1">C</text>
        <text x="420" y="150" textAnchor="middle" fontSize="13" fill="#cbd5e1">3</text>
        {/* D 2->4 critical */}
        <line x1="242" y1="200" x2="478" y2="200" stroke="#f87171" strokeWidth="3.5" markerEnd="url(#c2b)" />
        <text x="360" y="190" textAnchor="middle" fontSize="14" fill="#fca5a5">D</text>
        <text x="360" y="220" textAnchor="middle" fontSize="13" fill="#cbd5e1">7</text>
        {/* E 4->5 critical */}
        <line x1="522" y1="200" x2="638" y2="200" stroke="#f87171" strokeWidth="3.5" markerEnd="url(#c2b)" />
        <text x="580" y="190" textAnchor="middle" fontSize="14" fill="#fca5a5">E</text>
        <text x="580" y="220" textAnchor="middle" fontSize="13" fill="#cbd5e1">3</text>
        <Node cx="60" cy="200" label="1" />
        <Node cx="220" cy="200" label="2" />
        <Node cx="360" cy="70" label="3" />
        <Node cx="500" cy="200" label="4" />
        <Node cx="660" cy="200" label="5" />
        <TimeBox x="43" y="244" early="0" late="0" />
        <TimeBox x="203" y="244" early="4" late="4" />
        <TimeBox x="378" y="22" early="6" late="8" />
        <TimeBox x="483" y="244" early="11" late="11" />
        <TimeBox x="643" y="244" early="14" late="14" />
      </svg>
      <div className="mt-1 text-center text-xs text-slate-400">
        □上：最早結合点時刻／□下：最遅結合点時刻／
        <span className="text-red-400">━ クリティカルパス</span>
      </div>
    </div>
  </FigCard>
);

// 問題6（解説）：短縮時間と短縮費用テーブル
const CpmCost = () => {
  const rows = [
    ["A", "5", "4", "1", "10", "10"],
    ["B", "6", "2", "4", "50", "200"],
    ["C", "7", "5", "2", "90", "180"],
    ["D", "9", "7", "2", "30", "60"],
    ["E", "5", "3", "2", "40", "80"],
  ];
  return (
    <FigCard>
      <table className="border-collapse text-xs text-slate-200 sm:text-sm">
        <thead>
          <tr>
            {[
              "作業名",
              "現在の所要時間 ①",
              "短縮後の所要時間 ②",
              "必要短縮日数 ③=①−②",
              "単位時間当たりの短縮費用(万円) ④",
              "短縮費用合計 ③×④",
            ].map((h, i) => (
              <th
                key={i}
                className="border border-slate-600 bg-slate-800 px-2 py-2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className="border border-slate-600 px-3 py-1.5 text-center"
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-amber-500/20">
            <td className="border border-slate-600 px-3 py-1.5 text-center font-bold text-amber-300">
              合計
            </td>
            <td className="border border-slate-600 px-3 py-1.5" colSpan={4}></td>
            <td className="border border-slate-600 px-3 py-1.5 text-center font-bold text-amber-300">
              530
            </td>
          </tr>
        </tbody>
      </table>
    </FigCard>
  );
};

// 問題7：ジョブ加工時間テーブル（与条件）
const JohnsonTable = () => {
  const rows = [
    ["第１工程", "3時間", "5時間", "1時間"],
    ["第２工程", "2時間", "4時間", "6時間"],
  ];
  return (
    <FigCard>
      <table className="border-collapse text-sm text-slate-200">
        <thead>
          <tr>
            {["ジョブ", "J1", "J2", "J3"].map((h, i) => (
              <th
                key={i}
                className="border border-slate-600 bg-slate-800 px-6 py-2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`border border-slate-600 px-6 py-2 text-center ${
                    ci === 0 ? "bg-slate-800 font-medium" : ""
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </FigCard>
  );
};

// 問題7（解説）：ジョンソン法のガントチャート（メイクスパン13時間）
const JohnsonGantt = () => {
  // 1時間 = 46px
  const U = 46;
  const x0 = 90;
  return (
    <FigCard>
      <svg viewBox="0 0 760 230" className="h-auto w-full max-w-[760px]">
        {/* 第1工程: J3(1) J2(5) J1(3) 0->9 */}
        <text x="10" y="55" fontSize="15" fill="#e2e8f0">第１工程</text>
        <rect x={x0} y="30" width={1 * U} height="44" fill="#3b82f6" stroke="#1e3a8a" />
        <text x={x0 + 0.5 * U} y="58" textAnchor="middle" fontSize="15" fill="#fff">J3</text>
        <rect x={x0 + 1 * U} y="30" width={5 * U} height="44" fill="#0ea5e9" stroke="#0369a1" />
        <text x={x0 + 3.5 * U} y="58" textAnchor="middle" fontSize="15" fill="#fff">J2</text>
        <rect x={x0 + 6 * U} y="30" width={3 * U} height="44" fill="#bae6fd" stroke="#0369a1" />
        <text x={x0 + 7.5 * U} y="58" textAnchor="middle" fontSize="15" fill="#b91c1c" fontWeight="bold">J1</text>
        <text x={x0 + 0.5 * U} y="92" textAnchor="middle" fontSize="12" fill="#94a3b8">1h</text>
        <text x={x0 + 3.5 * U} y="92" textAnchor="middle" fontSize="12" fill="#94a3b8">5h</text>
        <text x={x0 + 7.5 * U} y="92" textAnchor="middle" fontSize="12" fill="#94a3b8">3h</text>

        {/* 第2工程: J3 starts at 1 (6) -> 7, J2 at 7 (4) -> 11, J1 at 11 (2) -> 13 */}
        <text x="10" y="150" fontSize="15" fill="#e2e8f0">第２工程</text>
        <rect x={x0 + 1 * U} y="125" width={6 * U} height="44" fill="#1e40af" stroke="#1e3a8a" />
        <text x={x0 + 4 * U} y="153" textAnchor="middle" fontSize="15" fill="#fff">J3</text>
        <rect x={x0 + 7 * U} y="125" width={4 * U} height="44" fill="#0ea5e9" stroke="#0369a1" />
        <text x={x0 + 9 * U} y="153" textAnchor="middle" fontSize="15" fill="#fff">J2</text>
        <rect x={x0 + 11 * U} y="125" width={2 * U} height="44" fill="#bae6fd" stroke="#0369a1" />
        <text x={x0 + 12 * U} y="153" textAnchor="middle" fontSize="15" fill="#b91c1c" fontWeight="bold">J1</text>
        <text x={x0 + 4 * U} y="187" textAnchor="middle" fontSize="12" fill="#94a3b8">6h</text>
        <text x={x0 + 9 * U} y="187" textAnchor="middle" fontSize="12" fill="#94a3b8">4h</text>
        <text x={x0 + 12 * U} y="187" textAnchor="middle" fontSize="12" fill="#94a3b8">2h</text>

        {/* time axis */}
        <line x1={x0} y1="200" x2={x0 + 13 * U} y2="200" stroke="#475569" strokeWidth="1" />
        <text x={x0 + 13 * U + 6} y="150" fontSize="14" fill="#fbbf24" fontWeight="bold">メイクスパン</text>
        <text x={x0 + 13 * U + 6} y="170" fontSize="14" fill="#fbbf24" fontWeight="bold">13時間</text>
      </svg>
    </FigCard>
  );
};

// 図表レンダラ（キー → コンポーネント）
const renderFig = (key) => {
  switch (key) {
    case "planTable":
      return <PlanTable />;
    case "invTable":
      return <InvTable />;
    case "workTableQ4":
      return <WorkTableQ4 />;
    case "arrowQ4":
      return <ArrowQ4 />;
    case "pertNeutral":
      return <PertQ5 showExplanation={false} />;
    case "pertFull":
      return <PertQ5 showExplanation={true} />;
    case "cpmTable6":
      return <CpmTable6 />;
    case "cpmFig1":
      return <CpmFig1 />;
    case "cpmFig2":
      return <CpmFig2 />;
    case "cpmCost":
      return <CpmCost />;
    case "johnsonTable":
      return <JohnsonTable />;
    case "johnsonGantt":
      return <JohnsonGantt />;
    default:
      return null;
  }
};

// 「ここが重要」風のノートボックス
const NoteBox = ({ title, body }) => (
  <div className="my-3 rounded-xl border border-sky-700/60 bg-sky-950/40 p-4">
    <div className="mb-2 flex items-center gap-2 font-semibold text-sky-300">
      <BookOpen className="h-4 w-4" />
      {title}
    </div>
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
      {body}
    </div>
  </div>
);

// ===================================================================
// 問題データ（全15問・ノンカット収録：問題文・選択肢・正解・解説をそのまま格納）
// ===================================================================
const QUESTIONS = [
  {
    id: 1,
    no: 1,
    title: "ロット生産における生産計画",
    era: "平成26年 第9問",
    category: CAT_PLAN,
    question:
      "　ある製品をロット生産している工場で、以下の表に示す5日間の需要量(個)に対する生産計画を考える。製品を生産する日には、生産に先だち段取りが必要で、1回当たり段取り費5,000円が発生する。また、生産した製品を当日の需要に充当する場合、在庫保管費は発生しないが、翌日以降に繰り越す場合、繰越在庫量に比例して、1個1日当たり10円の在庫保管費が発生する。",
    problemFig: "planTable",
    questionAfter:
      "生産計画の案0は1日目に5日間の総需要量700個を生産する計画で、総費用(段取り費と在庫保管費の合計)は16,000円になる。\n\n案1〜案4は総需要量700個を2回に分けて生産する計画である。これらの中で総費用を最小にするものを、下記の解答群から選べ。",
    choices: ["案１", "案２", "案３", "案４"],
    answer: 1,
    explanation: [
      {
        t: "p",
        v: "ロット生産の生産計画に関する出題です。設問が長いので一見すると難しく感じられますが、問われている内容は単純な計算で、難易度は高くありません。\nまず、条件を整理すると次のとおりとなります。\n段取り費：１回5,000円\n在庫保管費：繰越在庫1個あたり10円\n段取り回数はすべて2回\n以上を踏まえて、案１～案４の中で最小費用となる生産計画案を探します。段取り費用は、１と３の条件よりすべて同じである為、在庫保管費（繰越在庫量）だけを比較すれば正解を導き出すことができます。\n設問の生産計画表から繰越在庫量を計算すると、下記のようになります。",
      },
      { t: "fig", v: "invTable" },
      { t: "p", v: "よって、案２が最小費用となるため、選択肢イが正解です。" },
    ],
  },
  {
    id: 2,
    no: 2,
    title: "プッシュ型管理とプル型管理",
    era: "平成28年 第3問",
    category: CAT_PLAN,
    question:
      "プッシュ型管理方式とプル型管理方式に関する記述として、最も適切なものはどれか。",
    choices: [
      "プッシュ型管理方式では、顧客の注文が起点となって順番に製造指示が発生するため、余分な工程間在庫を持つ必要がない。",
      "プッシュ型管理方式では、生産計画の変更は最終工程のみに指示すればよい。",
      "プル型管理方式では、管理部門が生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となる。",
      "プル型管理方式では、稼働率を維持するための作りだめなどができないため、過剰在庫が発生する可能性は少ない。",
    ],
    answer: 3,
    explanation: [
      {
        t: "p",
        v: "プッシュ型管理とプル型管理の問題です。\nプッシュ型管理方式とは、あらかじめ定められたスケジュールに従い、生産活動を行う管理方式で、押出し方式ともいわれます。この方式では現状に合わせてスケジュールを適切に維持・管理していく必要があります。そのためには管理部門により集中的に生産・配送・在庫状況情報が管理される必要があります。\n一方、プル管理方式は、後工程から引き取られた量を補充するためだけに生産能力が使用される管理方式です。引っ張り方式ともいわれます。この方式は、プッシュ型管理方式のような集中管理は必要ありません。\nそれでは選択肢を見ていきましょう。\n選択肢アは不適切な記述です。顧客の注文が起点となって順番に製造指示が発生するのはプル型管理方式です。プッシュ型管理方式では工程間の負荷のばらつきが生じたり、稼働率を維持するために工程間在庫を持つことがあります。\n選択肢イは不適切な記述です。生産計画の変更を最終工程のみに指示すればいいのはプル型管理方式の特徴です。\n選択肢ウは不適切な記述です。管理部門が、生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となるのはプッシュ型管理方式です。\n選択肢エは適切な記述です。プル型管理では注文を起点としているため、原則、作りだめは行われません。したがって、過剰在庫が発生するリスクは低くなります。",
      },
    ],
  },
  {
    id: 3,
    no: 3,
    title: "工数計画",
    era: "平成28年 第11問",
    category: CAT_PLAN,
    question:
      "　工数計画およびそれに対応した余力管理に関する記述として、最も不適切なものはどれか。",
    choices: [
      "各職場・各作業者について手持仕事量と現有生産能力とを調査し、これらを比較対照したうえで手順計画によって再スケジュールをする。",
      "工数計画において、仕事量や生産能力を算定するためには、一般的に作業時間や作業量が用いられる。",
      "工数計画において求めた工程別の仕事量と日程計画で計画された納期までに完了する工程別の仕事量とを比較することを並行的に進めていき、生産能力の過不足の状況を把握する。",
      "余力がマイナスになった場合に、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強などの対策をとる。",
    ],
    answer: 0,
    explanation: [
      {
        t: "p",
        v: "　生産計画のうち、特に工数計画と余力管理に関する問題です。\n　生産計画の中で工数計画と他の手順計画、日程計画との関係を理解していれば正解できる問題です。\n\n　まずは、工数計画を含む生産計画と余力管理を簡単に復習しましょう。\n　生産計画は、手順計画、工数計画、日程計画に分けられます。\n　手順計画は、製品を生産するための作業や、工程の順序、作業条件などを決定する活動です。\n　工数計画は、生産に必要な工数を計算し、工数を調整する活動です。\n　日程計画は、生産のスケジュールを決定する活動です。\n　余力管理は、工程や作業者について、現在の負荷状況と能力を把握し、余力や不足がある場合は、作業の再配分を行う活動です。\n\n　ここまで押さえた上で、選択肢を見ていきましょう。\n　選択肢アについて、手持仕事量が現有生産能力を超えている場合は、超過分の仕事量を別の期間に振り分けるなど、「日程計画」によって再スケジュールをします。よって、選択肢アは不適切です。\n\n　選択肢イについて、一般的に、作業時間や作業量から仕事量や生産能力を算定します。よって、選択肢イは適切です。\n\n　選択肢ウについて、「日程計画で計画された納期までに完了する工程別の仕事量」(納期までに対応できる仕事の量)が生産能力であり、これと工数計画を比較することで生産能力の過不足の状況を把握できます。よって、選択肢ウは適切です。\n\n　選択肢エについて、余力がマイナスのため、工数計画で計画した工数より、実際に発生した工数のほうが大きい状態になっています。そのため、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強といった、余力の確保が必要となります。よって、選択肢エは適切です。",
      },
    ],
  },
  {
    id: 4,
    no: 4,
    title: "PERT1",
    era: "平成30年 第6問",
    category: CAT_PLAN,
    question:
      "　下表に示される作業A～Fで構成されるプロジェクトについて、PERTを用いて日程管理をすることに関する記述として、最も適切なものを下記の解答群から選べ。",
    problemFig: "workTableQ4",
    choices: [
      "このプロジェクトのアローダイアグラムを作成するためには、ダミーが２本必要である。",
      "このプロジェクトの所要日数は８日である。",
      "このプロジェクトの所要日数を１日縮めるためには、作業Fを１日短縮すればよい。",
      "作業Eを最も早く始められるのは６日後である。",
    ],
    answer: 3,
    explanation: [
      {
        t: "p",
        v: "　PERTに関する問題です。ダミー矢線の正確な知識が必要となります。\n　アローダイアグラムを作成すると以下のようになります。",
      },
      { t: "fig", v: "arrowQ4" },
      {
        t: "p",
        v: "　それでは選択肢アを見ていきましょう。\n　ダミー（アロー）とは、ノード間に重複する作業がある場合に、複数の作業が並行すると考えず、ダミー作業を設けて分割するものです。つまり、同じ結合点からは複数のアローは入れないため一本に限定するというルールです。複数の作業を並行して行う場合には架空の作業であるダミー（アロー）を点線で示します。\n　上図ではCとDの作業が重複するため、ノード③、④の間にダミー（アロー）が引かれます。したがってダミーは2本ではなく1本なので、不適切な選択肢です。\n\n　選択肢イを見ていきましょう。クリティカルパスとは、プロジェクトの始点と終点を結ぶ最も長いアクティビティの流れです。上図では最早着手日と最遅着手日が等しい工程であるA→C→E（3日＋3日＋3日＝9日）となります。したがって、8日ではなく9日ですので不適切な選択肢です。\n\n　選択肢ウはプロジェクトの所要日数を1日縮めるためには作業Fを1日短縮すればよい、としていますが、作業Fはクリティカルパスではありませんので、全体の日数を短縮することはできません。なお、クリティカルパスである作業Eを1日縮めると全体を8日とすれば短縮することができます。従って、記述は不適切です。\n\n　選択肢エは、作業Eを最も早く始められるのは6日後としています。結合点④の最早着手日程は6日ですので、記述は適切です。\n\n　PERTは頻出テーマであり、ある程度複雑な問題が出ても対応できるように、復習をしっかりしておきましょう。",
      },
    ],
  },
  {
    id: 5,
    no: 5,
    title: "PERT2",
    era: "令和5年 第8問",
    category: CAT_PLAN,
    question:
      "　以下は、あるプロジェクトにおけるPERT図であり、各作業の作業所要時間の予定が記載されている。この図のプロジェクトに関する記述として、最も適切なものを下記の解答群から選べ。",
    problemFig: "pertNeutral",
    choices: [
      "作業Ｃの終了時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "作業Ｅの開始時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は変わらない。",
      "作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは変わらない。",
      "作業Ｈの作業所要時間が２時間長くなった場合、クリティカルパスは変わらない。",
    ],
    answer: 4,
    explanation: [
      {
        t: "p",
        v: "PERTに関する出題です。アローダイアグラムからクリティカルパスを特定し、解答群の選択肢から正しい記述を選ぶ問題です。\n\nPERT（Program Evaluation and Review Technique）とは、各作業の先行関係と所要時間をアローダイアグラムと呼ばれる図で表し、短期間でプロジェクトを実行するスケジュールを決定するものです。アローダイアグラムでは、プロジェクトの作業をアクティビティと呼ばれる矢印の線で表します。作業の開始と終了の時点はノードと呼ばれる丸で表します。\n\nでは、本問のアローダイアグラムを確認してみましょう。各作業の作業所要時間から各ノードの最早着手時間及び最遅着手時間は次の通りです。作業Ｃ→Ｆ→Ｈ→Ｉの経路がクリティカルパスであることが分かります。",
      },
      { t: "fig", v: "pertFull" },
      {
        t: "p",
        v: "では、解答群の記述を確認していきましょう。\n選択肢アは不適切な記述です。作業Ｃの終了時刻が２時間早くなった場合、クリティカルパスは作業Ｂ→Ｅ→Ｇ→Ｉの経路（18時間）に変わります。よって、プロジェクトの完了時刻は１時間だけ早くなります。\n\n選択肢イは不適切な記述です。作業Ｅの開始時刻が２時間早くなっても、クリティカルパスは作業Ｃ→Ｆ→Ｈ→Ｉのままですので、プロジェクトの完了時刻は変わりません。\n\n選択肢ウは不適切な記述です。作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は18時間に変わります。\n\n選択肢エは不適切な記述です。作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは作業Ｂ→Ｅ→Ｇ→Ｉの経路に変わります。\n\n選択肢オは適切な記述です。作業Ｈの作業所要時間が２時間長くなった場合、プロジェクトの完了時刻が２時間遅くなるだけであり、クリティカルパスは変わりません。\n以上より、選択肢オが正解です。\n\nPERTは出題頻度の高いテーマです。本問はアローダイアグラムが与えられていましたが、過去の本試験ではアローダイアグラムの作成が求められる問題も度々出題されています。アローダイアグラムを作成してクリティカルパスが特定できるよう、トレーニングしておくと良いでしょう。",
      },
    ],
  },
  {
    id: 6,
    no: 6,
    title: "CPM",
    era: "令和2年 第11問",
    category: CAT_PLAN,
    question:
      "下表は、あるプロジェクト業務を行う際の各作業の要件を示している。CPM（Critical Path Method）を適用して、最短プロジェクト遂行期間となる条件を達成したときの最小費用として、最も適切なものを下記の解答群から選べ（単位：万円）。",
    problemFig: "cpmTable6",
    choices: ["440", "510", "530", "610", "710"],
    answer: 2,
    explanation: [
      {
        t: "p",
        v: "PERTに関する問題です。最短プロジェクト日数達成のための最小費用の算出まで求められる難易度の高いものです。\n\n解答の手順は以下の通りです。\n手順1：最短所要時間を用いたクリティカルパスの導出と最短プロジェクト遂行時間の把握\n手順２：手順１の最短プロジェクト遂行期間を実現する必要短縮時間の把握\n手順３：手順２の必要短縮時間を最小費用で行う方法の特定\n\n【手順１：最短プロジェクト遂行期間の把握】\n所要期間と最短所要期間のアローダイヤグラムは以下のとおりです。",
      },
      { t: "fig", v: "cpmFig1" },
      { t: "fig", v: "cpmFig2" },
      {
        t: "p",
        v: "最短所要時間に基づくアローダイヤグラムのクリティカルパスはA（4）＋D（7）＋E（3）＝14となります。\n\n【手順2：必要短縮時間の把握】\n図1と図2より、\n・作業Aは5から4に短縮\n・作業Dは9から7に短縮\n・作業Eは5から3に短縮\nする必要があります。\nなお、作業Bと作業Cは現状の6と7のままであると作業Dの7を超えてしまいます。そこで作業Bと作業Cの所要時間を7にする最小費用を特定します。\n\n【手順3：最小費用の特定】\n作業Bと作業Cの単位時間当たりの短縮費用から、短縮費用の小さい作業Bを優先的に短縮します。\n・作業Bは6から2に短縮\n・作業Cは7から5に短縮\n以上から各作業の短縮時間と短縮費用は以下のようになります。",
      },
      { t: "fig", v: "cpmCost" },
      {
        t: "p",
        v: "したがって、最小費用は530となるため、選択肢ウが正解です。",
      },
    ],
  },
  {
    id: 7,
    no: 7,
    title: "ジョブの投入順序",
    era: "令和元年 第9問",
    category: CAT_PLAN,
    question:
      "　2工程のフローショップにおけるジョブの投入順序を考える。各ジョブ各工程の加工時間が下表のように与えられたとき、生産を開始して全てのジョブの加工を完了するまでの時間（メイクスパン）を最小にする順序として、最も適切なものを下記の解答群から選べ。",
    problemFig: "johnsonTable",
    choices: ["J1→J2→J3", "J1→J3→J2", "J2→J1→J3", "J3→J2→J1"],
    answer: 3,
    explanation: [
      {
        t: "p",
        v: "本問では、フローショップにおけるジョブの投入順序が問われています。また、ジョブショップスケジューリングのJohnson法の知識と各工程開始の判断が求められるため、やや難易度は高いものです。\nフローショップは、すべてのジョブについて実行されるべき作業が類似のもので、その作業順序に従って機械が配置されている多段階生産システムです。全ジョブはその機械配置に沿って一方向に流れます。2工程のフローショップでメイクスパン、つまり最も早い作業時間の開始時刻から、最も遅い作業の終了時刻までの長さの最小化を目的とするスケジューリングに対してはジョンソンの最適化アルゴリズムを利用します。\nジョブショップは、ジョブについて実行されるべき作業内容や工程順序が異なる多段階生産システムです。フローショップに比べて、ジョブの流れは複雑で交錯したものになります。ジョブショップは順序付け手法とディスパチング手法に大別されます。順位付け手法にはJohnson法、完全列挙法等の手法があります。\n本問では、2工程のフローショップなのでジョンソンの最適化アルゴリズムを利用します。ジョンソンの最適化アルゴリズムにおける順位付けのルールは、以下のステップから決定されます。",
      },
      { t: "fig", v: "johnsonTable" },
      {
        t: "p",
        v: "ステップ１：すべての作業時間から最小のものを選ぶ。2工程では第1工程のJ3の1時間が該当します。\nステップ2：ステップ1で選んだ工程が、第1工程の場合は最初に、第2工程の場合は最後に処理します。J3の1時間は第1工程なので最初にスケジューリングします。\nステップ3：処理順序の決定したJ3の第1工程を除きます。\nステップ4：順序の決定していないものをステップ1に戻り繰り返します。\n上記の結果、次の工程が最小のメイクスパンとなります。",
      },
      { t: "fig", v: "johnsonGantt" },
      {
        t: "p",
        v: "従って、投入順序はJ3→J2→J1となり、選択肢エが適切な順番です。",
      },
    ],
  },
  {
    id: 8,
    no: 8,
    title: "需要予測1",
    era: "令和3年 第8問",
    category: CAT_PLAN,
    question:
      "需要量の時系列データを用いる需要予測法に関する記述として、最も適切なものはどれか。",
    choices: [
      "移動平均法の予測精度は、個々の予測値の計算に用いるデータ数に依存しない。",
      "移動平均法では、期が進むにつれて個々の予測値の計算に用いるデータ数が増加する。",
      "指数平滑法では、過去の需要量にさかのぼるにつれて重みが指数的に減少する。",
      "指数平滑法では、過去の予測誤差とは独立に将来の需要量が予測される。",
    ],
    answer: 2,
    explanation: [
      {
        t: "p",
        v: "需要予測法に関する出題です。時系列データを用いる「移動平均法」と「指数平滑法」の基本的な知識が問われています。難易度は高くありませんので、確実に正解したい問題です。\nまず、それぞれの需要予測法について確認しておきましょう。",
      },
      {
        t: "note",
        title: "需要予測の方法",
        v: "移動平均法とは、過去の実績データをもとに将来の需要量を予測する方法です。過去のデータを単純平均した値を使う「単純移動平均法」と、過去のデータに異なる重み付けをした加重平均値を用いる「加重移動平均法」があります。\n指数平滑法とは、過去の実績データのうち、直近の新しいデータに重いウェイトを置いて将来の需要量を予測する方法です。過去のデータに遡るにつれて、指数的に重みを減少させる加重移動平均法です。",
      },
      {
        t: "p",
        v: "では、選択肢を見ていきましょう。\n選択肢アは不適切な記述です。移動平均法は、過去の実績データを平均して予測値を求めますので、予測精度は計算に用いるデータの数に依存します。数が多ければ予測精度は高まり、少なければ予測精度は低くなります。\n選択肢イは不適切な記述です。移動平均法の計算に用いるデータ数は、任意で設定します。過去の全期間を対象にする必要はありませんので、期が進むにつれて必ずしもデータ数が増加するわけではありません。\n選択肢ウは適切な記述です。指数平滑法は、直近の実績データに重きを置いて将来の需要量を予測します。過去のデータ（需要量）に遡るにつれて、重みは指数的に減少します。\n選択肢エは不適切な記述です。指数平滑法は、前回の予測と実績がどの程度乖離したかを踏まえて、将来の需要予測を立てます。計算式は次の通りです。\n将来の予測値＝前回の予測値＋平滑化指数×（前回の実績値－前回の予測値）\n右辺の（前回の実績値－前回の予測値）が過去の予測誤差です。よって、指数平滑法では将来の需要量を予測する際に、過去の予測誤差を反映します。\n需要予測法は生産管理だけでなく、店舗販売管理においても頻繁に出題されています。需要予測法のそれぞれの特徴と計算式はしっかり覚えておきましょう。",
      },
    ],
  },
  {
    id: 9,
    no: 9,
    title: "需要予測2",
    era: "平成29年 第34問",
    category: CAT_PLAN,
    question: "　需要予測に関する次の記述として、最も適切なものはどれか。",
    choices: [
      "移動平均法は、過去の一定期間の実績値の平均に過去の変動要因を加えて予測する方法である。",
      "季節変動とは、3か月を周期とする変動である。",
      "指数平滑法は、当期の実績値と当期の予測値を加重平均して次期の予測値を算出する方法である。",
      "重回帰分析では、説明変数間の相関が高いほど良い数式（モデル）であると評価できる。",
    ],
    answer: 2,
    explanation: [
      {
        t: "p",
        v: "　需要予測に関する問題です。\nそれでは選択肢を見ていきましょう。\n\n　選択肢アですが、移動平均法は、過去の実績値のみを予測に利用するものです。過去の変動要因を加えるものではありません。したがって、不適切な記述です。\n\n　選択肢イですが、季節変動は3か月ではなく、1年を周期とする変動です。季節変動の要因は天候など自然現象や社会慣習、ボーナス支給、年末年始などがあります。したがって、不適切な記述です。\n\n　選択肢ウを見てみましょう。指数平滑法とは、次期の予測値を以下の式で求めるものです。\n次期の予測値＝当期の予測値＋α（当期の実績値－当期の予測値）\nαは平滑化定数といわれ、0から1の値をとります。当期の実績値と当期の予測値は平滑化定数αにより加重平均されます。したがって、適切な記述です。\n\n　選択肢エを見てみましょう。重回帰分析では重回帰モデルを利用して、説明したい変数を説明変数によりモデル化します。説明変数が１つのものを単回帰モデル、複数の場合を重回帰モデルといいます。重回帰モデルによる予測値と実際の値の相関関係（重回帰係数）を二乗したものを重決定係数といいます。この値が高いほど、重回帰モデルの予測値の精度が高いものとされます。説明変数間の相関が高いものではありません。したがって、不適切な記述です。",
      },
    ],
  },
  {
    id: 10,
    no: 10,
    title: "指数平滑法",
    era: "平成27年 第9問",
    category: CAT_PLAN,
    question:
      "　ある会社では、商品の需要予測に指数平滑法（平滑化定数α＝0.4）を用いている。当期の需要予測値75に対し、需要実績値は55であった。次期の需要予測値として、最も適切なものはどれか。",
    choices: ["63", "65", "67", "69"],
    answer: 2,
    explanation: [
      {
        t: "p",
        v: "　需要予測について、指数平滑法に関する問題です。\n指数平滑法で予測値を求める式を覚えていれば容易に解ける問題です。\n指数平滑法では、需要予測にあたって、直近の値を重視します。予測値を求める式は次の通りです。\n　来期予測値＝今期予測値＋平滑化指数Ｘ（今期実績値－今期予測値）\nこの式にあてはめて、次期の需要予測値を計算すると、\n　75＋0.4× (55－75) ＝75－8＝67\nとなります。\nしたがって正解はウになります。",
      },
    ],
  },
  {
    id: 11,
    no: 11,
    title: "現品管理",
    era: "平成30年 第14問",
    category: CAT_CTRL,
    question:
      "JIS で定義される現品管理の活動として、最も不適切なものはどれか。",
    choices: [
      "受け入れ外注品の品質と数量の把握",
      "仕掛品の適正な保管位置や保管方法の設定",
      "製品の適正な運搬荷姿や運搬方法の検討",
      "利用資材の発注方式の見直し",
    ],
    answer: 3,
    explanation: [
      {
        t: "p",
        v: "本問は、現品管理について問われています。\nまずは現品管理について、簡単に復習しておきましょう。\nなお、JISには以下のように定義されています。\n「資材、仕掛品、製品などの物について、運搬・移動や停滞・保管の状況を管理する活動。現品の経済的処理と数量、所在の確実な把握を目的とする。現物管理ともいう。」（JISZ8142-4102）\n\nでは、選択肢をみていきましょう。本問は、不適切なものを選択することに注意します。\n選択肢アは適切な記述です。「受け入れ外注品の品質と数量」を把握することは、前述の定義と照らし、現品管理と言えます。よって、アは適切です。\n選択肢イは適切な記述です。「仕掛品の適正な保管位置や保管方法」を設定することは、前述の定義と照らし、現品管理と言えます。よって、イは適切です。\n選択肢ウは適切な記述です。「製品の適正な運搬荷姿や運搬方法」を検討することは、前述の定義と照らし、現品管理と言えます。よって、ウは適切です。\n選択肢エは不適切な記述です。「利用資材の発注方式」を見直すことは、前述の定義と照らし、現品管理とは合致しません。これは、改善活動と言えます。よって、記述は不適切で、エが正解です。\nJISの定義を網羅して学習することは非効率ですので、基礎的な用語の定義は、一通り覚えておきましょう。また、現品管理は生産統制を構成する3要素の1つですので、幅広く理解を深めておきましょう。",
      },
    ],
  },
  {
    id: 12,
    no: 12,
    title: "余力管理",
    era: "令和5年 第10問",
    category: CAT_CTRL,
    question:
      "工数管理や余力管理に関する以下のａ～ｄの記述と用語の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\nａ　仕事量の全体を表す尺度で、仕事を１人の作業者で遂行するのに要する時間。\nｂ　各工程または個々の作業者における、現在の作業負荷状態と現有作業能力の差。\nｃ　作業習熟や改善活動、設計改良などによって作業時間を減らすこと。\nｄ　作業の実施時期をずらすなどにより生産の負荷平準化を行うこと。",
    choices: [
      "ａ：工数　　ｂ：作業余裕　　ｃ：工数低減　　ｄ：工程編成",
      "ａ：工数　　ｂ：余力　　ｃ：工数低減　　ｄ：工数の山積山崩",
      "ａ：工程能力　　ｂ：工程能力指数　　ｃ：工程分割　　ｄ：工数低減",
      "ａ：標準時間　　ｂ：作業余裕　　ｃ：工程分割　　ｄ：工数の山積山崩",
      "ａ：標準時間　　ｂ：余力　　ｃ：工数の山積山崩　　ｄ：工程編成",
    ],
    answer: 1,
    explanation: [
      {
        t: "p",
        v: "余力管理に関する出題です。基本的な知識が問われており、難易度は高くありません。\n\n余力とは、負荷と能力の差を指します。余力管理では、各工程又は個々の作業者について、現在の負荷状態と現有能力とを把握し、現在どれだけの余力又は不足があるかを検討し、作業の再配分を行って能力と負荷を均衡させていく活動です。工数管理ともいいます。\n工数とは、仕事量の全体を表す尺度で、仕事を一人の作業者で遂行するのに要する時間を指します。\nでは、それぞれの記述を確認してみましょう。\n\nａ：仕事量の全体を表す尺度で、仕事を１人の作業者で遂行するのに要する時間は、工数です。\nｂ：各工程または個々の作業者における現在の作業負荷状態と現有作業能力の差は、余力です。\nｃ：作業習熟や改善活動、設計改良などによって作業時間を減らすことを、工数低減といいます。\nｄ：作業の実施時期をずらすなどにより、生産の負荷平準化を行うことを、工数の山積山崩といいます。\n\n以上より、選択肢イの組み合わせが正解です。\n余力管理は過去の本試験で度々出題されています。しっかり理解しておきましょう。",
      },
    ],
  },
  {
    id: 13,
    no: 13,
    title: "生産管理方式",
    era: "令和4年 第4問",
    category: CAT_PLAN,
    question:
      "生産方式に関する記述の正誤の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\nａ　オーダエントリー方式は、生産工程にある半製品に顧客のオーダを引き当て、顧客が希望した仕様の製品として完成させるために、仕様に合わせた部品や作業を選択して生産する方式である。\nｂ　生産座席予約方式は、設備の稼働状況を基に、顧客のオーダを到着順に生産する方式である。\nｃ　モジュール生産方式は、あらかじめモジュール部品を複数用意し、受注後にそれらの組み合わせによって多品種の最終製品を生産する方式で、リードタイムの短縮が期待できる。\nｄ　製番管理方式は、製品の組立を開始する時点で部品を引き当てる方式で、ロット生産にも利用可能で、特にロットサイズが大きい場合に適している。",
    choices: [
      "ａ：正　　ｂ：正　　ｃ：誤　　ｄ：誤",
      "ａ：正　　ｂ：誤　　ｃ：正　　ｄ：誤",
      "ａ：正　　ｂ：誤　　ｃ：正　　ｄ：正",
      "ａ：誤　　ｂ：正　　ｃ：誤　　ｄ：正",
      "ａ：誤　　ｂ：誤　　ｃ：正　　ｄ：正",
    ],
    answer: 1,
    explanation: [
      {
        t: "p",
        v: "生産方式に関する出題です。それぞれの生産方式について踏み込んだ知識が問われており、すべての設問の正誤を判断する必要があるため、難易度はやや高いと言えます。\n\nでは、設問を見ていきましょう。\naは適切な記述です。オーダエントリー方式とは、「生産工程にある製品に顧客のオーダを引き当て、製品の仕様の選択又は変更をする生産方式」です。例えば、自動車の生産では、途中まで組み立てられた標準の車体に対して、シートの素材や塗装の色など、顧客が選択したオプションに合わせて、個別に仕様を変更して車を完成させます。\n\nbは不適切な記述です。生産座席予約方式とは、「受注時に、製造設備の使用日程・資材の使用予定などにオーダを割り付け、顧客が要求する納期どおりに生産する方式」です。製造工程を「座席」に見立て、例えば営業部門が（飛行機などの座席を予約する感覚で）顧客の希望する製品の出荷を予約していきます。オーダを到着順に生産する方式ではありません。\n\ncは適切な記述です。モジュール生産方式は、モジュールと呼ばれる機能ごとの部品をあらかじめ組み上げておき、受注後にそれらのモジュールを複数組み合わせて、最終製品として完成させる方式です。これにより、リードタイムの短縮が図れます。\n\ndは不適切な記述です。製番管理方式は、製品ごとに「製番」という製造番号を発行し、製品を構成する全ての部品に対して同じ製番を付けて管理します。ロット生産でも利用可能ですが、ロットサイズは小さい場合に適しています。\n\n以上より、a：正　b：誤　c：正　d：誤　の組み合わせとなりますので、選択肢イが正解です。\n生産方式は出題頻度の高いテーマです。本問で問われた生産方式は、今後も出題される可能性がありますので、しっかり理解しておきましょう。",
      },
    ],
  },
  {
    id: 14,
    no: 14,
    title: "トヨタ生産方式",
    era: "平成30年 第11問",
    category: CAT_PLAN,
    question:
      "　トヨタ生産方式の特徴を表す用語として、最も適切なものの組み合わせを下記の解答群から選べ。\n\nａ　MRP\nｂ　かんばん方式\nｃ　セル生産方式\nｄ　製番管理方式\nｅ　あんどん方式",
    choices: ["ａとｃ", "ａとｄ", "ｂとｃ", "ｂとｅ", "ｄとｅ"],
    answer: 3,
    explanation: [
      {
        t: "p",
        v: "　本問は、トヨタ生産方式について問われています。\n　生産管理の管理方式について基礎的な知識と、トヨタ生産方式の特徴を押さえている方であれば、容易に正解できる問題です。\n\n　まずは生産管理の管理方式について、簡単に復習しておきましょう。\n\n　次にトヨタ生産方式ですが、無駄をできるだけ排除して、必要な数だけ生産する方式です。トヨタ生産方式は、ジャストインタイムと、自働化という思想に基づいています。また、かんばん方式は、トヨタ自動車が開発した管理方式として有名で、トヨタ生産方式の一部となっています。\n\n　ジャストインタイム（JIT）は、必要なものを、必要な時に、必要な数だけ生産する方式です。ジャストインタイムでは、後工程が使った分だけ前工程から引き取ります。そのため、ジャストインタイムは、後工程引取方式やプルシステムと呼ばれることもあります。\n\n　自働化は、異常が発生したときに、機械を自動的に停止し、不良品を作らないための仕組みです。異常が発生した場合には、すぐにラインを停止します。また「あんどん」というランプによって、どこで停止したかが一目で分かるようになっています。ちなみに、自働化の「働」という字には、ニンベンがついています。\n\n　かんばん方式は、後工程引取方式を実現するための情報伝達の手法です。かんばんには、「生産指示かんばん」と「引取りかんばん」の2種類があります。生産指示かんばんは、作業の指示を表し、引取りかんばんは、運搬を表します。このかんばんによって、後工程から前工程に生産指示が出されていきます。これにより、後工程が生産した分だけ、前工程で生産するため、無駄を極力排除することができます。\n\n　ここまで押さえた上で、選択肢の各用語をみていきましょう。\n\n　ａですが、MRP（Material Requirement Planning：資材所要量計画）とは、製品の生産計画を基に、資材の所要量と時期を計画するための仕組みです。製品の生産計画を、MRPでは「基準生産計画」MPS（Master Production Schedule）と呼びますが、トップダウンの計画に基づいているため、プルシステムに対してプッシュシステムと呼ばれることがあります。MRPは、トヨタ生産方式の特徴であるジャストインタイム（プルシステム）と相反する特徴をもつシステムであり、不適切です。\n\n　ｂですが、かんばん方式は前述の通り、トヨタ自動車が開発した管理方式として有名で、トヨタ生産方式の一部となっています。よって、適切です。\n\n　ｃですが、セル生産方式は、加工機械のグループを作り、そのグループ単位で工程を編成する方式です。加工機械のグループのことをセルと呼びます。\nセル生産方式では、グループテクノロジーを利用して部品をグループ化することで、それらの生産に適した機械を配置します。グループテクノロジーとは、多種類の部品をなんらかの類似性に基づいて分類することで、多種少量生産に大量生産的効果を与える管理手法です。一般的には、セル生産方式は、1人から数人の作業者で製品を最後まで作り上げる生産方式という意味で使われることが多いですが、本来の意味では、グループテクノロジーが使われているのが、セル生産方式です。\nセル生産方式は、トヨタ生産方式やジャストインタイムでライン形式を進化させて生まれた方式と言われますが、トヨタ生産方式で必ず使用される方式というわけではなく、特徴的なものではありません。よって、不適切です。\n\n　ｄですが、製番管理方式は、製品を中心に管理する手法です。製番管理方式では、製品ごとに製番という製造番号を発行し、製品を構成する全ての部品に対して同じ製番を付けて管理します。製番管理方式は、受注生産形態で多く用いられている手法ですが、トヨタ生産方式で用いられる方式ではありません。よって、不適切です。\n\n　ｅですが、あんどん方式の「あんどん」は、前述の通りトヨタ生産方式の自働化において、異常発生時にどこで停止しているかを可視化するランプのことです。自働化を支える方式の1つであり、適切です。\n\n　よって、ｂとｅが適切な組み合わせであり、エが正解です。\n\n　生産管理の管理方式は、過去に何度も出題されたほどの頻出論点です。また、トヨタ生産方式は、日本の製造業を支える代表的で、重要な方式の1つです。本問のような基礎的でシンプルな設問は必ず正解するのは言うまでもありませんが、応用力も養って様々な切り口の出題に対応できるようにしましょう。",
      },
    ],
  },
  {
    id: 15,
    no: 15,
    title: "製造現場の改善方法",
    era: "平成29年 第20問",
    category: CAT_CTRL,
    question:
      "　生産現場で行われる改善施策に関する記述として、最も不適切なものはどれか。",
    choices: [
      "機械設備の稼働状況を可視化するために、「あんどん」を設置した。",
      "「シングル段取」の実現を目指して、内段取の一部を外段取に変更した。",
      "品種変更に伴う段取り替えの回数を抑制するために、製品の流れを「1個流し」に変更した。",
      "部品の組み付け忘れを防止するために、部品の供給棚に「ポカヨケ」の改善を施した。",
    ],
    answer: 2,
    explanation: [
      {
        t: "p",
        v: "　生産現場の改善に関する問題です。\n　選択肢アは適切な記述です。あんどんとは、各工程の状況をランプで示し、工程内外に一目で見てわかるように工夫した工程管理方式の1つです。機械設備の稼働状況を可視化する方式ですので、適切な記述です。\n\n　選択肢イは適切な記述ですシングル段取とは、機械の停止時間が10分未満の内段取のことです。段取替え時間の短縮、改善方法には内段取そのものの短縮化、内段取の外段取化があります。したがって、適切な記述です。\n\n　選択肢ウは不適切な記述です1個流しは、部品の生産から組み立てまで顧客が必要とする単位である「1個ずつ」流す方法です。製品を1個加工したら、すぐ次工程に送るので工程間に仕掛品は置きません。1個流しは中間仕掛品の滞留や工程における遊休防止のためですが、品種変更に伴う段取り替えの回数はむしろ増える可能性があります。したがって不適切な記述です。\n\n　選択肢エは適切な記述です「ポカヨケ」とは、生産ラインに設置される作業ミスを防止する仕組み、装置のことです。部品の供給棚に「ポカヨケ」の改善を施すことは部品の組み付け忘れという間違いの予防に役立つと考えられます。したがって適切な記述です。",
      },
    ],
  },
];

const TOTAL = QUESTIONS.length;

// ===================================================================
// LocalStorageフォールバック（通信不能でもクラッシュさせない）
// ===================================================================
const localKey = (uid) => `${APP_ID}::${uid}`;
const loadLocal = (uid) => {
  try {
    const raw = localStorage.getItem(localKey(uid));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("[Local] 読み込み失敗:", e);
    return null;
  }
};
const saveLocal = (uid, data) => {
  try {
    const prev = loadLocal(uid) || {};
    localStorage.setItem(localKey(uid), JSON.stringify({ ...prev, ...data }));
  } catch (e) {
    console.error("[Local] 保存失敗:", e);
  }
};

const MODE_LABEL = {
  all: "すべての問題",
  wrong: "前回不正解の問題のみ",
  review: "要復習の問題のみ",
};

// ===================================================================
// 解説ブロックの描画
// ===================================================================
const ExplanationBlocks = ({ blocks }) => (
  <div className="space-y-1">
    {(blocks || []).map((b, i) => {
      if (b.t === "fig") {
        return <div key={i}>{renderFig(b.v)}</div>;
      }
      if (b.t === "note") {
        return <NoteBox key={i} title={b.title} body={b.v} />;
      }
      return (
        <p
          key={i}
          className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200"
        >
          {b.v}
        </p>
      );
    })}
  </div>
);

// ===================================================================
// メインアプリ
// ===================================================================
export default function App() {
  const [authReady, setAuthReady] = useState(false); // 匿名認証の通信完了
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 合言葉ログイン完了
  const [dataLoaded, setDataLoaded] = useState(false); // 初回データ取得完了
  const [passphrase, setPassphrase] = useState("");
  const [loginError, setLoginError] = useState("");
  const [userId, setUserId] = useState("");

  // 学習データ
  const [history, setHistory] = useState({}); // { [qid]: {result, reviewed, lastAnsweredAt} }
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressMode, setProgressMode] = useState("all");

  // 画面制御
  const [screen, setScreen] = useState("dashboard"); // dashboard | quiz
  const [mode, setMode] = useState("all"); // all | wrong | review
  const [quizList, setQuizList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExp, setShowExp] = useState(false);

  // 途中再開モーダル
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(null);

  // ---- ガードレール用 Ref ----
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    isFirstLoad.current = true; // ユーザーが変わったら初回ロード扱いに戻す
  }, [userId]);

  // -----------------------------------------------------------------
  // 起動時：Firebase匿名認証（通信できる状態にするだけ）
  // -----------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    const doAuth = async () => {
      if (!auth) {
        console.error("[Auth] Firebase未初期化。ローカルモードで続行します");
        if (mounted) setAuthReady(true);
        return;
      }
      try {
        await signInAnonymously(auth);
        console.log("[Auth] 匿名認証に成功（通信可能状態）");
      } catch (e) {
        console.error("[Auth] 匿名認証に失敗。ローカルモードで続行:", e);
      } finally {
        if (mounted) setAuthReady(true);
      }
    };
    doAuth();
    return () => {
      mounted = false;
    };
  }, []);

  // -----------------------------------------------------------------
  // データ保存（Firestore + LocalStorage 二重化。防衛的）
  // -----------------------------------------------------------------
  const persist = useCallback(async (uid, data) => {
    if (!uid) return;
    saveLocal(uid, data);
    if (!db) return;
    try {
      const ref = doc(db, APP_ID, uid);
      await setDoc(ref, data, { merge: true });
      console.log("[Save] Firestoreへ保存しました", data);
    } catch (e) {
      console.error("[Save] Firestore保存に失敗（ローカルには保存済み）:", e);
    }
  }, []);

  // -----------------------------------------------------------------
  // 合言葉ログイン：userIdをセットして onSnapshot 購読を開始
  // -----------------------------------------------------------------
  const handleLogin = (e) => {
    e?.preventDefault?.();
    const key = passphrase.trim();
    if (!key) {
      setLoginError("合言葉を入力してください。");
      return;
    }
    setLoginError("");
    console.log("[Login] 合言葉で接続を開始:", key);
    setDataLoaded(false);
    isFirstLoad.current = true;
    setScreen("dashboard");
    setUserId(key);
    setIsAuthenticated(true);
  };

  // -----------------------------------------------------------------
  // Firestore リアルタイム購読（screenRef + isFirstLoad ガード）
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const applyResumeOrSync = (parsed) => {
      // 【重要ガード】初回ロード かつ ダッシュボード表示中のときだけ再開モーダルをトリガー
      if (isFirstLoad.current && screenRef.current === "dashboard") {
        isFirstLoad.current = false;
        setHistory(parsed.history || {});
        setProgressIndex(parsed.progressIndex || 0);
        setProgressMode(parsed.progressMode || "all");
        setDataLoaded(true);
        if ((parsed.progressIndex || 0) > 0) {
          console.log("[Resume] 途中再開モーダルを表示:", parsed);
          setPendingProgress(parsed);
          setShowResumeModal(true);
        }
        return;
      }
      // クイズ解答中などは、モーダルを出さずに進捗のみ静かに同期
      setHistory(parsed.history || {});
      setProgressIndex(parsed.progressIndex || 0);
      setProgressMode(parsed.progressMode || "all");
      setDataLoaded(true);
    };

    // Firebase未初期化時：LocalStorageから復元
    if (!db) {
      const local = loadLocal(userId) || {};
      console.log("[Load] ローカルから復元:", local);
      applyResumeOrSync({
        history: local.history || {},
        progressIndex: Number(local.progressIndex || 0),
        progressMode: local.progressMode || "all",
      });
      return;
    }

    const ref = doc(db, APP_ID, userId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          const d = snapshot.data() || {};
          const parsed = {
            history: d?.history || {},
            progressIndex: Number(d?.progressIndex || 0),
            progressMode: d?.progressMode || "all",
          };
          console.log("[Snapshot] データ受信:", parsed);
          applyResumeOrSync(parsed);
        } else {
          // 新規ユーザー：初期ドキュメントを作成
          console.log("[Snapshot] 新規ユーザー。初期データを作成します");
          setDoc(ref, {
            history: {},
            progressIndex: 0,
            progressMode: "all",
            createdAt: new Date().toISOString(),
          }).catch((err) => console.error("[Snapshot] 初期作成失敗:", err));
          applyResumeOrSync({ history: {}, progressIndex: 0, progressMode: "all" });
        }
      },
      (err) => {
        // 通信エラー：ローカルへフォールバックしてクラッシュ回避
        console.error("[Snapshot] 購読エラー。ローカルへフォールバック:", err);
        const local = loadLocal(userId) || {};
        applyResumeOrSync({
          history: local.history || {},
          progressIndex: Number(local.progressIndex || 0),
          progressMode: local.progressMode || "all",
        });
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId]);

  // -----------------------------------------------------------------
  // モードに応じた問題リストを構築
  // -----------------------------------------------------------------
  const buildList = useCallback(
    (m) => {
      if (m === "wrong") {
        return QUESTIONS.filter((q) => history?.[q?.id]?.result === "wrong");
      }
      if (m === "review") {
        return QUESTIONS.filter((q) => history?.[q?.id]?.reviewed === true);
      }
      return [...QUESTIONS];
    },
    [history]
  );

  // 出題開始
  const startQuiz = (m, startIndex = 0) => {
    const list = buildList(m);
    if (!list || list.length === 0) {
      console.log("[Quiz] 対象問題が0件のため開始しません:", m);
      alert("対象となる問題がありません。");
      return;
    }
    const safeIndex = Math.min(Math.max(startIndex, 0), list.length - 1);
    console.log("[Quiz] 出題モード切替:", m, "／ 開始インデックス:", safeIndex);
    setMode(m);
    setQuizList(list);
    setCurrentIndex(safeIndex);
    setSelected(null);
    setShowExp(false);
    setScreen("quiz");
    setProgressMode(m);
    setProgressIndex(safeIndex);
    persist(userId, { progressMode: m, progressIndex: safeIndex });
  };

  // 続きから再開
  const resumeQuiz = () => {
    const p = pendingProgress || { progressMode, progressIndex };
    console.log("[Resume] 続きから再開:", p);
    setShowResumeModal(false);
    startQuiz(p.progressMode || "all", p.progressIndex || 0);
  };

  // 最初から
  const restartFromBeginning = () => {
    console.log("[Resume] 最初から開始。progressIndexをリセット");
    setShowResumeModal(false);
    setProgressIndex(0);
    persist(userId, { progressIndex: 0 });
    startQuiz("all", 0);
  };

  // 解答
  const handleAnswer = (choiceIndex) => {
    if (showExp) return; // 二重解答防止
    const q = quizList?.[currentIndex];
    if (!q) return;
    const correct = choiceIndex === q?.answer;
    setSelected(choiceIndex);
    setShowExp(true);

    const newHistory = {
      ...history,
      [q.id]: {
        ...(history?.[q.id] || {}),
        result: correct ? "correct" : "wrong",
        reviewed: history?.[q.id]?.reviewed || false,
        lastAnsweredAt: new Date().toISOString(),
      },
    };
    setHistory(newHistory);

    const nextIndex = currentIndex + 1;
    setProgressIndex(nextIndex);
    console.log(
      "[Answer] Q" + q.id,
      correct ? "正解" : "不正解",
      "／ progressIndex:",
      nextIndex
    );
    persist(userId, {
      history: newHistory,
      progressIndex: nextIndex,
      progressMode: mode,
    });
  };

  // 要復習トグル
  const toggleReview = () => {
    const q = quizList?.[currentIndex];
    if (!q) return;
    const cur = history?.[q.id]?.reviewed || false;
    const newHistory = {
      ...history,
      [q.id]: {
        ...(history?.[q.id] || {}),
        reviewed: !cur,
      },
    };
    setHistory(newHistory);
    console.log("[Review] Q" + q.id, "要復習:", !cur);
    persist(userId, { history: newHistory });
  };

  // 次の問題 / 完走
  const handleNext = () => {
    const isLast = currentIndex >= quizList.length - 1;
    if (isLast) {
      console.log("[Quiz] 全問完走。progressIndexを0にリセット");
      setProgressIndex(0);
      persist(userId, { progressIndex: 0 });
      setScreen("dashboard");
      return;
    }
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setSelected(null);
    setShowExp(false);
  };

  // ホームへ戻る（現在地を保存）
  const goHome = () => {
    console.log("[Nav] ホームへ戻る。progressIndexを保存:", currentIndex);
    setProgressIndex(currentIndex);
    persist(userId, { progressIndex: currentIndex, progressMode: mode });
    setScreen("dashboard");
  };

  const logout = () => {
    console.log("[Nav] ログアウト");
    setIsAuthenticated(false);
    setDataLoaded(false);
    setUserId("");
    setPassphrase("");
    setHistory({});
    setProgressIndex(0);
    setProgressMode("all");
    setScreen("dashboard");
  };

  // -----------------------------------------------------------------
  // 集計
  // -----------------------------------------------------------------
  const answeredCount = QUESTIONS.filter((q) => history?.[q?.id]?.result).length;
  const correctCount = QUESTIONS.filter(
    (q) => history?.[q?.id]?.result === "correct"
  ).length;
  const wrongCount = QUESTIONS.filter(
    (q) => history?.[q?.id]?.result === "wrong"
  ).length;
  const reviewCount = QUESTIONS.filter((q) => history?.[q?.id]?.reviewed).length;

  const catStats = (cat) => {
    const list = QUESTIONS.filter((q) => q?.category === cat);
    const total = list.length;
    const corr = list.filter(
      (q) => history?.[q?.id]?.result === "correct"
    ).length;
    return total > 0 ? Math.round((corr / total) * 100) : 0;
  };

  const radarData = [
    {
      metric: "総合進捗率",
      value: TOTAL > 0 ? Math.round((answeredCount / TOTAL) * 100) : 0,
    },
    {
      metric: "全問正解率",
      value: TOTAL > 0 ? Math.round((correctCount / TOTAL) * 100) : 0,
    },
    {
      metric: "回答正確性",
      value:
        answeredCount > 0
          ? Math.round((correctCount / answeredCount) * 100)
          : 0,
    },
    { metric: CAT_PLAN, value: catStats(CAT_PLAN) },
    { metric: CAT_CTRL, value: catStats(CAT_CTRL) },
  ];

  // ===================================================================
  // レンダリング
  // ===================================================================

  // 1) 匿名認証の通信完了前：ローディング
  if (!authReady) {
    return <FullScreenLoader text="接続を初期化しています..." />;
  }

  // 2) 未ログイン：合言葉入力画面（ダッシュボードは描画しない）
  if (!isAuthenticated) {
    return (
      <LoginScreen
        passphrase={passphrase}
        setPassphrase={setPassphrase}
        loginError={loginError}
        onSubmit={handleLogin}
      />
    );
  }

  // 3) ログイン直後・初回データ取得前：ローディング（画面真っ白防止）
  if (!dataLoaded) {
    return <FullScreenLoader text="学習データを読み込んでいます..." />;
  }

  // 4) クイズ画面
  if (screen === "quiz") {
    const q = quizList?.[currentIndex];
    if (!q) {
      return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
          <p>問題が見つかりませんでした。</p>
          <button
            onClick={goHome}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2"
          >
            ホームへ戻る
          </button>
        </div>
      );
    }
    const isCorrect = selected === q.answer;
    const reviewed = history?.[q.id]?.reviewed || false;
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* ヘッダ */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={goHome}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              <Home className="h-4 w-4" />
              ホーム
            </button>
            <div className="text-sm text-slate-400">
              {currentIndex + 1} / {quizList.length} 問
            </div>
          </div>

          {/* 進捗バー */}
          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / quizList.length) * 100}%`,
              }}
            />
          </div>

          {/* 問題カード */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur md:p-7">
            {/* バッジ */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-3 py-1 text-xs font-bold text-white">
                過去問 {EXAM_NO}
              </span>
              <span className="rounded-full border border-sky-700/60 bg-sky-950/50 px-3 py-1 text-xs font-semibold text-sky-300">
                {q.era}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {q.category}
              </span>
            </div>

            <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold text-white">
              <span className="text-sky-400">問題{q.no}</span>
              <span className="text-base text-slate-200">{q.title}</span>
            </h2>

            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
              {q.question}
            </p>

            {/* 問題図表（与条件のみ：解答情報は描画しない） */}
            {q.problemFig && renderFig(q.problemFig)}

            {q.questionAfter && (
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
                {q.questionAfter}
              </p>
            )}

            {/* 選択肢 */}
            <div className="mt-5 space-y-3">
              {q.choices.map((c, i) => {
                let cls =
                  "border-slate-700 bg-slate-800/60 hover:border-indigo-500 hover:bg-slate-800 hover:scale-[1.01]";
                let icon = null;
                if (showExp) {
                  if (i === q.answer) {
                    cls = "border-emerald-500 bg-emerald-500/15";
                    icon = <Check className="h-5 w-5 text-emerald-400" />;
                  } else if (i === selected) {
                    cls = "border-rose-500 bg-rose-500/15";
                    icon = <X className="h-5 w-5 text-rose-400" />;
                  } else {
                    cls = "border-slate-800 bg-slate-900/40 opacity-70";
                  }
                }
                return (
                  <button
                    key={i}
                    disabled={showExp}
                    onClick={() => handleAnswer(i)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${cls}`}
                  >
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-100">
                      {CHOICE_LABELS[i]}
                    </span>
                    <span className="flex-1 text-[15px] leading-relaxed text-slate-100">
                      {c}
                    </span>
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 解説 */}
          {showExp && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/30 md:p-7">
              <div
                className={`mb-4 flex items-center gap-2 text-lg font-bold ${
                  isCorrect ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isCorrect ? (
                  <>
                    <Check className="h-6 w-6" /> 正解！
                  </>
                ) : (
                  <>
                    <X className="h-6 w-6" /> 不正解
                  </>
                )}
              </div>

              <div className="mb-4 rounded-lg border border-indigo-700/50 bg-indigo-950/40 px-4 py-3 text-sm">
                正解：
                <span className="ml-1 text-base font-bold text-indigo-300">
                  {CHOICE_LABELS[q.answer]}
                </span>
                <span className="ml-2 text-slate-200">{q.choices[q.answer]}</span>
              </div>

              {/* 解説本文（フルテキスト＋解説図表） */}
              <ExplanationBlocks blocks={q.explanation} />

              {/* 要復習チェック */}
              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4 transition hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={toggleReview}
                  className="h-5 w-5 accent-amber-500"
                />
                <span className="flex items-center gap-2 text-sm font-medium text-amber-300">
                  <HelpCircle className="h-4 w-4" />
                  要復習リストに登録する
                </span>
              </label>

              {/* 次へ */}
              <button
                onClick={handleNext}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01] hover:shadow-indigo-700/50"
              >
                {currentIndex >= quizList.length - 1 ? (
                  <>
                    結果を見る（ホームへ）
                    <BarChart2 className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    次の問題へ
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5) ダッシュボード
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* 途中再開モーダル */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-lg font-bold text-sky-300">
              <RefreshCw className="h-5 w-5" />
              途中から再開しますか？
            </div>
            <p className="mb-5 text-sm leading-relaxed text-slate-200">
              前回は【問題
              {(pendingProgress?.progressIndex || 0) + 1}】まで進んでいます。
              中断したモード（
              <span className="font-semibold text-indigo-300">
                {MODE_LABEL[pendingProgress?.progressMode || "all"]}
              </span>
              ）の続きから再開しますか？
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={resumeQuiz}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 font-bold text-white transition hover:scale-[1.01]"
              >
                続きから再開する
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={restartFromBeginning}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-medium text-slate-200 transition hover:bg-slate-700"
              >
                最初から始める
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* ヘッダ */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-3 py-1 text-xs font-bold text-white">
              <BookOpen className="h-3.5 w-3.5" />
              過去問 {EXAM_NO}
            </div>
            <h1 className="text-xl font-bold text-white md:text-2xl">
              {TITLE}
            </h1>
          </div>
          <button
            onClick={logout}
            className="flex flex-none items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800"
          >
            <User className="h-4 w-4" />
            {userId}
          </button>
        </div>

        {/* サマリ + レーダー */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-100">
              <BarChart2 className="h-5 w-5 text-sky-400" />
              学習サマリ
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="収録問題数" value={`${TOTAL}問`} color="text-slate-100" />
              <Stat
                label="解答済み"
                value={`${answeredCount}問`}
                color="text-sky-400"
              />
              <Stat
                label="正解数"
                value={`${correctCount}問`}
                color="text-emerald-400"
              />
              <Stat
                label="不正解数"
                value={`${wrongCount}問`}
                color="text-rose-400"
              />
            </div>
            <div className="mt-3 rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-300">
              要復習：{reviewCount}問
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-100">
              <BarChart2 className="h-5 w-5 text-indigo-400" />
              学習レーダー
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "#cbd5e1", fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#818cf8"
                    fill="#6366f1"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* モード選択 */}
        <div className="mb-6">
          <h3 className="mb-3 font-bold text-slate-100">出題モードを選択</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ModeButton
              title="すべての問題"
              desc={`全${TOTAL}問に挑戦`}
              onClick={() => startQuiz("all", 0)}
              primary
            />
            <ModeButton
              title="前回不正解のみ"
              desc={`${wrongCount}問`}
              disabled={wrongCount === 0}
              onClick={() => startQuiz("wrong", 0)}
            />
            <ModeButton
              title="要復習のみ"
              desc={`${reviewCount}問`}
              disabled={reviewCount === 0}
              onClick={() => startQuiz("review", 0)}
            />
          </div>
        </div>

        {/* 履歴一覧 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="mb-4 font-bold text-slate-100">問題別の学習状況</h3>
          <div className="space-y-2">
            {QUESTIONS.map((q) => {
              const h = history?.[q.id] || {};
              const result = h?.result;
              const reviewed = h?.reviewed;
              const date = h?.lastAnsweredAt
                ? new Date(h.lastAnsweredAt).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";
              return (
                <div
                  key={q.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-200">
                    {q.no}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">
                      {q.title}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {q.era}・{q.category}
                    </div>
                  </div>
                  {reviewed && (
                    <span className="flex-none rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                      要復習
                    </span>
                  )}
                  <span className="hidden flex-none text-xs text-slate-500 sm:block">
                    {date}
                  </span>
                  <span className="flex-none">
                    {result === "correct" ? (
                      <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        正解
                      </span>
                    ) : result === "wrong" ? (
                      <span className="flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-xs font-bold text-rose-400">
                        <X className="h-3.5 w-3.5" />
                        不正解
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-400">
                        未着手
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-600">
          APP_ID: {APP_ID}
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// 補助コンポーネント
// ===================================================================
const FullScreenLoader = ({ text }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-200">
    <RefreshCw className="mb-4 h-10 w-10 animate-spin text-indigo-400" />
    <p className="text-sm text-slate-400">{text}</p>
  </div>
);

const LoginScreen = ({ passphrase, setPassphrase, loginError, onSubmit }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 font-sans">
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-1.5 text-sm font-bold text-white">
          <BookOpen className="h-4 w-4" />
          過去問セレクト演習 {EXAM_NO}
        </div>
        <h1 className="text-xl font-bold text-white">生産計画と生産統制</h1>
        <p className="mt-2 text-sm text-slate-400">
          合言葉でログインすると、学習履歴が複数端末で同期されます。
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur"
      >
        <label className="mb-2 block text-sm font-medium text-slate-300">
          合言葉（ユーザーID）
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="例：sanpei-2026"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        {loginError && (
          <p className="mt-2 text-sm text-rose-400">{loginError}</p>
        )}
        <button
          type="submit"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
        >
          学習をはじめる
          <ChevronRight className="h-5 w-5" />
        </button>
        <p className="mt-4 text-center text-xs text-slate-500">
          同じ合言葉をスマホ・PCで入力すれば、進捗が完全同期されます。
        </p>
      </form>
    </div>
  </div>
);

const Stat = ({ label, value, color }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`mt-0.5 text-xl font-bold ${color}`}>{value}</div>
  </div>
);

const ModeButton = ({ title, desc, onClick, disabled, primary }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group rounded-2xl border p-4 text-left transition-all duration-150 ${
      disabled
        ? "cursor-not-allowed border-slate-800 bg-slate-900/40 opacity-50"
        : primary
        ? "border-indigo-500/60 bg-gradient-to-br from-indigo-600/30 to-sky-500/20 hover:scale-[1.02] hover:border-indigo-400"
        : "border-slate-700 bg-slate-900/70 hover:scale-[1.02] hover:border-sky-500"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="font-bold text-slate-100">{title}</span>
      {!disabled && (
        <ChevronRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-sky-400" />
      )}
    </div>
    <div className="mt-1 text-sm text-slate-400">{desc}</div>
  </button>
);