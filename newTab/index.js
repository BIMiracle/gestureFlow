// 获取windmill-top元素
const windmillTop = document.querySelector(".windmill-top");
const wallpaper = document.querySelector(".wallpaper");

// 记录当前旋转角度
let currentRotation = 0;
let isAnimating = false;

// 设置元素旋转角度的函数 - 修改为保留两位小数
function setRotation(element, degrees) {
  // 保留两位小数，避免角度突变
  const roundedDegrees = parseFloat(degrees.toFixed(2));
  element.style.transform = `rotate(${roundedDegrees}deg)`;
}

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
    console.log(111, finalRotationForThisClick);
    

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
        console.log("Wallpaper loaded, final rotation:", finalRotationForThisClick);
      };
      img.onerror = () => {
        console.log(222, finalRotationForThisClick);
        console.error("Wallpaper failed to load.");
        // 确保即使出错也保持旋转角度
        setRotation(windmillTop, finalRotationForThisClick);
        console.log("Wallpaper error, final rotation:", finalRotationForThisClick);
      };
      img.src = wallpaperUrl;
    } else {
      console.log("No wallpaper data received or data format incorrect.");
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