// 获取windmill-top元素
const windmillTop = document.querySelector(".windmill-top");
const wallpaper = document.querySelector(".wallpaper");
const appGridsContainer = document.querySelector(".app-grids-container");
const paginationDots = document.querySelector(".pagination-dots");

// 记录当前旋转角度
let currentRotation = 0;
let isAnimating = false;

// 网站数据和当前页面索引
let sitesData = [];
let currentPageIndex = 0;

// 设置元素旋转角度的函数 - 修改为保留两位小数
function setRotation(element, degrees) {
  // 保留两位小数，避免角度突变
  const roundedDegrees = parseFloat(degrees.toFixed(2));
  element.style.transform = `rotate(${roundedDegrees}deg)`;
}

// 加载数据
async function loadData() {
  try {
    const response = await fetch("../data.json");
    const data = await response.json();
    sitesData = data.data.site.sites;
    
    // 初始化分页点
    initPagination();
    
    // 初始化所有页面
    initAllPages();
    
    // 渲染第一页
    renderPage(0);
  } catch (error) {
    console.error("加载数据失败:", error);
  }
}

// 初始化分页点
function initPagination() {
  // 清空现有的分页点
  paginationDots.innerHTML = "";
  
  // 为每一页创建一个分页点
  sitesData.forEach((_, index) => {
    const dot = document.createElement("span");
    dot.classList.add("dot");
    if (index === 0) dot.classList.add("active");
    
    // 点击分页点切换页面
    dot.addEventListener("click", () => {
      if (!isAnimating) {
        renderPage(index);
      }
    });
    
    paginationDots.appendChild(dot);
  });
}

// 初始化所有页面
function initAllPages() {
  // 清空容器
  appGridsContainer.innerHTML = "";
  
  // 为每一页创建一个app-grid-wrap
  sitesData.forEach((pageSites, pageIndex) => {
    const gridWrap = document.createElement("div");
    gridWrap.classList.add("app-grid-wrap");
    gridWrap.dataset.pageIndex = pageIndex;
    
    const grid = document.createElement("div");
    grid.classList.add("app-grid");
    
    // 渲染当前页的网站
    pageSites.forEach(site => {
      const appItem = document.createElement("div");
      appItem.classList.add("app-item");
      
      const appIcon = document.createElement("div");
      appIcon.classList.add("app-icon");
      
      // 根据网站的bgType设置图标样式
      if (site.bgType === "image" && site.bgImage) {
        appIcon.style.backgroundImage = `url(${site.bgImage})`;
      } else if (site.bgType === "color") {
        appIcon.style.backgroundColor = site.bgColor || "transparent";
        appIcon.textContent = site.bgText || "";
      }
      
      // 添加特殊类名（如果有）
      if (site.name === "Gmail") {
        appIcon.classList.add("gmail-icon");
      } else if (site.name.includes("小程序")) {
        appIcon.classList.add("wechat-icon");
      } else if (site.name.includes("热榜")) {
        appIcon.classList.add("hot-icon");
      } else if (site.name === "Epic Games") {
        appIcon.classList.add("epic-icon");
      }
      
      const span = document.createElement("span");
      span.textContent = site.name;
      
      // 添加点击事件，跳转到目标网站
      appItem.addEventListener("click", () => {
        window.location.href = site.target;
      });
      
      appItem.appendChild(appIcon);
      appItem.appendChild(span);
      grid.appendChild(appItem);
    });
    
    gridWrap.appendChild(grid);
    appGridsContainer.appendChild(gridWrap);
  });
}

// 渲染指定页面
function renderPage(pageIndex) {
  // 确保页面索引有效
  if (pageIndex < 0 || pageIndex >= sitesData.length) return;
  
  // 更新当前页面索引
  currentPageIndex = pageIndex;
  
  // 使用transform平移到指定页面
  appGridsContainer.style.transform = `translateX(-${pageIndex * 100}%)`;
  
  // 更新分页点状态
  updatePaginationDots();
}

