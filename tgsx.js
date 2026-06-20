document.getElementById("startBtn").onclick = function () {

    // 按钮动画
    this.innerHTML = "正在启动...";

    setTimeout(function () {

        // 跳转 Telegram
        window.location.href = "https://t.me/WaterChisato_bot";

    }, 1000);

};