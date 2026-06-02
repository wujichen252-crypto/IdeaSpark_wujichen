"""Community services — split by entity.

Shared datetime formatter.
"""


def _dt(val):
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return val.isoformat() if hasattr(val, 'isoformat') else str(val)
