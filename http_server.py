import http.server
import socketserver
import os
import re

# 设置端口号，默认 8082
PORT = 8082

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Range')
        self.send_header('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length, Content-Type')
        super().end_headers()
    
    def send_head(self):
        """Common code for GET and HEAD commands with Range support."""
        path = self.translate_path(self.path)
        
        if os.path.isdir(path):
            # Let parent handle directory listing
            return super().send_head()
        
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None
        
        try:
            fs = os.fstat(f.fileno())
            file_len = fs.st_size
            
            # Check for Range header
            range_header = self.headers.get('Range')
            
            if range_header:
                # Parse Range header
                match = re.match(r'bytes=(\d+)-(\d*)', range_header)
                if match:
                    start = int(match.group(1))
                    end = int(match.group(2)) if match.group(2) else file_len - 1
                    
                    if start >= file_len:
                        self.send_error(416, "Requested Range Not Satisfiable")
                        return None
                    
                    # Seek to start position
                    f.seek(start)
                    content_length = end - start + 1
                    
                    # Send 206 Partial Content
                    self.send_response(206)
                    self.send_header("Content-type", self.guess_type(path))
                    self.send_header("Accept-Ranges", "bytes")
                    self.send_header("Content-Range", f"bytes {start}-{end}/{file_len}")
                    self.send_header("Content-Length", str(content_length))
                    self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                    self.end_headers()
                    return f
            
            # No Range header or invalid - send full file
            self.send_response(200)
            self.send_header("Content-type", self.guess_type(path))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(file_len))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
            
        except Exception as e:
            f.close()
            self.send_error(500, f"Internal error: {e}")
            return None
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Serve a GET request."""
        f = self.send_head()
        if f:
            try:
                self.copyfile(f, self.wfile)
            except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                # Client closed connection (e.g., seeking to new position) - this is normal
                pass
            finally:
                f.close()
    
    def do_HEAD(self):
        """Serve a HEAD request."""
        f = self.send_head()
        if f:
            f.close()

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
    
    # 使用 ThreadingMixIn 提高并发处理能力
    class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        # 允许快速重用地址
        allow_reuse_address = True
        # 设置为daemon线程，主程序退出时自动清理
        daemon_threads = True
        # 增加请求队列大小
        request_queue_size = 10
    
    with ThreadedTCPServer(("", PORT), Handler) as httpd:
        print(f"服务已启动（多线程模式），按 Ctrl+C 停止。")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n服务器已停止。")
except OSError as e:
    print(f"\n错误：端口 {PORT} 被占用。请修改脚本中的 PORT 变量，或关闭占用端口的程序。")