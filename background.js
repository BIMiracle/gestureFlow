// 背景脚本 - 处理浏览器级别的操作

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'executeGesture') {
    const { gesture } = message;
    
    switch (gesture) {
      case 'back':
        chrome.tabs.goBack(sender.tab.id);
        break;
      case 'forward':
        chrome.tabs.goForward(sender.tab.id);
        break;
      case 'newTab':
        chrome.tabs.create({});
        break;
      case 'closeTab':
        chrome.tabs.remove(sender.tab.id);
        break;
      case 'leftTab':
        switchToAdjacentTab(sender.tab.id, -1);
        break;
      case 'rightTab':
        switchToAdjacentTab(sender.tab.id, 1);
        break;
      case 'reopenTab':
        chrome.sessions.getRecentlyClosed({ maxResults: 1 }, (sessions) => {
          if (sessions.length && sessions[0].tab) {
            chrome.sessions.restore(sessions[0].tab.sessionId);
          }
        });
        break;
      case 'refresh':
        chrome.tabs.reload(sender.tab.id);
        break;
      case 'forceRefresh':
        chrome.tabs.reload(sender.tab.id, { bypassCache: true });
        break;
      case 'searchText':
        // 搜索文本由内容脚本处理
        break;
      case 'searchTextBackground':
        // 搜索文本并在后台打开由内容脚本处理
        break;
    }
    
    sendResponse({ success: true });
    return true;
  }
});

// 切换到相邻标签页
function switchToAdjacentTab(currentTabId, offset) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if (tabs.length <= 1) return;
    
    const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
    if (currentIndex === -1) return;
    
    let newIndex = (currentIndex + offset) % tabs.length;
    if (newIndex < 0) newIndex = tabs.length - 1;
    
    chrome.tabs.update(tabs[newIndex].id, { active: true });
  });
}

// 初始化默认设置
chrome.runtime.onInstalled.addListener(() => {
  const defaultSettings = {
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
  
  chrome.storage.sync.set({ gestureSettings: defaultSettings });
});
