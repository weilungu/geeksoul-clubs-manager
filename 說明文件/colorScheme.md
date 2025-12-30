# 《極客魂社團》線上表單系統  
## 網頁調色板設計（Red / Orange Theme）

---

## 一、整體設計定位（Color Strategy）

- 主色調：紅色 × 橘色  
- 設計目標：
  - 傳達技術熱情、行動力與可靠度
  - 適合長時間操作的行政與表單型 Web App
  - 符合學術專題展示的專業感
- 色彩使用原則：
  - 紅色：品牌與結構主軸
  - 橘色：互動與操作引導
  - 搭配大量中性色，避免視覺疲勞

---

## 二、主要調色板（Primary Palette｜建議採用）

### 1. 核心色（Brand / Primary Colors）

| 用途 | 色名 | HEX |
|----|----|----|
| 主色（Primary） | 深紅 | `#B71C1C` |
| 次主色（Secondary） | 暖橘 | `#F57C00` |
| 強調色（Accent） | 淺橘 | `#FFB74D` |

使用建議：
- 深紅：Header、系統標題、Logo
- 暖橘：主要操作按鈕、互動元件
- 淺橘：Hover、提示訊息、Icon 強調

---

### 2. 中性色（Neutral / Base Colors）

| 用途 | 色名 | HEX |
|----|----|----|
| 頁面背景 | 極淺灰 | `#FAFAFA` |
| 卡片／表單背景 | 白色 | `#FFFFFF` |
| 主要文字 | 深灰 | `#212121` |
| 次要文字 | 中灰 | `#616161` |
| 分隔線／邊框 | 淺灰 | `#E0E0E0` |

---

### 3. 系統狀態色（System Feedback Colors）

| 狀態 | 色名 | HEX | 使用情境 |
|----|----|----|----|
| 成功 | 綠 | `#2E7D32` | 報名成功 |
| 警告 | 橘紅 | `#EF6C00` | 名額即將額滿 |
| 錯誤 | 紅 | `#D32F2F` | 額滿、報名失敗 |

---

## 三、UI 元件配色建議

### Header / Navbar
- 背景：`#B71C1C`
- 文字：`#FFFFFF`
- Hover / Active：`#F57C00`

---

### 主要操作按鈕（Primary Button）
- 背景：`#F57C00`
- 文字：`#FFFFFF`
- Hover：`#EF6C00`
- Disabled：`#FFCC80`

---

### 次要按鈕（Secondary Button）
- 邊框：`#F57C00`
- 文字：`#F57C00`
- Hover 背景：`#FFF3E0`

---

### 表單欄位（Form Input）
- 邊框：`#E0E0E0`
- Focus：`#F57C00`
- 錯誤提示：`#D32F2F`

---

### 報名結果頁（Result Feedback）
- 成功提示：`#2E7D32`
- 額滿提示：`#EF6C00`
- 錯誤訊息：`#D32F2F`

---

## 四、備用方案（偏科技感 Red / Orange）

> 適用於後台或管理介面

| 用途 | HEX |
|----|----|
| 主紅 | `#C62828` |
| 橘 | `#FB8C00` |
| 深灰背景 | `#1E1E1E` |
| 文字 | `#FAFAFA` |

---

## 五、CSS 色彩變數範例

```css
:root {
  --color-primary: #B71C1C;
  --color-secondary: #F57C00;
  --color-accent: #FFB74D;

  --color-bg: #FAFAFA;
  --color-card: #FFFFFF;

  --color-text-main: #212121;
  --color-text-secondary: #616161;

  --color-success: #2E7D32;
  --color-warning: #EF6C00;
  --color-error: #D32F2F;
}
