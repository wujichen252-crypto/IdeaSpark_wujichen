#!/bin/bash
echo "=== 502 错误排查脚本 ==="
echo ""

echo "1. 检查后端绑定的 IP（关键！）"
echo "----------------------------"
netstat -tlnp | grep 9000
echo ""
echo "如果显示 127.0.0.1:9000，说明只绑定了本地，需要改成 0.0.0.0:9000"
echo ""

echo "2. 从服务器本机测试 9000 端口"
echo "----------------------------"
curl -s http://127.0.0.1:9000/ | head -c 200
echo ""
echo ""

echo "3. 检查防火墙"
echo "------------"
firewall-cmd --list-ports 2>/dev/null || iptables -L -n | grep 9000
echo ""

echo "4. 检查 SELinux（如果是 CentOS）"
echo "-------------------------------"
getenforce 2>/dev/null || echo "SELinux 未启用或不存在"
echo ""

echo "5. 测试 Nginx 到后端的连接"
echo "-------------------------"
curl -s http://47.108.232.238:9000/api/user/login -X POST -H "Content-Type: application/json" -d '{}' | head -c 200
echo ""
