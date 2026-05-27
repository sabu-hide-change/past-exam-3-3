// npm install lucide-react recharts firebase
import React, { useState, useEffect } from 'react';
import { Check, X, Home, ChevronRight, RefreshCw, List, Bookmark, AlertTriangle, Clock, User, Award } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- CONFIGURATION & FIREBASE INITIALIZATION ---
const APP_ID = "ProductionManagement_QuizApp_2026";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- STATIC QUIZ DATA ---
const QUIZ_DATA = [
  {
    id: 1,
    year: "平成26年 第9問",
    title: "ロット生産における生産計画",
    question: `ある製品をロット生産している工場で、以下の表に示す5日間の需要量(個)に対する生産計画を考える。製品を生産する日には、生産に先だち段取りが必要で、1回当たり段取り費5,000円が発生する。また、生産した製品を当日の需要に充当する場合、在庫保管費は発生しないが、翌日以降に繰り越す場合、繰越在庫量に比例して、1個1日当たり10円の在庫保管費が発生する。\n\n生産計画の案0は1日目に5日間の総需要量700個を生産する計画で、総費用(段取り費と在庫保管費の合計)は16,000円になる。案1〜案4は総需要量700個を2回に分けて生産する計画である。これらの中で総費用を最小にするものを、下記の解答群から選べ。`,
    hasTable: true,
    tableType: "q1",
    options: [
      { id: "A", text: "ア. 案１" },
      { id: "B", text: "イ. 案２" },
      { id: "C", text: "ウ. 案３" },
      { id: "D", text: "エ. 案４" }
    ],
    answer: "B",
    explanation: `ロット生産の生産計画に関する出題です。問われている内容は単純な計算で、難易度は高くありません。\n\n【条件整理】\n・段取り費：１回5,000円\n・在庫保管費：繰越在庫1個あたり10円\n・段取り回数はすべて2回（＝段取り費はすべて10,000円で共通）\n\nしたがって、在庫保管費（繰越在庫量）だけを比較すれば正解を導き出すことができます。\n\n各案の繰越在庫量の推移と合計は解説表の通りです。案2の繰越在庫量合計が「460個」と最小になるため、選択肢イが正解です。`
  },
  {
    id: 2,
    year: "平成28年 第3問",
    title: "プッシュ型管理とプル型管理",
    question: "プッシュ型管理方式とプル型管理方式に関する記述として、最も適切なものはどれか。",
    options: [
      { id: "A", text: "ア. プッシュ型管理方式では、顧客の注文が起点となって順番に製造指示が発生するため、余分な工程間在庫を持つ必要がない。" },
      { id: "B", text: "イ. プッシュ型管理方式では、生産計画の変更は最終工程のみに指示すればよい。" },
      { id: "C", text: "ウ. プル型管理方式では、管理部門が生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となる。" },
      { id: "D", text: "エ. プル型管理方式では、稼働率を維持するための作りだめなどができないため、過剰在庫が発生する可能性は少ない。" }
    ],
    answer: "D",
    explanation: `プッシュ型管理とプル型管理に関する問題です。\n\n・ア：不適切。顧客の注文が起点となって順番に製造指示が発生するのはプル型管理方式です。\n・イ：不適切。生産計画の変更を最終工程のみに指示すればいいのはプル型管理方式の特徴です。\n・ウ：不適切。管理部門が情報を集中的に把握し、大掛かりな情報システムが必要なのはプッシュ型管理方式です。\n・エ：適切。プル型管理では注文を起点としており原則作りだめを行わないため、過剰在庫が発生するリスクは低くなります。`
  },
  {
    id: 3,
    year: "平成28年 第11問",
    title: "工数計画",
    question: "工数計画およびそれに対応した余力管理に関する記述として、最も不適切なものはどれか。",
    options: [
      { id: "A", text: "ア. 各職場・各作業者について手持仕事量と現有生産能力とを調査し、これらを比較対照したうえで手順計画によって再スケジュールをする。" },
      { id: "B", text: "イ. 工数計画において、仕事量や生産能力を算定するためには、一般的に作業時間や作業量が用いられる。" },
      { id: "C", text: "ウ. 工数計画において求めた工程別の仕事量と日程計画で計画された納期までに完了する工程別の仕事量とを比較することを並行的に進めていき、生産能力の過不足の状況を把握する。" },
      { id: "D", text: "エ. 余力がマイナスになった場合に、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強などの対策をとる。" }
    ],
    answer: "A",
    explanation: `工数計画と余力管理に関する問題です。\n\n・ア：不適切。手持仕事量が現有生産能力を超えている場合は、超過分の仕事量を別の期間に振り分けるなど、「日程計画」によって再スケジュールをします。手順計画は作業順序や条件を決める活動です。\n・イ：適切。一般的に、作業時間や作業量から仕事量や生産能力を算定します。\n・ウ：適切。納期までに対応できる仕事量（生産能力）と工数計画を比較して過不足を把握します。\n・エ：適切。余力がマイナスの場合は負荷超過状態のため、時間延長や外注利用などの対策が必要です。`
  },
  {
    id: 4,
    year: "平成30年 第6問",
    title: "PERT1",
    question: "下表に示される作業A～Fで構成されるプロジェクトについて、PERTを用いて日程管理をすることに関する記述として、最も適切なものを下記の解答群から選べ。",
    hasTable: true,
    tableType: "q4",
    options: [
      { id: "A", text: "ア. このプロジェクトのアローダイアグラムを作成するためには、ダミーが２本必要である。" },
      { id: "B", text: "イ. このプロジェクトの所要日数は８日である。" },
      { id: "C", text: "ウ. このプロジェクトの所要日数を１日縮めるためには、作業Fを１日短縮すればよい。" },
      { id: "D", text: "エ. 作業Eを最も早く始められるのは６日後である。" }
    ],
    answer: "D",
    explanation: `PERT（アローダイアグラム）に関する問題です。\n\n各ノードの最早・最遅着手日を計算すると以下のようになります：\n・ノード①（スタート）: 0\n・ノード②（A終了）: 3\n・ノード③（A→D終了）: 3 + 2 = 5\n・ノード④（B終了(4) or A→C終了(3+3=6) or Dからのダミー(5) の最大値）: 6\n・ノード⑤（ゴール：D→F(5+3=8) or ④→E(6+3=9) の最大値）: 9\n\n・ア：不適切。重複管理のために必要なダミーはノード③から④への1本のみです。\n・イ：不適切。クリティカルパスは A→C→E で、所要日数は 9日（3+3+3）です。\n・ウ：不適切。作業Fはクリティカルパス上にないため、短縮しても全体日数は縮みません。\n・エ：適切。作業Eの開始点である結合点④の最早着手日程は6日ですので、6日後が適切です。`
  },
  {
    id: 5,
    year: "令和5年 第8問",
    title: "PERT2",
    question: "以下は、あるプロジェクトにおけるPERT図であり、各作業の作業所要時間の予定が記載されている。この図のプロジェクトに関する記述として、最も適切なものを下記の解答群から選べ。",
    hasTable: true,
    tableType: "q5",
    options: [
      { id: "A", text: "ア. 作業Ｃの終了時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。" },
      { id: "B", text: "イ. 作業Ｅの開始時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。" },
      { id: "C", text: "ウ. 作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は変わらない。" },
      { id: "D", text: "エ. 作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは変わらない。" },
      { id: "E", text: "オ. 作業Ｈの作業所要時間が２時間長くなった場合、クリティカルパスは変わらない。" }
    ],
    answer: "E",
    explanation: `初期状態の各経路の長さを算出します：\n1) A→D→G→I = 3 + 5 + 5 + 3 = 16時間\n2) B→E→G→I = 4 + 6 + 5 + 3 = 18時間\n3) B→(ダミー)→H→I = 4 + 0 + 5 + 3 = 12時間\n4) C→F→H→I = 5 + 6 + 5 + 3 = 19時間\nしたがって、初期のクリティカルパスは C→F→H→I (19時間)です。\n\n・ア：不適切。Cが2時間早まると、全体のボトルネックは2番目に長いB→E→G→Iの18時間になり、完了は1時間しか早まりません。\n・イ：不適切。Eは元々クリティカルパス上にないため変化しません。\n・ウ：不適切。Fが1時間短くなると、C→F→H→Iが18時間となり、B→E→G→I(18時間)と並び、完了時刻は18時間（1時間短縮）に変わります。\n・エ：不適切。Fが2時間短くなると、C→F→H→Iは17時間となり、クリティカルパスはB→E→G→I(18時間)へ変化します。\n・オ：適切。クリティカルパス上のHが2時間長くなると、プロジェクト完了時刻が21時間になるだけで、クリティカルパスの経路自体は変わりません。`
  },
  {
    id: 6,
    year: "令和2年 第11問",
    title: "CPM（Critical Path Method）",
    question: "下表は、あるプロジェクト業務を行う際の各作業の要件を示している。CPMを適用して、最短プロジェクト遂行期間となる条件を達成したときの最小費用として、最も適切なものを下記の解答群から選べ（単位：万円）。",
    hasTable: true,
    tableType: "q6",
    options: [
      { id: "A", text: "440" },
      { id: "B", text: "510" },
      { id: "C", text: "530" },
      { id: "D", text: "610" },
      { id: "E", text: "710" }
    ],
    answer: "C",
    explanation: `【最短プロジェクト期間の特定】\nすべての作業を「最短所要期間」にした場合、経路は A(4) + D(7) + E(3) = 14日間 となり、これがターゲットとなる最短期間です。\n\n【各作業の最適短縮日数の決定】\n・主経路上の A, D, E は、最短14日を達成するために必ず最大まで短縮する必要があります。\n  - A: 5日→4日 (1日短縮 × 10万 = 10万円)\n  - D: 9日→7日 (2日短縮 × 30万 = 60万円)\n  - E: 5日→3日 (2日短縮 × 40万 = 80万円)\n\n・並行する経路 B→C について：\n  初期状態では B(6) + C(7) = 13日 であり、Dの9日を下回っています。しかし、Dを7日に短縮した際、B+Cが13日のままだとボトルネックがB→C（合計13日）に移ってしまい、全体を14日（A+D+E = 4+7+3）にできません。A+E=7日のため、B+Cの合計期間を「7日」にする必要があります（4+7+3=14日のため）。\n  つまり、B+Cを13日から7日へと、計6日間短縮する必要があります。\n  短縮単価の安いB（50万円）を優先して最大まで短縮します。\n  - B: 6日→2日 (4日短縮 × 50万 = 200万円)\n  - 残り2日分をCで短縮: 7日→5日 (2日短縮 × 90万 = 180万円)\n\n【費用合計】\n10 + 200 + 180 + 60 + 80 = 530万円。したがって選択肢ウが正解です。`
  },
  {
    id: 7,
    year: "令和元年 第9問",
    title: "ジョブの投入順序",
    question: "2工程のフローショップにおけるジョブの投入順序を考える。各ジョブ各工程の加工時間が下表のように与えられたとき、生産を開始して全てのジョブの加工を完了するまでの時間（メイクスパン）を最小にする順序として、最も適切なものを下記の解答群から選べ。",
    hasTable: true,
    tableType: "q7",
    options: [
      { id: "A", text: "J1→J2→J3" },
      { id: "B", text: "J1→J3→J2" },
      { id: "C", text: "J2→J1→J3" },
      { id: "D", text: "J3→J2→J1" }
    ],
    answer: "D",
    explanation: `2工程のフローショップにおけるメイクスパン最小化には、ジョンソン法（Johnson's rule）を適用します。\n\n【手順】\n1. 全ての加工時間の中で最小の値を探す。 → J3の第1工程（1時間）および J1の第2工程（2時間）\n2. 最小値が「第1工程」にある場合、そのジョブを可能な限り「最初」に配置する。 → J3を1番目に確定。\n3. 最小値が「第2工程」にある場合、そのジョブを可能な限り「最後」に配置する。 → J1を最後に確定。\n4. 残ったJ2を中間に配置する。\n\n結果、最適な投入順序は J3 → J2 → J1 となり、選択肢エが正解です。`
  },
  {
    id: 8,
    year: "令和3年 第8問",
    title: " need予測1",
    question: "需要量の時系列データを用いる需要予測法に関する記述として、最も適切なものはどれか。",
    options: [
      { id: "A", text: "ア 移動平均法の予測精度は、個々の予測値の計算に用いるデータ数に依存しない。" },
      { id: "B", text: "イ 移動平均法では、期が進むにつれて個々の予測値の計算に用いるデータ数が増加する。" },
      { id: "C", text: "ウ 指数平滑法では、過去の需要量にさかのぼるにつれて重みが指数的に減少する。" },
      { id: "D", text: "エ 指数平滑法では、過去の予測誤差とは独立に将来の需要量が予測される。" }
    ],
    answer: "C",
    explanation: `需要予測法（移動平均法・指数平滑法）の基本特性に関する問題です。\n\n・ア：不適切。データの数（区間数）によって平滑化効果が変わり、予測精度に大きく依存します。\n  イ：不適切。移動平均法はあらかじめ設定した一定個数のデータ（例: 直近3ヶ月など）をスライドさせて平均をとるため、データ数は増加しません。\n・ウ：適切。指数平滑法は、過去に遡るほど重み（ウェイト）が指数関数的（(1-α)の乗数）に減少する仕組みです。\n・エ：不適切。指数平滑法の基本式は「次期予測 ＝ 今期予測 ＋ α(今期実績 － 今期予測)」であり、末尾の(実績－予測)は過去の予測誤差そのものです。したがって、予測誤差を反映して計算されます。`
  },
  {
    id: 9,
    year: "平成29年 第34問",
    title: "需要予測2",
    question: "需要予測に関する次の記述として、最も適切なものはどれか。",
    options: [
      { id: "A", text: "ア 移動平均法は、過去の一定期間の実績値の平均に過去の変動要因を加えて予測する方法である。" },
      { id: "B", text: "イ 季節変動とは、3か月を周期とする変動である。" },
      { id: "C", text: "ウ 指数平滑法は、当期の実績値と当期の予測値を加重平均して次期の予測値を算出する方法である。" },
      { id: "D", text: "エ 重回帰分析では、説明変数間の相関が高いほど良い数式（モデル）であると評価できる。" }
    ],
    answer: "C",
    explanation: `・ア：不適切。移動平均法は過去の実績値の単純または加重平均を用いるのみで、別途要因を加算するロジックはありません。\n・イ：不適切。季節変動は「1年（12ヶ月）」を1周期とする定期的な変動を指します。\n・ウ：適切。公式を展開すると「次期予測 ＝ α×当期実績 ＋ (1-α)×当期予測」となり、当期実績と当期予測を α と 1-α で加重平均していることがわかります。\n・エ：不適切。説明変数同士の相関が高すぎると「多重共線性（マルチコ）」という現象を引き起こし、モデルの推計が不安定になるため、説明変数間の相関は低い方が好ましいです。`
  },
  {
    id: 10,
    year: "平成27年 第9問",
    title: "指数平滑法の計算",
    question: "ある会社では、商品の需要予測に指数平滑法（平滑化定数α＝0.4）を用いている。当期の需要予測値75に対し、需要実績値は55であった。次期の需要予測値として、最も適切なものはどれか。",
    options: [
      { id: "A", text: "ア. 63" },
      { id: "B", text: "イ. 65" },
      { id: "C", text: "ウ. 67" },
      { id: "D", text: "エ. 69" }
    ],
    answer: "C",
    explanation: `指数平滑法の公式に数値を代入して計算します。\n\n【公式】\n次期予測値 ＝ 今期予測値 ＋ α × (今期実績値 － 今期予測値)\n\n【計算】\n次期予測値 ＝ 75 ＋ 0.4 × (55 － 75)\n            ＝ 75 ＋ 0.4 × (-20)\n            ＝ 75 － 8\n            ＝ 67\n\nしたがって、ウの67が正解です。`
  },
  {
    id: 11,
    year: "平成30年 第14問",
    title: "現品管理",
    question: "JIS (JIS Z 8142) で定義される現品管理の活動として、最も不適切なものはどれか。",
    options: [
      { id: "A", text: "ア 受け入れ外注品の品質と数量の把握" },
      { id: "B", text: "イ 仕掛品の適正な保管位置や保管方法の設定" },
      { id: "C", text: "ウ 製品の適正な運搬荷姿や運搬方法の検討" },
      { id: "D", text: "エ 利用資材の発注方式の見直し" }
    ],
    answer: "D",
    explanation: `JISの定義において、現品管理とは「資材、仕掛品、製品などの物について、運搬・移動や停滞・保管の状況を管理する活動」とされています。物の「数量」や「所在」の確実な把握を目的とします。\n\n・ア、イ、ウ：いずれも品質・数量の把握、保管、運搬に関わる内容であり、現品管理の範囲内です。\n・エ：不適切。「発注方式の見直し（定期か定量かなど）」は、調達管理・在庫管理の仕組みそのものの「改善活動（計画・制度設計）」であり、現場の現品を追跡・管理する活動とは異なります。`
  },
  {
    id: 12,
    year: "令和5年 第10問",
    title: "余力管理と関連用語",
    question: "工数管理や余力管理に関する以下のａ～ｄの記述と用語の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\nａ 工作量の全体を表す尺度で、仕事を１人の作業者で遂行するのに要する時間。\nｂ 各工程または個々の作業者における、現在の作業負荷状態と現有作業能力の差。\nｃ 作業習熟や改善活動、設計改良などによって作業時間を減らすこと。\nｄ 作業の実施時期をずらすなどにより生産の負荷平準化を行うこと。",
    options: [
      { id: "A", text: "ア ａ：工数  ｂ：作業余裕  ｃ：工数低減  ｄ：工程編成" },
      { id: "B", text: "イ ａ：工数  ｂ：余力  ｃ：工数低減  ｄ：工数の山積山崩" },
      { id: "C", text: "ウ ａ：工程能力  ｂ：工程能力指数  ｃ：工程分割  ｄ：工数低減" },
      { id: "D", text: "エ ａ：標準時間  ｂ：作業余裕  ｃ：工程分割  ｄ：工数の山積山崩" },
      { id: "E", text: "オ ａ：標準時間  ｂ：余力  ｃ：工数の山積山崩  ｄ：工程編成" }
    ],
    answer: "B",
    explanation: `各記述の用語定義を確認します：\n\n・ａ：仕事量を「人×時間」等で表す尺度。これは「工数」の定義です。\n・ｂ：能力と負荷の差。これは「余力」の定義です（余力 ＝ 能力 － 負荷）。\n・ｃ：作業時間を低減させること。これは「工数低減」です。\n・ｄ：負荷を各期間へ均すため、時期を前後にずらす行為。これは「工数の山積山崩（山崩し）」と呼ばれます。\n\nよって、すべての組み合わせが一致する選択肢イが正解です。`
  },
  {
    id: 13,
    year: "令和4年 第4問",
    title: "生産管理方式の諸特徴",
    question: "生産方式に関する記述の正誤の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\na オーダエントリー方式は、生産工程にある半製品に顧客のオーダを引き当て、顧客が希望した仕様の製品として完成させるために、仕様に合わせた部品や作業を選択して生産する方式である。\nb 生産座席予約方式は、設備の稼働状況を基に、顧客のオーダを到着順に生産する方式である。\nc モジュール生産方式は、あらかじめモジュール部品を複数用意し、受注後にそれらの組み合わせによって多品種の最終製品を生産する方式で、リードタイムの短縮が期待できる。\nd 製番管理方式は、製品の組立を開始する時点で部品を引き当てる方式で、ロット生産にも利用可能で、特にロットサイズが大きい場合に適している。",
    options: [
      { id: "A", text: "ア ａ：正  ｂ：正  ｃ：誤  ｄ：誤" },
      { id: "B", text: "イ ａ：正  ｂ：誤  ｃ：正  ｄ：誤" },
      { id: "C", text: "ウ ａ：正  ｂ：誤  ｃ：正  ｄ：正" },
      { id: "D", text: "エ ａ：誤  ｂ：正  ｃ：誤  ｄ：正" },
      { id: "E", text: "オ ａ：誤  ｂ：誤  ｃ：正  ｄ：正" }
    ],
    answer: "B",
    explanation: `・a：正。自動車生産などで見られる、流れている標準半製品に受注時点でオプションを引き当てる典型的な方式です。\n・b：誤。生産座席予約方式は、設備の空きスケジュール（座席）に予約を割り付けることで納期を確約する方式であり、単なる「到着順生産」ではありません。\n・c：正。標準化された機能モジュールを受注後にアセンブリするため、多品種化と短納期化（リードタイム短縮）を両立できます。\n・d：誤。製番管理方式は、製造番号（製番）で部品と製品を紐付けるため、個別生産やロットサイズが「小さい」多種少量ロット生産に適します。大ロットには適しません。\n\nよって、[正, 誤, 正, 誤] の組み合わせであるイが正解です。`
  },
  {
    id: 14,
    year: "平成30年 第11問",
    title: "トヨタ生産方式の特徴",
    question: "トヨタ生産方式の特徴を表す用語として、最も適切なものの組み合わせを下記の解答群から選べ。\n\nａ ＭＲＰ\nｂ かんばん方式\nｃ セル生産方式\nｄ 製番管理方式\nｅ あんどん方式",
    options: [
      { id: "A", text: "ア ａとｃ" },
      { id: "B", text: "イ ａとｄ" },
      { id: "C", text: "ウ ｂとｃ" },
      { id: "D", text: "エ ｂとｅ" },
      { id: "E", text: "オ ｄとｅ" }
    ],
    answer: "D",
    explanation: `トヨタ生産方式（TPS）の2大柱は「ジャストインタイム（JIT）」と「自働化」です。\n\n・ａ：MRPはプッシュ型のスケジュール中央管理システムであり、JIT（プル型後工程引取）とは逆の思想です。\n・ｂ：かんばん方式は、JITを実現するための現場のツール（後工程引取指示・情報伝達）であり、特徴的です。\n・ｃ：セル生産方式はJIT進化の過程で親和性がありますが、TPS固有・必須のシステムではありません。\n・ｄ：製番管理方式は受注生産型の個別管理手法であり、TPSの平準化生産・繰返生産管理とは異なります。\n・ｅ：あんどん方式は、「自働化」の思想において異常を可視化しラインを止めるための重要システムです。\n\nしたがって、確実にTPSを代表する特徴語であるｂとｅの組み合わせ（エ）が正解です。`
  },
  {
    id: 15,
    year: "平成29年 第20問",
    title: "製造現場の改善方法",
    question: "生産現場で行われる改善施策に関する記述として、最も不適切なものはどれか。",
    options: [
      { id: "A", text: "ア 機械設備の稼働状況を可視化するために、「あんどん」を設置した。" },
      { id: "B", text: "イ 「シングル段取」の実現を目指して、内段取の一部を外段取に変更した。" },
      { id: "C", text: "ウ 品種変更に伴う段取り替えの回数を抑制するために、製品の流れを「1個流し」に変更した。" },
      { id: "D", text: "エ 部品の組み付け忘れを防止するために、部品の供給棚に「ポカヨケ」の改善を施した。" }
    ],
    answer: "C",
    explanation: `・ア：適切。あんどんは異常や稼働状況を一目で分かるように可視化する道具です。\n・イ：適切。シングル段取（10分未満での段取り替え）のために、機械を止めないとできない「内段取」を、機械稼働中に行える「外段取」へシフトするのは基本セオリーです。\n・外：不適切。1個流しは中間仕掛品を削減するために1個ずつ加工・搬送する方式であり、多品種が混流する場合はむしろ段取り替え回数が「増加」する傾向にあります。段取り替えの回数を抑制・カットするための手段ではありません。\n・エ：適切。部品棚のシャッター開閉連動など、ポカヨケによって物理的にポカ（ミス）を予防します。`
  }
];

