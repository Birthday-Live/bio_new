let btn = document.getElementById("start");

btn.onclick = function(){

    btn.innerHTML = "正在进入...";

    btn.disabled = true;

    setTimeout(function(){

        location.href = "https://t.me/WaterChisato";

    },800);

};