import http.server
import socketserver
import os
import sys

# 设置端口号，默认 8082
PORT = 8082

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

web_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(web_dir)

Handler = CORSRequestHandler

print(f"-------------------------------------------------------")
print(f"正在启动服务器...")
print(f"根目录: {web_dir}")
print(f"地  址: http://localhost:{PORT}")
print(f"-------------------------------------------------------")
print(f"请注意：")
print(f"1. URL 路径不需要再加盘符了。")
print(f"   例如：http://localhost:{PORT}/你的歌名.lrc")
print(f"2. 记得在浏览器对 GitHub Pages 开启【允许不安全内容】(Mixed Content)。")
print(f"-------------------------------------------------------")

try:
    # 允许地址重用，避免关闭后立刻重启报错
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"服务已启动，按 Ctrl+C 停止。")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n服务器已停止。")
except OSError as e:
    print(f"\n错误：端口 {PORT} 被占用。请修改脚本中的 PORT 变量，或关闭占用端口的程序。")