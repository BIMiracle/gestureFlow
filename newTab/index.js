// 动态加载Google API库
function loadGoogleAPI() {
  return new Promise((resolve, reject) => {
    if (typeof gapi !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API'));
    document.head.appendChild(script);
  });
}

(function () {
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
      pageSites.forEach((site) => {
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
        if (site.name === "Gmail" || site.target === "infinity://gmail" || site.target === "https://mail.google.com/mail/u/0") {
          appIcon.classList.add("gmail-icon");
          // 添加Gmail未读邮件数显示
          const notificationBadge = document.createElement("div");
          notificationBadge.classList.add("notification-badge");
          notificationBadge.style.display = "none"; // 默认隐藏
          appIcon.appendChild(notificationBadge);
          
          // 获取Gmail未读邮件数
          fetchGmailUnreadCount(notificationBadge);
        } else if (site.name.includes("小程序")) {
          appIcon.classList.add("wechat-icon");
        } else if (site.name.includes("热榜")) {
          appIcon.classList.add("hot-icon");
        } else if (site.name === "Epic Games") {
          appIcon.classList.add("epic-icon");
        }

        // 创建删除按钮
        const deleteBtn = document.createElement("div");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.style.display = "none";

        // 创建编辑按钮
        const editBtn = document.createElement("div");
        editBtn.classList.add("edit-btn");
        editBtn.innerHTML = `<img draggable="false" class="edit-icon" alt="" src="../images/edit.png">`;
        editBtn.style.display = "none";

        const span = document.createElement("span");
        span.textContent = site.name;

        // 添加点击事件，跳转到目标网站
        appIcon.addEventListener("click", (e) => {
          if (!appIcon.classList.contains("editing")) {
            window.location.href = site.target;
          }
        });

        // 添加右键事件，进入编辑模式
        appIcon.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          enterEditMode(appIcon, deleteBtn, editBtn);
        });

        // 删除按钮点击事件
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`确定要删除 ${site.name} 吗？`)) {
            appItem.remove();
          }
        });

        // 编辑按钮点击事件
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          alert("编辑功能待实现");
        });

        // 将按钮添加到appIcon中
        appIcon.appendChild(deleteBtn);
        appIcon.appendChild(editBtn);

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
    const cloneWrap = document.createElement("div");
    cloneWrap.classList.add("app-grid-wrap");
    cloneWrap.innerHTML =
      appGridsContainer.children[isForward ? 0 : totalPages - 1].innerHTML;

    if (isForward) {
      // 向前循环：在末尾添加第一页的克隆
      appGridsContainer.appendChild(cloneWrap);
      // 先移动到克隆页面
      appGridsContainer.style.transform = `translateX(-${totalPages * 100}%)`;
    } else {
      // 向后循环：在开头添加最后一页的克隆
      appGridsContainer.insertBefore(cloneWrap, appGridsContainer.firstChild);
      // 立即调整容器位置，考虑到新增的克隆页面
      appGridsContainer.style.transition = "none";
      // 由于在开头添加了一个页面，所以当前页面的位置需要+1
      appGridsContainer.style.transform = `translateX(-${
        (currentPageIndex + 1) * 100
      }%)`;
      // 强制重绘
      appGridsContainer.offsetHeight;
      // 恢复动画
      appGridsContainer.style.transition =
        "transform 350ms ease-in-out, margin-left 350ms ease-in-out";
      // 执行动画，移动到克隆页面（最后一页的克隆，在容器的第一个位置）
      appGridsContainer.style.transform = `translateX(0%)`;
    }
    // 动画完成后移除克隆页面并调整位置
    setTimeout(() => {
      // 移除过渡效果
      appGridsContainer.style.transition = "none";
      // 移除克隆页面
      appGridsContainer.removeChild(cloneWrap);
      // 调整到正确的位置（最后一页）
      appGridsContainer.style.transform = `translateX(-${targetIndex * 100}%)`;
      // 强制重绘
      appGridsContainer.offsetHeight;
      // 恢复动画效果
      appGridsContainer.style.transition =
        "transform 350ms ease-in-out, margin-left 350ms ease-in-out";

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
    const isWrappingForward =
      currentPageIndex === totalPages - 1 && targetIndex === 0;
    const isWrappingBackward =
      currentPageIndex === 0 && targetIndex === totalPages - 1;

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
    if (searchSuggestionsWrap.classList.contains("active")) return;

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
            currentRotation = parseFloat(
              (currentRotation + actualRotation).toFixed(2)
            );
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
          const currentAngle = currentRotation + progress * actualRotation;

          // 确保角度变化平滑，避免突变
          if (Math.abs(currentAngle - lastAngle) < 30) {
            // 防止角度突变
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
      if (typeof finalRotationForThisClick !== "undefined") {
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

  navTypes.forEach((type) => {
    type.addEventListener("click", () => {
      if (type.innerHTML === "地图") {
        location.href = "https://map.baidu.com/";
      } else {
        navTypes.forEach((t) => t.classList.remove("active"));
        type.classList.add("active");
      }
    });
  });

  // 搜索建议功能
  const searchInput = document.querySelector(".search-bar input");
  let selectedSuggestionIndex = -1; // 当前选中的建议索引，-1表示没有选中
  let originalInputValue = ""; // 保存原始输入内容
  let currentSuggestions = []; // 保存当前的建议列表

  // 监听输入事件
  searchInput.addEventListener("input", debounce(handleInputChange, 300));

  searchInput.addEventListener("keydown", function (event) {
    // 如果建议列表显示，处理键盘导航
    if (
      searchSuggestionsWrap.classList.contains("active") &&
      currentSuggestions.length > 0
    ) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (selectedSuggestionIndex < currentSuggestions.length - 1) {
          selectedSuggestionIndex++;
          updateSelectedSuggestion();
        } else {
          // 在最后一个建议时按下键，回到原始输入
          selectedSuggestionIndex = -1;
          searchInput.value = originalInputValue;
          updateSelectedSuggestion();
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (selectedSuggestionIndex > 0) {
          selectedSuggestionIndex--;
          updateSelectedSuggestion();
        } else if (selectedSuggestionIndex === 0) {
          // 在第一个建议时按上键，回到原始输入
          selectedSuggestionIndex = -1;
          searchInput.value = originalInputValue;
          updateSelectedSuggestion();
        } else {
          // 当前没有选中任何建议，选中最后一个
          selectedSuggestionIndex = currentSuggestions.length - 1;
          updateSelectedSuggestion();
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          // 有选中的建议，直接跳转
          const selectedSuggestion =
            currentSuggestions[selectedSuggestionIndex];
          hideSuggestions();
          location.href = `https://www.baidu.com/s?wd=${encodeURIComponent(
            selectedSuggestion
          )}`;
          return;
        }
        // 没有选中建议，使用当前输入框的值
        const value = searchInput.value.trim();
        if (!value) return;

        const activeNavElement = document.querySelector(".nav-type.active");
        if (activeNavElement) {
          const activeNavType = activeNavElement.textContent.trim();
          if (activeNavType === "网页") {
            location.href = `https://www.baidu.com/s?wd=${encodeURIComponent(
              value
            )}`;
          } else if (activeNavType === "图片") {
            location.href = `https://image.baidu.com/search/index?word=${encodeURIComponent(
              value
            )}`;
          }
        }
      } else if (event.key === "Escape") {
        // ESC键隐藏建议列表
        event.preventDefault();
        hideSuggestions();
        selectedSuggestionIndex = -1;
      }
    } else {
      // 建议列表未显示时的回车处理
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
        const value = searchInput.value.trim();
        if (!value) return;

        const activeNavElement = document.querySelector(".nav-type.active");
        if (activeNavElement) {
          const activeNavType = activeNavElement.textContent.trim();
          if (activeNavType === "网页") {
            location.href = `https://www.baidu.com/s?wd=${encodeURIComponent(
              value
            )}`;
          } else if (activeNavType === "图片") {
            location.href = `https://image.baidu.com/search/index?word=${encodeURIComponent(
              value
            )}`;
          }
        }
      }
    }
  });

  // 监听焦点事件
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      if (searchSuggestions.innerHTML) {
        showSuggestions();
      } else {
        handleInputChange();
      }
    }
  });

  searchInput.addEventListener("blur", () => {
    // 使用延时，以便能够点击建议项
    setTimeout(() => {
      hideSuggestions();
    }, 200);
  });

  // 防抖函数
  function debounce(func, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // 处理输入变化
  async function handleInputChange() {
    const query = searchInput.value.trim();
    originalInputValue = query; // 保存原始输入内容
    selectedSuggestionIndex = -1; // 重置选中索引

    if (!query) {
      hideSuggestions();
      currentSuggestions = [];
      return;
    }

    try {
      const suggestions = await fetchSuggestions(query);
      currentSuggestions = suggestions || [];
      renderSuggestions(currentSuggestions);
      if (currentSuggestions.length) {
        showSuggestions();
      } else {
        hideSuggestions();
      }
    } catch (error) {
      console.error("获取搜索建议失败:", error);
      currentSuggestions = [];
    }
  }

  // 获取搜索建议
  async function fetchSuggestions(query) {
    // 对查询进行编码
    const encodedQuery = encodeURIComponent(query);
    let url = `https://suggestion.baidu.com/su?p=3&ie=UTF-8&cb=&wd=${encodedQuery}`;

    const activeNavElement = document.querySelector(".nav-type.active");
    if (activeNavElement) {
      const activeNavType = activeNavElement.textContent.trim();
      console.log(activeNavType);

      if (activeNavType === "网页") {
        url = `https://www.baidu.com/sugrec?json=1&prod=pc&from=pc_web&wd=${encodedQuery}`;
      } else if (activeNavType === "图片") {
        url = `https://www.baidu.com/sugrec?prod=open_image&from=pc_web&wd=${encodedQuery}`;
      }
      try {
        const response = await fetch(url);
        // 检查响应是否成功
        if (!response.ok) {
          throw new Error(`HTTP 错误! 状态: ${response.status}`);
        }

        // 将响应体解析为JSON
        const data = await response.json();

        if (activeNavType === "地图") {
          return data.s;
        } else {
          const suggestions = data.g;
          return suggestions.map((s) => s.q);
        }
      } catch (error) {
        console.error("获取搜索建议出错:", error);
        return [];
      }
    }
  }

  const searchSuggestionsWrap = document.querySelector(
    ".search-suggestions-wrap"
  );
  const searchSuggestions = document.querySelector(".search-suggestions");

  // 渲染搜索建议
  function renderSuggestions(suggestions) {
    searchSuggestions.innerHTML = "";

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement("div");
      item.classList.add("suggestion-item");
      item.textContent = suggestion;
      item.dataset.index = index;

      // 点击建议项填充到输入框
      item.addEventListener("click", () => {
        searchInput.value = suggestion;
        hideSuggestions();
        location.href = `https://www.baidu.com/s?wd=${encodeURIComponent(
          suggestion
        )}`;
      });

      searchSuggestions.appendChild(item);
    });
  }

  // 更新选中的建议项
  function updateSelectedSuggestion() {
    const items = searchSuggestions.querySelectorAll(".suggestion-item");
    items.forEach((item, index) => {
      if (index === selectedSuggestionIndex) {
        item.classList.add("selected");
        // 更新输入框内容为选中的建议
        if (selectedSuggestionIndex >= 0) {
          searchInput.value = currentSuggestions[selectedSuggestionIndex];
        }
      } else {
        item.classList.remove("selected");
      }
    });
  }

  // 显示建议列表
  function showSuggestions() {
    searchSuggestionsWrap.classList.add("active");
  }

  // 隐藏建议列表
  function hideSuggestions() {
    searchSuggestionsWrap.classList.remove("active");
    selectedSuggestionIndex = -1;
  }

  // 进入编辑模式
  function enterEditMode(appIcon, deleteBtn, editBtn) {
    // 先退出所有其他编辑模式
    exitAllEditModes();

    // 让所有appIcon都进入编辑模式
    const allAppIcons = document.querySelectorAll(".app-icon");
    allAppIcons.forEach((icon) => {
      icon.classList.add("editing");
      const iconDeleteBtn = icon.querySelector(".delete-btn");
      const iconEditBtn = icon.querySelector(".edit-btn");
      if (iconDeleteBtn) iconDeleteBtn.style.display = "block";
      if (iconEditBtn) iconEditBtn.style.display = "block";
    });
  }

  // 退出所有编辑模式
  function exitAllEditModes() {
    const editingIcons = document.querySelectorAll(".app-icon.editing");
    editingIcons.forEach((icon) => {
      icon.classList.remove("editing");
      const deleteBtn = icon.querySelector(".delete-btn");
      const editBtn = icon.querySelector(".edit-btn");
      if (deleteBtn) deleteBtn.style.display = "none";
      if (editBtn) editBtn.style.display = "none";
    });
  }

  // 添加全局点击事件监听器，点击其他区域退出编辑模式
  document.addEventListener("click", (e) => {
    // 如果点击的不是app-icon或其子元素，则退出编辑模式
    if (!e.target.closest(".app-icon")) {
      exitAllEditModes();
    }
  });

  // 添加全局右键事件监听器，点击其他区域退出编辑模式
  document.addEventListener("contextmenu", (e) => {
    // 如果右键点击的不是app-icon，则退出编辑模式
    if (!e.target.closest(".app-icon")) {
      exitAllEditModes();
    }
  });

  // 弹窗控制逻辑
  const menuIcon = document.querySelector(".menu-icon");
  const modalOverlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const addBtn = document.getElementById("addBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const addPanel = document.getElementById("addPanel");
  const settingsPanel = document.getElementById("settingsPanel");
  const mainActions = document.querySelector(".main-actions");

  // 打开弹窗
  function openModal() {
    modalOverlay.classList.add("show");
    // 让app-grids-container向左移动，使app-item能完全显示
    appGridsContainer.style.marginLeft = "-20vmin";
    // 重置到主界面
    showMainActions();
  }

  // 关闭弹窗
  function closeModal() {
    modalOverlay.classList.remove("show");
    // 复原app-grids-container的位置
    appGridsContainer.style.marginLeft = "0";
  }

  // 显示主要功能按钮
  function showMainActions() {
    // 默认选中设置功能
    showSettingsPanel();
  }

  // 显示设置面板
  function showSettingsPanel() {
    mainActions.style.display = "flex";
    settingsPanel.style.display = "block";
    addPanel.style.display = "none";
    setActiveTab("settings");
  }

  // 设置活跃标签
  function setActiveTab(tabName) {
    // 移除所有active类
    addBtn.classList.remove("active");
    settingsBtn.classList.remove("active");

    // 添加对应的active类
    if (tabName === "add") {
      addBtn.classList.add("active");
    } else if (tabName === "settings") {
      settingsBtn.classList.add("active");
    }
  }

  // menu-icon点击事件
  menuIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    openModal();
  });

  // 关闭按钮点击事件
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeModal();
  });

  // 添加按钮点击事件
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showAddPanel();
  });

  // 显示添加面板
  function showAddPanel() {
    mainActions.style.display = "flex";
    settingsPanel.style.display = "none";
    addPanel.style.display = "block";
    setActiveTab("add");

    // 初始化添加面板内容
    initAddPanel();
  }

  // 初始化添加面板
  function initAddPanel() {
    // 显示添加表单，隐藏图标选择
    const addForm = document.getElementById("addForm");
    const iconSelection = document.getElementById("iconSelection");
    addForm.style.display = "block";
    iconSelection.style.display = "none";

    // 复原表单
    document.getElementById("siteUrl").value = "https://";
    document.getElementById("siteName").value = "";
    document.getElementById("urlError").style.display = "none";
    document.getElementById("nameError").style.display = "none";

    // 绑定输入框事件
    const siteUrlInput = document.getElementById("siteUrl");
    const siteNameInput = document.getElementById("siteName");
    const urlError = document.getElementById("urlError");
    const nameError = document.getElementById("nameError");

    // 移除之前的事件监听器（如果存在）
    siteUrlInput.removeEventListener("blur", validateUrl);
    siteUrlInput.removeEventListener("input", clearUrlError);
    siteNameInput.removeEventListener("blur", validateName);
    siteNameInput.removeEventListener("input", clearNameError);

    // 网站地址输入框失焦验证
    function validateUrl() {
      const value = siteUrlInput.value.trim();
      if (!value) {
        urlError.textContent = "请输入网站地址";
        urlError.style.display = "inline";
      } else {
        try {
          new URL(value);
          urlError.style.display = "none";
        } catch (e) {
          urlError.textContent = "请输入有效的网站地址";
          urlError.style.display = "inline";
        }
      }
    }

    // 网站地址输入框输入时清除错误并尝试获取网站信息
    function clearUrlError() {
      if (siteUrlInput.value.trim()) {
        urlError.style.display = "none";
        // 使用防抖函数处理输入变化
        debouncedFetchSiteInfo(siteUrlInput.value.trim());
      }
    }

    // 防抖处理网站信息获取
    const debouncedFetchSiteInfo = debounce(fetchSiteInfo, 800);

    // 获取网站信息
    async function fetchSiteInfo(url) {
      // 确保URL格式正确
      try {
        // 尝试创建URL对象验证格式
        const urlObj = new URL(url);

        // 显示加载指示器
        const loadingIndicator = document.createElement("span");
        loadingIndicator.textContent = " 正在获取网站信息...";
        loadingIndicator.style.color = "#666";
        loadingIndicator.style.fontSize = "12px";
        loadingIndicator.id = "loadingIndicator";

        // 移除之前的加载指示器（如果存在）
        const existingIndicator = document.getElementById("loadingIndicator");
        if (existingIndicator) {
          existingIndicator.remove();
        }

        // 添加新的加载指示器
        const urlLabel = document.querySelector('label[for="siteUrl"]');
        urlLabel.appendChild(loadingIndicator);

        try {
          // 尝试使用fetch API获取网站信息
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

          const response = await fetch(`${url}`, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // 获取标题
            const title = doc.title;

            if (title) {
              siteNameInput.value = title;
              validateName();
            }

            // 获取图标
            const faviconLink = doc.querySelector(
              'link[rel="icon"], link[rel="shortcut icon"]'
            );
            if (faviconLink && faviconLink.href) {
              const faviconUrl = new URL(faviconLink.href, url).href;
              console.log("找到网站图标:", faviconUrl);
              // 保存图标URL
              window.siteIconUrl = faviconUrl;

              // 如果选择了自动图标，更新预览
              updateAutoIconPreview(faviconUrl);
            } else {
              // 尝试默认图标路径
              const defaultIconUrl = new URL("/favicon.ico", url).href;
              try {
                const iconResponse = await fetch(defaultIconUrl, {
                  method: "HEAD",
                });
                if (iconResponse.ok) {
                  console.log("找到默认网站图标:", defaultIconUrl);
                  window.siteIconUrl = defaultIconUrl;
                  updateAutoIconPreview(defaultIconUrl);
                }
              } catch (e) {
                console.log("无法获取默认图标");
              }
            }

            loadingIndicator.textContent = " 获取成功";
            loadingIndicator.style.color = "green";
            setTimeout(() => loadingIndicator.remove(), 2000);
          } else {
            throw new Error("请求失败");
          }
        } catch (e) {
          console.log("使用fetch获取网站信息失败:", e.message);
          loadingIndicator.textContent = " 获取失败";
          loadingIndicator.style.color = "red";
          setTimeout(() => loadingIndicator.remove(), 2000);

          // 备用方法：使用iframe（可能受跨域限制）
          tryFetchWithIframe(url);
        }
      } catch (e) {
        // URL格式不正确，不执行请求
        console.log("URL格式不正确");
        const existingIndicator = document.getElementById("loadingIndicator");
        if (existingIndicator) {
          existingIndicator.remove();
        }
      }
    }

    // 更新自动图标预览
    function updateAutoIconPreview(iconUrl) {
      const autoIconPreview = document.querySelector(
        '.icon-option[data-type="auto"] .icon-preview'
      );
      if (autoIconPreview) {
        // 保存原始内容
        if (!autoIconPreview.dataset.originalContent) {
          autoIconPreview.dataset.originalContent = autoIconPreview.innerHTML;
        }

        // 清空内容并设置背景图片
        autoIconPreview.innerHTML = "";
        autoIconPreview.style.backgroundImage = `url(${iconUrl})`;
        autoIconPreview.style.backgroundSize = "contain";
        autoIconPreview.style.backgroundPosition = "center";
        autoIconPreview.style.backgroundRepeat = "no-repeat";
      }
    }

    // 备用方法：使用iframe尝试获取
    function tryFetchWithIframe(url) {
      // 创建一个隐藏的iframe来加载网页
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      // 设置超时
      const timeoutId = setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000); // 5秒超时

      // 加载事件
      iframe.onload = () => {
        clearTimeout(timeoutId);

        try {
          // 尝试获取网站标题
          const title = iframe.contentDocument.title;
          if (title && siteNameInput.value.trim() === "") {
            siteNameInput.value = title;
          }

          // 尝试获取网站图标
          const favicon = iframe.contentDocument.querySelector(
            'link[rel="icon"], link[rel="shortcut icon"]'
          );
          if (favicon) {
            const faviconUrl = new URL(favicon.href, url).href;
            console.log("通过iframe找到网站图标:", faviconUrl);
            window.siteIconUrl = faviconUrl;
            updateAutoIconPreview(faviconUrl);
          }
        } catch (e) {
          console.log("无法访问iframe内容，可能是跨域限制");
        } finally {
          document.body.removeChild(iframe);
        }
      };

      iframe.onerror = () => {
        clearTimeout(timeoutId);
        document.body.removeChild(iframe);
      };

      iframe.src = url;
    }

    // 网站名称输入框失焦验证
    function validateName() {
      const value = siteNameInput.value.trim();
      if (!value) {
        nameError.textContent = "请输入网站名称";
        nameError.style.display = "inline";
      } else {
        nameError.style.display = "none";
      }
    }

    // 网站名称输入框输入时清除错误
    function clearNameError() {
      if (siteNameInput.value.trim()) {
        nameError.style.display = "none";
      }
    }

    // 绑定事件监听器
    siteUrlInput.addEventListener("blur", validateUrl);
    siteUrlInput.addEventListener("input", clearUrlError);
    siteNameInput.addEventListener("blur", validateName);
    siteNameInput.addEventListener("input", clearNameError);

    // 绑定下一步按钮事件
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.removeEventListener("click", showIconSelection);
    nextBtn.addEventListener("click", showIconSelection);
  }

  // 显示图标选择界面
  function showIconSelection() {
    const siteUrl = document.getElementById("siteUrl").value.trim();
    const siteName = document.getElementById("siteName").value.trim();
    const urlError = document.getElementById("urlError");
    const nameError = document.getElementById("nameError");

    let hasError = false;

    // 验证网站地址
    if (!siteUrl) {
      urlError.textContent = "请输入网站地址";
      urlError.style.display = "inline";
      hasError = true;
    } else {
      try {
        new URL(siteUrl);
        urlError.style.display = "none";
      } catch (e) {
        urlError.textContent = "请输入有效的网站地址";
        urlError.style.display = "inline";
        hasError = true;
      }
    }

    // 验证网站名称
    if (!siteName) {
      nameError.textContent = "请输入网站名称";
      nameError.style.display = "inline";
      hasError = true;
    } else {
      nameError.style.display = "none";
    }

    // 如果有错误，不继续执行
    if (hasError) {
      return;
    }

    // 隐藏添加表单，显示图标选择
    const addForm = document.getElementById("addForm");
    const iconSelection = document.getElementById("iconSelection");
    addForm.style.display = "none";
    iconSelection.style.display = "block";

    // 更新文字图标预览
    const textIconPreview = document.getElementById("textIconPreview");
    textIconPreview.textContent = siteName.charAt(0);

    // 重置选择状态
    const iconOptions = document.querySelectorAll(".icon-option");
    iconOptions.forEach((opt) => opt.classList.remove("selected"));
    const iconConfig = document.getElementById("iconConfig");
    iconConfig.style.display = "none";
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;

    // 绑定返回按钮事件
    const backBtn = document.getElementById("backToForm");
    backBtn.removeEventListener("click", backToFormHandler);

    function backToFormHandler() {
      // 显示添加表单，隐藏图标选择
      addForm.style.display = "block";
      iconSelection.style.display = "none";
      // 内容会保留，因为没有清空
    }

    backBtn.addEventListener("click", backToFormHandler);

    // 绑定图标选项事件
    let selectedIconType = null;
    let iconData = {};

    // 移除之前的事件监听器
    iconOptions.forEach((option) => {
      option.removeEventListener("click", option.iconClickHandler);
    });

    iconOptions.forEach((option) => {
      function iconClickHandler() {
        // 移除其他选项的选中状态
        iconOptions.forEach((opt) => opt.classList.remove("selected"));
        // 添加当前选项的选中状态
        option.classList.add("selected");

        selectedIconType = option.dataset.type;
        showIconConfig(selectedIconType, siteName, iconConfig);
        saveBtn.disabled = false;
      }

      option.iconClickHandler = iconClickHandler;
      option.addEventListener("click", iconClickHandler);
    });

    // 绑定保存按钮事件
    saveBtn.removeEventListener("click", saveBtn.saveClickHandler);

    function saveClickHandler() {
      if (selectedIconType) {
        saveNewSite(siteUrl, siteName, selectedIconType, iconData);
      }
    }

    saveBtn.saveClickHandler = saveClickHandler;
    saveBtn.addEventListener("click", saveClickHandler);
  }

  // 显示图标配置选项
  function showIconConfig(iconType, siteName, configContainer) {
    configContainer.style.display = "block";

    switch (iconType) {
      case "auto":
        configContainer.innerHTML = "<p>将自动获取网站图标</p>";
        break;
      case "text":
        configContainer.innerHTML = `
          <div class="config-group">
            <label>显示文字</label>
            <input type="text" id="iconText" value="${siteName.charAt(
              0
            )}" maxlength="2">
          </div>
          <div class="config-group">
            <label>背景颜色</label>
            <input type="color" id="iconBgColor" value="#4285f4">
          </div>
        `;
        break;
      case "color":
        configContainer.innerHTML = `
          <div class="config-group">
            <label>背景颜色</label>
            <input type="color" id="iconBgColor" value="#4285f4">
          </div>
        `;
        break;
      case "upload":
        configContainer.innerHTML = `
          <div class="config-group">
            <label>选择图片</label>
            <input type="file" id="iconFile" accept="image/*">
          </div>
        `;
        break;
    }
  }

  // 保存新网站
  function saveNewSite(url, name, iconType, iconData) {
    // 这里可以实现保存逻辑
    // 暂时只是显示成功消息
    alert(`网站添加成功！\n地址：${url}\n名称：${name}\n图标类型：${iconType}`);
    closeModal();
  }

  // 设置按钮点击事件
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showSettingsPanel();
  });

  // 点击遮罩层关闭弹窗
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // 模式选择功能
  const modeOptions = document.querySelectorAll(".mode-option");
  const standardSettings = document.getElementById("standardSettings");

  modeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // 移除所有active类
      modeOptions.forEach((opt) => opt.classList.remove("active"));
      // 添加active类到当前选项
      option.classList.add("active");

      const mode = option.dataset.mode;
      if (mode === "standard") {
        standardSettings.style.display = "block";
      } else {
        standardSettings.style.display = "none";
      }
    });
  });

  // 壁纸设置功能
  const changeWallpaperBtn = document.getElementById("changeWallpaperBtn");
  const wallpaperPreview = document.getElementById("wallpaperPreview");

  changeWallpaperBtn.addEventListener("click", async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `https://infinity-api.infinitynewtab.com/random-wallpaper?_=${timestamp}`
      );
      const data = await response.json();

      if (data.success && data.data && data.data[0]) {
        const rawSrc = data.data[0].src.rawSrc;
        const wallpaperUrl = `${rawSrc}?imageView2/2/w/2880/format/webp/interlace/1`;

        // 更新预览图
        wallpaperPreview.src = wallpaperUrl;
        // 更新背景壁纸
        wallpaper.style.backgroundImage = `url(${wallpaperUrl})`;
      }
    } catch (error) {
      console.error("获取壁纸失败:", error);
      alert("获取壁纸失败，请稍后重试");
    }
  });

  // 遮罩浓度滑块
  const maskOpacitySlider = document.getElementById("maskOpacitySlider");
  const maskOpacityValue = maskOpacitySlider.nextElementSibling;
  const wallpaperMask = document.querySelector(".wallpaper-mask");

  maskOpacitySlider.addEventListener("input", (e) => {
    const value = e.target.value;
    const percentage = (value / e.target.max) * 100;
    maskOpacityValue.textContent = `${value}%`;
    wallpaperMask.style.backgroundColor = `rgba(0, 0, 0, ${value / 100})`;
    // 更新进度显示
    e.target.style.setProperty("--progress", `${percentage}%`);
  });

  // 模糊度滑块
  const blurSlider = document.getElementById("blurSlider");
  const blurValue = blurSlider.nextElementSibling;

  blurSlider.addEventListener("input", (e) => {
    const value = e.target.value;
    const percentage = parseInt(value);
    const progressPercentage = (value / e.target.max) * 100;
    blurValue.textContent = `${percentage}%`;

    // 设置CSS变量来控制模糊度，将百分比转换为像素值
    const blurPixels = (percentage / 100) * 20; // 最大20px模糊
    document.documentElement.style.setProperty(
      "--wallpaper-filter",
      `${blurPixels}px`
    );
    // 更新进度显示
    e.target.style.setProperty("--progress", `${progressPercentage}%`);
  });

  // 初始化CSS变量和进度显示
  const initialBlurPixels = (10 / 100) * 20; // 初始值10%对应2px
  document.documentElement.style.setProperty(
    "--wallpaper-filter",
    `${initialBlurPixels}px`
  );

  // 初始化slider进度显示
  const initSliderProgress = (slider) => {
    const value = slider.value;
    const max = slider.max;
    const percentage = (value / max) * 100;
    slider.style.setProperty("--progress", `${percentage}%`);
  };

  initSliderProgress(maskOpacitySlider);
  initSliderProgress(blurSlider);

  // Gmail API配置管理函数
  function loadGmailApiConfig() {
    const clientId = localStorage.getItem('gmailClientId') || '';
    const apiKey = localStorage.getItem('gmailApiKey') || '';
    
    document.getElementById('gmailClientId').value = clientId;
    document.getElementById('gmailApiKey').value = apiKey;
    
    updateGmailApiStatus('info', '请配置Gmail API凭据以获取真实邮件数量');
  }
  
  function saveGmailApiConfig() {
    const clientId = document.getElementById('gmailClientId').value.trim();
    const apiKey = document.getElementById('gmailApiKey').value.trim();
    
    if (clientId) {
      localStorage.setItem('gmailClientId', clientId);
    }
    if (apiKey) {
      localStorage.setItem('gmailApiKey', apiKey);
    }
    
    return { clientId, apiKey };
  }
  
  function updateGmailApiStatus(type, message) {
    const statusElement = document.getElementById('gmailApiStatus');
    if (statusElement) {
      statusElement.className = `gmail-api-status ${type}`;
      statusElement.textContent = message;
    }
  }
  
  async function authorizeGmailApi() {
    const config = saveGmailApiConfig();
    
    if (!config.clientId) {
      updateGmailApiStatus('error', '请输入客户端ID');
      return;
    }
    
    updateGmailApiStatus('info', '正在加载Google API库...');
    
    try {
      // 动态加载Google API库
      await loadGoogleAPI();
      
      updateGmailApiStatus('info', '正在初始化Gmail API授权...');
      
      // 初始化Gmail API
      gapi.load('auth2', function() {
        gapi.auth2.init({
          client_id: config.clientId
        }).then(function() {
          const authInstance = gapi.auth2.getAuthInstance();
          return authInstance.signIn({
            scope: 'https://www.googleapis.com/auth/gmail.readonly'
          });
        }).then(function(user) {
          const authResponse = user.getAuthResponse();
          localStorage.setItem('gmailAccessToken', authResponse.access_token);
          localStorage.setItem('gmailRefreshToken', authResponse.refresh_token || '');
          localStorage.setItem('gmailTokenExpiry', (Date.now() + authResponse.expires_in * 1000).toString());
          
          updateGmailApiStatus('success', 'Gmail API授权成功！');
          
          // 重新初始化Gmail API实例
          if (window.gmailAPI) {
            window.gmailAPI = new GmailAPI();
          }
        }).catch(function(error) {
          console.error('Gmail授权失败:', error);
          updateGmailApiStatus('error', '授权失败: ' + (error.error || error.message || '未知错误'));
        });
      });
    } catch (error) {
      console.error('加载Google API库失败:', error);
      updateGmailApiStatus('error', 'Google API库加载失败，请检查网络连接');
    }
  }
  
  function testGmailConnection() {
    const config = saveGmailApiConfig();
    
    if (!config.clientId || !config.apiKey) {
      updateGmailApiStatus('error', '请先配置客户端ID和API密钥');
      return;
    }
    
    const accessToken = localStorage.getItem('gmailAccessToken');
    if (!accessToken) {
      updateGmailApiStatus('error', '请先进行Gmail授权');
      return;
    }
    
    updateGmailApiStatus('info', '正在测试Gmail连接...');
    
    // 测试API连接
    fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => {
      if (response.ok) {
        updateGmailApiStatus('success', 'Gmail连接测试成功！');
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    })
    .then(data => {
      console.log('Gmail API测试响应:', data);
    })
    .catch(error => {
      console.error('Gmail连接测试失败:', error);
      updateGmailApiStatus('error', '连接测试失败: ' + error.message);
    });
  }

  // Gmail API集成类
  class GmailAPI {
    constructor() {
      this.clientId = localStorage.getItem('gmailClientId') || '';
      this.apiKey = localStorage.getItem('gmailApiKey') || '';
      this.accessToken = localStorage.getItem('gmailAccessToken') || '';
      this.refreshToken = localStorage.getItem('gmailRefreshToken') || '';
      this.tokenExpiry = localStorage.getItem('gmailTokenExpiry') || 0;
    }
    
    // 检查是否已配置API
    isConfigured() {
      return this.clientId && this.apiKey;
    }
    
    // 检查访问令牌是否有效
    isTokenValid() {
      return this.accessToken && Date.now() < this.tokenExpiry;
    }
    
    // 刷新访问令牌
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('没有刷新令牌');
      }
      
      try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            refresh_token: this.refreshToken,
            grant_type: 'refresh_token'
          })
        });
        
        if (!response.ok) {
          throw new Error('刷新令牌失败');
        }
        
        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        
        // 保存到localStorage
        localStorage.setItem('gmailAccessToken', this.accessToken);
        localStorage.setItem('gmailTokenExpiry', this.tokenExpiry);
        
        return this.accessToken;
      } catch (error) {
        console.error('刷新访问令牌失败:', error);
        throw error;
      }
    }
    
    // 获取有效的访问令牌
    async getValidAccessToken() {
      if (this.isTokenValid()) {
        return this.accessToken;
      }
      
      if (this.refreshToken) {
        return await this.refreshAccessToken();
      }
      
      throw new Error('需要重新授权');
    }
    
    // 获取未读邮件数
    async getUnreadCount() {
      try {
        const accessToken = await this.getValidAccessToken();
        
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('获取邮件失败');
        }
        
        const data = await response.json();
        return data.resultSizeEstimate || 0;
      } catch (error) {
        console.error('获取Gmail未读邮件数失败:', error);
        // 回退到localStorage中的模拟数据
        return localStorage.getItem('gmailUnreadCount') || 0;
      }
    }
    
    // 启动OAuth授权流程
    async authorize() {
      if (!this.isConfigured()) {
        throw new Error('请先配置Gmail API客户端ID和API密钥');
      }
      
      const scope = 'https://www.googleapis.com/auth/gmail.readonly';
      const redirectUri = chrome.identity ? chrome.identity.getRedirectURL() : window.location.origin;
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      // 在Chrome扩展环境中使用chrome.identity API
      if (chrome.identity) {
        return new Promise((resolve, reject) => {
          chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
          }, (responseUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            const url = new URL(responseUrl);
            const code = url.searchParams.get('code');
            
            if (code) {
              this.exchangeCodeForTokens(code, redirectUri)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error('授权失败'));
            }
          });
        });
      } else {
        // 在普通网页环境中打开新窗口
        window.open(authUrl, 'gmail-auth', 'width=500,height=600');
        throw new Error('请在弹出窗口中完成授权，然后手动输入授权码');
      }
    }
    
    // 交换授权码获取令牌
    async exchangeCodeForTokens(code, redirectUri) {
      try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        });
        
        if (!response.ok) {
          throw new Error('交换令牌失败');
        }
        
        const data = await response.json();
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        
        // 保存到localStorage
        localStorage.setItem('gmailAccessToken', this.accessToken);
        localStorage.setItem('gmailRefreshToken', this.refreshToken);
        localStorage.setItem('gmailTokenExpiry', this.tokenExpiry);
        
        return data;
      } catch (error) {
        console.error('交换令牌失败:', error);
        throw error;
      }
    }
  }
  
  // 创建Gmail API实例
  const gmailAPI = new GmailAPI();
  
  // 获取Gmail未读邮件数
  async function fetchGmailUnreadCount(badgeElement) {
    try {
      let unreadCount;
      
      // 如果配置了Gmail API，尝试获取真实数据
      if (gmailAPI.isConfigured() && gmailAPI.accessToken) {
        unreadCount = await gmailAPI.getUnreadCount();
        // 更新localStorage中的缓存
        localStorage.setItem('gmailUnreadCount', unreadCount);
      } else {
        // 使用localStorage中的模拟数据
        unreadCount = localStorage.getItem('gmailUnreadCount') || 0;
      }
      
      updateGmailBadge(badgeElement, unreadCount);
    } catch (error) {
      console.error('获取Gmail未读邮件数失败:', error);
      // 回退到localStorage中的数据
      const unreadCount = localStorage.getItem('gmailUnreadCount') || 0;
      updateGmailBadge(badgeElement, unreadCount);
    }
    
    // 定期更新未读邮件数（每5分钟）
    setInterval(async () => {
      try {
        let newCount;
        
        if (gmailAPI.isConfigured() && gmailAPI.accessToken) {
          newCount = await gmailAPI.getUnreadCount();
          localStorage.setItem('gmailUnreadCount', newCount);
        } else {
          newCount = localStorage.getItem('gmailUnreadCount') || 0;
        }
        
        updateGmailBadge(badgeElement, newCount);
      } catch (error) {
        console.error('定期更新Gmail未读邮件数失败:', error);
      }
    }, 300000); // 5分钟
  }
  
  // 更新Gmail徽章显示
  function updateGmailBadge(badgeElement, count) {
    if (count > 0) {
      badgeElement.textContent = count > 99 ? '99+' : count;
      badgeElement.style.display = 'flex';
    } else {
      badgeElement.style.display = 'none';
    }
  }
  
  // 设置Gmail未读邮件数（用于测试）
  function setGmailUnreadCount(count) {
    localStorage.setItem('gmailUnreadCount', count);
    // 更新所有Gmail图标的徽章
    document.querySelectorAll('.notification-badge').forEach(badge => {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }
  
  // 暴露到全局作用域用于测试
  window.setGmailUnreadCount = setGmailUnreadCount;

  // 导出配置功能
  function exportConfig() {
    try {
      // 获取localStorage中的所有数据
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      
      // 去除空格和回车，转换为紧凑的JSON字符串
      const jsonString = JSON.stringify(data).replace(/\s+/g, '');
      
      // 生成文件名
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const filename = `gestureFlowBackup-${year}-${month}-${day}.json`;
      
      // 创建下载链接
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('配置导出成功:', filename);
    } catch (error) {
      console.error('导出配置失败:', error);
      alert('导出失败，请重试');
    }
  }

  // Github同步功能
  class GithubSync {
    constructor() {
      this.apiBase = 'https://api.github.com';
    }
    
    // 上传文件到Github
    async uploadToGithub(username, repo, branch, token, filename, content) {
      try {
        const url = `${this.apiBase}/repos/${username}/${repo}/contents/${filename}`;
        
        // 检查文件是否已存在
        let sha = null;
        try {
          const existingFile = await fetch(url, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          if (existingFile.ok) {
            const fileData = await existingFile.json();
            sha = fileData.sha;
          }
        } catch (e) {
          // 文件不存在，继续创建
        }
        
        // 上传文件
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Update backup ${filename}`,
            content: btoa(unescape(encodeURIComponent(content))), // Base64编码
            branch: branch,
            ...(sha && { sha }) // 如果文件存在，包含sha
          })
        });
        
        if (!response.ok) {
          throw new Error(`Github API错误: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('上传到Github失败:', error);
        throw error;
      }
    }
    
    // 从Github下载文件
    async downloadFromGithub(username, repo, branch, token, filename) {
      try {
        const url = `${this.apiBase}/repos/${username}/${repo}/contents/${filename}?ref=${branch}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Github API错误: ${response.status}`);
        }
        
        const fileData = await response.json();
        const content = decodeURIComponent(escape(atob(fileData.content)));
        
        return JSON.parse(content);
      } catch (error) {
        console.error('从Github下载失败:', error);
        throw error;
      }
    }
    
    // 获取仓库中的所有备份文件
    async getBackupFiles(username, repo, branch, token) {
      try {
        const url = `${this.apiBase}/repos/${username}/${repo}/contents?ref=${branch}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Github API错误: ${response.status}`);
        }
        
        const files = await response.json();
        return files.filter(file => 
          file.name.startsWith('gestureFlowBackup-') && file.name.endsWith('.json')
        ).sort((a, b) => b.name.localeCompare(a.name)); // 按日期降序排列
      } catch (error) {
        console.error('获取备份文件列表失败:', error);
        throw error;
      }
    }
  }

  const githubSync = new GithubSync();

  // 导入配置功能
  function importConfig(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          
          // 清空当前localStorage
          localStorage.clear();
          
          // 恢复数据
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
          
          console.log('配置导入成功');
          resolve();
        } catch (error) {
          console.error('导入配置失败:', error);
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // 事件监听器
  document.addEventListener('DOMContentLoaded', function() {
    // 模式切换逻辑
    const modeOptions = document.querySelectorAll('.mode-option');
    const standardSettings = document.getElementById('standardSettings');
    const minimalSettings = document.getElementById('minimalSettings');
    
    modeOptions.forEach(option => {
      option.addEventListener('click', function() {
        const mode = this.dataset.mode;
        
        // 更新激活状态
        modeOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // 切换设置面板
        if (mode === 'standard') {
          standardSettings.style.display = 'block';
          minimalSettings.style.display = 'none';
        } else {
          standardSettings.style.display = 'none';
          minimalSettings.style.display = 'block';
        }
      });
    });
    
    // 导出数据事件（标准模式和极简模式）
    const exportItems = ['exportDataItem', 'exportDataItemMinimal'];
    exportItems.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', exportConfig);
      }
    });
    
    // 导入数据事件（标准模式和极简模式）
    const importItems = ['importDataItem', 'importDataItemMinimal'];
    const importFileInput = document.getElementById('importFileInput');
    
    importItems.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', function() {
          importFileInput.click();
        });
      }
    });
    
    // 文件导入处理
    if (importFileInput) {
      importFileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
          try {
            await importConfig(file);
            alert('导入成功！页面将刷新以应用新配置。');
            location.reload();
          } catch (error) {
            alert('导入失败：' + error.message);
          }
          // 清空文件输入
          this.value = '';
        }
      });
    }
    
    // Github同步事件（标准模式和极简模式）
    const githubSyncItems = ['githubSyncItem', 'githubSyncItemMinimal'];
    const githubSyncModal = document.getElementById('githubSyncModal');
    const closeGithubModal = document.getElementById('closeGithubModal');
    
    githubSyncItems.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', function() {
          githubSyncModal.style.display = 'flex';
        });
      }
    });
    
    // 关闭Github同步模态框
    if (closeGithubModal) {
      closeGithubModal.addEventListener('click', function() {
        githubSyncModal.style.display = 'none';
      });
    }
    
    // 点击模态框背景关闭
    if (githubSyncModal) {
      githubSyncModal.addEventListener('click', function(e) {
        if (e.target === githubSyncModal) {
          githubSyncModal.style.display = 'none';
        }
      });
    }
    
    // Gmail API配置事件监听器
    const gmailApiConfigItems = ['gmailApiConfigMinimal'];
    const gmailApiModal = document.getElementById('gmailApiModal');
    const closeGmailApiModal = document.getElementById('closeGmailApiModal');
    
    gmailApiConfigItems.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', function() {
          gmailApiModal.style.display = 'flex';
          loadGmailApiConfig();
        });
      }
    });
    
    // 关闭Gmail API配置模态框
    if (closeGmailApiModal) {
      closeGmailApiModal.addEventListener('click', function() {
        gmailApiModal.style.display = 'none';
      });
    }
    
    // 点击Gmail API模态框背景关闭
    if (gmailApiModal) {
      gmailApiModal.addEventListener('click', function(e) {
        if (e.target === gmailApiModal) {
          gmailApiModal.style.display = 'none';
        }
      });
    }
    
    // Gmail API授权按钮
    const authorizeGmail = document.getElementById('authorizeGmail');
    if (authorizeGmail) {
      authorizeGmail.addEventListener('click', function() {
        authorizeGmailApi();
      });
    }
    
    // Gmail API测试连接按钮
    const testGmailConnectionBtn = document.getElementById('testGmailConnection');
    if (testGmailConnectionBtn) {
      testGmailConnectionBtn.addEventListener('click', function() {
        testGmailConnection();
      });
    }
    
    // 上传到Github
    const uploadToGithub = document.getElementById('uploadToGithub');
    if (uploadToGithub) {
      uploadToGithub.addEventListener('click', async function() {
        const username = document.getElementById('githubUsername').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();
        const branch = document.getElementById('githubBranch').value.trim() || 'main';
        const token = document.getElementById('githubToken').value.trim();
        
        if (!username || !repo || !token) {
          alert('请填写完整的Github配置信息');
          return;
        }
        
        try {
          // 生成备份数据
          const data = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
          }
          
          const jsonString = JSON.stringify(data).replace(/\s+/g, '');
          
          // 生成文件名
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const filename = `gestureFlowBackup-${year}-${month}-${day}.json`;
          
          uploadToGithub.textContent = '上传中...';
          uploadToGithub.disabled = true;
          
          await githubSync.uploadToGithub(username, repo, branch, token, filename, jsonString);
          
          alert('上传到Github成功！');
          githubSyncModal.style.display = 'none';
        } catch (error) {
          alert(`上传失败: ${error.message}`);
        } finally {
          uploadToGithub.textContent = '上传到Github';
          uploadToGithub.disabled = false;
        }
      });
    }
    
    // 从Github下载
    const downloadFromGithub = document.getElementById('downloadFromGithub');
    if (downloadFromGithub) {
      downloadFromGithub.addEventListener('click', async function() {
        const username = document.getElementById('githubUsername').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();
        const branch = document.getElementById('githubBranch').value.trim() || 'main';
        const token = document.getElementById('githubToken').value.trim();
        
        if (!username || !repo || !token) {
          alert('请填写完整的Github配置信息');
          return;
        }
        
        try {
          downloadFromGithub.textContent = '获取文件列表...';
          downloadFromGithub.disabled = true;
          
          const backupFiles = await githubSync.getBackupFiles(username, repo, branch, token);
          
          if (backupFiles.length === 0) {
            alert('未找到备份文件');
            return;
          }
          
          // 默认选择最新的备份文件，也可以让用户选择
          const selectedFile = backupFiles[0]; // 最新的文件
          
          downloadFromGithub.textContent = '下载中...';
          
          const backupData = await githubSync.downloadFromGithub(username, repo, branch, token, selectedFile.name);
          
          // 恢复数据到localStorage
          localStorage.clear();
          for (const [key, value] of Object.entries(backupData)) {
            localStorage.setItem(key, value);
          }
          
          alert(`从Github恢复数据成功！\n文件: ${selectedFile.name}`);
          githubSyncModal.style.display = 'none';
          
          // 刷新页面以应用新数据
          location.reload();
        } catch (error) {
          alert(`下载失败: ${error.message}`);
        } finally {
          downloadFromGithub.textContent = '从Github下载';
          downloadFromGithub.disabled = false;
        }
      });
    }
  });

  // 页面加载完成后初始化数据
  loadData();
})();
