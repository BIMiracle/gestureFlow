// 选项页面的JavaScript

// 可用的手势动作
const availableGestures = [
  { id: 'up', name: '向上' },
  { id: 'down', name: '向下' },
  { id: 'left', name: '向左' },
  { id: 'right', name: '向右' },
  { id: 'up-down', name: '上下' },
  { id: 'down-up', name: '下上' },
  { id: 'left-right', name: '左右' },
  { id: 'right-left', name: '右左' },
  { id: 'up-right', name: '上右' },
  { id: 'up-left', name: '上左' },
  { id: 'down-right', name: '下右' },
  { id: 'down-left', name: '下左' }
];

// 可用的动作
const availableActions = [
  { id: 'back', name: '后退' },
  { id: 'forward', name: '前进' },
  { id: 'scrollUp', name: '向上滚动' },
  { id: 'scrollDown', name: '向下滚动' },
  { id: 'scrollTop', name: '到顶部' },
  { id: 'scrollBottom', name: '到底部' },
  { id: 'newTab', name: '新建标签页' },
  { id: 'closeTab', name: '关闭当前标签' },
  { id: 'leftTab', name: '切换到左边标签页' },
  { id: 'rightTab', name: '切换到右边标签页' },
  { id: 'reopenTab', name: '重新打开关闭的标签页' },
  { id: 'searchText', name: '搜索文本' },
  { id: 'searchTextBackground', name: '搜索文本并在后台标签中打开' },
  { id: 'refresh', name: '刷新当前标签页' },
  { id: 'forceRefresh', name: '强制刷新' }
];

// DOM 元素
const lineColorInput = document.getElementById('lineColor');
const lineWidthInput = document.getElementById('lineWidth');
const gestureGrid = document.getElementById('gestureGrid');
const saveButton = document.getElementById('saveButton');
const statusDiv = document.getElementById('status');

// 加载设置
function loadSettings() {
  chrome.storage.sync.get('gestureSettings', (data) => {
    const settings = data.gestureSettings || {
      lineColor: '#0066FF',
      lineWidth: 3,
      gestures: {
        'up': 'scrollTop',
        'down': 'scrollBottom',
        'down-right': 'closeTab',
        'left': 'back',
        'right': 'forward',
        'up-down': 'refresh',
        'down-up': 'newTab',
        'left-right': 'rightTab',
        'right-left': 'leftTab',
        'down-left': 'reopenTab'
      }
    };
    
    // 设置颜色和线宽
    lineColorInput.value = settings.lineColor;
    lineWidthInput.value = settings.lineWidth;
    
    // 创建手势设置界面
    createGestureSettings(settings.gestures);
  });
}

// 创建手势设置界面
function createGestureSettings(gestureSettings) {
  gestureGrid.innerHTML = '';
  
  availableGestures.forEach(gesture => {
    const gestureItem = document.createElement('div');
    gestureItem.className = 'gesture-item';
    
    const gestureName = document.createElement('div');
    gestureName.className = 'gesture-name';
    gestureName.textContent = gesture.name;
    
    const actionSelect = document.createElement('select');
    actionSelect.id = `gesture-${gesture.id}`;
    actionSelect.dataset.gesture = gesture.id;
    
    // 添加空选项
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- 选择动作 --';
    actionSelect.appendChild(emptyOption);
    
    // 添加所有可用动作
    availableActions.forEach(action => {
      const option = document.createElement('option');
      option.value = action.id;
      option.textContent = action.name;
      
      // 如果是当前设置的动作，则选中
      if (gestureSettings[gesture.id] === action.id) {
        option.selected = true;
      }
      
      actionSelect.appendChild(option);
    });
    
    gestureItem.appendChild(gestureName);
    gestureItem.appendChild(actionSelect);
    
    gestureGrid.appendChild(gestureItem);
  });
}

// 保存设置
function saveSettings() {
  const gestures = {};
  
  // 收集所有手势设置
  availableGestures.forEach(gesture => {
    const select = document.getElementById(`gesture-${gesture.id}`);
    if (select.value) {
      gestures[gesture.id] = select.value;
    }
  });
  
  const settings = {
    lineColor: lineColorInput.value,
    lineWidth: parseInt(lineWidthInput.value, 10),
    gestures: gestures
  };
  
  // 保存到存储
  chrome.storage.sync.set({ gestureSettings: settings }, () => {
    // 显示保存成功消息
    statusDiv.className = 'status success';
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 2000);
  });
}

// 事件监听器
saveButton.addEventListener('click', saveSettings);

// 初始化
document.addEventListener('DOMContentLoaded', loadSettings);
