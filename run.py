import http.server
import socketserver
import webbrowser
import os

# 配置端口号（建议用 8000 或 8080）
PORT = 8000

# 获取当前脚本所在的目录
current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)

# 定义处理请求的类
Handler = http.server.SimpleHTTPRequestHandler

try:
    # 1. 创建服务器对象
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"✅ 服务器已启动！")
        print(f"👉 请在浏览器访问: http://127.0.0.1:{PORT}")
        print(f"🛑 按 Ctrl+C 停止服务")
        
        # 2. 自动打开浏览器（可选）
        # 假设你的主页叫 index.html，如果不是请修改下面这行
        webbrowser.open(f"http://127.0.0.1:{PORT}/index.html")
        
        # 3. 保持服务运行
        httpd.serve_forever()

except OSError as e:
    print(f"❌ 启动失败：端口 {PORT} 可能已被占用，请尝试更换端口。")
except KeyboardInterrupt:
    print("\n👋 服务器已关闭。")
