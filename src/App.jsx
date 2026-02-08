// npm install lucide-react recharts

import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Home, RotateCcw, BookOpen, AlertCircle, ChevronRight, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- DATA: QUESTIONS & CONTENT ---
const QUESTIONS = [
  {
    id: 1,
    year: "平成26年 第9問",
    category: "生産計画",
    title: "ロット生産における生産計画",
    question: "ある製品をロット生産している工場で、以下の表に示す5日間の需要量(個)に対する生産計画を考える。製品を生産する日には、生産に先だち段取りが必要で、1回当たり段取り費5,000円が発生する。また、生産した製品を当日の需要に充当する場合、在庫保管費は発生しないが、翌日以降に繰り越す場合、繰越在庫量に比例して、1個1日当たり10円の在庫保管費が発生する。\n\n案1〜案4は総需要量700個を2回に分けて生産する計画である。これらの中で総費用を最小にするものを、下記の解答群から選べ。",
    tableData: {
      headers: ["日", "1", "2", "3", "4", "5", "総費用"],
      rows: [
        ["需要量", "200", "180", "140", "80", "100", ""],
        ["案0", "700", "0", "0", "0", "0", "16,000"],
        ["案1", "200", "500", "0", "0", "0", "?"],
        ["案2", "380", "0", "320", "0", "0", "?"],
        ["案3", "520", "0", "0", "180", "0", "?"],
        ["案4", "600", "0", "0", "0", "100", "?"]
      ]
    },
    options: ["案1", "案2", "案3", "案4"],
    correctAnswer: 1, // 案2 (index 1)
    explanation: "段取り回数は全て2回のため、段取り費用は同額（10,000円）です。在庫保管費（繰越在庫量×10円）が最小になる案を選びます。\n\n各案の繰越在庫の計算：\n案2の場合：\n・1日目：生産380 - 需要200 = 繰越180\n・2日目：在庫180 - 需要180 = 繰越0\n・3日目：生産320 - 需要140 = 繰越180\n・4日目：在庫180 - 需要80 = 繰越100\n・5日目：在庫100 - 需要100 = 繰越0\n合計在庫量：180+0+180+100+0 = 460個。\n在庫保管費：460個×10円 = 4,600円。\nこれが最小となります。",
  },
  {
    id: 2,
    year: "平成28年 第3問",
    category: "生産管理方式",
    title: "プッシュ型管理とプル型管理",
    question: "プッシュ型管理方式とプル型管理方式に関する記述として、最も適切なものはどれか。",
    options: [
      "プッシュ型管理方式では、顧客の注文が起点となって順番に製造指示が発生するため、余分な工程間在庫を持つ必要がない。",
      "プッシュ型管理方式では、生産計画の変更は最終工程のみに指示すればよい。",
      "プル型管理方式では、管理部門が生産・在庫情報を集中的に把握する必要があり、大掛かりな情報システムなどの仕掛けが必要となる。",
      "プル型管理方式では、稼働率を維持するための作りだめなどができないため、過剰在庫が発生する可能性は少ない。"
    ],
    correctAnswer: 3,
    explanation: "プル型管理（後工程引取方式）は、後工程が使った分だけ前工程から引き取る「ジャストインタイム」の考え方です。注文（需要）を起点とするため、原則として作りだめが行われず、過剰在庫のリスクが低くなります。\n\n・ア：これはプル型の説明です。\n・イ：これもプル型の特徴（かんばん方式など）です。\n・ウ：これはプッシュ型（MRPなど）の説明です。",
  },
  {
    id: 3,
    year: "平成28年 第11問",
    category: "工数計画",
    title: "工数計画",
    question: "工数計画およびそれに対応した余力管理に関する記述として、最も不適切なものはどれか。",
    options: [
      "各職場・各作業者について手持仕事量と現有生産能力とを調査し、これらを比較対照したうえで手順計画によって再スケジュールをする。",
      "工数計画において、仕事量や生産能力を算定するためには、一般的に作業時間や作業量が用いられる。",
      "工数計画において求めた工程別の仕事量と日程計画で計画された納期までに完了する工程別の仕事量とを比較することを並行的に進めていき、生産能力の過不足の状況を把握する。",
      "余力がマイナスになった場合に、就業時間の延長、作業員の増員、外注の利用、機械・設備の増強などの対策をとる。"
    ],
    correctAnswer: 0,
    explanation: "最も不適切です。「手順計画」は作業の順序や方法を決めるものであり、スケジュール調整（日程の再計画）を行うのは「日程計画（大日程・中日程・小日程計画）」の役割です。能力と負荷の調整は余力管理を通じて行われ、必要に応じて日程計画を見直します。",
  },
  {
    id: 4,
    year: "平成30年 第6問",
    category: "PERT",
    title: "PERT 1",
    question: "下表に示される作業A～Fで構成されるプロジェクトについて、PERTを用いて日程管理をすることに関する記述として、最も適切なものを選べ。",
    tableData: {
      headers: ["作業", "作業日数", "先行作業"],
      rows: [
        ["A", "3", "なし"],
        ["B", "4", "なし"],
        ["C", "3", "A"],
        ["D", "2", "A"],
        ["E", "3", "B, C, D"],
        ["F", "3", "D"]
      ]
    },
    options: [
      "このプロジェクトのアローダイアグラムを作成するためには、ダミーが２本必要である。",
      "このプロジェクトの所要日数は８日である。",
      "このプロジェクトの所要日数を１日縮めるためには、作業Fを１日短縮すればよい。",
      "作業Eを最も早く始められるのは６日後である。"
    ],
    correctAnswer: 3,
    explanation: "クリティカルパスを計算すると、A(3) → C(3) → E(3) = 9日となります。\n\n・ア：CとDは共にAを先行とし、Eの先行となるため、並行作業の表現にダミーは1本で足ります（またはノード構成により0本で表現可能な場合もありますが、解説では「1本」として不適切としています）。\n・イ：所要日数は9日です。\n・ウ：Fはクリティカルパス上にないため、短縮しても全体日数は変わりません。\n・エ：作業Eの先行作業はB(4日終了), C(3+3=6日終了), D(3+2=5日終了)です。全て終わる必要があるため、最も早い開始は6日後となります（正解）。",
    diagramType: "PERT1"
  },
  {
    id: 5,
    year: "令和5年 第8問",
    category: "PERT",
    title: "PERT 2",
    question: "あるプロジェクトにおけるPERT図において、クリティカルパスは C(5) -> F(6) -> H(5) -> I(3) の合計19時間である（図省略、データより再現）。このプロジェクトに関する記述として、最も適切なものはどれか。\n\n前提：\nパス1: A(3)->D(5) => Node 4 (8h)\nパス2: B(4)->E(6) => Node 4 (10h)\nパス3: C(5)->F(6)->H(5) => Node 7 (16h) ... クリティカルパスの一部",
    options: [
      "作業Ｃの終了時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "作業Ｅの開始時刻が２時間早くなった場合、プロジェクトの完了時刻が２時間早くなる。",
      "作業Ｆの作業所要時間が１時間短くなった場合、プロジェクトの完了時刻は変わらない。",
      "作業Ｆの作業所要時間が２時間短くなった場合、クリティカルパスは変わらない。",
      "作業Ｈの作業所要時間が２時間長くなった場合、クリティカルパスは変わらない。"
    ],
    correctAnswer: 4,
    explanation: "現在のクリティカルパスは C→F→H→I (5+6+5+3 = 19時間) です。\n\n・ア：Cを2時間短縮すると、C→F→H→Iは17時間になりますが、別のパス（B→E→G→I = 4+6+5+3=18時間）が新たなクリティカルパスになるため、完了は1時間しか早まりません。\n・オ：Hはクリティカルパス上の作業です。これを2時間長くすると、総所要時間は21時間となり、依然として最長経路（クリティカルパス）のままです。",
  },
  {
    id: 6,
    year: "令和2年 第11問",
    category: "CPM",
    title: "CPM (Critical Path Method)",
    question: "以下の作業要件において、最短プロジェクト遂行期間となる条件を達成したときの最小費用として、最も適切なものを選べ（単位：万円）。\n\n標準状態：A(5), B(6), C(7), D(9), E(5)\n先行関係：BはA後, CはB後, DはA後, EはC,D後\n標準日数でのパス：\nA-B-C-E = 5+6+7+5 = 23日\nA-D-E = 5+9+5 = 19日\n\n最短所要期間(特急)：\nA(4), B(2), C(3), D(7), E(3)",
    tableData: {
      headers: ["作業", "標準期間", "最短期間", "短縮費用/日"],
      rows: [
        ["A", "5", "4", "10"],
        ["B", "6", "2", "50"],
        ["C", "7", "3", "90"],
        ["D", "9", "7", "30"],
        ["E", "5", "3", "40"]
      ]
    },
    options: ["440", "510", "530", "610", "710"],
    correctAnswer: 2,
    explanation: "1. 全作業を最短期間にした場合のクリティカルパスを求めます。\n   A(4)+D(7)+E(3) = 14日。\n   A(4)+B(2)+C(3)+E(3) = 12日。\n   よってプロジェクト最短日数は14日です。\n\n2. 目標14日を達成するために、標準日数から必要な短縮を行います。\n   ・パスA-D-E（標準19日→目標14日）：5日短縮必要。\n     A(1日短縮:10万), D(2日短縮:30万×2), E(2日短縮:40万×2)。\n     Aは1日しか縮まらない。DとEで残り4日。\n     コスト安順：A(10)→D(30)→E(40)。\n     Aを1日(5→4)、Dを2日(9→7)、Eを2日(5→3)。これでA-D-Eは14日。\n     コスト：10 + 60 + 80 = 150万円。\n\n   ・パスA-B-C-E（標準23日→目標14日）：9日短縮必要。\n     Eは既に2日短縮済み(3日)。Aも1日短縮済み(4日)。\n     残り短縮必要数 = 23 - (4+B+C+3) = 14  => B+C <= 7。\n     標準B(6)+C(7)=13。ここから6日分短縮が必要。\n     コスト安順：B(50) vs C(90)。Bを優先。\n     Bは最大4日短縮可能(6→2)。コスト50×4=200。\n     残り2日はCを短縮(7→5)。コスト90×2=180。\n     パス短縮コスト合計：200+180 = 380万円。\n\n3. 合計コスト = ベースの150 + 380 = 530万円。",
  },
  {
    id: 7,
    year: "令和元年 第9問",
    category: "スケジューリング",
    title: "ジョンソン法",
    question: "2工程のフローショップにおけるジョブの投入順序を考える。メイクスパンを最小にする順序を選べ。",
    tableData: {
      headers: ["ジョブ", "第1工程", "第2工程"],
      rows: [
        ["J1", "3時間", "2時間"],
        ["J2", "5時間", "4時間"],
        ["J3", "1時間", "6時間"]
      ]
    },
    options: ["J1→J2→J3", "J1→J3→J2", "J2→J1→J3", "J3→J2→J1"],
    correctAnswer: 3,
    explanation: "ジョンソン法のルール：\n1. 全作業時間の中で最小のものを見つける。\n   → J3の第1工程（1時間）が最小。\n2. それが第1工程なら「最初」に、第2工程なら「最後」に配置する。\n   → J3を最初に配置 (J3 → ...)。\n3. J3を除外して残りで最小を探す。\n   → J1の第2工程（2時間）が最小。\n   → 第2工程なので「最後」に配置 (... → J1)。\n4. 残ったJ2を真ん中に。\n\n結果：J3 → J2 → J1",
    diagramType: "Gantt"
  },
  {
    id: 8,
    year: "令和3年 第8問",
    category: "需要予測",
    title: "需要予測1",
    question: "需要量の時系列データを用いる需要予測法に関する記述として、最も適切なものはどれか。",
    options: [
      "移動平均法の予測精度は、個々の予測値の計算に用いるデータ数に依存しない。",
      "移動平均法では、期が進むにつれて個々の予測値の計算に用いるデータ数が増加する。",
      "指数平滑法では、過去の需要量にさかのぼるにつれて重みが指数的に減少する。",
      "指数平滑法では、過去の予測誤差とは独立に将来の需要量が予測される。"
    ],
    correctAnswer: 2,
    explanation: "・ウ（正解）：指数平滑法は、直近のデータに最大の重みを置き、過去に遡るほど指数関数的に重みを減らす加重平均の一種です。\n・ア：移動平均法の期間（n）によって平滑化の度合いが変わるため、精度はデータ数に依存します。\n・イ：移動平均は常に一定期間（例：直近3ヶ月）のデータを使うため、データ数は一定です。\n・エ：指数平滑法の式「次回予測 = 前回予測 + α(前回実績 - 前回予測)」の通り、過去の予測誤差（実績-予測）を反映します。",
  },
  {
    id: 9,
    year: "平成29年 第34問",
    category: "需要予測",
    title: "需要予測2",
    question: "需要予測に関する記述として、最も適切なものはどれか。",
    options: [
      "移動平均法は、過去の一定期間の実績値の平均に過去の変動要因を加えて予測する方法である。",
      "季節変動とは、3か月を周期とする変動である。",
      "指数平滑法は、当期の実績値と当期の予測値を加重平均して次期の予測値を算出する方法である。",
      "重回帰分析では、説明変数間の相関が高いほど良い数式（モデル）であると評価できる。"
    ],
    correctAnswer: 2,
    explanation: "・ウ（正解）：指数平滑法は、前回の予測値と今回の実績値を、平滑化定数αを用いて加重平均します。\n・ア：変動要因を加えるわけではなく、単純に平均化します。\n・イ：季節変動は通常「1年」周期です。\n・エ：説明変数間の相関が高いと「多重共線性」という問題が発生し、モデルの精度が不安定になります（悪い状態）。",
  },
  {
    id: 10,
    year: "平成27年 第9問",
    category: "需要予測",
    title: "指数平滑法 計算",
    question: "ある会社では、商品の需要予測に指数平滑法（平滑化定数α＝0.4）を用いている。当期の需要予測値75に対し、需要実績値は55であった。次期の需要予測値として、最も適切なものはどれか。",
    options: ["63", "65", "67", "69"],
    correctAnswer: 2,
    explanation: "計算式：\n次期予測値 ＝ 当期予測値 ＋ α × (当期実績値 － 当期予測値)\n\n＝ 75 ＋ 0.4 × (55 － 75)\n＝ 75 ＋ 0.4 × (－20)\n＝ 75 － 8\n＝ 67",
  },
  {
    id: 11,
    year: "平成30年 第14問",
    category: "現品管理",
    title: "現品管理 (JIS)",
    question: "JIS で定義される現品管理の活動として、最も不適切なものはどれか。",
    options: [
      "受け入れ外注品の品質と数量の把握",
      "仕掛品の適正な保管位置や保管方法の設定",
      "製品の適正な運搬荷姿や運搬方法の検討",
      "利用資材の発注方式の見直し"
    ],
    correctAnswer: 3,
    explanation: "現品管理とは、モノの運搬・移動・停滞・保管の状況を管理し、現品の数量・所在を確実に把握する活動です。\n・エ（正解）：発注方式の見直しは「在庫管理」や「調達管理」の範疇であり、現物そのものの管理（現品管理）とは異なります。",
  },
  {
    id: 12,
    year: "令和5年 第10問",
    category: "余力管理",
    title: "用語の定義",
    question: "工数管理や余力管理に関する以下の記述a～dと用語の組み合わせとして、適切なものを選べ。\n\na: 仕事量の全体を表す尺度で、仕事を1人の作業者で遂行するのに要する時間。\nb: 各工程または個々の作業者における、現在の作業負荷状態と現有作業能力の差。\nc: 作業習熟や改善活動、設計改良などによって作業時間を減らすこと。\nd: 作業の実施時期をずらすなどにより生産の負荷平準化を行うこと。",
    options: [
      "a:工数, b:作業余裕, c:工数低減, d:工程編成",
      "a:工数, b:余力, c:工数低減, d:工数の山積山崩",
      "a:工程能力, b:工程能力指数, c:工程分割, d:工数低減",
      "a:標準時間, b:作業余裕, c:工程分割, d:工数の山積山崩",
      "a:標準時間, b:余力, c:工数の山積山崩, d:工程編成"
    ],
    correctAnswer: 1,
    explanation: "・a (工数): 人×時間で表される仕事量。\n・b (余力): 能力 － 負荷。\n・c (工数低減): 改善による時間短縮。\n・d (工数の山積山崩): 山積（負荷の積み上げ）と山崩（平準化）による調整。",
  },
  {
    id: 13,
    year: "令和4年 第4問",
    category: "生産方式",
    title: "生産方式の特徴",
    question: "生産方式に関する記述の正誤の組み合わせとして、適切なものを選べ。\n\na: オーダエントリー方式は、生産工程にある半製品に顧客のオーダを引き当て、顧客が希望した仕様の製品として完成させる。\nb: 生産座席予約方式は、設備の稼働状況を基に、顧客のオーダを到着順に生産する方式である。\nc: モジュール生産方式は、あらかじめモジュール部品を複数用意し、受注後にそれらの組み合わせによって多品種の最終製品を生産する。\nd: 製番管理方式は、製品の組立を開始する時点で部品を引き当てる方式で、ロット生産にも利用可能で、特にロットサイズが大きい場合に適している。",
    options: [
      "a:正, b:正, c:誤, d:誤",
      "a:正, b:誤, c:正, d:誤",
      "a:正, b:誤, c:正, d:正",
      "a:誤, b:正, c:誤, d:正",
      "a:誤, b:誤, c:正, d:正"
    ],
    correctAnswer: 1,
    explanation: "・a (正): BTO（Build to Order）の一種で正しい記述です。\n・b (誤): 生産座席予約方式は、到着順ではなく、設備の空き枠（座席）にオーダーを割り当てて納期を確約する方式です。\n・c (正): モジュールの組み合わせで多様性を出す方式です。\n・d (誤): 製番管理は個別受注生産に適しており、共通部品をまとめて作る大ロット生産には不向き（管理が煩雑になるため）です。",
  },
  {
    id: 14,
    year: "平成30年 第11問",
    category: "トヨタ生産方式",
    title: "トヨタ生産方式",
    question: "トヨタ生産方式の特徴を表す用語として、最も適切なものの組み合わせを選べ。\n\na: MRP\nb: かんばん方式\nc: セル生産方式\nd: 製番管理方式\ne: あんどん方式",
    options: ["aとc", "aとd", "bとc", "bとe", "dとe"],
    correctAnswer: 3,
    explanation: "トヨタ生産方式（TPS）の2本柱は「ジャストインタイム」と「自働化」です。\n・b (かんばん): ジャストインタイムを実現する道具。\n・e (あんどん): 自働化（異常時に止めて知らせる）を実現する道具。\n\n一方、MRPはプッシュ型、製番管理は個別生産管理でありTPSとは異なります。",
  },
  {
    id: 15,
    year: "平成29年 第20問",
    category: "改善",
    title: "製造現場の改善",
    question: "生産現場で行われる改善施策に関する記述として、最も不適切なものはどれか。",
    options: [
      "機械設備の稼働状況を可視化するために、「あんどん」を設置した。",
      "「シングル段取」の実現を目指して、内段取の一部を外段取に変更した。",
      "品種変更に伴う段取り替えの回数を抑制するために、製品の流れを「1個流し」に変更した。",
      "部品の組み付け忘れを防止するために、部品の供給棚に「ポカヨケ」の改善を施した。"
    ],
    correctAnswer: 2,
    explanation: "・ウ（不適切）：1個流し生産は、仕掛品削減やリードタイム短縮のために行いますが、多品種を1個ずつ流すと段取り替え頻度は極大化します。段取り替えを抑制するためではなく、段取り替え時間を極小化（シングル段取など）した上で実施するものです。",
  }
];

