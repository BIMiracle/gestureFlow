// 内容脚本 - 处理页面中的鼠标手势

let isGestureActive = false;
let isGestureStarted = false; // 新增：标记手势是否真正开始
let gestureStartTime = 0; // 新增：记录右键按下时间
let gestureStartPoint = null; // 新增：记录右键按下位置
let gesturePoints = [];
let gestureCanvas = null;
let gestureContext = null;
let gestureLabel = null;
let blockContextMenu = false;
let gestureTimer = null; // 新增：延迟计时器
let settings = {
  lineColor: '#0066FF',
  lineWidth: 3,
  gestures: {},
};
const GESTURE_DELAY = 200; // 新增：手势激活延迟时间（毫秒）
const MIN_MOVE_DISTANCE = 15; // 新增：最小移动距离（像素）


// 初始化
function init() {
  // 从存储中加载设置
  loadSettings();
  
  // 监听设置变化
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.gestureSettings) {
      settings = changes.gestureSettings.newValue;
    }
  });
  
  // 创建手势画布
  createGestureCanvas();
  
  // 创建手势标签
  createGestureLabel();
  
  // 添加事件监听器
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('contextmenu', handleContextMenu);
}

// 加载设置
function loadSettings() {
  chrome.storage.sync.get('gestureSettings', (data) => {
    if (data.gestureSettings) {
      settings = data.gestureSettings;
    }
  });
}

// 创建手势画布
function createGestureCanvas() {
  gestureCanvas = document.createElement('canvas');
  // 确保元素已创建后再设置样式
  requestAnimationFrame(() => {
    if (gestureCanvas) {
      gestureCanvas.style.position = 'fixed';
      gestureCanvas.style.top = '0';
      gestureCanvas.style.left = '0';
      gestureCanvas.style.width = '100%';
      gestureCanvas.style.height = '100%';
      gestureCanvas.style.pointerEvents = 'none';
      gestureCanvas.style.zIndex = '9999';
      gestureCanvas.width = window.innerWidth;
      gestureCanvas.height = window.innerHeight;
    }
  });
  
  gestureContext = gestureCanvas.getContext('2d');
  
  // 窗口大小改变时调整画布大小
  window.addEventListener('resize', () => {
    gestureCanvas.width = window.innerWidth;
    gestureCanvas.height = window.innerHeight;
  });
}

// 创建手势标签
function createGestureLabel() {
  gestureLabel = document.createElement('div');
  gestureLabel.style.position = 'fixed';
  gestureLabel.style.padding = '5px 10px';
  gestureLabel.style.background = 'rgba(0, 0, 0, 0.7)';
  gestureLabel.style.color = 'white';
  gestureLabel.style.borderRadius = '4px';
  gestureLabel.style.fontSize = '14px';
  gestureLabel.style.fontWeight = 'bold';
  gestureLabel.style.pointerEvents = 'none';
  gestureLabel.style.zIndex = '10000';
  gestureLabel.style.display = 'none';
}

// 处理鼠标按下事件
function handleMouseDown(e) {
  // 只响应右键
  if (e.button === 2) {
    isGestureActive = true;
    isGestureStarted = false; // 重置手势开始状态
    blockContextMenu = false; // 重置标志
    gestureStartTime = Date.now(); // 记录按下时间
    gestureStartPoint = { x: e.clientX, y: e.clientY }; // 记录按下位置
    gesturePoints = [{ x: e.clientX, y: e.clientY }];
    
    // 清除之前的计时器
    if (gestureTimer) {
      clearTimeout(gestureTimer);
      gestureTimer = null;
    }
    
    // 设置延迟计时器
    gestureTimer = setTimeout(() => {
      if (isGestureActive && !isGestureStarted) {
        // 检查是否有足够的移动距离
        const currentPoint = gesturePoints[gesturePoints.length - 1];
        const distance = Math.sqrt(
          Math.pow(currentPoint.x - gestureStartPoint.x, 2) + 
          Math.pow(currentPoint.y - gestureStartPoint.y, 2)
        );
        
        if (distance >= MIN_MOVE_DISTANCE) {
          isGestureStarted = true;
          blockContextMenu = true;
          
          // 添加画布和标签到文档
          if (!document.body.contains(gestureCanvas)) {
            document.body.appendChild(gestureCanvas);
          }
          if (!document.body.contains(gestureLabel)) {
            document.body.appendChild(gestureLabel);
          }
          
          // 开始绘制轨迹
          drawGesture();
        }
      }
      gestureTimer = null;
    }, GESTURE_DELAY);
  }
}