export default function App() {
  // --- STATE MANAGEMENT ---
  const [userId, setUserId] = useState(localStorage.getItem('saved_quiz_uid') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // App view state: 'menu' | 'quiz' | 'history'
  const [view, setView] = useState('menu');
  const [quizMode, setQuizMode] = useState('all'); // 'all' | 'wrong' | 'review'
  
  // Quiz running states
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  // Cloud Sync state
  const [userHistory, setUserHistory] = useState({}); // { [questionId]: { correct: boolean, review: boolean } }
  const [resumeData, setResumeData] = useState(null);

  // --- ACTIONS & SYNC LOOPS ---
  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log("[Sync] User authenticated, checking historical state on cloud...");
      fetchUserData();
    }
  }, [isAuthenticated, userId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    
    setLoading(true);
    console.log(`[Auth] Executing anonymous sign-in for secure workspace sync: ${userId}`);
    try {
      const auth = getAuth(app);
      await signInAnonymously(auth);
      localStorage.setItem('saved_quiz_uid', userId.trim());
      setIsAuthenticated(true);
    } catch (err) {
      console.error("[Auth Error] Anonymous authentication failed", err);
      alert("認証エラーが発生しました。通信環境を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, APP_ID, userId.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("[Sync] Active user profile recovered:", data);
        setUserHistory(data.history || {});
        
        if (typeof data.progressIndex === 'number' && data.progressMode) {
          console.log(`[Resume Found] Interrupted session detected at mode: ${data.progressMode}, Index: ${data.progressIndex}`);
          setResumeData({
            index: data.progressIndex,
            mode: data.progressMode
          });
        } else {
          setResumeData(null);
        }
      } else {
        console.log("[Sync] Fresh cloud container initialized for user.");
        setUserHistory({});
        setResumeData(null);
      }
    } catch (err) {
      console.error("[Sync Error] Could not read user database object", err);
    } finally {
      setLoading(false);
    }
  };

  const startQuizSession = (mode, forceStartIndex = null) => {
    console.log(`[Session] Structuring dynamic query queue. Filter Mode: ${mode}`);
    let filtered = [...QUIZ_DATA];
    
    if (mode === 'wrong') {
      filtered = QUIZ_DATA.filter(q => userHistory[q.id] && userHistory[q.id].correct === false);
    } else if (mode === 'review') {
      filtered = QUIZ_DATA.filter(q => userHistory[q.id] && userHistory[q.id].review === true);
    }

    if (filtered.length === 0) {
      alert("条件に該当する問題が存在しません。別のモードを選択してください。");
      return;
    }

    setCurrentQuestions(filtered);
    setQuizMode(mode);
    setSelectedAnswer(null);
    setIsAnswered(false);
    
    if (typeof forceStartIndex === 'number' && forceStartIndex < filtered.length) {
      console.log(`[Session RESTORE] Resuming queue pipeline from index offset: ${forceStartIndex}`);
      setCurrentIndex(forceStartIndex);
    } else {
      console.log("[Session NEW] Running track from beginning (index=0)");
      setCurrentIndex(0);
    }
    
    setView('quiz');
  };

  const handleAnswerSelect = async (optionId) => {
    if (isAnswered) return;
    setSelectedAnswer(optionId);
    setIsAnswered(true);
    
    const targetQuestion = currentQuestions[currentIndex];
    const isCorrect = optionId === targetQuestion.answer;
    
    console.log(`[Evaluation] Problem ID ${targetQuestion.id} processed. Answer status: ${isCorrect}`);

    const updatedHistory = {
      ...userHistory,
      [targetQuestion.id]: {
        ...userHistory[targetQuestion.id],
        correct: isCorrect,
        review: userHistory[targetQuestion.id]?.review || false
      }
    };
    
    setUserHistory(updatedHistory);

    // Persist answer result and advance index counter to Cloud instantly
    try {
      const nextIdx = currentIndex + 1;
      const isCompleted = nextIdx >= currentQuestions.length;
      
      const docRef = doc(db, APP_ID, userId.trim());
      await setDoc(docRef, {
        history: updatedHistory,
        progressIndex: isCompleted ? 0 : nextIdx,
        progressMode: isCompleted ? "" : quizMode
      }, { merge: true });
      
      console.log(`[Sync Commit] Progress offset state ${isCompleted ? 'RESET' : 'INCREMENTED'} via firestore pipeline.`);
    } catch (err) {
      console.error("[Sync Commit Error] Progress state stream broken", err);
    }
  };

  const toggleReviewFlag = async (qId) => {
    const nextReviewState = !userHistory[qId]?.review;
    console.log(`[Flag Modification] Review switch triggered for ID ${qId} -> State: ${nextReviewState}`);

    const updatedHistory = {
      ...userHistory,
      [qId]: {
        ...userHistory[qId],
        review: nextReviewState
      }
    };
    setUserHistory(updatedHistory);

    try {
      const docRef = doc(db, APP_ID, userId.trim());
      await updateDoc(docRef, { history: updatedHistory });
    } catch (err) {
      console.error("[Sync Modification Error] Review property mutation failed", err);
    }
  };

  const clearSessionTracking = async () => {
    console.log("[Session Reset] Purging pointer telemetry fields from cloud state...");
    setResumeData(null);
    try {
      const docRef = doc(db, APP_ID, userId.trim());
      await setDoc(docRef, {
        progressIndex: 0,
        progressMode: ""
      }, { merge: true });
    } catch (err) {
      console.error("[Session Reset Error] Could not clean tracking metadata", err);
    }
  };

  const calculateAnalytics = () => {
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    QUIZ_DATA.forEach(q => {
      if (userHistory[q.id] === undefined) {
        unattemptedCount++;
      } else if (userHistory[q.id].correct) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    return [
      { name: '正解', value: correctCount, fill: '#10B981' },
      { name: '不正解', value: wrongCount, fill: '#EF4444' },
      { name: '未着手', value: unattemptedCount, fill: '#9CA3AF' }
    ];
  };

  // --- SUB-COMPONENTS FOR EMBEDDED TABLES ---
  const RenderQuestionTable = ({ type }) => {
    if (type === "q1") {
      return (
        <div className="overflow-x-auto my-4 border border-gray-300 rounded-lg shadow-sm">
          <table className="min-w-full text-xs text-center divide-y divide-gray-200">
            <thead className="bg-gray-100 font-semibold text-gray-700">
              <tr>
                <th className="px-2 py-2 border-r">日</th>
                <th className="px-2 py-2 border-r">1</th>
                <th className="px-2 py-2 border-r">2</th>
                <th className="px-2 py-2 border-r">3</th>
                <th className="px-2 py-2 border-r">4</th>
                <th className="px-2 py-2 border-r">5</th>
                <th className="px-2 py-2">総費用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              <tr className="bg-gray-50 font-medium">
                <td className="px-2 py-2 border-r bg-gray-100 font-semibold">需要量</td>
                <td className="px-2 py-2 border-r">200</td>
                <td className="px-2 py-2 border-r">180</td>
                <td className="px-2 py-2 border-r">140</td>
                <td className="px-2 py-2 border-r">80</td>
                <td className="px-2 py-2">100</td>
                <td className="px-2 py-2 bg-gray-100"></td>
              </tr>
              <tr>
                <td className="px-2 py-2 border-r font-semibold bg-gray-50">案 0</td>
                <td className="px-2 py-2 border-r">700</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2">0</td>
                <td className="px-2 py-2 font-bold text-red-600 bg-red-50">16,000</td>
              </tr>
              <tr>
                <td className="px-2 py-2 border-r font-semibold bg-gray-50">案 1</td>
                <td className="px-2 py-2 border-r">200</td>
                <td className="px-2 py-2 border-r">500</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2">0</td>
                <td className="px-2 py-2"></td>
              </tr>
              <tr>
                <td className="px-2 py-2 border-r font-semibold bg-gray-50">案 2</td>
                <td className="px-2 py-2 border-r">380</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">320</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2">0</td>
                <td className="px-2 py-2"></td>
              </tr>
              <tr>
                <td className="px-2 py-2 border-r font-semibold bg-gray-50">案 3</td>
                <td className="px-2 py-2 border-r">520</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">180</td>
                <td className="px-2 py-2">0</td>
                <td className="px-2 py-2"></td>
              </tr>
              <tr>
                <td className="px-2 py-2 border-r font-semibold bg-gray-50">案 4</td>
                <td className="px-2 py-2 border-r">600</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 border-r">0</td>
                <td className="px-2 py-2 text-center">100</td>
                <td className="px-2 py-2 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    if (type === "q4") {
      return (
        <div className="overflow-x-auto my-4 border border-gray-300 rounded-lg max-w-md shadow-sm mx-auto">
          <table className="min-w-full text-xs text-center divide-y divide-gray-200">
            <thead className="bg-gray-100 font-semibold text-gray-700">
              <tr>
                <th className="px-4 py-2 border-r">作業名</th>
                <th className="px-4 py-2 border-r">作業日数</th>
                <th className="px-4 py-2">先行作業</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {[['A', '3', 'なし'], ['B', '4', 'なし'], ['C', '3', 'A'], ['D', '2', 'A'], ['E', '3', 'B, C, D'], ['F', '3', 'D']].map(([n, d, p]) => (
                <tr key={n}>
                  <td className="px-4 py-2 border-r font-bold bg-gray-50">{n}</td>
                  <td className="px-4 py-2 border-r">{d} 日</td>
                  <td className="px-4 py-2 text-gray-600 font-mono">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (type === "q5") {
      return (
        <div className="my-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl">
          <div className="text-xs font-semibold text-blue-800 mb-2 text-center">【図：アローダイアグラムのネットワーク経路構造】</div>
          <div className="text-xs space-y-1 text-gray-700 font-mono max-w-sm mx-auto">
            <div>・① → (作業A: 3時間) → ②</div>
            <div>・① → (作業B: 4時間) → ③</div>
            <div>・① → (作業C: 5時間) → ⑤</div>
            <div>・② → (作業D: 5時間) → ④</div>
            <div>・③ → (作業E: 6時間) → ④</div>
            <div>・③ ⇢ (点線ダミー: 0時間) ⇢ ⑥</div>
            <div> tyranny・⑤ → (作業F: 6時間) → ⑥</div>
            <div>・④ → (作業G: 5時間) → ⑦</div>
            <div>・⑥ → (作業H: 5時間) → ⑦</div>
            <div>・⑦ → (作業I: 3時間) → ⑧ [終点]</div>
          </div>
        </div>
      );
    }
    if (type === "q6") {
      return (
        <div className="overflow-x-auto my-4 border border-gray-300 rounded-lg shadow-sm">
          <table className="min-w-full text-xs text-center divide-y divide-gray-200">
            <thead className="bg-gray-100 font-semibold text-gray-700">
              <tr>
                <th className="px-2 py-2 border-r">作業名</th>
                <th className="px-2 py-2 border-r">先行作業</th>
                <th className="px-2 py-2 border-r">通常所要期間</th>
                <th className="px-2 py-2 border-r">最短所要期間</th>
                <th className="px-2 py-2">単位時間当たりの短縮費用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {[
                ['A', '—', '5', '4', '10万円'],
                ['B', 'A', '6', '2', '50万円'],
                ['C', 'B', '7', '3', '90万円'],
                ['D', 'A', '9', '7', '30万円'],
                ['E', 'C, D', '5', '3', '40万円']
              ].map(([n, p, d, sd, c]) => (
                <tr key={n}>
                  <td className="px-2 py-2 border-r font-bold bg-gray-50">{n}</td>
                  <td className="px-2 py-2 border-r font-mono">{p}</td>
                  <td className="px-2 py-2 border-r">{d}</td>
                  <td className="px-2 py-2 border-r font-medium text-red-600">{sd}</td>
                  <td className="px-2 py-2 bg-amber-50/50 font-medium">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (type === "q7") {
      return (
        <div className="overflow-x-auto my-4 border border-gray-300 rounded-lg max-w-sm shadow-sm mx-auto">
          <table className="min-w-full text-xs text-center divide-y divide-gray-200">
            <thead className="bg-gray-100 font-semibold text-gray-700">
              <tr>
                <th className="px-3 py-2 border-r">工程 / ジョブ</th>
                <th className="px-3 py-2 border-r">J1</th>
                <th className="px-3 py-2 border-r">J2</th>
                <th className="px-3 py-2">J3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              <tr>
                <td className="px-3 py-2 border-r font-medium bg-gray-50 text-left">第１工程</td>
                <td className="px-3 py-2 border-r">3時間</td>
                <td className="px-3 py-2 border-r">5時間</td>
                <td className="px-3 py-2">1時間</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-r font-medium bg-gray-50 text-left">第２工程</td>
                <td className="px-3 py-2 border-r">2時間</td>
                <td className="px-3 py-2 border-r">4時間</td>
                <td className="px-3 py-2">6時間</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  const RenderExplanationTable = ({ type }) => {
    if (type === "q1") {
      return (
        <div className="overflow-x-auto my-3 border border-amber-300 rounded-lg text-xs">
          <table className="min-w-full text-center divide-y divide-gray-200">
            <thead className="bg-amber-100 text-amber-900 font-semibold">
              <tr>
                <th className="px-2 py-1.5 border-r">案 / 日</th>
                <th className="px-2 py-1.5 border-r">1日目</th>
                <th className="px-2 py-1.5 border-r">2日目</th>
                <th className="px-2 py-1.5 border-r">3日目</th>
                <th className="px-2 py-1.5 border-r">4日目</th>
                <th className="px-2 py-1.5 border-r">5日目</th>
                <th className="px-2 py-1.5 font-bold">繰越在庫量合計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                <td className="px-2 py-1.5 border-r bg-gray-50 font-medium">案0 (繰越)</td>
                <td className="px-2 py-1.5 border-r">500</td>
                <td className="px-2 py-1.5 border-r">320</td>
                <td className="px-2 py-1.5 border-r">180</td>
                <td className="px-2 py-1.5 border-r">100</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 font-bold text-gray-600">1,100 個</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 border-r bg-gray-50 font-medium">案1 (繰越)</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 border-r">320</td>
                <td className="px-2 py-1.5 border-r">180</td>
                <td className="px-2 py-1.5 border-r">100</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 font-bold text-gray-600">600 個</td>
              </tr>
              <tr className="bg-yellow-50 font-semibold">
                <td className="px-2 py-1.5 border-r bg-yellow-100 text-amber-900 font-bold">案2 (繰越)</td>
                <td className="px-2 py-1.5 border-r">180</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 border-r">180</td>
                <td className="px-2 py-1.5 border-r">100</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 font-bold text-green-700 bg-green-100">460 個</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 border-r bg-gray-50 font-medium">案3 (繰越)</td>
                <td className="px-2 py-1.5 border-r">320</td>
                <td className="px-2 py-1.5 border-r">140</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 border-r">100</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 font-bold text-gray-600">560 個</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 border-r bg-gray-50 font-medium">案4 (繰越)</td>
                <td className="px-2 py-1.5 border-r">400</td>
                <td className="px-2 py-1.5 border-r">220</td>
                <td className="px-2 py-1.5 border-r">80</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 border-r">0</td>
                <td className="px-2 py-1.5 font-bold text-gray-600">700 個</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    if (type === "q6") {
      return (
        <div className="overflow-x-auto my-3 border border-amber-300 rounded-lg text-xs">
          <table className="min-w-full text-center divide-y divide-gray-200">
            <thead className="bg-amber-100 text-amber-900 font-semibold">
              <tr>
                <th className="px-3 py-1.5 border-r">作業</th>
                <th className="px-3 py-1.5 border-r">通常期間</th>
                <th className="px-3 py-1.5 border-r">短縮後期間</th>
                <th className="px-3 py-1.5 border-r">必要短縮日数</th>
                <th className="px-3 py-1.5 border-r">単位費用</th>
                <th className="px-3 py-1.5">短縮費用計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {[
                ['A', '5', '4', '1日', '10万', '10万円'],
                ['B', '6', '2', '4日', '50万', '200万円'],
                ['C', '7', '5', '2日', '90万', '180万円'],
                ['D', '9', '7', '2日', '30万', '60万円'],
                ['E', '5', '3', '2日', '40万', '80万円']
              ].map(([n, o, na, r, u, t]) => (
                <tr key={n} className={n === 'B' || n === 'C' ? "bg-amber-50/40" : ""}>
                  <td className="px-3 py-1.5 border-r font-bold bg-gray-50">{n}</td>
                  <td className="px-3 py-1.5 border-r">{o}</td>
                  <td className="px-3 py-1.5 border-r">{na}</td>
                  <td className="px-3 py-1.5 border-r text-red-600 font-medium">{r}</td>
                  <td className="px-3 py-1.5 border-r">{u}</td>
                  <td className="px-3 py-1.5 font-bold text-gray-900">{t}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold text-gray-900">
                <td colSpan="5" className="px-3 py-2 border-r text-right">総合計最小費用:</td>
                <td className="px-3 py-2 text-red-600 text-sm">530 万円</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  // --- RENDER LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white text-center">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-90" />
            <h1 className="text-xl font-bold tracking-tight">中小企業診断士 過去問演習</h1>
            <p className="text-xs text-indigo-200 mt-1">運営管理：生産計画と生産統制セレクトパック</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                同期用合言葉（ユーザーIDキー）
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="PC・スマホ間で共通のシークレットキー"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                ※任意のパスワードを入力してください。他のデバイスで同じパスワードを入力することで、全解答履歴・復習フラグ・途中中断データをリアルタイムに引き継ぐことができます。
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-md shadow-indigo-100 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="flex items-center space-x-1.5 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>セッション確立中...</span>
                </span>
              ) : (
                <span>学習コンソールへログイン</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">クラウドデータを同期中...</p>
      </div>
    );
  }

  // --- RENDER DASHBOARD/MENU VIEW ---
  if (view === 'menu') {
    const allCount = QUIZ_DATA.length;
    const wrongCount = QUIZ_DATA.filter(q => userHistory[q.id] && userHistory[q.id].correct === false).length;
    const reviewCount = QUIZ_DATA.filter(q => userHistory[q.id] && userHistory[q.id].review === true).length;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 h-14 flex justify-between items-center">
            <span className="font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-5 bg-indigo-600 rounded-full"></span>
              <span className="text-sm md:text-base">生産管理 過去問トレーニング</span>
            </span>
            <div className="flex items-center space-x-2 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg text-slate-600 font-mono">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate max-w-[80px] md:max-w-none font-bold">{userId}</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
          {/* INTERRUPTED RESUME MODAL UI */}
          {resumeData && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 shadow-sm space-y-3.5 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-amber-200 opacity-20">
                <Clock className="w-32 h-32" />
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">未完了セッションの検出</h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    前回はモード <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">{resumeData.mode === 'all' ? 'すべての問題' : resumeData.mode === 'wrong' ? '前回不正解のみ' : '要復習のみ'}</span> で<span className="font-bold text-amber-900">【問題 {resumeData.index + 1}】</span>まで進んでいます。続きから再開しますか？
                  </p>
                </div>
              </div>
              <div className="flex space-x-2.5 pt-1">
                <button
                  onClick={() => startQuizSession(resumeData.mode, resumeData.index)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs py-2 px-3 rounded-lg transition shadow-sm"
                >
                  続きから再開する
                </button>
                <button
                  onClick={clearSessionTracking}
                  className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 font-medium text-xs py-2 px-3 rounded-lg transition"
                >
                  最初から始める
                </button>
              </div>
            </div>
          )}

          {/* MODE SELECTION CARDS */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">学習モードの選択</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => startQuizSession('all')}
                className="bg-white hover:border-indigo-400 border border-slate-200 rounded-2xl p-4 text-left transition shadow-sm flex md:flex-col justify-between items-center md:items-start space-y-0 md:space-y-4"
              >
                <div className="flex items-center space-x-3 md:space-x-0 md:block">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-0 md:mb-2">
                    <List className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">すべての問題</h3>
                    <p className="text-xs text-slate-400 mt-0.5">パック全問題を網羅</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {allCount} 問
                </span>
              </button>

              <button
                onClick={() => startQuizSession('wrong')}
                disabled={wrongCount === 0}
                className={`bg-white border text-left transition shadow-sm flex md:flex-col justify-between items-center md:items-start space-y-0 md:space-y-4 rounded-2xl p-4 ${
                  wrongCount === 0 ? 'opacity-50 cursor-not-allowed border-slate-100' : 'hover:border-red-400 border border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3 md:space-x-0 md:block">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl w-fit mb-0 md:mb-2">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">前回不正解の問題のみ</h3>
                    <p className="text-xs text-slate-400 mt-0.5">弱点を集中的に克服</p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${wrongCount > 0 ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-100'}`}>
                  {wrongCount} 問
                </span>
              </button>

              <button
                onClick={() => startQuizSession('review')}
                disabled={reviewCount === 0}
                className={`bg-white border text-left transition shadow-sm flex md:flex-col justify-between items-center md:items-start space-y-0 md:space-y-4 rounded-2xl p-4 ${
                  reviewCount === 0 ? 'opacity-50 cursor-not-allowed border-slate-100' : 'hover:border-amber-400 border border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3 md:space-x-0 md:block">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit mb-0 md:mb-2">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">要復習の問題のみ</h3>
                    <p className="text-xs text-slate-400 mt-0.5">ブックマークした重要問</p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${reviewCount > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-100'}`}>
                  {reviewCount} 問
                </span>
              </button>
            </div>
          </section>

          {/* STATS ANALYTICS VISUALIZATION */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">学習進捗アナリティクス</h2>
              <p className="text-xs text-slate-400 mt-0.5">現在の全体アテンプト状況</p>
            </div>
            <div className="h-44 w-full text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculateAnalytics()} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#6B7280" />
                  <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* TRAILING AUDIT LIST */}
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">問題一覧と同期ステータス</h2>
              <span className="text-[11px] text-indigo-600 font-medium">全端末リアルタイム同期対応</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
              {QUIZ_DATA.map((q) => {
                const status = userHistory[q.id];
                return (
                  <div key={q.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition">
                    <div className="space-y-0.5 pr-4 truncate">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-mono text-slate-400 font-bold">問 {q.id}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-500 text-[11px] font-medium bg-slate-100 px-1.5 py-0.5 rounded">{q.year}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-700 truncate">{q.title}</h4>
                    </div>
                    
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      {status?.review && (
                        <span className="p-1 bg-amber-50 rounded text-amber-600">
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </span>
                      )}
                      {status === undefined ? (
                        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">未アテンプト</span>
                      ) : status.correct ? (
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg border border-green-100 flex items-center space-x-1">
                          <Check className="w-3 h-3 stroke-[3]" /> <span>正解</span>
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100 flex items-center space-x-1">
                          <X className="w-3 h-3 stroke-[3]" /> <span>不正解</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --- RENDER SCREEN: QUIZ INTERFACE & EXPLANATION ---
  if (view === 'quiz') {
    const question = currentQuestions[currentIndex];
    const isLastQuestion = currentIndex === currentQuestions.length - 1;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
        {/* HEADER TRACKER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 h-14 flex justify-between items-center">
            <button
              onClick={() => {
                console.log("[Navigation] Manual escape to menu layout.");
                setView('menu');
              }}
              className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center space-x-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition"
            >
              <Home className="w-4 h-4" />
              <span>中断して戻る</span>
            </button>
            <div className="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-full">
              進行度: <span className="text-indigo-600 font-extrabold">{currentIndex + 1}</span> / {currentQuestions.length} 問
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 mt-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
            {/* SUBTITLE META */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-md">
                問題 {question.id}
              </span>
              <span className="bg-slate-100 text-slate-500 text-xs font-medium px-2 py-0.5 rounded-md">
                {question.year}
              </span>
              <span className="text-slate-700 text-xs font-bold font-sans">
                {question.title}
              </span>
            </div>

            {/* PROBLEM TEXT */}
            <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {question.question}
            </div>

            {/* INTERNALLY REPLICATED TABLES */}
            {question.hasTable && <RenderQuestionTable type={question.tableType} />}

            {/* INTERACTIVE CHOICE BLOCK */}
            <div className="space-y-2.5 pt-2">
              {question.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                const isCorrectOption = opt.id === question.answer;
                
                let btnStyle = "border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 bg-white";
                if (isAnswered) {
                  if (isCorrectOption) {
                    btnStyle = "border-green-500 bg-green-50/70 text-green-900 shadow-sm shadow-green-100";
                  } else if (isSelected) {
                    btnStyle = "border-red-400 bg-red-50/70 text-red-900";
                  } else {
                    btnStyle = "border-slate-100 opacity-60 text-slate-400 bg-slate-50/30";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isAnswered}
                    onClick={() => handleAnswerSelect(opt.id)}
                    className={`w-full border-2 text-left p-3.5 rounded-xl text-xs font-semibold leading-relaxed transition flex items-start space-x-3 ${btnStyle}`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono mt-0.5 flex-shrink-0 ${
                      isAnswered && isCorrectOption ? 'bg-green-600 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {opt.id}
                    </span>
                    <span className="pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* EVALUATION FEEDBACK AND EXPLANATION STREAM */}
            {isAnswered && (
              <div className="border-t border-dashed border-slate-200 pt-5 space-y-4 animate-fadeIn">
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${
                  selectedAnswer === question.answer ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-red-50 border border-red-200 text-red-900'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedAnswer === question.answer ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {selectedAnswer === question.answer ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-5 h-5 stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">
                      {selectedAnswer === question.answer ? '正解です！' : '不正解です'}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      正しい解答の選択肢: <span className="font-extrabold underline font-mono text-sm">{question.answer}</span>
                    </p>
                  </div>
                </div>

                {/* REVIEW PERSISTENT CHECKBOX */}
                <div className="bg-slate-100/70 p-3.5 rounded-xl flex items-center justify-between border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                      <span>この問題の要復習登録</span>
                    </span>
                    <p className="text-[11px] text-slate-400">チェックを入れるとダッシュボードから抽出可能になります</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={userHistory[question.id]?.review || false}
                      onChange={() => toggleReviewFlag(question.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* EXPLANATORY CONTENT */}
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 md:p-5 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 tracking-wider uppercase border-b border-amber-200 pb-1 w-fit">
                    解答・解説の紐解き
                  </h4>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {question.explanation}
                  </div>
                  
                  {/* EXPLANATION ANALYSIS TABLE DEPENDENCY */}
                  <RenderExplanationTable type={question.tableType} />
                </div>

                {/* STEPPER CONTROL BUTTONS */}
                <div className="pt-2">
                  {isLastQuestion ? (
                    <button
                      onClick={async () => {
                        console.log("[Track Finished] Reached terminus. Cleaning pointers.");
                        await clearSessionTracking();
                        setView('menu');
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl transition shadow-md flex items-center justify-center space-x-1"
                    >
                      <span>全問回答完了（メニューへ戻る）</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        console.log(`[Queue Advance] Incrementing cursor position index to: ${currentIndex + 1}`);
                        setSelectedAnswer(null);
                        setIsAnswered(false);
                        setCurrentIndex(prev => prev + 1);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition shadow-md flex items-center justify-center space-x-1"
                    >
                      <span>次の問題へ進む</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
}