// 带循环效果的页面渲染
function renderPageWithWrap(targetIndex, isForward) {
  isAnimating = true;
  const totalPages = sitesData.length;
  
  // 临时创建克隆页面用于循环动画
  const cloneWrap = document.createElement('div');
  cloneWrap.classList.add('app-grid-wrap');
  cloneWrap.innerHTML = appGridsContainer.children[isForward ? 0 : totalPages - 1].innerHTML;
  
  if (isForward) {
    // 向前循环：在末尾添加第一页的克隆
    appGridsContainer.appendChild(cloneWrap);
    // 先移动到克隆页面
    appGridsContainer.style.transform = `translateX(-${totalPages * 100}%)`;
  } else {
    // 向后循环：在开头添加最后一页的克隆
    appGridsContainer.insertBefore(cloneWrap, appGridsContainer.firstChild);
    // 立即调整容器位置，考虑到新增的克隆页面
    appGridsContainer.style.transition = 'none';
    // 由于在开头添加了一个页面，所以当前页面的位置需要+1
    appGridsContainer.style.transform = `translateX(-${(currentPageIndex + 1) * 100}%)`;
    // 强制重绘
    appGridsContainer.offsetHeight;
    // 恢复动画
    appGridsContainer.style.transition = 'transform 350ms ease-in-out';
    // 执行动画，移动到克隆页面（最后一页的克隆，在容器的第一个位置）
    appGridsContainer.style.transform = `translateX(0%)`;
  }
  // 动画完成后移除克隆页面并调整位置
  setTimeout(() => {
    // 移除过渡效果
    appGridsContainer.style.transition = 'none';
    // 移除克隆页面
    appGridsContainer.removeChild(cloneWrap);
    // 调整到正确的位置（最后一页）
    appGridsContainer.style.transform = `translateX(-${targetIndex * 100}%)`;
    // 强制重绘
    appGridsContainer.offsetHeight;
    // 恢复动画效果
    appGridsContainer.style.transition = 'transform 350ms ease-in-out';
    
    // 更新当前页面索引和分页点
    currentPageIndex = targetIndex;
    updatePaginationDots();
    isAnimating = false;
  }, 350);
}