// 处理鼠标移动事件
function handleMouseMove(e) {
  if (!isGestureActive) return;
  
  // 添加新的点
  gesturePoints.push({ x: e.clientX, y: e.clientY });

  // 如果手势还没有正式开始，检查是否满足开始条件
  if (!isGestureStarted) {
    const distance = Math.sqrt(
      Math.pow(e.clientX - gestureStartPoint.x, 2) + 
      Math.pow(e.clientY - gestureStartPoint.y, 2)
    );
    
    // 如果移动距离足够且时间超过延迟，立即开始手势
    if (distance >= settings.minMoveDistance && Date.now() - gestureStartTime >= settings.gestureDelay) {
      isGestureStarted = true;
      blockContextMenu = true;
      
      // 添加画布和标签到文档
      if (!document.body.contains(gestureCanvas)) {
        document.body.appendChild(gestureCanvas);
      }
      if (!document.body.contains(gestureLabel)) {
        document.body.appendChild(gestureLabel);
      }
    }
    
    // 如果手势还没开始，不绘制轨迹
    if (!isGestureStarted) {
      return;
    }
  }
  
  // 绘制手势轨迹
  drawGesture();
  
  // 识别手势并显示标签
  const gesture = recognizeGesture();
  if (gesture) {
    showGestureLabel(e.clientX, e.clientY, getGestureActionName(gesture));
  } else {
    hideGestureLabel();
  }
}

// 处理鼠标释放事件
function handleMouseUp(e) {
  if (!isGestureActive || e.button !== 2) return;
  
  // 清除延迟计时器
  if (gestureTimer) {
    clearTimeout(gestureTimer);
    gestureTimer = null;
  }
  
  isGestureActive = false;
  
  // 只有在手势真正开始后才执行手势识别
  if (isGestureStarted) {
    // 识别手势并执行相应操作
    const gesture = recognizeGesture();
    if (gesture) {
      executeGesture(gesture);
    }
  }
  
  // 重置状态
  isGestureStarted = false;
  
  // 清理
  clearGesture();
  hideGestureLabel();
}

// 处理右键菜单事件
function handleContextMenu(e) {
  // 如果 blockContextMenu 为 true，说明是拖拽手势，阻止右键菜单
  if (blockContextMenu) {
    e.preventDefault();
    blockContextMenu = false; // 重置标志以备下次使用
  }
  // 对于普通右键单击（blockContextMenu 为 false），不执行任何操作，允许默认菜单显示
}

// 绘制手势轨迹
function drawGesture() {
  if (gesturePoints.length < 2) return;
  
  // 清除画布
  gestureContext.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
  
  // 设置线条样式
  gestureContext.strokeStyle = settings.lineColor;
  gestureContext.lineWidth = settings.lineWidth;
  gestureContext.lineJoin = 'round';
  gestureContext.lineCap = 'round';
  
  // 绘制路径
  gestureContext.beginPath();
  gestureContext.moveTo(gesturePoints[0].x, gesturePoints[0].y);
  
  for (let i = 1; i < gesturePoints.length; i++) {
    gestureContext.lineTo(gesturePoints[i].x, gesturePoints[i].y);
  }
  
  gestureContext.stroke();
}

// 清除手势
function clearGesture() {
  if (gestureContext) {
    gestureContext.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
  }
  gesturePoints = [];
}

// 显示手势标签
function showGestureLabel(x, y, text) {
  gestureLabel.textContent = text;
  gestureLabel.style.display = 'block';
  gestureLabel.style.left = `${x + 15}px`;
  gestureLabel.style.top = `${y + 15}px`;
}

// 隐藏手势标签
function hideGestureLabel() {
  gestureLabel.style.display = 'none';
}

