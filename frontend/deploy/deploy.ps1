# IdeaSpark 前端部署脚本 (PowerShell)
# 支持: 本地预览、构建、FTP 部署

param(
    [Parameter()]
    [ValidateSet("build", "preview", "ftp", "help")]
    [string]$Action = "help",
    
    [Parameter()]
    [string]$FtpHost,
    
    [Parameter()]
    [string]$FtpUser,
    
    [Parameter()]
    [string]$FtpPass,
    
    [Parameter()]
    [string]$FtpPath = "/"
)

# 颜色函数
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Green
}

function Write-Warn($message) {
    Write-Host "[WARN] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# 显示帮助
function Show-Help {
    Write-Host "IdeaSpark 前端部署脚本 (PowerShell)`n"
    Write-Host "用法: .\deploy.ps1 -Action <操作> [选项]`n"
    Write-Host "操作:"
    Write-Host "  build       仅构建项目"
    Write-Host "  preview     本地预览生产构建"
    Write-Host "  ftp         FTP 部署到远程服务器"
    Write-Host "  help        显示帮助信息`n"
    Write-Host "FTP 选项:"
    Write-Host "  -FtpHost    FTP 服务器地址"
    Write-Host "  -FtpUser    FTP 用户名"
    Write-Host "  -FtpPass    FTP 密码"
    Write-Host "  -FtpPath    远程路径 (默认: /)`n"
    Write-Host "示例:"
    Write-Host '  .\deploy.ps1 -Action ftp -FtpHost "ftp.example.com" -FtpUser "user" -FtpPass "pass"' -ForegroundColor Cyan
}

# 构建项目
function Build-Project {
    Write-Info "开始构建项目..."
    
    # 检查 node_modules
    if (-not (Test-Path "node_modules")) {
        Write-Warn "node_modules 不存在，正在安装依赖..."
        npm ci
    }
    
    # 清理旧的构建产物
    if (Test-Path "dist") {
        Write-Info "清理旧的构建产物..."
        Remove-Item -Recurse -Force "dist"
    }
    
    # 构建
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "构建失败！"
        exit 1
    }
    
    Write-Info "构建完成！"
}

# 本地预览
function Start-Preview {
    Write-Info "本地预览生产构建..."
    
    Build-Project
    
    Write-Info "启动预览服务器..."
    npm run preview
}

# FTP 部署
function Deploy-Ftp {
    param(
        [string]$Host,
        [string]$User,
        [string]$Pass,
        [string]$RemotePath
    )
    
    if (-not $Host -or -not $User -or -not $Pass) {
        Write-Error "FTP 部署需要提供 -FtpHost, -FtpUser, -FtpPass 参数"
        Show-Help
        exit 1
    }
    
    Write-Info "开始 FTP 部署..."
    
    Build-Project
    
    # 使用 PowerShell 的 FTP 功能
    $ftp = "ftp://$Host$RemotePath"
    
    Write-Info "连接到 $Host..."
    
    # 创建凭据
    $credentials = New-Object System.Net.NetworkCredential($User, $Pass)
    
    # 获取所有文件
    $files = Get-ChildItem -Path "dist" -Recurse | Where-Object { -not $_.PSIsContainer }
    
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring((Resolve-Path "dist").Path.Length + 1).Replace("\", "/")
        $remoteFile = "$ftp/$relativePath"
        
        Write-Info "上传: $relativePath"
        
        try {
            $request = [System.Net.FtpWebRequest]::Create($remoteFile)
            $request.Credentials = $credentials
            $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $request.UseBinary = $true
            $request.UsePassive = $true
            
            $content = [System.IO.File]::ReadAllBytes($file.FullName)
            $request.ContentLength = $content.Length
            
            $stream = $request.GetRequestStream()
            $stream.Write($content, 0, $content.Length)
            $stream.Close()
            
            $response = $request.GetResponse()
            $response.Close()
        }
        catch {
            Write-Error "上传失败: $relativePath - $_"
        }
    }
    
    Write-Info "FTP 部署完成！"
}

# 主逻辑
switch ($Action) {
    "build" { Build-Project }
    "preview" { Start-Preview }
    "ftp" { Deploy-Ftp -Host $FtpHost -User $FtpUser -Pass $FtpPass -RemotePath $FtpPath }
    default { Show-Help }
}
