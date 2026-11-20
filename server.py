# -*- coding: utf-8 -*-
"""
Smart Greenhouse 3D - Жергілікті офлайн HTTP сервер
Компьютердің нақты Wi-Fi IP мекенжайын автоматты анықтайды
және смартфондар үшін 0.0.0.0 арқылы таратады.
"""

import http.server
import socket
import socketserver
import webbrowser
import os
import sys

def get_local_ip():
    """Компьютердің сыртқы/Wi-Fi IPv4 мекенжайын сенімді түрде анықтау"""
    # 1-әдіс: UDP сокет арқылы жергілікті шлюзге бағыттау
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith('127.') and not ip.startswith('169.254.'):
            return ip
    except Exception:
        pass

    # 2-әдіс: Хост атауы арқылы желілік интерфейстерді қарау
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith('127.') and not ip.startswith('169.254.'):
                return ip
    except Exception:
        pass

    return '127.0.0.1'

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """MIME типтері мен баптаулары дұрыс реттелген өңдегіш"""
    def end_headers(self):
        # Браузерлерде кэш мәселесі болмауы үшін
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # Жергілікті желіаралық қауіпсіздік
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Тым көп журнал шығармау үшін
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} - {args[1]}\n")

def find_available_port(start_port=8080, max_attempts=10):
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
    return start_port

def run():
    # Жұмыс қалтасын осы файл тұрған орынға ауыстыру
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    port = find_available_port(8080)
    local_ip = get_local_ip()

    print("\n" + "=" * 65, flush=True)
    print("  🌱 SMART GREENHOUSE: БОЛАШАҚТЫҢ АВТОНОМДЫ ЖЫЛЫЖАЙЫ", flush=True)
    print("          3D Цифрлық Егіз (Digital Twin Simulator)", flush=True)
    print("=" * 65, flush=True)
    print(f"\n  [OK] Офлайн сервер сәтті қосылды!\n", flush=True)
    print(f"  💻 Компьютерде ашу:      http://localhost:{port}/index.html", flush=True)
    print(f"  📱 Смартфонмен ашу (QR):  http://{local_ip}:{port}/index.html", flush=True)
    print("\n" + "-" * 65, flush=True)
    print("  ⚠️ МАҢЫЗДЫ НҰСҚАУЛЫҚ (Телефонмен ашу үшін):", flush=True)
    print(f"  1. Компьютер мен смартфон бір Wi-Fi желісіне қосылуы тиіс.", flush=True)
    print(f"     (Немесе телефонның 'Точка доступасын / Мобильный хот-спотты' қосып,", flush=True)
    print(f"      компьютерді сол телефонның Wi-Fi-ына қосыңыз).", flush=True)
    print(f"  2. Компьютердегі сайттан '📱 QR' түймесін басып, QR-кодты сканерлеңіз.", flush=True)
    print(f"  3. Сервер жұмысын тоқтату үшін: осы терезені жабыңыз (немесе Ctrl+C).", flush=True)
    print("=" * 65 + "\n", flush=True)

    # Браузерді бірден Wi-Fi IP мекенжайымен ашу (сонда QR-код бірден осы IP-ді алады)
    target_url = f"http://{local_ip}:{port}/index.html"
    try:
        webbrowser.open(target_url)
    except Exception:
        pass

    # 0.0.0.0 арқылы барлық желілік құрылғыларға (телефон, планшет) ашық ету
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", port), CustomHTTPHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[i] Сервер тоқтатылды.")
            sys.exit(0)

if __name__ == '__main__':
    run()
