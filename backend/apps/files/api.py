"""
File & Export API router.
Maps Java: FileController + ExportController
"""
import logging

from django.http import HttpRequest, HttpResponse
from ninja import Body, Router
from ninja.files import UploadedFile

from apps.accounts.auth import AuthBearer
from apps.files import services
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


@router.post('/api/file/upload', auth=AuthBearer())
def upload_file(request: HttpRequest, file: UploadedFile):
    """上传文件到 OSS"""
    result = services.upload(file)
    return ApiResponseData.ok(data=result, message='上传成功')


@router.post('/api/export/docx', auth=AuthBearer())
def export_docx(request: HttpRequest, payload: dict = Body(None)):
    """导出 Word 文档"""
    payload = payload or {}
    html_content = payload.get('content', '')
    file_name = payload.get('fileName', 'document.docx')
    bytes_data = services.export_docx(html_content, file_name)
    return HttpResponse(bytes_data, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        headers={'Content-Disposition': f'attachment; filename="{file_name}"'})


@router.post('/api/export/xlsx', auth=AuthBearer())
def export_xlsx(request: HttpRequest, payload: dict = Body(None)):
    """导出 Excel 表格"""
    payload = payload or {}
    data = payload.get('data', [])
    file_name = payload.get('fileName', 'workbook.xlsx')
    sheet_name = payload.get('sheetName', 'Sheet1')
    bytes_data = services.export_xlsx(data, file_name, sheet_name)
    return HttpResponse(bytes_data, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        headers={'Content-Disposition': f'attachment; filename="{file_name}"'})


@router.post('/api/export/pptx', auth=AuthBearer())
def export_pptx(request: HttpRequest, payload: dict = Body(None)):
    """导出 PPT 演示文稿"""
    payload = payload or {}
    slides = payload.get('slides', [])
    file_name = payload.get('fileName', 'presentation.pptx')
    bytes_data = services.export_pptx(slides, file_name)
    return HttpResponse(bytes_data, content_type='application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        headers={'Content-Disposition': f'attachment; filename="{file_name}"'})
