"""
Request logging middleware.
Replaces Spring Boot's log pattern with trace ID support.
"""
import logging
import uuid
import time

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLogMiddleware(MiddlewareMixin):
    """Log each request with a trace ID, method, path, and duration."""

    def process_request(self, request):
        trace_id = str(uuid.uuid4())[:8]
        request.trace_id = trace_id
        request._start_time = time.time()

    def process_response(self, request, response):
        duration = time.time() - getattr(request, '_start_time', time.time())
        trace_id = getattr(request, 'trace_id', '-')
        logger.info(
            '[%s] %s %s → %s (%.0fms)',
            trace_id, request.method, request.path,
            response.status_code, duration * 1000,
        )
        return response

    def process_exception(self, request, exception):
        trace_id = getattr(request, 'trace_id', '-')
        logger.exception('[%s] Unhandled exception: %s', trace_id, exception)
