"""
WebSocket authentication middleware for Django Channels.
"""

from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    """
    Get user from JWT token.
    """
    try:
        # Validate the token
        UntypedToken(token)
        
        # Decode the token to get user_id
        decoded_token = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded_token.get('user_id')
        
        if user_id:
            user = User.objects.get(id=user_id)
            return user
    except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
        pass
    
    return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    WebSocket middleware that authenticates users using JWT tokens.
    """
    
    def __init__(self, inner):
        super().__init__(inner)
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = parse_qs(scope["query_string"].decode("utf8"))
        token = query_string.get("token", [None])[0]
        
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Stack that includes JWT authentication middleware.
    """
    return JWTAuthMiddleware(inner)