// 更新分页点状态
function updatePaginationDots() {
  const dots = paginationDots.querySelectorAll(".dot");
  dots.forEach((dot, index) => {
    if (index === currentPageIndex) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

// 导航到指定页面
function navigateToPage(pageIndex) {
  // 如果正在动画中，不执行新的导航
  if (isAnimating) return;
  
  const totalPages = sitesData.length;
  let targetIndex = pageIndex;
  
  // 处理边界情况
  if (pageIndex < 0) {
    targetIndex = totalPages - 1;
  } else if (pageIndex >= totalPages) {
    targetIndex = 0;
  }
  
  // 检查是否需要循环动画
  const isWrappingForward = currentPageIndex === totalPages - 1 && targetIndex === 0;
  const isWrappingBackward = currentPageIndex === 0 && targetIndex === totalPages - 1;
  
  if (isWrappingForward || isWrappingBackward) {
    // 使用循环动画
    renderPageWithWrap(targetIndex, isWrappingForward);
  } else {
    // 使用普通动画
    renderPage(targetIndex);
  }
}

// 添加鼠标滚轮事件监听
document.addEventListener("wheel", (event) => {
  // 防止过快滚动
  if (isAnimating) return;
  
  // 如果搜索建议列表显示，则不处理页面切换
  if (searchSuggestions.classList.contains("active")) return;
  
  // 根据滚动方向切换页面
  if (event.deltaY > 0 || event.deltaX > 0) {
    // 向下或向右滚动，切换到下一页
    navigateToPage(currentPageIndex + 1);
  } else {
    // 向上或向左滚动，切换到上一页
    navigateToPage(currentPageIndex - 1);
  }
  
  // 设置一个短暂的延迟，防止连续滚动
  setTimeout(() => {
    if (!isAnimating) {
      isAnimating = false;
    }
  }, 500);
});

windmillTop.addEventListener("click", async () => {
  // 如果已经在动画中，不执行新的动画
  if (isAnimating) return;

  let finalRotationForThisClick; // 在事件处理函数作用域内声明

  try {
    isAnimating = true;
    const startTime = performance.now();
    const initialSpeed = 360; // 初始速度（度/秒）
    const deceleration = 120; // 减速率（度/秒²）
    const minRotation = 1080; // 最小旋转角度（3圈 3 * 360）

    // 计算动画总时长（基于物理减速公式）
    const duration = (initialSpeed / deceleration) * 1000;
    // 计算总旋转角度（匀减速运动）
    const totalRotation = (initialSpeed * duration) / 1000 / 2;

    // 确保至少旋转minRotation度
    const actualRotation = Math.max(totalRotation, minRotation);
    
    // 创建一个变量跟踪上一帧的角度，用于平滑过渡
    let lastAngle = currentRotation;

    // 创建一个Promise来处理动画
    const animationPromise = new Promise((resolve) => {
      function animate(currentTime) {
        const elapsed = currentTime - startTime;

        if (elapsed >= duration) {
          // 动画结束，更新最终角度 - 保留小数点后两位
          currentRotation = parseFloat((currentRotation + actualRotation).toFixed(2));
          finalRotationForThisClick = currentRotation;
          setRotation(windmillTop, currentRotation);
          resolve();
          return;
        }

        // 使用三次贝塞尔曲线模拟更平滑的减速效果
        const t = elapsed / duration;
        // 使用更平滑的缓动函数 - cubic-bezier
        const progress = 1 - Math.pow(1 - t, 3); // cubic ease-out

        // 计算当前旋转角度 - 保留小数点后两位
        const currentAngle = currentRotation + (progress * actualRotation);
        
        // 确保角度变化平滑，避免突变
        if (Math.abs(currentAngle - lastAngle) < 30) { // 防止角度突变
          setRotation(windmillTop, currentAngle);
          lastAngle = currentAngle;
        }

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });

    // 等待动画完成
    await animationPromise;

    // 保存当前的旋转角度，避免在异步操作中丢失
    // 这里不需要重新赋值，因为在动画结束时已经设置了finalRotationForThisClick
    // 但保留这行代码以确保兼容性
    finalRotationForThisClick = currentRotation;

    // 发起请求获取壁纸
    const timestamp = Date.now();
    const response = await fetch(
      `https://infinity-api.infinitynewtab.com/random-wallpaper?_=${timestamp}`
    );
    const data = await response.json();

    if (data.success && data.data && data.data[0]) {
      const rawSrc = data.data[0].src.rawSrc;
      const wallpaperUrl = `${rawSrc}?imageView2/2/w/2880/format/webp/interlace/1`;

      // 创建一个新的Image对象预加载图片
      const img = new Image();
      img.onload = () => {
        // 图片加载完成后更新背景
        wallpaper.style.backgroundImage = `url(${wallpaperUrl})`;
        // 再次确认使用保存的旋转角度 (以防万一)
        setRotation(windmillTop, finalRotationForThisClick);
      };
      img.onerror = () => {
        console.error("Wallpaper failed to load.");
        // 确保即使出错也保持旋转角度
        setRotation(windmillTop, finalRotationForThisClick);
      };
      img.src = wallpaperUrl;
    } else {
      // 即使没有壁纸数据，也要确保 isAnimating 状态被重置
      setRotation(windmillTop, finalRotationForThisClick); // 确保角度正确
    }
  } catch (error) {
    console.error("获取壁纸或动画处理失败:", error);
    // 确保即使出错也保持旋转角度 (如果 finalRotationForThisClick 已被赋值)
    if (typeof finalRotationForThisClick !== 'undefined') {
        setRotation(windmillTop, finalRotationForThisClick);
    } else {
        // 如果在 finalRotationForThisClick 赋值前出错，则使用当前的 currentRotation
        setRotation(windmillTop, currentRotation);
    }
  } finally {
    isAnimating = false; // 确保 isAnimating 总是被重置
  }
});

const navTypes = document.querySelectorAll(".nav-type");

navTypes.forEach(type => {
  type.addEventListener("click", () => {
    navTypes.forEach(t => t.classList.add("active"));
    type.classList.add("active");
  });
});

// 搜索建议功能
const searchInput = document.querySelector('.search-bar input');
const searchSuggestions = document.querySelector('.search-suggestions');

// 监听输入事件
searchInput.addEventListener('input', debounce(handleInputChange, 300));

// 监听焦点事件
searchInput.addEventListener('focus', () => {
  if (searchInput.value.trim()) {
    showSuggestions();
  }
});

searchInput.addEventListener('blur', () => {
  // 使用延时，以便能够点击建议项
  setTimeout(() => {
    hideSuggestions();
  }, 200);
});

// 防抖函数
function debounce(func, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 处理输入变化
async function handleInputChange() {
  const query = searchInput.value.trim();
  
  if (!query) {
    hideSuggestions();
    return;
  }
  
  try {
    const suggestions = await fetchSuggestions(query);
    renderSuggestions(suggestions);
    showSuggestions();
  } catch (error) {
    console.error('获取搜索建议失败:', error);
  }
}

// 获取搜索建议
async function fetchSuggestions(query) {
  // 对查询进行编码
  const encodedQuery = encodeURIComponent(query);
  const url = `https://suggestion.baidu.com/su?p=3&ie=UTF-8&cb=&wd=${encodedQuery}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // 解析返回的数据
    // 格式: ({q:"天",p:false,s:["天气预报","天蝎座",...]})
    // 或者 window.baidu.sug({q:"天",p:false,s:["天气预报","天蝎座",...]})
    // 正则表达式提取括号内的内容
    const match = text.match(/\((.*)\)/);
    if (match && match[1]) {
      const objectLiteralString = match[1]; // 这就是你例子中的 jsonStr，例如 '{q:"t",p:false,s:[]}'

      // objectLiteralString 不是一个有效的 JSON 字符串，因为键名没有用双引号。
      // 但它是一个有效的 JavaScript 对象字面量。
      // 使用 new Function 将其转换为对象。
      // 这比 eval() 更安全，因为它在受限的作用域中执行。
      const data = (new Function('return ' + objectLiteralString))();

      return data.s || [];
    }
    // 如果没有匹配到括号，可能需要检查返回的 text 格式是否变化
    console.warn("Baidu suggestion response format might have changed or was unexpected:", text);
    return [];
  } catch (error) {
    console.error('获取搜索建议出错:', error);
    // 可以在这里打印 text 和 objectLiteralString (如果存在) 以便调试
    // console.error('Original text:', text);
    // if (typeof objectLiteralString !== 'undefined') {
    //   console.error('Extracted objectLiteralString:', objectLiteralString);
    // }
    return [];
  }
}

// 渲染搜索建议
function renderSuggestions(suggestions) {
  searchSuggestions.innerHTML = '';
  
  suggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.classList.add('suggestion-item');
    item.textContent = suggestion;
    
    // 点击建议项填充到输入框
    item.addEventListener('click', () => {
      searchInput.value = suggestion;
      hideSuggestions();
      // 可以在这里添加搜索跳转逻辑
    });
    
    searchSuggestions.appendChild(item);
  });
}

// 显示建议列表
function showSuggestions() {
  searchSuggestions.classList.add('active');
}

// 隐藏建议列表
function hideSuggestions() {
  searchSuggestions.classList.remove('active');
}

// 页面加载完成后初始化数据
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});