// 识别手势
function recognizeGesture() {
  if (gesturePoints.length < 10) return null;
  
  // 简化轨迹，只保留方向变化的点
  const simplifiedPoints = simplifyGesture(gesturePoints);
  
  // 计算方向序列
  const directions = calculateDirections(simplifiedPoints);
  
  // 如果方向超过两个，识别为取消操作
  if (directions.length > 2) {
    return 'cancel';
  }
  
  // 将方向序列转换为手势字符串
  const gesture = directionsToGesture(directions);
  
  // 检查是否是已定义的手势
  if (gesture && settings.gestures && settings.gestures[gesture]) {
    return gesture;
  } else if (directions.length > 0) {
    // 返回未识别的手势，但仍显示方向
    return directions.join('-') + '-未识别';
  }
  
  return null;
}

// 简化手势轨迹
function simplifyGesture(points) {
  if (points.length < 3) return points;
  
  const threshold = 20; // 最小距离阈值
  const simplified = [points[0]];
  let lastPoint = points[0];
  
  for (let i = 1; i < points.length; i++) {
    const distance = Math.sqrt(
      Math.pow(points[i].x - lastPoint.x, 2) + 
      Math.pow(points[i].y - lastPoint.y, 2)
    );
    
    if (distance > threshold) {
      simplified.push(points[i]);
      lastPoint = points[i];
    }
  }
  
  return simplified;
}

// 计算方向序列
function calculateDirections(points) {
  if (points.length < 3) return [];
  
  const directions = [];
  const angleThreshold = Math.PI / 4; // 45度
  
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x;
    const dy = points[i].y - points[i-1].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 忽略太短的移动
    if (distance < 10) continue;
    
    // 计算角度（弧度）
    let angle = Math.atan2(dy, dx);
    
    // 将角度映射到方向
    let direction;
    if (angle > -angleThreshold && angle < angleThreshold) {
      direction = 'right';
    } else if (angle > angleThreshold && angle < Math.PI - angleThreshold) {
      direction = 'down';
    } else if (angle > Math.PI - angleThreshold || angle < -Math.PI + angleThreshold) {
      direction = 'left';
    } else {
      direction = 'up';
    }
    
    // 只有当方向变化时才添加
    if (directions.length === 0 || directions[directions.length - 1] !== direction) {
      directions.push(direction);
    }
  }
  
  return directions;
}

// 将方向序列转换为手势字符串
function directionsToGesture(directions) {
  if (directions.length === 0) return null;
  
  // 简化手势，最多保留两个方向
  const simplified = directions.slice(0, 2);
  
  // 返回手势字符串
  return simplified.join('-');
}

// 获取手势对应的操作名称
function getGestureActionName(gesture) {
  const actionMap = {
    'back': '后退',
    'forward': '前进',
    'scrollUp': '向上滚动',
    'scrollDown': '向下滚动',
    'scrollTop': '到顶部',
    'scrollBottom': '到底部',
    'newTab': '新建标签页',
    'closeTab': '关闭标签页',
    'leftTab': '左标签页',
    'rightTab': '右标签页',
    'reopenTab': '重新打开标签页',
    'searchText': '搜索文本',
    'searchTextBackground': '后台搜索',
    'refresh': '刷新',
    'forceRefresh': '强制刷新'
  };
  
  // 检查是否是取消操作
  if (gesture === 'cancel') {
    return '取消手势';
  }
  
  // 检查是否是未识别的手势
  if (gesture && gesture.endsWith('-未识别')) {
    return '未识别的手势';
  }
  
  const action = settings.gestures[gesture];
  return action ? actionMap[action] || action : '';
}

// 执行手势对应的操作
function executeGesture(gesture) {
  // 如果是未识别的手势或取消操作，不执行任何操作
  if (gesture && (gesture.endsWith('-未识别') || gesture === 'cancel')) {
    return;
  }
  
  const action = settings.gestures[gesture];
  if (!action) return;
  
  switch (action) {
    case 'scrollUp':
      window.scrollBy(0, -100);
      break;
    case 'scrollDown':
      window.scrollBy(0, 100);
      break;
    case 'scrollTop':
      window.scrollTo(0, 0);
      break;
    case 'scrollBottom':
      window.scrollTo(0, document.body.scrollHeight);
      break;
    case 'searchText':
      const selectedText = window.getSelection().toString();
      if (selectedText) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_self');
      }
      break;
    case 'searchTextBackground':
      const selection = window.getSelection().toString();
      if (selection) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(selection)}`, '_blank');
      }
      break;
    default:
      // 发送消息给背景脚本处理其他操作
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'executeGesture',
          gesture: action
        });
      }
      break;
  }
}

// 初始化
init();
