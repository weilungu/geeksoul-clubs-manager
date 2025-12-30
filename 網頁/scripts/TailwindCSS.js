// TailwindCSS CDN Loader
// 此腳本動態載入 TailwindCSS，讓所有網頁具備響應式設計能力

(function() {
  // 創建 Tailwind CSS CDN script 標籤
  const tailwindScript = document.createElement('script');
  tailwindScript.src = 'https://cdn.tailwindcss.com';
  
  // 配置 Tailwind（可自訂設定）
  tailwindScript.onload = function() {
    // Tailwind 配置
    if (typeof tailwind !== 'undefined') {
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#B71C1C',
              secondary: '#F57C00',
              accent: '#FFB74D',
              success: '#2E7D32',
              warning: '#EF6C00',
              error: '#D32F2F',
            },
            fontFamily: {
              sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Microsoft JhengHei', 'sans-serif'],
            }
          }
        },
        // 避免與現有 CSS 衝突
        corePlugins: {
          preflight: false,
        }
      };
    }
    console.log('TailwindCSS 已成功載入');
  };

  tailwindScript.onerror = function() {
    console.error('TailwindCSS 載入失敗');
  };

  // 插入到 head 標籤中
  document.head.appendChild(tailwindScript);
})();
