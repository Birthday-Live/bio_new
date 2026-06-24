// 全局存储当前选择的媒体配置
let currentType = 'video';
let currentDefaultName = 'video.mp4';

// 页面加载时：自动读取上次成功保存的 Token 和 Chat ID
window.onload = function() {
    if (localStorage.getItem('tg_token')) {
        document.getElementById('botToken').value = localStorage.getItem('tg_token');
    }
    if (localStorage.getItem('tg_chatid')) {
        document.getElementById('chatId').value = localStorage.getItem('tg_chatid');
    }
};

// 切换媒体类型
function switchType(type, acceptType, defaultName, event) {
    currentType = type;
    currentDefaultName = defaultName;

    // 切换按钮高亮状态
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 动态修改文件选择器的限制类型
    const fileInput = document.getElementById('mediaFile');
    fileInput.accept = acceptType;
    fileInput.value = ''; // 切换时清空已选文件
    updateFileName();

    // 贴纸不支持文字说明，动态隐藏文本框
    const captionGroup = document.getElementById('captionGroup');
    if (type === 'sticker') {
        captionGroup.style.display = 'none';
    } else {
        captionGroup.style.display = 'block';
    }
}

// 状态提示信息展示
function showStatus(text, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.style.display = 'block';
    statusDiv.className = type;
    statusDiv.innerHTML = text;
}

// 监听文件选择并动态更新文件名显示
function updateFileName() {
    const fileInput = document.getElementById('mediaFile');
    const nameDisplay = document.getElementById('fileNameDisplay');
    const zoneText = document.getElementById('dropZoneText');
    
    if (fileInput.files[0]) {
        zoneText.innerText = "已选择文件：";
        nameDisplay.innerText = fileInput.files[0].name;
    } else {
        zoneText.innerText = "📁 点击或拖拽文件到此处";
        nameDisplay.innerText = "";
    }
}

// 核心发送主函数
async function processAndSend() {
    const token = document.getElementById('botToken').value.trim();
    const chatId = document.getElementById('chatId').value.trim();
    const caption = document.getElementById('mediaCaption').value.trim();
    const fileInput = document.getElementById('mediaFile');

    if (!token || !chatId || !fileInput.files[0]) {
        showStatus('⚠️ 请完整填写 Token、Chat ID 并选择需要上传的文件！', 'error');
        return;
    }

    // 自动保存配置到浏览器缓存中
    localStorage.setItem('tg_token', token);
    localStorage.setItem('tg_chatid', chatId);

    const file = fileInput.files[0];
    showStatus('🔄 正在对文件进行 Base64 编码...', 'info');

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function (e) {
        const base64DataUrl = e.target.result; 
        showStatus(`🚀 编码完成！正在发送为【${currentType}】并上传中...`, 'info');

        try {
            const blob = dataURLtoBlob(base64DataUrl);
            const formData = new FormData();
            
            formData.append('chat_id', chatId);
            
            // 根据选择的类型动态注入 API 参数（如 video/photo/document/audio/sticker）
            formData.append(currentType, blob, file.name || currentDefaultName); 
            
            // 如果不是贴纸，并且填写了附言，则带上文本
            if (currentType !== 'sticker' && caption) {
                formData.append('caption', caption);
            }

            // 映射对应的请求路径方法名（如 sendVideo / sendPhoto 等）
            const methodName = 'send' + currentType.charAt(0).toUpperCase() + currentType.slice(1);
            const url = `https://api.telegram.org/bot${token}/${methodName}`;

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.ok) {
                showStatus('✨ <b>发送成功！</b> 媒体内容已送达。', 'success');
            } else {
                showStatus(`❌ <b>发送失败</b><br>错误信息: ${result.description}`, 'error');
            }

        } catch (error) {
            showStatus(`❌ <b>网络错误</b><br>${error.message}`, 'error');
        }
    };

    reader.onerror = function() {
        showStatus('❌ 读取本地文件失败', 'error');
    };
}

// 辅助函数：将前端 DataURL (Base64) 转换为 Blob 二进制
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
