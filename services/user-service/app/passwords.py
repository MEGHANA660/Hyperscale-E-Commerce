"""Password hashing with bcrypt."""
import bcrypt


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def is_hashed(stored: str) -> bool:
    return stored.startswith(("$2a$", "$2b$", "$2y$"))


def verify_password(plain: str, stored: str) -> bool:
    """True if `plain` matches `stored` (a bcrypt hash)."""
    if not is_hashed(stored):
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], stored.encode("utf-8"))
    except ValueError:
        return False