// --- COMPONENTS ---

const App = () => {
  const [screen, setScreen] = useState('start'); // start, quiz, result, history
  const [mode, setMode] = useState('all'); // all, wrong, review
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reviewChecked, setReviewChecked] = useState(false);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sme_quiz_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
      setHistory([]);
    }
  }, []);

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem('sme_quiz_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [history]);

  const startQuiz = (selectedMode) => {
    setMode(selectedMode);
    console.log(`Starting quiz in mode: ${selectedMode}`);
    
    let filtered = [];
    if (selectedMode === 'all') {
      filtered = [...QUESTIONS];
    } else if (selectedMode === 'wrong') {
      const wrongIds = history.filter(h => h.isCorrect === false).map(h => h.id);
      filtered = QUESTIONS.filter(q => wrongIds.includes(q.id));
    } else if (selectedMode === 'review') {
      const reviewIds = history.filter(h => h.reviewNeeded).map(h => h.id);
      filtered = QUESTIONS.filter(q => reviewIds.includes(q.id));
    }

    if (filtered.length === 0) {
      alert("該当する問題がありません。");
      return;
    }

    setCurrentQuestions(filtered);
    setCurrentIndex(0);
    setScreen('quiz');
    resetQuestionState(filtered[0].id);
  };

  const resetQuestionState = (questionId) => {
    setSelectedOption(null);
    setShowExplanation(false);
    const hist = history.find(h => h.id === questionId);
    setReviewChecked(hist ? !!hist.reviewNeeded : false);
  };

  const handleAnswer = (optionIndex) => {
    setSelectedOption(optionIndex);
    setShowExplanation(true);
    
    const currentQ = currentQuestions[currentIndex];
    const isCorrect = optionIndex === currentQ.correctAnswer;
    
    // Update History
    setHistory(prev => {
      const newHist = [...prev];
      const existingIdx = newHist.findIndex(h => h.id === currentQ.id);
      const record = {
        id: currentQ.id,
        isCorrect: isCorrect,
        timestamp: new Date().toISOString(),
        reviewNeeded: reviewChecked // keep existing review flag initially
      };

      if (existingIdx >= 0) {
        // preserve review flag if not explicitly changed yet, but here we just update correctness
        record.reviewNeeded = newHist[existingIdx].reviewNeeded; 
        newHist[existingIdx] = record;
      } else {
        newHist.push(record);
      }
      return newHist;
    });
  };

  const toggleReview = () => {
    const newVal = !reviewChecked;
    setReviewChecked(newVal);
    const currentQ = currentQuestions[currentIndex];
    
    setHistory(prev => {
      return prev.map(h => h.id === currentQ.id ? { ...h, reviewNeeded: newVal } : h);
    });
  };

  const nextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      resetQuestionState(currentQuestions[nextIdx].id);
    } else {
      setScreen('start');
    }
  };

  // --- RENDERERS ---

  const renderTable = (tableData) => {
    if (!tableData) return null;
    return (
      <div className="overflow-x-auto my-4 border rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 font-bold">
            <tr>
              {tableData.headers.map((h, i) => (
                <th key={i} className="px-4 py-2 border-b border-gray-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, i) => (
              <tr key={i} className="even:bg-gray-50 hover:bg-blue-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 border-b border-gray-200">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Specialized visualization for Johnson's Rule (Gantt-like)
  const renderJohnsonGantt = () => (
    <div className="my-4 p-4 bg-white border rounded">
      <h4 className="font-bold mb-2">最適なスケジュール（J3→J2→J1）</h4>
      <div className="space-y-4 text-xs text-white text-center font-bold">
        {/* Machine 1 */}
        <div className="flex w-full">
          <div className="w-16 text-gray-700 flex items-center">第1工程</div>
          <div className="flex-1 flex border border-gray-300 h-8 bg-gray-100">
             <div className="bg-blue-500 flex items-center justify-center" style={{ width: '10%' }}>J3(1)</div>
             <div className="bg-blue-400 flex items-center justify-center" style={{ width: '50%' }}>J2(5)</div>
             <div className="bg-blue-300 flex items-center justify-center" style={{ width: '30%' }}>J1(3)</div>
          </div>
        </div>
        {/* Machine 2 (with idle time logic visualized simplified) */}
        <div className="flex w-full">
          <div className="w-16 text-gray-700 flex items-center">第2工程</div>
          <div className="flex-1 flex border border-gray-300 h-8 bg-gray-100 relative">
             {/* Idle time for J3 to finish M1 */}
             <div className="bg-transparent" style={{ width: '10%' }}></div>
             <div className="bg-indigo-600 flex items-center justify-center" style={{ width: '60%' }}>J3(6)</div>
             {/* J2 waits for M1 J2 to finish? M1 J2 finishes at 1+5=6. M2 J3 finishes at 1+6=7. No wait. */}
             <div className="bg-indigo-500 flex items-center justify-center" style={{ width: '40%' }}>J2(4)</div>
             <div className="bg-indigo-400 flex items-center justify-center" style={{ width: '20%' }}>J1(2)</div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">※長さはイメージです</p>
    </div>
  );

  const getStats = () => {
    const total = QUESTIONS.length;
    const answered = history.length;
    const correct = history.filter(h => h.isCorrect).length;
    const review = history.filter(h => h.reviewNeeded).length;
    return { total, answered, correct, review };
  };

  // --- SCREENS ---

  if (screen === 'start') {
    const stats = getStats();
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-gray-800 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">中小企業診断士 過去問演習</h1>
            <p className="text-gray-500">生産管理・運営管理 重点対策</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.answered}/{stats.total}</div>
              <div className="text-xs text-gray-600">回答済み</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-500">{stats.review}</div>
              <div className="text-xs text-gray-600">要復習</div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => startQuiz('all')}
              className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <span className="flex items-center gap-2"><BookOpen size={20}/> すべての問題を解く</span>
              <ChevronRight size={20}/>
            </button>
            <button 
              onClick={() => startQuiz('wrong')}
              className="w-full flex items-center justify-between p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              <span className="flex items-center gap-2"><RotateCcw size={20}/> 前回間違えた問題</span>
              <ChevronRight size={20}/>
            </button>
            <button 
              onClick={() => startQuiz('review')}
              className="w-full flex items-center justify-between p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <span className="flex items-center gap-2"><AlertCircle size={20}/> 要復習の問題のみ</span>
              <ChevronRight size={20}/>
            </button>
          </div>

          <button onClick={() => setScreen('history')} className="w-full text-center text-sm text-gray-500 hover:underline mt-4">
            学習履歴を確認する
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between bg-blue-600 text-white">
            <h2 className="text-lg font-bold">学習履歴</h2>
            <button onClick={() => setScreen('start')}><Home size={20}/></button>
          </div>
          <div className="divide-y max-h-[80vh] overflow-y-auto">
            {QUESTIONS.map(q => {
              const hist = history.find(h => h.id === q.id);
              return (
                <div key={q.id} className="p-4 flex items-start justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-700">{q.year}</span>
                      {hist?.reviewNeeded && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200">要復習</span>}
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{q.title}</p>
                  </div>
                  <div className="ml-4">
                    {hist ? (
                      hist.isCorrect ? 
                      <Check className="text-green-500" size={24}/> : 
                      <X className="text-red-500" size={24}/>
                    ) : (
                      <div className="text-gray-300 text-xs">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Screen
  const question = currentQuestions[currentIndex];
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <button onClick={() => setScreen('start')} className="flex items-center gap-1 hover:text-blue-600">
            <Home size={16}/> ホーム
          </button>
          <span>{currentIndex + 1} / {currentQuestions.length}</span>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap gap-2 mb-4">
             <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">{question.year}</span>
             <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{question.category}</span>
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-4">{question.title}</h2>
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
            {question.question}
          </p>

          {renderTable(question.tableData)}

          <div className="space-y-3 mt-6">
            {question.options.map((option, idx) => {
              let btnClass = "w-full p-4 rounded-lg text-left border-2 transition-all ";
              if (showExplanation) {
                if (idx === question.correctAnswer) btnClass += "border-green-500 bg-green-50 text-green-700";
                else if (idx === selectedOption) btnClass += "border-red-500 bg-red-50 text-red-700";
                else btnClass += "border-gray-200 opacity-50";
              } else {
                btnClass += "border-gray-200 hover:border-blue-400 hover:bg-blue-50";
              }

              return (
                <button 
                  key={idx} 
                  disabled={showExplanation}
                  onClick={() => handleAnswer(idx)}
                  className={btnClass}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-sm font-bold">
                      {["ア","イ","ウ","エ","オ"][idx]}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation Card */}
        {showExplanation && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-500 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {selectedOption === question.correctAnswer ? (
                  <span className="text-green-600 flex items-center gap-1"><Check/> 正解</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1"><X/> 不正解</span>
                )}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={reviewChecked} 
                  onChange={toggleReview}
                  className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                />
                <span className="text-sm font-bold text-gray-600">後で復習する</span>
              </label>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
              <span className="font-bold block mb-2 text-gray-900">【解説】</span>
              {question.explanation}
              {question.diagramType === 'Gantt' && renderJohnsonGantt()}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
              >
                {currentIndex < currentQuestions.length - 1 ? "次の問題へ" : "終了する"} <ChevronRight/>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;