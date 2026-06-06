// npm install lucide-react recharts firebase

import React, { useState, useEffect, useMemo } from "react";
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
  HelpCircle 
} from "lucide-react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const APP_ID = "QuizApp_Production_Planning_001";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 防衛的初期化
let app;
let db;
let auth;
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config is incomplete. Running in Local Storage fallback mode.");
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// ==========================================
// 1. 各種インラインSVG・Tableコンポーネント
// ==========================================

// 問題1：生産計画テーブル
const Q1Table = ({ showExplanation = false }) => {
  return (
    <div className="overflow-x-auto my-4">
      {!showExplanation ? (
        <table className="min-w-full text-center border-collapse border border-slate-700 bg-slate-900/60 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="border border-slate-700 p-2 font-bold text-sm">日</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">1</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">2</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">3</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">4</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">5</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">総費用</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr>
              <td className="border border-slate-700 p-2 font-semibold">需要量</td>
              <td className="border border-slate-700 p-2">200</td>
              <td className="border border-slate-700 p-2">180</td>
              <td className="border border-slate-700 p-2">140</td>
              <td className="border border-slate-700 p-2">80</td>
              <td className="border border-slate-700 p-2">100</td>
              <td className="border border-slate-700 p-2 bg-slate-800/40"></td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-semibold text-sky-400">案0</td>
              <td className="border border-slate-700 p-2">700</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2 font-semibold text-emerald-400">16,000</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-semibold text-sky-400">案1</td>
              <td className="border border-slate-700 p-2">200</td>
              <td className="border border-slate-700 p-2">500</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2"></td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-semibold text-sky-400">案2</td>
              <td className="border border-slate-700 p-2">380</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">320</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2"></td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-semibold text-sky-400">案3</td>
              <td className="border border-slate-700 p-2">520</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">180</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2"></td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-semibold text-sky-400">案4</td>
              <td className="border border-slate-700 p-2">600</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">0</td>
              <td className="border border-slate-700 p-2">100</td>
              <td className="border border-slate-700 p-2"></td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="min-w-full text-center border-collapse border border-slate-700 bg-slate-900/60 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="border border-slate-700 p-2 font-bold text-sm">日</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">1</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">2</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">3</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">4</th>
              <th className="border border-slate-700 p-2 font-bold text-sm">5</th>
              <th className="border border-slate-700 p-2 font-bold text-sm text-amber-400">繰越在庫量（合計）</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr>
              <td className="border border-slate-700 p-2 font-semibold">需要量</td>
              <td className="border border-slate-700 p-2">200</td>
              <td className="border border-slate-700 p-2">180</td>
              <td className="border border-slate-700 p-2">140</td>
              <td className="border border-slate-700 p-2">80</td>
              <td className="border border-slate-700 p-2">100</td>
              <td className="border border-slate-700 p-2 bg-slate-800/40"></td>
            </tr>
            <tr className="bg-slate-800/10">
              <td className="border border-slate-700 p-2 font-semibold text-slate-400" rowSpan={2}>案0</td>
              <td className="border border-slate-700 p-2 text-xs text-slate-500">700</td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2 bg-slate-800/40"></td>
            </tr>
            <tr className="bg-slate-800/10 border-b-2 border-slate-700">
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">500</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">320</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">180</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">100</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">0</td>
              <td className="border border-slate-700 p-2 text-amber-400 font-bold bg-slate-800/60">1,100</td>
            </tr>
            <tr className="bg-slate-800/5">
              <td className="border border-slate-700 p-2 font-semibold text-slate-400" rowSpan={2}>案1</td>
              <td className="border border-slate-700 p-2 text-xs text-slate-500">200</td>
              <td className="border border-slate-700 p-2 text-xs text-slate-500">500</td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2 bg-slate-800/40"></td>
            </tr>
            <tr className="bg-slate-800/5 border-b-2 border-slate-700">
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">0</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">320</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">180</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">100</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">0</td>
              <td className="border border-slate-700 p-2 text-amber-400 font-bold bg-slate-800/60">600</td>
            </tr>
            <tr className="bg-amber-500/10">
              <td className="border border-slate-700 p-2 font-bold text-amber-400" rowSpan={2}>案2</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-300 font-semibold">380</td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2 text-xs text-amber-300 font-semibold">320</td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2 bg-slate-800/40"></td>
            </tr>
            <tr className="bg-amber-500/10 border-b-2 border-slate-700">
              <td className="border border-slate-700 p-2 text-xs text-amber-400 font-bold">180</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-400 font-bold">0</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-400 font-bold">180</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-400 font-bold">100</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-400 font-bold">0</td>
              <td className="border border-slate-700 p-2 text-amber-300 font-extrabold bg-amber-500/35">460</td>
            </tr>
            <tr className="bg-slate-800/5">
              <td className="border border-slate-700 p-2 font-semibold text-slate-400" rowSpan={2}>案3</td>
              <td className="border border-slate-700 p-2 text-xs text-slate-500">520</td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2 text-xs text-slate-500">180</td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2 bg-slate-800/40"></td>
            </tr>
            <tr className="bg-slate-800/5 border-b-2 border-slate-700">
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">320</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">140</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">0</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">100</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">0</td>
              <td className="border border-slate-700 p-2 text-amber-400 font-bold bg-slate-800/60">560</td>
            </tr>
            <tr className="bg-slate-800/10">
              <td className="border border-slate-700 p-2 font-semibold text-slate-400" rowSpan={2}>案4</td>
              <td className="border border-slate-700 p-2 text-xs text-slate-500">600</td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2"></td>
              <td className="border border-slate-700 p-2 text-xs text-slate-500">100</td>
              <td className="border border-slate-700 p-2 bg-slate-800/40"></td>
            </tr>
            <tr className="bg-slate-800/10 border-b-2 border-slate-700">
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">400</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">220</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">80</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">0</td>
              <td className="border border-slate-700 p-2 text-xs text-amber-500 font-semibold">0</td>
              <td className="border border-slate-700 p-2 text-amber-400 font-bold bg-slate-800/60">700</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

// 問題4：PERT1 アローダイアグラム (最早・最遅ボックス付き)
const Q4PERT = () => {
  return (
    <div className="flex flex-col items-center my-6 bg-slate-900/40 p-4 border border-slate-700 rounded-lg">
      <h4 className="text-sm font-semibold text-slate-200 mb-2">アローダイアグラム</h4>
      <svg viewBox="0 0 700 400" className="w-full max-w-xl">
        <defs>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>
          <marker id="arrow-dash" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* 凡例 */}
        <g transform="translate(480, 20)">
          <rect x="0" y="0" width="200" height="90" fill="none" stroke="#475569" strokeWidth="1" rx="4" />
          <rect x="15" y="15" width="40" height="30" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          <line x1="15" y1="30" x2="55" y2="30" stroke="#38bdf8" strokeWidth="1" />
          <text x="20" y="26" fill="#f8fafc" className="text-[10px]" textAnchor="start">上段</text>
          <text x="20" y="41" fill="#f8fafc" className="text-[10px]" textAnchor="start">下段</text>
          <path d="M 55 30 L 68 22" fill="none" stroke="#f8fafc" strokeWidth="1" />
          <path d="M 55 30 L 68 38" fill="none" stroke="#f8fafc" strokeWidth="1" />
          <text x="75" y="26" fill="#cbd5e1" className="text-[10px]" textAnchor="start">最早着手日</text>
          <text x="75" y="41" fill="#cbd5e1" className="text-[10px]" textAnchor="start">最遅着手日</text>
          <line x1="15" y1="65" x2="60" y2="65" stroke="#f43f5e" strokeWidth="3" />
          <text x="75" y="69" fill="#cbd5e1" className="text-[10px]" textAnchor="start">クリティカルパス</text>
        </g>

        {/* アロー */}
        <line x1="100" y1="200" x2="250" y2="150" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#arrow-red)" />
        <text x="175" y="160" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">A (3日)</text>

        <line x1="100" y1="200" x2="350" y2="300" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="210" y="270" fill="#38bdf8" className="text-xs font-bold" textAnchor="middle">B (4日)</text>

        <line x1="250" y1="150" x2="400" y2="150" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="325" y="135" fill="#38bdf8" className="text-xs font-bold" textAnchor="middle">D (2日)</text>

        <line x1="250" y1="150" x2="350" y2="300" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#arrow-red)" />
        <text x="315" y="220" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">C (3日)</text>

        <line x1="400" y1="150" x2="350" y2="300" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4" markerEnd="url(#arrow-dash)" />
        <text x="390" y="230" fill="#94a3b8" className="text-[10px]" textAnchor="middle">ダミー</text>

        <line x1="400" y1="150" x2="550" y2="200" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="475" y="165" fill="#38bdf8" className="text-xs font-bold" textAnchor="middle">F (3日)</text>

        <line x1="350" y1="300" x2="550" y2="200" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#arrow-red)" />
        <text x="450" y="270" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">E (3日)</text>

        {/* ノード */}
        {[
          { id: 1, cx: 100, cy: 200, boxX: 80, boxY: 120, es: 0, ls: 0 },
          { id: 2, cx: 250, cy: 150, boxX: 230, boxY: 70, es: 3, ls: 3 },
          { id: 3, cx: 400, cy: 150, boxX: 380, boxY: 70, es: 5, ls: 6 },
          { id: 4, cx: 350, cy: 300, boxX: 330, boxY: 335, es: 6, ls: 6 },
          { id: 5, cx: 550, cy: 200, boxX: 530, boxY: 120, es: 9, ls: 9 },
        ].map(n => (
          <g key={n.id}>
            <circle cx={n.cx} cy={n.cy} r="22" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x={n.cx} y={n.cy + 4} fill="#f8fafc" className="text-xs font-bold" textAnchor="middle">{n.id}</text>
            <g transform={`translate(${n.boxX}, ${n.boxY})`}>
              <rect x="0" y="0" width="40" height="40" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <line x1="0" y1="20" x2="40" y2="20" stroke="#475569" strokeWidth="1" />
              <text x="20" y="15" fill="#38bdf8" className="text-xs font-bold" textAnchor="middle">{n.es}</text>
              <text x="20" y="35" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">{n.ls}</text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};

// 問題5：PERT2 アローダイアグラム
const Q5PERT = ({ showExplanation = false }) => {
  return (
    <div className="flex flex-col items-center my-6 bg-slate-900/40 p-4 border border-slate-700 rounded-lg">
      <h4 className="text-sm font-semibold text-slate-200 mb-2">
        {showExplanation ? "アローダイアグラム（解答解説）" : "プロジェクト PERT図"}
      </h4>
      <svg viewBox="0 0 920 480" className="w-full max-w-2xl">
        <defs>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>
          <marker id="arrow-dash" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
          </marker>
        </defs>

        {showExplanation && (
          <g transform="translate(680, 20)">
            <rect x="0" y="0" width="200" height="90" fill="none" stroke="#475569" strokeWidth="1" rx="4" />
            <rect x="15" y="15" width="45" height="30" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <line x1="15" y1="30" x2="60" y2="30" stroke="#475569" strokeWidth="1" />
            <text x="20" y="26" fill="#38bdf8" className="text-[9px] font-bold">最早着手</text>
            <text x="20" y="41" fill="#f43f5e" className="text-[9px] font-bold">最遅着手</text>
            <line x1="15" y1="65" x2="60" y2="65" stroke="#f43f5e" strokeWidth="3" />
            <text x="70" y="69" fill="#cbd5e1" className="text-[10px]" textAnchor="start">クリティカルパス</text>
          </g>
        )}

        {/* アロー */}
        <line x1="100" y1="240" x2="250" y2="120" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="160" y="160" fill="#cbd5e1" className="text-[10px]">作業A 3時間</text>

        <line x1="100" y1="240" x2="400" y2="240" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="230" y="230" fill="#cbd5e1" className="text-[10px]">作業B 4時間</text>

        <line x1="100" y1="240" x2="250" y2="360" stroke={showExplanation ? "#f43f5e" : "#38bdf8"} strokeWidth={showExplanation ? 3 : 1.5} markerEnd={showExplanation ? "url(#arrow-red)" : "url(#arrow-blue)"} />
        <text x="160" y="320" fill={showExplanation ? "#f43f5e" : "#cbd5e1"} className="text-[10px] font-bold">作業C 5時間</text>

        <line x1="250" y1="120" x2="550" y2="120" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="400" y="110" fill="#cbd5e1" className="text-[10px]">作業D 5時間</text>

        <line x1="400" y1="240" x2="550" y2="120" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="490" y="190" fill="#cbd5e1" className="text-[10px]">作業E 6時間</text>

        <line x1="400" y1="240" x2="550" y2="360" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4" markerEnd="url(#arrow-dash)" />
        <text x="490" y="300" fill="#94a3b8" className="text-[10px]">ダミー</text>

        <line x1="250" y1="360" x2="550" y2="360" stroke={showExplanation ? "#f43f5e" : "#38bdf8"} strokeWidth={showExplanation ? 3 : 1.5} markerEnd={showExplanation ? "url(#arrow-red)" : "url(#arrow-blue)"} />
        <text x="400" y="350" fill={showExplanation ? "#f43f5e" : "#cbd5e1"} className="text-[10px] font-bold">作業F 6時間</text>

        <line x1="550" y1="120" x2="700" y2="240" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="640" y="170" fill="#cbd5e1" className="text-[10px]">作業G 5時間</text>

        <line x1="550" y1="360" x2="700" y2="240" stroke={showExplanation ? "#f43f5e" : "#38bdf8"} strokeWidth={showExplanation ? 3 : 1.5} markerEnd={showExplanation ? "url(#arrow-red)" : "url(#arrow-blue)"} />
        <text x="640" y="320" fill={showExplanation ? "#f43f5e" : "#cbd5e1"} className="text-[10px] font-bold">作業H 5時間</text>

        <line x1="700" y1="240" x2="840" y2="240" stroke={showExplanation ? "#f43f5e" : "#38bdf8"} strokeWidth={showExplanation ? 3 : 1.5} markerEnd={showExplanation ? "url(#arrow-red)" : "url(#arrow-blue)"} />
        <text x="760" y="230" fill={showExplanation ? "#f43f5e" : "#cbd5e1"} className="text-[10px] font-bold">作業I 3時間</text>

        {/* ノード */}
        {[
          { id: 1, cx: 100, cy: 240, es: 0, ls: 0 },
          { id: 2, cx: 250, cy: 120, es: 3, ls: 6 },
          { id: 3, cx: 400, cy: 240, es: 4, ls: 5 },
          { id: 4, cx: 550, cy: 120, es: 10, ls: 11 },
          { id: 5, cx: 250, cy: 360, es: 5, ls: 5 },
          { id: 6, cx: 550, cy: 360, es: 11, ls: 11 },
          { id: 7, cx: 700, cy: 240, es: 16, ls: 16 },
          { id: 8, cx: 840, cy: 240, es: 19, ls: 19 },
        ].map(node => (
          <g key={node.id}>
            <circle cx={node.cx} cy={node.cy} r="22" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x={node.cx} y={node.cy + 4} fill="#f8fafc" className="text-xs font-bold" textAnchor="middle">{node.id}</text>
          </g>
        ))}

        {/* ボックス */}
        {showExplanation && [
          { x: 30, y: 220, es: 0, ls: 0 },
          { x: 230, y: 40, es: 3, ls: 6 },
          { x: 380, y: 275, es: 4, ls: 5 },
          { x: 530, y: 40, es: 10, ls: 11 },
          { x: 230, y: 395, es: 5, ls: 5 },
          { x: 530, y: 395, es: 11, ls: 11 },
          { x: 680, y: 275, es: 16, ls: 16 },
          { x: 820, y: 275, es: 19, ls: 19 },
        ].map((b, idx) => (
          <g key={idx} transform={`translate(${b.x}, ${b.y})`}>
            <rect x="0" y="0" width="40" height="40" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <line x1="0" y1="20" x2="40" y2="20" stroke="#475569" strokeWidth="1" />
            <text x="20" y="15" fill="#38bdf8" className="text-xs font-bold" textAnchor="middle">{b.es}</text>
            <text x="20" y="35" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">{b.ls}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// 問題6：CPM 関連テーブル & アローダイアグラム
const Q6CPM = ({ type = "problem" }) => {
  if (type === "problem") {
    return (
      <div className="overflow-x-auto my-4 bg-slate-900/40 p-4 border border-slate-700 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-200 mb-2">作業要件</h4>
        <table className="min-w-full text-center border-collapse border border-slate-700 bg-slate-900/60 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="border border-slate-700 p-2 font-bold text-xs">作業名</th>
              <th className="border border-slate-700 p-2 font-bold text-xs">先行作業</th>
              <th className="border border-slate-700 p-2 font-bold text-xs">所要期間</th>
              <th className="border border-slate-700 p-2 font-bold text-xs">最短所要期間</th>
              <th className="border border-slate-700 p-2 font-bold text-xs text-amber-400">単位時間当たりの短縮費用 (万円)</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr>
              <td className="border border-slate-700 p-2 font-bold">A</td>
              <td className="border border-slate-700 p-2">－</td>
              <td className="border border-slate-700 p-2">5</td>
              <td className="border border-slate-700 p-2">4</td>
              <td className="border border-slate-700 p-2">10</td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-bold">B</td>
              <td className="border border-slate-700 p-2">A</td>
              <td className="border border-slate-700 p-2">6</td>
              <td className="border border-slate-700 p-2">2</td>
              <td className="border border-slate-700 p-2">50</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-bold">C</td>
              <td className="border border-slate-700 p-2">B</td>
              <td className="border border-slate-700 p-2">7</td>
              <td className="border border-slate-700 p-2">3</td>
              <td className="border border-slate-700 p-2">90</td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-bold">D</td>
              <td className="border border-slate-700 p-2">A</td>
              <td className="border border-slate-700 p-2">9</td>
              <td className="border border-slate-700 p-2">7</td>
              <td className="border border-slate-700 p-2">30</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-bold">E</td>
              <td className="border border-slate-700 p-2">C, D</td>
              <td className="border border-slate-700 p-2">5</td>
              <td className="border border-slate-700 p-2">3</td>
              <td className="border border-slate-700 p-2">40</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (type === "diagrams") {
    return (
      <div className="flex flex-col gap-8 my-6 bg-slate-900/40 p-4 border border-slate-700 rounded-lg">
        {/* 図1 */}
        <div className="w-full">
          <h5 className="text-xs font-semibold text-slate-300 text-center mb-2">【図1　所要期間のアローダイヤグラム】</h5>
          <svg viewBox="0 0 800 280" className="w-full max-w-xl mx-auto">
            <defs>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
            </defs>
            <line x1="100" y1="140" x2="250" y2="140" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
            <text x="175" y="125" fill="#cbd5e1" className="text-xs" textAnchor="middle">A (5)</text>

            <line x1="250" y1="140" x2="400" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
            <text x="325" y="90" fill="#cbd5e1" className="text-xs" textAnchor="middle">B (6)</text>

            <line x1="400" y1="60" x2="550" y2="140" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
            <text x="475" y="90" fill="#cbd5e1" className="text-xs" textAnchor="middle">C (7)</text>

            <line x1="250" y1="140" x2="550" y2="140" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
            <text x="400" y="160" fill="#cbd5e1" className="text-xs" textAnchor="middle">D (9)</text>

            <line x1="550" y1="140" x2="700" y2="140" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
            <text x="625" y="125" fill="#cbd5e1" className="text-xs" textAnchor="middle">E (5)</text>

            {[{id:1, x:100, y:140},{id:2, x:250, y:140},{id:3, x:400, y:60},{id:4, x:550, y:140},{id:5, x:700, y:140}].map(n => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="20" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x={n.x} y={n.y+4} fill="#f8fafc" className="text-xs font-bold" textAnchor="middle">{n.id}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* 図2 */}
        <div className="w-full border-t border-slate-800 pt-6">
          <h5 className="text-xs font-semibold text-slate-300 text-center mb-2">【図2　最短所要期間のアローダイヤグラム】</h5>
          <svg viewBox="0 0 850 320" className="w-full max-w-xl mx-auto">
            <defs>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
            </defs>

            <g transform="translate(680, 20)">
              <rect x="0" y="0" width="160" height="90" fill="none" stroke="#475569" strokeWidth="1" rx="4" />
              <rect x="10" y="10" width="40" height="30" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <line x1="10" y1="25" x2="50" y2="25" stroke="#475569" strokeWidth="1" />
              <text x="14" y="21" fill="#38bdf8" className="text-[8px] font-bold">最早結</text>
              <text x="14" y="36" fill="#f43f5e" className="text-[8px] font-bold">最遅結</text>
              <line x1="10" y1="65" x2="50" y2="65" stroke="#f43f5e" strokeWidth="3" />
              <text x="60" y="69" fill="#cbd5e1" className="text-[9px]" textAnchor="start">クリティカルパス</text>
            </g>

            <line x1="80" y1="180" x2="230" y2="180" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#arrow-red)" />
            <text x="155" y="165" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">A (4)</text>

            <line x1="230" y1="180" x2="380" y2="100" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
            <text x="305" y="130" fill="#38bdf8" className="text-xs" textAnchor="middle">B (2)</text>

            <line x1="380" y1="100" x2="530" y2="180" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
            <text x="455" y="130" fill="#38bdf8" className="text-xs" textAnchor="middle">C (3)</text>

            <line x1="230" y1="180" x2="530" y2="180" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#arrow-red)" />
            <text x="380" y="200" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">D (7)</text>

            <line x1="530" y1="180" x2="680" y2="180" stroke="#f43f5e" strokeWidth="3" markerEnd="url(#arrow-red)" />
            <text x="605" y="165" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">E (3)</text>

            {[{id:1, x:80, y:180},{id:2, x:230, y:180},{id:3, x:380, y:100},{id:4, x:530, y:180},{id:5, x:680, y:180}].map(n => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="20" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x={n.x} y={n.y+4} fill="#f8fafc" className="text-xs font-bold" textAnchor="middle">{n.id}</text>
              </g>
            ))}

            {[
              { x: 60, y: 215, es: 0, ls: 0 },
              { x: 210, y: 215, es: 4, ls: 4 },
              { x: 360, y: 15, es: 6, ls: 8 },
              { x: 510, y: 215, es: 11, ls: 11 },
              { x: 660, y: 215, es: 14, ls: 14 },
            ].map((b, idx) => (
              <g key={idx} transform={`translate(${b.x}, ${b.y})`}>
                <rect x="0" y="0" width="40" height="40" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <line x1="0" y1="20" x2="40" y2="20" stroke="#475569" strokeWidth="1" />
                <text x="20" y="15" fill="#38bdf8" className="text-xs font-bold" textAnchor="middle">{b.es}</text>
                <text x="20" y="35" fill="#f43f5e" className="text-xs font-bold" textAnchor="middle">{b.ls}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  if (type === "costTable") {
    return (
      <div className="overflow-x-auto my-4 bg-slate-900/40 p-4 border border-slate-700 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-200 mb-2">短縮費用内訳</h4>
        <table className="min-w-full text-center border-collapse border border-slate-700 bg-slate-900/60 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="border border-slate-700 p-2 font-bold text-xs">作業名</th>
              <th className="border border-slate-700 p-2 font-bold text-xs">現在の所要時間 (①)</th>
              <th className="border border-slate-700 p-2 font-bold text-xs">短縮後の所要時間 (②)</th>
              <th className="border border-slate-700 p-2 font-bold text-xs">必要短縮日数 (③＝①－②)</th>
              <th className="border border-slate-700 p-2 font-bold text-xs">単位時間当たりの短縮費用 (万円) (④)</th>
              <th className="border border-slate-700 p-2 font-bold text-xs text-amber-400">短縮費用合計 (③×④)</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr>
              <td className="border border-slate-700 p-2 font-semibold">A</td>
              <td className="border border-slate-700 p-2">5</td>
              <td className="border border-slate-700 p-2">4</td>
              <td className="border border-slate-700 p-2">1</td>
              <td className="border border-slate-700 p-2">10</td>
              <td className="border border-slate-700 p-2 font-semibold">10</td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-semibold">B</td>
              <td className="border border-slate-700 p-2">6</td>
              <td className="border border-slate-700 p-2">2</td>
              <td className="border border-slate-700 p-2">4</td>
              <td className="border border-slate-700 p-2">50</td>
              <td className="border border-slate-700 p-2 font-semibold">200</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-semibold">C</td>
              <td className="border border-slate-700 p-2">7</td>
              <td className="border border-slate-700 p-2">5</td>
              <td className="border border-slate-700 p-2">2</td>
              <td className="border border-slate-700 p-2">90</td>
              <td className="border border-slate-700 p-2 font-semibold">180</td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-semibold">D</td>
              <td className="border border-slate-700 p-2">9</td>
              <td className="border border-slate-700 p-2">7</td>
              <td className="border border-slate-700 p-2">2</td>
              <td className="border border-slate-700 p-2">30</td>
              <td className="border border-slate-700 p-2 font-semibold">60</td>
            </tr>
            <tr>
              <td className="border border-slate-700 p-2 font-semibold">E</td>
              <td className="border border-slate-700 p-2">5</td>
              <td className="border border-slate-700 p-2">3</td>
              <td className="border border-slate-700 p-2">2</td>
              <td className="border border-slate-700 p-2">40</td>
              <td className="border border-slate-700 p-2 font-semibold">80</td>
            </tr>
            <tr className="bg-amber-500/20 text-amber-300 font-bold border-t border-slate-600">
              <td className="border border-slate-700 p-2">合計</td>
              <td className="border border-slate-700 p-2" colSpan={4}></td>
              <td className="border border-slate-700 p-2 text-lg font-extrabold text-amber-400">530</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
};

// 問題7：ジョブ投入順序テーブル＆ガントチャート
const Q7Gantt = ({ showExplanation = false }) => {
  return (
    <div className="flex flex-col gap-6 my-4 bg-slate-900/40 p-4 border border-slate-700 rounded-lg">
      <div className="overflow-x-auto w-full">
        <h4 className="text-sm font-semibold text-slate-200 mb-2">加工時間データ</h4>
        <table className="min-w-full text-center border-collapse border border-slate-700 bg-slate-900/60 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-800 text-slate-200">
              <th className="border border-slate-700 p-2 font-bold text-xs">ジョブ</th>
              <th className="border border-slate-700 p-2 font-bold text-xs text-sky-400">J1</th>
              <th className="border border-slate-700 p-2 font-bold text-xs text-sky-400">J2</th>
              <th className="border border-slate-700 p-2 font-bold text-xs text-sky-400">J3</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            <tr>
              <td className="border border-slate-700 p-2 font-semibold">第１工程</td>
              <td className="border border-slate-700 p-2">3時間</td>
              <td className="border border-slate-700 p-2">5時間</td>
              <td className="border border-slate-700 p-2">1時間</td>
            </tr>
            <tr className="bg-slate-800/20">
              <td className="border border-slate-700 p-2 font-semibold">第２工程</td>
              <td className="border border-slate-700 p-2">2時間</td>
              <td className="border border-slate-700 p-2">4時間</td>
              <td className="border border-slate-700 p-2">6時間</td>
            </tr>
          </tbody>
        </table>
      </div>

      {showExplanation && (
        <div className="w-full pt-4 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-200 mb-3 text-center">最適スケジューリング（メイクスパン: 13時間）</h4>
          
          <div className="flex flex-col gap-4 text-xs font-semibold">
            <div className="flex items-center">
              <div className="w-24 text-slate-300 font-bold shrink-0">第１工程</div>
              <div className="flex-1 flex bg-slate-800 h-10 border border-slate-700 rounded-md overflow-hidden relative">
                <div className="bg-purple-950/80 border-r border-slate-700 flex flex-col justify-center items-center text-purple-300" style={{ width: "7.7%" }}>
                  <span>J3</span>
                  <span className="text-[9px]">1h</span>
                </div>
                <div className="bg-sky-950/80 border-r border-slate-700 flex flex-col justify-center items-center text-sky-300" style={{ width: "38.5%" }}>
                  <span>J2</span>
                  <span className="text-[9px]">5h</span>
                </div>
                <div className="bg-emerald-950/80 border-r border-slate-700 flex flex-col justify-center items-center text-emerald-300" style={{ width: "23%" }}>
                  <span>J1</span>
                  <span className="text-[9px]">3h</span>
                </div>
                <div className="bg-slate-900" style={{ width: "30.8%" }}></div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-24 text-slate-300 font-bold shrink-0">第２工程</div>
              <div className="flex-1 flex bg-slate-800 h-10 border border-slate-700 rounded-md overflow-hidden relative">
                <div className="bg-slate-900 border-r border-slate-700" style={{ width: "7.7%" }}></div>
                <div className="bg-purple-900/60 border-r border-slate-700 flex flex-col justify-center items-center text-purple-300" style={{ width: "46.2%" }}>
                  <span>J3</span>
                  <span className="text-[9px]">6h</span>
                </div>
                <div className="bg-sky-900/60 border-r border-slate-700 flex flex-col justify-center items-center text-sky-300" style={{ width: "30.8%" }}>
                  <span>J2</span>
                  <span className="text-[9px]">4h</span>
                </div>
                <div className="bg-emerald-900/60 flex flex-col justify-center items-center text-emerald-300" style={{ width: "15.3%" }}>
                  <span>J1</span>
                  <span className="text-[9px]">2h</span>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-24 shrink-0"></div>
              <div className="flex-1 relative h-6 text-slate-400 text-[10px]">
                <span className="absolute left-[0%] translate-x-[-50%]">0h</span>
                <span className="absolute left-[7.7%] translate-x-[-50%]">1h</span>
                <span className="absolute left-[46.2%] translate-x-[-50%]">6h</span>
                <span className="absolute left-[53.8%] translate-x-[-50%]">7h</span>
                <span className="absolute left-[69.2%] translate-x-[-50%]">9h</span>
                <span className="absolute left-[84.6%] translate-x-[-50%]">11h</span>
                <span className="absolute left-[100%] translate-x-[-100%]">13h</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. 問題データ（完全ノンカット収録）
// ==========================================
const QUESTIONS = [
  {
    id: 1,
    title: "問題 1 ロット生産における生産計画【平成26年　第9問】",
    year: "平成26年　第9問",
    question: "ある製品をロット生産している工場で、以下の表に示す5日間の需要量(個)に対する生産計画を考える。製品を生産する日には、生産に先だち段取りが必要で、1回当たり段取り費5,000円が発生する。また、生産した製品を当日の需要に充当する場合、在庫保管費は発生しないが、翌日以降に繰り越す場合、繰越在庫量に比例して、1個1日当たり10円の在庫保管費が発生する。\n\n生産計画の案0は1日目に5日間の総需要量700個を生産する計画で、総費用(段取り費と在庫保管費の合計)は16,000円になる。\n案1〜案4は総需要量700個を2回に分けて生産する計画である。これらの中で総費用を最小にするものを、下記の解答群から選べ。",
    options: [
      "ア. 案１",
      "イ. 案２",
      "ウ. 案３",
      "エ. 案４"
    ],
    answer: "イ",
    explanation: `ロット生産の生産計画に関する出題です。設問が長いので一見すると難しく感じられますが、問われている内容は単純な計算で、難易度は高くありません。
まず、条件を整理すると次のとおりとなります。
段取り費：１回5,000円
在庫保管費：繰越在庫1個あたり10円
段取り回数はすべて2回
以上を踏まえて、案１～案４の中で最小費用となる生産計画案を探します。段取り費用は、１と３の条件よりすべて同じである為、在庫保管費（繰越在庫量）だけを比較すれば正解を導き出すことができます。
設問の生産計画表から繰越在庫量を計算すると、下記のようになります。

よって、案２が最小費用となるため、選択肢イが正解です。`,
    hasSvg: "Q1"
  },
  {
    id: 2,
    title: "問題 2 プッシュ型管理とプル型管理【平成28年　第3問】",
    year: "平成28年　第3問",
    question: "プッシュ型管理方式とプル型管理方式に関する記述として、最も適切なものはどれか。",
    options: [
      "ア　プッシュ型管理方式では、顧客の注文が起点となって順番に製造指示が発生するため、余分な工程間在庫を持つ必要がない。",
      "イ　プッシュ型管理方式では、生産計画の変更は最終工程のみに指示すればよい。",
      "ウ　プル型管理方式では、管理部門が生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となる。",
      "エ　プル型管理方式では、稼働率を維持するための作りだめなどができないため、過剰在庫が発生する可能性は少ない。"
    ],
    answer: "エ",
    explanation: `プッシュ型管理とプル型管理の問題です。
プッシュ型管理方式とは、あらかじめ定められたスケジュールに従い、生産活動を行う管理方式で、押出し方式ともいわれます。この方式では現状に合わせてスケジュールを適切に維持・管理していく必要があります。そのためには管理部門により集中的に生産・配送・在庫状況情報が管理される必要があります。
一方、プル管理方式は、後工程から引き取られた量を補充するためだけに生産能力が使用される管理方式です。引っ張り方式ともいわれます。この方式は、プッシュ型管理方式のような集中管理は必要ありません。
それでは選択肢を見ていきましょう。
選択肢アは不適切な記述です。顧客の注文が起点となって順番に製造指示が発生するのはプル型管理方式です。プッシュ型管理方式では工程間の負荷のばらつきが生じたり、稼働率を維持するために工程間在庫を持つことがあります。
選択肢イは不適切な記述です。生産計画の変更を最終工程のみに指示すればいいのはプル型管理方式の特徴です。
選択肢ウは不適切な記述です。管理部門が、生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となるのはプッシュ型管理方式です。
選択肢エは適切な記述です。プル型管理では注文を起点としているため、原則、作りだめは行われません。したがって、過剰在庫が発生するリスクは低くなります。`,
    hasSvg: null
  },
  {
    id: 3,
    title: "問題 3 工数計画 【平成28年　第11問】",
    year: "平成28年　第11問",
    question: "工数計画およびそれに対応した余力管理に関する記述として、最も不適切なものはどれか。",
    options: [
      "ア　各職場・各作業者について手持仕事量と現有生産能力とを調査し、これらを比較対照したうえで手順計画によって再スケジュールをする。",
      "イ　工数計画において、仕事量や生産能力を算定するためには、一般的に作業時間や作業量が用いられる。",
      "ウ　工数計画において求めた工程別の仕事量と日程計画で計画された納期までに完了する工程別の仕事量とを比較することを並行的に進めていき、生産能力の過不足の状況を把握する。",
      "エ　余力がマイナスになった場合に、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強などの対策をとる。"
    ],
    answer: "ア",
    explanation: `生産計画のうち、特に工数計画と余力管理に関する問題です。
生産計画の中で工数計画と他の手順計画、日程計画との関係を理解していれば正解できる問題です。
まずは、工数計画を含む生産計画と余力管理を簡単に復習しましょう。
生産計画は、手順計画、工数計画、日程計画に分けられます。
手順計画は、製品を生産するための作業や、工程の順序、作業条件などを決定する活動です。
工数計画は、生産に必要な工数を計算し、工数を調整する活動です。
日程計画は、生産のスケジュールを決定する活動です。
余力管理は、工程や作業者について、現在の負荷状況と能力を把握し、余力や不足がある場合は、作業の再配分を行う活動です。
ここまで押さえた上で、選択肢を見ていきましょう。
選択肢アについて、手持仕事量が現有生産能力を超えている場合は、超過分の仕事量を別の期間に振り分けるなど、「日程計画」によって再スケジュールをします。よって、選択肢アは不適切です。
選択肢イについて、一般的に、作業時間や作業量から仕事量や生産能力を算定します。よって、選択肢イは適切です。
選択肢ウについて、「日程計画で計画された納期までに完了する工程別の仕事量」(納期までに対応できる仕事の量)が生産能力であり、これと工数計画を比較することで生産能力の過不足の状況を把握できます。よって、選択肢ウは適切です。
選択肢エについて、余力がマイナスのため、工数計画で計画した工数より、実際に発生した工数のほうが大きい状態になっています。そのため、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強といった、余力の確保が必要となります。よって、選択肢エは適切です。`,
    hasSvg: null
  },
  {
    id: 4,
    title: "問題 4 PERT1【平成30年　第6問】",
    year: "平成30年　第6問",
    question: "下表に示される作業A～Fで構成されるプロジェクトについて、PERTを用いて日程管理をすることに関する記述として、最も適切なものを下記の解答群から選べ。\n\n【作業要件テーブル】\n・作業A: 作業日数 3日, 先行作業 なし\n・作業B: 作業日数 4日, 先行作業 なし\n・作業C: 作業日数 3日, 先行作業 A\n・作業D: 作業日数 2日, 先行作業 A\n・作業E: 作業日数 3日, 先行作業 B,C,D\n・作業F: 作業日数 3日, 先行作業 D",
    options: [
      "ア. このプロジェクトのアローダイアグラムを作成するためには、ダミーが２本必要である。",
      "イ. このプロジェクトの所要日数は８日である。",
      "ウ. このプロジェクトの所要日数を１日縮めるためには、作業Fを１日短縮すればよい。",
      "エ. 作業Eを最も早く始められるのは６日後である。"
    ],
    answer: "エ",
    explanation: `PERTに関する問題です。ダミー矢線の正確な知識が必要となります。
アローダイアグラムを作成すると以下のようになります。

それでは選択肢アを見ていきましょう。
ダミー（アロー）とは、ノード間に重複する作業がある場合に、複数の作業が並行すると考えず、ダミー作業を設けて分割するものです。つまり、同じ結合点からは複数のアローは入れないため一本に限定するというルールです。複数の作業を並行して行う場合には架空の作業であるダミー（アロー）を点線で示します。
上図ではCとDの作業が重複するため、ノード③、④の間にダミー（アロー）が引かれます。したがってダミーは2本ではなく1本なので、不適切な選択肢です。
選択肢イを見ていきましょう。クリティカルパスとは、プロジェクトの始点と終点を結ぶ最も長いアクティビティの流れです。上図では最早着手日と最遅着手日が等しい工程であるA→C→E（3日＋3日＋3日＝9日）となります。したがって、8日ではなく9日ですので不適切な選択肢です。
選択肢ウはプロジェクトの所要日数を1日縮めるためには作業Fを1日短縮すればよい、としていますが、作業Fはクリティカルパスではありませんので、全体の日数を短縮することはできません。なお、クリティカルパスである作業Eを1日縮めると全体を8日とすれば短縮することができます。従って、記述は不適切です。
選択肢エは、作業Eを最も早く始められるのは6日後としています。結合点④の最早着手日程は6日ですので、記述は適切です。
PERTは頻出テーマであり、ある程度複雑な問題が出ても対応できるように、復習をしっかりしておきましょう。`,
    hasSvg: "Q4"
  },
  {
    id: 5,
    title: "問題 5 PERT2 【令和5年　第8問】",
    year: "令和5年　第8問",
    question: "以下は、あるプロジェクトにおけるPERT図であり、各作業の作業所要時間の予定が記載されている。この図のプロジェクトに関する記述として、最も適切なものを下記の解答群から選べ。",
    options: [
      "ア　作業Ｃの終了時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "イ　作業Ｅの開始時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "ウ　作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は変わらない。",
      "エ　作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは変わらない。",
      "オ　作業Ｈの作業所要時間が２時間長くなった場合、クリティカルパスは変わらない。"
    ],
    answer: "オ",
    explanation: `PERTに関する出題です。アローダイアグラムからクリティカルパスを特定し、解答群の選択肢から正しい記述を選ぶ問題です。
PERT（Program Evaluation and Review Technique）とは、各作業の先行関係と所要時間をアローダイアグラムと呼ばれる図で表し、短期間でプロジェクトを実行するスケジュールを決定するものです。アローダイアグラムでは、プロジェクトの作業をアクティビティと呼ばれる矢印の線で表します。作業の開始と終了の時点はノードと呼ばれる丸で表します。
では、本問のアローダイアグラムを確認してみましょう。各作業の作業所要時間から各ノードの最早着手時間及び最遅着手時間は次の通りです。作業Ｃ→Ｆ→Ｈ→Ｉの経路がクリティカルパスであることが分かります。

では、解答群の記述を確認していきましょう。
選択肢アは不適切な記述です。作業Ｃの終了時刻が２時間早くなった場合、クリティカルパスは作業Ｂ→Ｅ→Ｇ→Ｉの経路（18時間）に変わります。よって、プロジェクトの完了時刻は１時間だけ早くなります。
選択肢イは不適切な記述です。作業Ｅの開始時刻が２時間早く上がった場合でも、クリティカルパスは作業Ｃ→Ｆ→Ｈ→Ｉのままですので、プロジェクトの完了時刻は変わりません。
選択肢ウは不適切な記述です。作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は18時間に変わります。
選択肢エは不適切な記述です。作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは作業Ｂ→Ｅ→Ｇ→Ｉの経路に変わります。
選択肢オは適切な記述です。作業Ｈの作業所要時間が２時間長くなった場合、プロジェクトの完了時刻が２時間遅くなるだけであり、クリティカルパスは変わりません。
以上より、選択肢オが正解です。
PERTは出題頻度の高いテーマです。本問はアローダイアグラムが与えられていましたが、過去の本試験ではアローダイアグラムの作成が求められる問題も度々出題されています。アローダイアグラムを作成してクリティカルパスが特定できるよう、トレーニングしておくと良いでしょう。`,
    hasSvg: "Q5"
  },
  {
    id: 6,
    title: "問題 6 CPM【令和2年　第11問】",
    year: "令和2年　第11問",
    question: "下表は、あるプロジェクト業務を行う際の各作業の要件を示している。CPM（Critical Path Method）を適用して、最短プロジェクト遂行期間となる条件を達成したときの最小費用として、最も適切なものを下記の解答群から選べ（単位：万円）。",
    options: [
      "ア. 440",
      "イ. 510",
      "ウ. 530",
      "エ. 610",
      "オ. 710"
    ],
    answer: "ウ",
    explanation: `PERTに関する問題です。最短プロジェクト日数達成のための最小費用の算出まで求められる難易度の高いものです。
解答の手順は以下の通りです。
手順1：最短所要時間を用いたクリティカルパスの導出と最短プロジェクト遂行時間の把握
手順２：手順１の最短プロジェクト遂行期間を実現する必要短縮時間の把握
手順３：手順２の必要短縮時間を最小費用で行う方法の特定
【手順１：最短プロジェクト遂行期間の把握】
所要期間と最短所要期間のアローダイヤグラムは以下のとおりです。


最短所要時間に基づくアローダイヤグラムのクリティカルパスはA（4）＋D（7）＋E（3）＝14となります。
【手順2：必要短縮時間の把握】
図1と図2より、
・作業Aは5から4に短縮
・作業Dは9から7に短縮
・作業Eは5から3に短縮
する必要があります。
なお、作業Bと作業Cは現状の6と7のままであると作業Dの7を超えてしまいます。そこで作業Bと作業Cの所要時間を7にする最小費用を特定します。
【手順3：最小費用の特定】
作業Bと作業Cの単位時間当たりの短縮費用から、短縮費用の小さい作業Bを優先的に短縮します。
・作業Bは6から2に短縮
・作業Cは7から5に短縮
以上から各作業の短縮時間と短縮費用は以下のようになります。

したがって、最小費用は530となるため、選択肢ウが正解です。`,
    hasSvg: "Q6"
  },
  {
    id: 7,
    title: "問題 7 ジョブの投入順序 【令和元年　第9問】",
    year: "令和元年　第9問",
    question: "2工程のフローショップにおけるジョブの投入順序を考える。各ジョブ各工程の加工時間が下表のように与えられたとき、生産を開始して全てのジョブの加工を完了するまでの時間（メイクスパン）を最小にする順序として、最も適切なものを下記の解答群から選べ。",
    options: [
      "ア. J1→J2→J3",
      "イ. J1→J3→J2",
      "ウ. J2→J1→J3",
      "エ. J3→J2→J1"
    ],
    answer: "エ",
    explanation: `本問では、フローショップにおけるジョブの投入順序が問われています。また、ジョブショップスケジューリングのJohnson法の知識と各工程開始の判断が求められるため、やや難易度は高いものです。
フローショップは、すべてのジョブについて実行されるべき作業が類似のもので、その作業順序に従って機械が配置されている多段階生産システムです。全ジョブはその機械配置に沿って一方向に流れます。2工程のフローショップでメイクスパン、つまり最も早い作業時間の開始時刻から、最も遅い作業の終了時刻までの長さの最小化を目的とするスケジューリングに対してはジョンソンの最適化アルゴリズムを利用します。
ジョブショップは、ジョブについて実行されるべき作業内容や工程順序が異なる多段階生産システムです。フローショップに比べて、ジョブの流れは複雑で交錯したものになります。ジョブショップは順序付け手法とディスパチング手法に大別されます。順位付け手法にはJohnson法、完全列挙法等の手法があります。
本問では、2工程のフローショップなのでジョンソンの最適化アルゴリズムを利用します。ジョンソンの最適化アルゴリズムにおける順位付けのルールは、以下のステップから決定されます。

ステップ１：すべての作業時間から最小のものを選ぶ。2工程では第1工程のJ3の1時間が該当します。
ステップ2：ステップ1で選んだ工程が、第1工程の場合は最初に、第2工程の場合は最後に処理します。J3の1時間は第1工程なので最初にスケジューリングします。
ステップ3：処理順序の決定したJ3の第1工程を除きます。
ステップ4：順序の決定していないものをステップ1に戻り繰り返します。
上記の結果、次の工程が最小のメイクスパンとなります。

従って、投入順序はJ3→J2→J1となり、選択肢エが適切な順番です。`,
    hasSvg: "Q7"
  },
  {
    id: 8,
    title: "問題 8 需要予測1 【令和3年　第8問】",
    year: "令和3年　第8問",
    question: "需要量の時系列データを用いる需要予測法に関する記述として、最も適切なものはどれか。",
    options: [
      "ア　移動平均法の予測精度は、個々の予測値の計算に用いるデータ数に依存しない。",
      "イ　移動平均法では、期が進むにつれて個々の予測値の計算に用いるデータ数が増加する。",
      "ウ　指数平滑法では、過去の需要量にさかのぼるにつれて重みが指数的に減少する。",
      "エ　指数平滑法では、過去の予測誤差とは独立に将来の需要量が予測される。"
    ],
    answer: "ウ",
    explanation: `需要予測法に関する出題です。時系列データを用いる「移動平均法」と「指数平滑法」の基本的な知識が問われています。難易度は高くありませんので、確実に正解したい問題です。
まず、それぞれの需要予測法について確認しておきましょう。

【需要予測の方法】
・移動平均法とは、過去の実績データをもとに将来の需要量を予測する方法です。過去のデータを単純平均した値を使う「単純移動平均法」と、過去のデータに異なる重み付けをした加重平均値を用いる「加重移動平均法」があります。
・指数平滑法とは、過去の実績データのうち、直近の新しいデータに重いウェイトを置いて将来の需要量を予測する方法です。過去のデータに遡るにつれて、指数的に重みを減少させる加重移動平均法です。

では、選択肢を見ていきましょう。
選択肢アは不適切な記述です。移動平均法は、過去の実績データを平均して予測値を求めますので、予測精度は計算に用いるデータの数に依存します。数が多ければ予測精度は高まり、少なければ予測精度は低くなります。
選択肢イは不適切な記述です。移動平均法の計算に用いるデータ数は、任意で設定します。過去の全期間を対象にする必要はありませんので、期が進むにつれて必ずしもデータ数が増加するわけではありません。
選択肢ウは適切な記述です。指数平滑法は、直近の実績データに重きを置いて将来の需要量を予測します。過去のデータ（需要量）に遡るにつれて、重みは指数的に減少します。
選択肢エは不適切な記述です。指数平滑法は、前回の予測と実績がどの程度乖離したかを踏まえて、将来の需要予測を立てます。計算式は次の通りです。
将来の予測値＝前回の予測値＋平滑化指数×（前回の実績値－前回の予測値）
右辺の（前回の実績値－前回の予測値）が過去の予測誤差です。よって、指数平滑法では将来の需要量を予測する際に、過去の予測誤差を反映します。
需要予測法は生産管理だけでなく、店舗販売管理においても頻繁に出題されています。需要予測法のそれぞれの特徴と計算式はしっかり覚えておきましょう。`,
    hasSvg: null
  },
  {
    id: 9,
    title: "問題 9 需要予測2 【平成29年　第34問】",
    year: "平成29年　第34問",
    question: "暗黙の前提知識を考慮し、需要予測に関する次の記述として、最も適切なものはどれか。",
    options: [
      "ア　移動平均法は、過去の一定期間の実績値の平均に過去の変動要因を加えて予測する方法である。",
      "イ　季節変動とは、3か月を周期とする変動である。",
      "ウ　指数平滑法は、当期の実績値と当期の予測値を加重平均して次期の予測値を算出する方法である。",
      "エ　重回帰分析では、説明変数間の相関が高いほど良い数式（モデル）であると評価できる。"
    ],
    answer: "ウ",
    explanation: `需要予測に関する問題です。
それでは選択肢を見ていきましょう。
選択肢アですが、移動平均法は、過去の実績値のみを予測に利用するものです。過去の変動要因を加えるものではありません。したがって、不適切な記述です。
選択肢イですが、季節変動は3か月ではなく、1年を周期とする変動です。季節変動の要因は天候など自然現象や社会慣習、ボーナス支給、年末年始などがあります。したがって、不適切な記述です。
選択肢ウを見てみましょう。指数平滑法とは、次期の予測値を以下の式で求めるものです。
次期の予測値＝当期の予測値＋α（当期の実績値－当期の予測値）
αは平滑化定数といわれ、0から1の値をとります。当期の実績値と当期の予測値は平滑化定数αにより加重平均されます。したがって、適切な記述です。
選択肢エを見てみましょう。重回帰分析では重回帰モデルを利用して、説明したい変数を説明変数によりモデル化します。説明変数が１つのものを単回帰モデル、複数の場合を重回帰モデルといいます。重回帰モデルによる予測値と実際の値の相関関係（重回帰係数）を二乗したものを重決定係数といいます。この値が高いほど、重回帰モデルの予測値の精度が高いものとされます。説明変数間の相関が高いものではありません。したがって、不適切な記述です。`,
    hasSvg: null
  },
  {
    id: 10,
    title: "問題 10 指数平滑法 【平成27年　第9問】",
    year: "平成27年　第9問",
    question: "ある会社では、商品の需要予測に指数平滑法（平滑化定数α＝0.4）を用いている。当期の需要予測値75に対し、需要実績値は55であった。次期の需要予測値として、最も適切なものはどれか。",
    options: [
      "ア. 63",
      "イ. 65",
      "ウ. 67",
      "エ. 69"
    ],
    answer: "ウ",
    explanation: `需要予測について、指数平滑法に関する問題です。
指数平滑法で予測値を求める式を覚えていれば容易に解ける問題です。
指数平滑法では、需要予測にあたって、直近の値を重視します。予測値を求める式は次の通りです。
来期予測値＝今期予測値＋平滑化指数Ｘ（今期実績値－今期予測値）
この式にあてはめて、次期の需要予測値を計算すると、
75＋0.4× (55－75) ＝75－8＝67
となります。
したがって正解はウになります。`,
    hasSvg: null
  },
  {
    id: 11,
    title: "問題 11 現品管理 【平成30年　第14問】",
    year: "平成30年　第14問",
    question: "JIS で定義される現品管理の活動として、最も不適切なものはどれか。",
    options: [
      "ア　受け入れ外注品の品質と数量の把握",
      "イ　仕掛品の適正な保管位置や保管方法の設定",
      "ウ　製品の適正な運搬荷姿や運搬方法の検討",
      "エ　利用資材の発注方式の見直し"
    ],
    answer: "エ",
    explanation: `本問は、現品管理について問われています。
まずは現品管理について、簡単に復習しておきましょう。
なお、JISには以下のように定義されています。
「資材、仕掛品、製品などの物について、運搬・移動や停滞・保管の状況を管理する活動。現品の経済的処理と数量、所在の確実な把握を目的とする。現物管理ともいう。」（JISZ8142-4102）
では、選択肢をみていきましょう。本問は、不適切なものを選択することに注意します。
選択肢アは適切な記述です。「受け入れ外注品の品質と数量」を把握することは、前述の定義と照らし、現品管理と言えます。よって、アは適切です。
選択肢イは適切な記述です。「仕掛品の適正な保管位置や保管方法」を設定することは、前述の定義と照らし、現品管理と言えます。よって、イは適切です。
選択肢ウは適切な記述です。「製品の適正な運搬荷姿や運搬方法」を検討することは、前述の定義と照らし、現品管理と言えます。よって、ウは適切です。
選択肢エは不適切な記述です。「利用資材の発注方式」を見直すことは、前述の定義と照らし、現品管理とは合致しません。これは、改善活動と言えます。よって、記述は不適切で、エが正解です。
JISの定義を網羅して学習することは非効率ですので、基礎的な用語の定義は、一通り覚えておきましょう。また、現品管理は生産統制を構成する3要素の1つですので、幅広く理解を深めておきましょう。`,
    hasSvg: null
  },
  {
    id: 12,
    title: "問題 12 余力管理 【令和5年　第10問】",
    year: "令和5年　第10問",
    question: "工数管理や余力管理に関する以下のａ～ｄの記述と用語の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\nａ　仕事量の全体を表す尺度で、仕事を１人の作業者で遂行するのに要する時間。\nｂ　各工程または個々の作業者における、現在の作業負荷状態と現有作業能力の差。\nｃ　作業習熟や改善活動、設計改良などによって作業時間を減らすこと。\nｄ　作業の実施時期をずらすなどにより生産の負荷平準化を行うこと。",
    options: [
      "ア　ａ：工数　　　　　　　　ｂ：作業余裕　　　　　ｃ：工数低減 　　ｄ：工程編成",
      "イ　ａ：工数　　　　　　　　ｂ：余力　　　　　　　ｃ：工数低減 　ｄ：工数の山積山崩",
      "ウ　ａ：工程能力　　　　　　ｂ：工程能力指数　　　ｃ：工程分割 　ｄ：工数低減",
      "エ　ａ：標準時間　　　　　　ｂ：作業余裕　　　　　ｃ：工程分割 　ｄ：工数の山積山崩",
      "オ　ａ：標準時間　　　　　　ｂ：余力　　　　　　　ｃ：工数の山積山崩 　ｄ：工程編成"
    ],
    answer: "イ",
    explanation: `余力管理に関する出題です。基本的な知識が問われており、難易度は高くありません。
余力とは、負荷と能力の差を指します。余力管理では、各工程又は個々の作業者について、現在の負荷状態と現有能力とを把握し、現在どれだけの余力又は不足があるかを検討し、作業の再配分を行って能力と負荷を均衡させていく活動です。工数管理ともいいます。
工数とは、仕事量の全体を表す尺度で、仕事を一人の作業者で遂行するのに要する時間を指します。
では、それぞれの記述を確認してみましょう。
ａ：仕事量の全体を表す尺度で、仕事を１人の作業者で遂行するのに要する時間は、工数です。
ｂ：各工程または個々の作業者における現在の作業負荷状態と現有作業能力の差は、余力です。
ｃ：作業習熟や改善活動、設計改良などによって作業時間を減らすことを、工数低減といいます。
ｄ：作業の実施時期をずらすなどにより、生産の負荷平準化を行うことを、工数の山積山崩といいます。
以上より、選択肢イの組み合わせが正解です。
余力管理は過去の本試験で度々出題されています。しっかり理解しておきましょう。`,
    hasSvg: null
  },
  {
    id: 13,
    title: "問題 13 生産管理方式【令和4年　第4問】",
    year: "令和4年　第4問",
    question: "生産方式に関する記述の正誤の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\nａ　オーダエントリー方式は、生産工程にある半製品に顧客のオーダを引き当て、顧客が希望した仕様の製品として完成させるために、仕様に合わせた部品や作業を選択して生産する方式である。\nｂ　生産座席予約方式は、設備の稼働状況を基に、顧客のオーダを到着順に生産する方式である。\nｃ　モジュール生産方式は、あらかじめモジュール部品を複数用意し、受注後にそれらの組み合わせによって多品種の最終製品を生産する方式で、リードタイムの短縮が期待できる。\nｄ　製番管理方式は、製品の組立を開始する時点で部品を引き当てる方式で、ロット生産にも利用可能で、特にロットサイズが大きい場合に適している。",
    options: [
      "ア　ａ：正　　ｂ：正　　ｃ：誤　　ｄ：誤",
      "イ　ａ：正　　ｂ：誤　　ｃ：正　　ｄ：誤",
      "ウ　ａ：正　　ｂ：誤　　ｃ：正　　ｄ：正",
      "エ　ａ：誤　　ｂ：正　　ｃ：誤　　ｄ：正",
      "オ　ａ：誤　　ｂ：誤　　ｃ：正　　ｄ：正"
    ],
    answer: "イ",
    explanation: `生産方式に関する出題です。それぞれの生産方式について踏み込んだ知識が問われており、すべての設問の正誤を判断する必要があるため、難易度はやや高いと言えます。
では、設問を見ていきましょう。
aは適切な記述です。オーダエントリー方式とは、「生産工程にある製品に顧客のオーダを引き当て、製品の仕様の選択又は変更をする生産方式」です。例えば、自動車の生産では、途中まで組み立てられた標準の車体に対して、シートの素材や塗装の色など、顧客が選択したオプションに合わせて、個別に仕様を変更して車を完成させます。
bは不適切な記述です。生産座席予約方式とは、「受注時に、製造設備の使用日程・資材の使用予定などにオーダを割り付け、顧客が要求する納期どおりに生産する方式」です。製造工程を「座席」に見立て、例えば営業部門が（飛行機などの座席を予約する感覚で）顧客の希望する製品の出荷を予約していきます。オーダを到着順に生産する方式ではありません。
cは適切な記述です。モジュール生産方式は、モジュールと呼ばれる機能ごとの部品をあらかじめ組み上げておき、受注後にそれらのモジュールを複数組み合わせて、最終製品として完成させる方式です。これにより、リードタイムの短縮が図れます。
dは不適切な記述です。製番管理方式は、製品ごとに「製番」という製造番号を発行し、製品を構成する全ての部品に対して同じ製番を付けて管理します。ロット生産でも利用可能ですが、ロットサイズは小さい場合に適しています。
以上より、a：正　b：誤　c：正　d：誤　の組み合わせとなりますので、選択肢イが正解です。
生産方式は出題頻度の高いテーマです。本問で問われた生産方式は、今後も出題される可能性がありますので、しっかり理解しておきましょう。`,
    hasSvg: null
  },
  {
    id: 14,
    title: "問題 14 トヨタ生産方式 【平成30年　第11問】",
    year: "平成30年　第11問",
    question: "トヨタ生産方式の特徴を表す用語として、最も適切なものの組み合わせを下記の解答群から選べ。\n\nａ　MRP\nｂ　かんばん方式\nｃ　セル生産方式\nｄ　製番管理方式\nｅ　あんどん方式",
    options: [
      "ア. ａとｃ",
      "イ. ａとｄ",
      "ウ. ｂとｃ",
      "エ. ｂとｅ",
      "オ. ｄとｅ"
    ],
    answer: "エ",
    explanation: `本問は、トヨタ生産方式について問われています。
生産管理の管理方式について基礎的な知識と、トヨタ生産方式の特徴を押さえている方であれば、容易に正解できる問題です。
まずは生産管理の管理方式について、簡単に復習しておきましょう。
次にトヨタ生産方式ですが、無駄をできるだけ排除して、必要な数だけ生産する方式です。トヨタ生産方式は、ジャストインタイムと、自働化という思想に基づいています。また、かんばん方式は、トヨタ自動車が開発した管理方式として有名で、トヨタ生産方式の一部となっています。
ジャストインタイム（JIT）は、必要なものを、必要な時に、必要な数だけ生産する方式です。ジャストインタイムでは、後工程が使った分だけ前工程から引き取ります。そのため、ジャストインタイムは、後工程引取方式やプルシステムと呼ばれることもあります。
自働化は、異常が発生したときに、機械を自動的に停止し、不良品を作らないための仕組みです。異常が発生した場合には、すぐにラインを停止します。また「あんどん」というランプによって、どこで停止したかが一目で分かるようになっています。ちなみに、自働化の「働」という字には、ニンベンがついています。
かんばん方式は、後工程引取方式を実現するための情報伝達の手法です。かんばんには、「生産指示かんばん」と「引取りかんばん」の2種類があります。生産指示かんばんは、作業の指示を表し、引取りかんばんは、運搬を表します。このかんばんによって、後工程から前工程に生産指示が出されていきます。これにより、後工程が生産した分だけ、前工程で生産するため、無駄を極力排除することができます。
ここまで押さえた上で、選択肢の各用語をみていきましょう。
ａですが、MRP（Material Requirement Planning：資材所要量計画）とは、製品の生産計画を基に、資材の所要量と時期を計画するための仕組みです。製品の生産計画を、MRPでは「基準生産計画」MPS（Master Production Schedule）と呼びますが、トップダウンの計画に基づいているため、プルシステムに対してプッシュシステムと呼ばれることがあります。MRPは、トヨタ生産方式の特徴であるジャストインタイム（プルシステム）と相反する特徴をもつシステムであり、不適切です。
ｂですが、かんばん方式は前述の通り、トヨタ自動車が開発した管理方式として有名で、トヨタ生産方式の一部となっています。よって、適切です。
ｃですが、セル生産方式は、加工機械のグループを作り、そのグループ単位で工程を編成する方式です。加工機械のグループのことをセルと呼びます。
セル生産方式では、グループテクノロジーを利用して部品をグループ化することで、それらの生産に適した機械を配置します。グループテクノロジーとは、多種類の部品をなんらかの類似性に基づいて分類することで、多種少量生産に大量生産的効果を与える管理手法です。一般的には、セル生産方式は、1人から数人の作業者で製品を最後まで作り上げる生産方式という意味で使われることが多いですが、本来の意味では、グループテクノロジーが使われているのが、セル生産方式です。
セル生産方式は、トヨタ生産方式やジャストインタイムでライン形式を進化させて生まれた方式と言われますが、トヨタ生産方式で必ず使用される方式というわけではなく、特徴的なものではありません。よって、不適切です。
ｄですが、製番管理方式は、製品を中心に管理する手法です。製番管理方式では、製品ごとに製番という製造番号を発行し、製品を構成する全ての部品に対して同じ製番を付けて管理します。製番管理方式は、受注生産形態で多く用いられている手法ですが、トヨタ生産方式で用いられる方式ではありません。よって、不適切です。
ｅですが、あんどん方式の「あんどん」は、前述の通りトヨタ生産方式の自働化において、異常発生時にどこで停止しているかを可視化するランプのことです。自働化を支える方式の1つであり、適切です。
よって、ｂとｅが適切な組み合わせであり、エが正解です。
生産管理の管理方式は、過去に何度も出題されたほどの頻出論点です。また、トヨタ生産方式は、日本の製造業を支える代表的で、重要な方式の1つです。本問のような基礎的でシンプルな設問は必ず正解するのは言うまでもありませんが、応用力も養って様々な切り口の出題に対応できるようにしましょう。`,
    hasSvg: null
  },
  {
    id: 15,
    title: "問題 15 製造現場の改善方法 【平成29年　第20問】",
    year: "平成29年　第20問",
    question: "生産現場で行われる改善施策に関する記述として、最も不適切なものはどれか。",
    options: [
      "ア. 機械設備の稼働状況を可視化するために、「あんどん」を設置した。",
      "イ. 「シングル段取」の実現を目指して、内段取の一部を外段取に変更した。",
      "ウ. 品種変更に伴う段取り替えの回数を抑制するために、製品の流れを「1個流し」に変更した。",
      "エ. 部品の組み付け忘れを防止するために、部品の供給棚に「ポカヨケ」の改善を施した。"
    ],
    answer: "ウ",
    explanation: `生産現場の改善に関する問題です。
選択肢アは適切な記述です。あんどんとは、各工程の状況をランプで示し、工程内外に一目で見てわかるように工夫した工程管理方式の1つです。機械設備の稼働状況を可視化する方式ですので、適切な記述です。
選択肢イは適切な記述ですシングル段取とは、機械の停止時間が10分未満の内段取のことです。段取替え時間の短縮、改善方法には内段取そのものの短縮化、内段取の外段取化があります。したがって、適切な記述です。
選択肢ウは不適切な記述です1個流しは、部品の生産から組み立てまで顧客が必要とする単位である「1個ずつ」流す方法です。製品を1個加工したら、すぐ次工程に送るので工程間に仕掛品は置きません。1個流しは中間仕掛品の滞留や工程における遊休防止のためですが、品種変更に伴う段取り替えの回数はむしろ増える可能性があります。したがって不適切な記述です。
選択肢エは適切な記述です「ポカヨケ」とは、生産ラインに設置される作業ミスを防止する仕組み、装置のことです。部品の供給棚に「ポカヨケ」の改善を施すことは部品の組み付け忘れという間違いの予防に役立つと考えられます。したがって適切な記述です。`,
    hasSvg: null
  }
];

// ==========================================
// 3. アプリケーション本体
// ==========================================

export default function App() {
  const [userKey, setUserKey] = useState(() => localStorage.getItem("quiz_user_key") || "");
  const [isAuthCompleted, setIsAuthCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [screen, setScreen] = useState(() => (localStorage.getItem("quiz_user_key") ? "dashboard" : "auth"));
  const [inputKey, setInputKey] = useState("");

  const [currentMode, setCurrentMode] = useState("all");
  const [questionsList, setQuestionsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const [userHistory, setUserHistory] = useState({});

  const [progressRestorable, setProgressRestorable] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    const runAuth = async () => {
      if (!auth) {
        setIsAuthCompleted(true);
        return;
      }
      try {
        console.log("Starting Firebase Anonymous Authentication...");
        await signInAnonymously(auth);
        console.log("Firebase Anonymous Authentication successful");
        setIsAuthCompleted(true);
      } catch (err) {
        console.error("Auth failed:", err);
        setIsAuthCompleted(true);
      }
    };
    runAuth();
  }, []);

  useEffect(() => {
    if (!isAuthCompleted || !userKey) return;

    const loadUserData = async () => {
      setIsLoading(true);
      try {
        if (db) {
          const docRef = doc(db, APP_ID, userKey);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserHistory(data.history || {});
            console.log("Successfully loaded user data from Firestore:", data);

            if (data.progressIndex !== undefined && data.progressIndex > 0) {
              setSavedProgress({
                index: data.progressIndex,
                mode: data.progressMode || "all"
              });
              setProgressRestorable(true);
              console.log(`Saved progress found: Index ${data.progressIndex}, Mode ${data.progressMode}`);
            }
          } else {
            console.log("No existing user document.");
            setUserHistory({});
            setProgressRestorable(false);
          }
        } else {
          const stored = localStorage.getItem(`quiz_history_${userKey}`);
          setUserHistory(stored ? JSON.parse(stored) : {});
        }
      } catch (e) {
        console.error("Error loading user data:", e);
        setUserHistory({});
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [isAuthCompleted, userKey]);

  useEffect(() => {
    if (userKey) {
      localStorage.setItem(`quiz_history_${userKey}`, JSON.stringify(userHistory));
    }
  }, [userHistory, userKey]);

  const handleStart = (key) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setUserKey(trimmed);
    localStorage.setItem("quiz_user_key", trimmed);
    setScreen("dashboard");
    console.log(`Sync initiated with password: ${trimmed}`);
  };

  const handleLogout = () => {
    setUserKey("");
    localStorage.removeItem("quiz_user_key");
    setScreen("auth");
    setProgressRestorable(false);
    setSavedProgress(null);
  };

  const saveStateToFirestore = async (updatedHistory, nextIndex, activeMode) => {
    if (!userKey) return;
    try {
      const payload = {
        history: updatedHistory || userHistory,
        progressIndex: nextIndex !== undefined ? nextIndex : currentIndex,
        progressMode: activeMode || currentMode,
        lastUpdated: new Date().toISOString()
      };

      if (db) {
        const docRef = doc(db, APP_ID, userKey);
        await setDoc(docRef, payload, { merge: true });
        console.log("Progress saved to Firestore:", payload);
      } else {
        localStorage.setItem(`quiz_progress_${userKey}`, JSON.stringify({
          progressIndex: payload.progressIndex,
          progressMode: payload.progressMode
        }));
      }
    } catch (err) {
      console.error("Failed to save state:", err);
    }
  };

  const startQuiz = (mode, restoreIndex = 0) => {
    console.log(`Starting quiz mode: ${mode}, from index: ${restoreIndex}`);
    setCurrentMode(mode);
    let list = [];

    if (mode === "all") {
      list = [...QUESTIONS];
    } else if (mode === "wrong") {
      list = QUESTIONS.filter(q => {
        const record = userHistory[q.id];
        return record && record.isCorrect === false;
      });
    } else if (mode === "review") {
      list = QUESTIONS.filter(q => {
        const record = userHistory[q.id];
        return record && record.isReview === true;
      });
    }

    setQuestionsList(list);
    setCurrentIndex(restoreIndex);
    setSelectedOption(null);
    setIsAnswered(false);
    setScreen("quiz");
  };

  const handleRestoreProgress = () => {
    if (savedProgress) {
      setProgressRestorable(false);
      startQuiz(savedProgress.mode, savedProgress.index);
    }
  };

  const handleResetProgress = async () => {
    setProgressRestorable(false);
    setSavedProgress(null);
    await saveStateToFirestore(userHistory, 0, currentMode);
  };

  const handleAnswer = async (optText) => {
    if (isAnswered) return;
    
    const currentQuestion = questionsList[currentIndex];
    const prefix = optText.trim().charAt(0);
    const isCorrect = prefix === currentQuestion.answer;

    setSelectedOption(optText);
    setIsAnswered(true);

    const updatedHistory = {
      ...userHistory,
      [currentQuestion.id]: {
        ...(userHistory[currentQuestion.id] || {}),
        isCorrect,
        timestamp: new Date().toISOString()
      }
    };

    setUserHistory(updatedHistory);

    const isLast = currentIndex === questionsList.length - 1;
    const nextIndex = isLast ? 0 : currentIndex + 1;
    await saveStateToFirestore(updatedHistory, nextIndex, currentMode);
  };

  const handleToggleReview = async (qId, val) => {
    const updatedHistory = {
      ...userHistory,
      [qId]: {
        ...(userHistory[qId] || {}),
        isReview: val
      }
    };
    setUserHistory(updatedHistory);
    await saveStateToFirestore(updatedHistory, currentIndex, currentMode);
  };

  const handleNext = () => {
    if (currentIndex < questionsList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setScreen("dashboard");
    }
  };

  const handleBackToDashboard = async () => {
    await saveStateToFirestore(userHistory, currentIndex, currentMode);
    setScreen("dashboard");
  };

  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let reviewCount = 0;
    let unattempted = 0;

    QUESTIONS.forEach(q => {
      const record = userHistory[q.id];
      if (!record) {
        unattempted++;
      } else {
        if (record.isCorrect) correct++;
        else wrong++;

        if (record.isReview) reviewCount++;
      }
    });

    const total = QUESTIONS.length;
    const answered = total - unattempted;
    const rate = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    return { correct, wrong, reviewCount, unattempted, total, rate };
  }, [userHistory]);

  if (!isAuthCompleted || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <RefreshCw className="w-10 h-10 text-sky-400 animate-spin mb-4" />
        <p className="text-sm tracking-wider font-semibold text-slate-400">Loading learning assets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/75 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-sky-400" />
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              生産計画と生産統制
            </span>
          </div>
          {userKey && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>ID: <span className="font-semibold text-slate-300">{userKey}</span></span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-md bg-slate-900"
              >
                切替
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Sync input view */}
        {screen === "auth" && (
          <div className="max-w-md mx-auto my-12 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-sky-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">学習履歴の同期（合鍵システム）</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                合言葉を入力してください。他のPCやスマホでも同じ合言葉を入力することで、進捗と要復習状況が完全に同期されます。
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleStart(inputKey); }} className="space-y-4">
              <div>
                <label htmlFor="user-id" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  合言葉 (ユーザーID)
                </label>
                <input
                  id="user-id"
                  type="text"
                  placeholder="例: my-study-key-2026"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-lg shadow-sky-950/40 hover:scale-[1.01]"
              >
                <span>学習を開始する</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Dashboard view */}
        {screen === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {progressRestorable && savedProgress && (
              <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900/60 border border-indigo-500/30 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
                    <h4 className="text-sm font-bold text-slate-100">学習の中断履歴があります</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    前回は 【問題 {savedProgress.index + 1}】 まで進んでいます。
                    中断した {savedProgress.mode === "all" ? "すべての問題" : savedProgress.mode === "wrong" ? "前回不正解の問題" : "要復習の問題"} の続きから再開しますか？
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleResetProgress}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-md bg-slate-950"
                  >
                    最初から始める
                  </button>
                  <button 
                    onClick={handleRestoreProgress}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md transition-colors shadow-md shadow-indigo-950"
                  >
                    続きから再開する
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">正解率</span>
                  <span className="text-2xl font-extrabold text-slate-200 mt-1 block">{stats.rate}%</span>
                </div>
                <BarChart2 className="w-8 h-8 text-sky-400" />
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">解いた問題</span>
                  <span className="text-2xl font-extrabold text-slate-200 mt-1 block">
                    {stats.total - stats.unattempted} <span className="text-xs text-slate-500 font-normal">/ {stats.total}</span>
                  </span>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">現在不正解</span>
                  <span className="text-2xl font-extrabold text-rose-400 mt-1 block">{stats.wrong}問</span>
                </div>
                <X className="w-8 h-8 text-rose-400" />
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">要復習リスト</span>
                  <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{stats.reviewCount}問</span>
                </div>
                <HelpCircle className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">出題モード選択</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden">
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-200">すべての問題</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      「生産計画と生産統制」セレクト演習全 {QUESTIONS.length} 問に最初から挑戦します。
                    </p>
                  </div>
                  <button 
                    onClick={() => startQuiz("all")} 
                    className="w-full mt-6 bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 transition-all font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2"
                  >
                    <span>開始する</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-slate-200">前回不正解の問題</h4>
                      <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {stats.wrong}問
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      前回解答時に間違えてしまった弱点問題だけを抽出して集中的に解き直します。
                    </p>
                  </div>
                  <button 
                    onClick={() => startQuiz("wrong")} 
                    disabled={stats.wrong === 0}
                    className="w-full mt-6 bg-rose-500/10 hover:bg-rose-500/20 disabled:bg-slate-900/40 text-rose-400 disabled:text-slate-600 border border-rose-500/20 disabled:border-slate-900/50 transition-all font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2"
                  >
                    <span>開始する</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-slate-200">要復習の問題</h4>
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {stats.reviewCount}問
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      解説画面で「要復習リストに追加」した問題だけをピックアップして確認します。
                    </p>
                  </div>
                  <button 
                    onClick={() => startQuiz("review")} 
                    disabled={stats.reviewCount === 0}
                    className="w-full mt-6 bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-slate-900/40 text-amber-400 disabled:text-slate-600 border border-amber-500/20 disabled:border-slate-900/50 transition-all font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2"
                  >
                    <span>開始する</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">問題別 学習状況一覧</h3>
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {QUESTIONS.map(q => {
                    const record = userHistory[q.id];
                    let statusLabel = "未着手";
                    let statusColor = "text-slate-500 bg-slate-950 border-slate-850";
                    if (record) {
                      if (record.isCorrect) {
                        statusLabel = "正解";
                        statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      } else {
                        statusLabel = "不正解";
                        statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                      }
                    }

                    return (
                      <div key={q.id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-850 rounded-lg hover:border-slate-800 transition-colors">
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-300">問{q.id}</span>
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{q.year}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium truncate w-[200px] sm:w-[280px]">
                            {q.question}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {record?.isReview && (
                            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">復習</span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Quiz view */}
        {screen === "quiz" && questionsList[currentIndex] && (
          <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">
                  進行度: <span className="text-slate-100 font-bold">{currentIndex + 1}</span> / {questionsList.length}
                </span>
                <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {questionsList[currentIndex].year}
                </span>
              </div>
              <button 
                onClick={handleBackToDashboard} 
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>中断して戻る</span>
              </button>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-sky-400 tracking-wide uppercase">問題</h3>
                <p className="text-slate-200 leading-relaxed font-medium text-base whitespace-pre-wrap">
                  {questionsList[currentIndex].question}
                </p>
              </div>

              {questionsList[currentIndex].hasSvg === "Q1" && (
                <Q1Table showExplanation={isAnswered} />
              )}
              {questionsList[currentIndex].hasSvg === "Q4" && (
                <Q4PERT />
              )}
              {questionsList[currentIndex].hasSvg === "Q5" && (
                <Q5PERT showExplanation={isAnswered} />
              )}
              {questionsList[currentIndex].hasSvg === "Q6" && (
                <div className="space-y-4">
                  <Q6CPM type="problem" />
                  {isAnswered && (
                    <>
                      <Q6CPM type="diagrams" />
                      <Q6CPM type="costTable" />
                    </>
                  )}
                </div>
              )}
              {questionsList[currentIndex].hasSvg === "Q7" && (
                <Q7Gantt showExplanation={isAnswered} />
              )}

              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                {questionsList[currentIndex].options.map((optText, idx) => {
                  const prefix = optText.trim().charAt(0);
                  const isSelected = selectedOption === optText;
                  const isCorrectAnswer = prefix === questionsList[currentIndex].answer;

                  let btnStyle = "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700 hover:bg-slate-900";
                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      btnStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 pointer-events-none";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-500/10 border-rose-500/40 text-rose-300 pointer-events-none";
                    } else {
                      btnStyle = "bg-slate-950/30 border-slate-900/50 text-slate-500 pointer-events-none opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(optText)}
                      disabled={isAnswered}
                      className={`w-full text-left px-5 py-4 border rounded-xl font-semibold text-sm transition-all flex items-center justify-between gap-4 ${btnStyle}`}
                    >
                      <span>{optText}</span>
                      {isAnswered && isCorrectAnswer && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {isAnswered && isSelected && !isCorrectAnswer && <X className="w-5 h-5 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {isAnswered && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    {selectedOption?.trim().charAt(0) === questionsList[currentIndex].answer ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-lg">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span>正解！</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-400 font-extrabold text-lg">
                        <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center">
                          <X className="w-4 h-4 text-rose-400" />
                        </div>
                        <span>不正解...</span>
                      </div>
                    )}
                    <span className="text-sm text-slate-400 font-medium">
                      （正解: <span className="text-emerald-400 font-bold">{questionsList[currentIndex].answer}</span>）
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-lg transition-colors shrink-0">
                    <input
                      type="checkbox"
                      checked={!!userHistory[questionsList[currentIndex].id]?.isReview}
                      onChange={(e) => handleToggleReview(questionsList[currentIndex].id, e.target.checked)}
                      className="rounded bg-slate-950 border-slate-850 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-xs font-semibold text-slate-300">要復習リストに追加</span>
                  </label>
                </div>

                <div className="space-y-3 leading-relaxed">
                  <h4 className="text-sm font-bold text-indigo-400 tracking-wide uppercase">解説レジュメ</h4>
                  <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {questionsList[currentIndex].explanation}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-sky-950/40 hover:scale-[1.01]"
                  >
                    <span>
                      {currentIndex === questionsList.length - 1 ? "ダッシュボードへ戻る" : "次の問題へ進む"}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-slate-600 text-xs">
        <p>© 2026 生産計画と生産統制 過去問セレクト演習. All rights reserved.</p>
      </footer>
    </div>
  );
}