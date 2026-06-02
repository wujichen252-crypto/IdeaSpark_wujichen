"""Community API — sub-routers combined."""
from ninja import Router
from .posts import router as posts_router
from .comments import router as comments_router
from .groups import router as groups_router
from .likes import router as likes_router
from .follows import router as follows_router

router = Router()
router.add_router('', posts_router)
router.add_router('', comments_router)
router.add_router('', groups_router)
router.add_router('', likes_router)
router.add_router('', follows_router)
