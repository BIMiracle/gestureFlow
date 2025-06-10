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
        if (site.name === "Gmail") {
          appIcon.classList.add("gmail-icon");
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
      appGridsContainer.style.transition = "transform 350ms ease-in-out";
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
      appGridsContainer.style.transition = "transform 350ms ease-in-out";

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
    setActiveTab("add");
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
    maskOpacityValue.textContent = `${value}%`;
    wallpaperMask.style.backgroundColor = `rgba(0, 0, 0, ${value / 100})`;
  });

  // 模糊度滑块
  const blurSlider = document.getElementById("blurSlider");
  const blurValue = blurSlider.nextElementSibling;

  blurSlider.addEventListener("input", (e) => {
    const value = e.target.value;
    const percentage = parseInt(value);
    blurValue.textContent = `${percentage}%`;

    // 设置CSS变量来控制模糊度，将百分比转换为像素值
    const blurPixels = (percentage / 100) * 20; // 最大20px模糊
    document.documentElement.style.setProperty(
      "--wallpaper-filter",
      `${blurPixels}px`
    );
  });

  // 初始化CSS变量
  const initialBlurPixels = (10 / 100) * 20; // 初始值10%对应2px
  document.documentElement.style.setProperty(
    "--wallpaper-filter",
    `${initialBlurPixels}px`
  );

  // 页面加载完成后初始化数据
  loadData();
})();
